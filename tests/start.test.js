import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// Run the real entry script in Windows PowerShell 5.1 with local process/CDP stubs.
// No TRAE process, watcher or network connection is started by these checks.
async function startup(t, scenario) {
  const tempDir = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(tempDir, 'trae-start-'));
  t.after(async () => {
    assert.equal(path.dirname(root), tempDir);
    assert.ok(path.basename(root).startsWith('trae-start-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, 'scripts'));
  await fs.copyFile(new URL('../scripts/start.ps1', import.meta.url), path.join(root, 'scripts', 'start.ps1'));
  await fs.writeFile(path.join(root, 'skin.mjs'), `
    if (process.env.START_SCENARIO === 'invalid') {
      console.error('Error: Duplicate dark configs');
      process.exitCode = 1;
    } else console.log('MATERIAL_LIST_SHOULD_BE_SILENT');
  `);
  await fs.writeFile(path.join(root, 'scripts', 'common.ps1'), `
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Port = 9341
$StateDir = Join-Path $Root 'state'
function Fail([string]$Message) { Write-Host $Message; exit 1 }
function Get-Node { return $env:START_NODE }
function Get-TraeExe { return (Join-Path $Root 'fake-trae.exe') }
function Get-TraeMain { return @() }
function Test-DebugPort { return $false }
function Start-Sleep {}
function Invoke-RestMethod { return @{ type = 'page'; url = 'file:///fake/solo/solo-lite.html' } }
function Stop-Watcher { return $true }
function Invoke-Skin { if ($env:START_SCENARIO -eq 'apply-fails') { return 1 }; return 0 }
function Start-Process {
  param($FilePath, $ArgumentList, $RedirectStandardOutput, $RedirectStandardError, $WindowStyle, $WorkingDirectory)
  @{ file = $FilePath; output = $RedirectStandardOutput; error = $RedirectStandardError; style = $WindowStyle } |
    ConvertTo-Json -Compress | Add-Content -LiteralPath (Join-Path $Root 'launches.jsonl')
}
`, 'utf8');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', 'start.ps1')], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, START_NODE: process.execPath, START_SCENARIO: scenario }
  });
  assert.ifError(result.error);
  const trace = await fs.readFile(path.join(root, 'launches.jsonl'), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  return { result, launches: trace.trim() ? trace.trim().split(/\r?\n/).map(line => JSON.parse(line)) : [], root };
}

test('successful startup hides material listing, redirects TRAE logs and returns zero', { skip: process.platform !== 'win32' }, async t => {
  const { result, launches, root } = await startup(t, 'success');
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /MATERIAL_LIST_SHOULD_BE_SILENT/);
  assert.match(result.stdout, /Background watcher started/);
  assert.equal(launches.length, 2);
  assert.equal(launches[0].output, path.join(root, 'state', 'trae.stdout.log'));
  assert.equal(launches[0].error, path.join(root, 'state', 'trae.stderr.log'));
  assert.equal(launches[1].style, 'Hidden');
});

test('failed material validation keeps the error visible and starts no processes', { skip: process.platform !== 'win32' }, async t => {
  const { result, launches } = await startup(t, 'invalid');
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /Duplicate dark configs/);
  assert.deepEqual(launches, []);
});

test('failed apply returns a failure without starting the watcher', { skip: process.platform !== 'win32' }, async t => {
  const { result, launches } = await startup(t, 'apply-fails');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Injection failed/);
  assert.equal(launches.length, 1);
});
