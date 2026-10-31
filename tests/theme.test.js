import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { listThemes, loadTheme } from '../src/core/theme.js';
import { Controller } from '../src/core/controller.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6EeAAAAAASUVORK5CYII=', 'base64');

async function material(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'trae-material-'));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('trae-material-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.writeFile(path.join(root, 'background.png'), png);
  const write = (file, mode, extra = {}) => fs.writeFile(path.join(root, file), JSON.stringify({ name: 'Example', mode, image: 'background.png', ...extra }));
  return { root, write };
}

async function offlineProject(t) {
  const { root } = await material(t);
  const workspace = path.join(root, 'project');
  await fs.mkdir(workspace);
  await fs.cp(path.join(repo, 'src'), path.join(workspace, 'src'), { recursive: true });
  await fs.copyFile(path.join(repo, 'skin.mjs'), path.join(workspace, 'skin.mjs'));
  await fs.writeFile(path.join(workspace, 'package.json'), '{"type":"module"}');
  const active = path.join(workspace, 'themes');
  await fs.mkdir(active);
  await fs.writeFile(path.join(active, 'background.png'), png);
  for (const mode of ['dark', 'light']) {
    await fs.writeFile(path.join(active, mode + '.json'), JSON.stringify({ mode, image: 'background.png' }));
  }
  return { root, workspace, active };
}

test('one image supports two configs; mode is independent of file name', async t => {
  const { root, write } = await material(t);
  await write('light.json', 'dark');
  await write('anything.JSON', 'light');
  const configs = await listThemes({ root });
  assert.deepEqual(configs.map(config => [config.file, config.mode]), [['anything.JSON', 'light'], ['light.json', 'dark']]);
  const a = await loadTheme('light.json', { root });
  const b = await loadTheme('anything.JSON', { root });
  assert.deepEqual(a.bytes, png);
  assert.equal(a.dataUrl, b.dataUrl);
  assert.equal(a.theme.ideSurfaceOpacity, a.theme.surfaceOpacity);
  assert.equal(a.theme.accentAlt, a.theme.accent);
});

test('nested material folders are ignored and one mode is supported', async t => {
  const { root, write } = await material(t);
  await write('custom.json', 'dark');
  await fs.mkdir(path.join(root, 'unused'));
  await fs.writeFile(path.join(root, 'unused', 'light.json'), 'invalid JSON');
  const configs = await listThemes({ root });
  assert.equal(configs.length, 1);
  assert.equal(configs[0].mode, 'dark');
  assert.equal(configs.find(config => config.mode === 'light'), undefined);
});

test('duplicate modes report both config names', async t => {
  const { root, write } = await material(t);
  await write('first.json', 'dark');
  await write('second.json', 'dark');
  await assert.rejects(listThemes({ root }), /Duplicate dark configs: first.json and second.json/);
});

test('empty active folders fail instead of using a default material', async t => {
  const { root } = await material(t);
  await assert.rejects(listThemes({ root }), /No skin configs in themes/);
});

test('mode is required; malformed JSON and invalid values fail with file context', async t => {
  const { root, write } = await material(t);
  await write('custom.json', undefined);
  await assert.rejects(listThemes({ root }), /custom.json: mode must be dark or light/);
  await write('custom.json', 'dark', { blur: 41 });
  await assert.rejects(listThemes({ root }), /custom.json: blur must be between/);
  await write('custom.json', 'dark', { text: 'white' });
  await assert.rejects(listThemes({ root }), /custom.json: text must be #rrggbb/);
  await write('custom.json', 'dark', { accentAlt: 'pink' });
  await assert.rejects(listThemes({ root }), /custom.json: accentAlt must be #rrggbb/);
  await fs.writeFile(path.join(root, 'custom.json'), '{');
  await assert.rejects(listThemes({ root }), /Cannot read themes\/custom.json/);
});

test('UTF-8 BOM configs are accepted and unknown fields are dropped', async t => {
  const { root } = await material(t);
  await fs.writeFile(path.join(root, 'custom.json'), '\uFEFF' + JSON.stringify({ mode: 'light', image: 'background.png', family: 'Unused' }));
  const [theme] = await listThemes({ root });
  assert.equal(theme.mode, 'light');
  assert.equal(theme.family, undefined);
});

test('metadata listing rejects missing and oversized images', async t => {
  const { root, write } = await material(t);
  await write('custom.json', 'dark', { image: 'missing.webp' });
  await assert.rejects(listThemes({ root }), /Missing background image themes\/missing.webp/);
  await write('custom.json', 'dark');
  await fs.writeFile(path.join(root, 'background.png'), Buffer.alloc(8 * 1024 * 1024 + 1));
  await assert.rejects(listThemes({ root }), /must not exceed 8MB/);
});

test('image type and local file boundaries remain enforced', async t => {
  const { root, write } = await material(t);
  for (const image of ['../background.png', 'https://example.com/image.png', 'background.svg', 'C:\\background.png']) {
    await write('custom.json', 'dark', { image });
    await assert.rejects(listThemes({ root }), /image must be an ASCII jpg\/png\/webp file name inside themes/);
  }
  await assert.rejects(loadTheme('../custom.json', { root }), /ASCII JSON file names inside themes/);
});

test('offline CLI ignores old selection config and rejects theme arguments', async t => {
  const { root, workspace, active } = await offlineProject(t);
  const state = path.join(root, 'trae-work-skin');
  await fs.mkdir(state);
  await fs.writeFile(path.join(state, 'config.json'), '{broken old config');
  const env = { ...process.env, APPDATA: root };
  const run = (...args) => spawnSync(process.execPath, ['skin.mjs', ...args], { cwd: workspace, env, encoding: 'utf8' });
  const result = run('list');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dark.json\s+dark/);
  assert.match(result.stdout, /light.json\s+light/);
  assert.deepEqual((await fs.readdir(state)).sort(), ['config.json']);
  assert.equal(await fs.readFile(path.join(state, 'config.json'), 'utf8'), '{broken old config');
  const rejected = run('apply', 'SUBARU-Dark');
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /do not accept skin IDs/);
  await fs.copyFile(path.join(active, 'dark.json'), path.join(active, 'extra.json'));
  const invalid = run('apply');
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Duplicate dark configs/);
});

// These sessions are in-memory stubs; no CDP connection or TRAE process is used.
class OfflineController extends Controller {
  constructor(root) {
    super();
    this.root = root;
    this.states = new Map(); this.injected = []; this.removed = [];
  }
  async withTarget(target, action) {
    return action({ evaluate: async () => this.states.get(target.id) });
  }
  async payload(file, surface) {
    const { theme } = await loadTheme(file, { root: this.root });
    return { theme, revision: `${file}:${surface}` };
  }
  async inject(target, payload) {
    this.injected.push({ id: target.id, mode: payload.theme.mode });
    const skin = { installed: true, revision: payload.revision, level: 'full', owner: this.owner };
    this.states.get(target.id).skin = skin;
    return { id: target.id, ...skin };
  }
  async remove(target) {
    this.removed.push(target.id);
    this.states.get(target.id).skin = null;
  }
}

test('controller follows each window mode, reuses current injection and yields to a newer owner', async t => {
  const { root, write } = await material(t);
  await write('night.json', 'dark');
  await write('day.json', 'light');
  const themes = await listThemes({ root });
  const controller = new OfflineController(root);
  const targets = [{ id: 'agent', surface: 'agent' }, { id: 'ide', surface: 'ide' }];
  controller.states.set('agent', { mode: 'dark-blue', skin: null });
  controller.states.set('ide', { mode: 'light', skin: null });
  const first = await controller.sync(targets, themes);
  assert.deepEqual(first.windows.map(window => window.theme.mode), ['dark', 'light']);
  assert.equal(controller.injected.length, 2);
  await controller.sync(targets, themes);
  assert.equal(controller.injected.length, 2);
  controller.states.get('agent').mode = 'light';
  await controller.sync(targets, themes);
  assert.equal(controller.injected.at(-1).mode, 'light');
  // A dark-only material removes an existing light injection and stays active.
  controller.states.get('agent').mode = 'light';
  const unmatched = await controller.sync([targets[0]], themes.filter(theme => theme.mode === 'dark'));
  assert.equal(unmatched.windows[0].theme, null);
  assert.deepEqual(controller.removed, ['agent']);
  controller.states.get('agent').skin = { installed: true, owner: controller.owner + 1 };
  assert.deepEqual(await controller.sync(targets, themes), { yielded: true });
});

test('a new apply clears old payloads before synchronizing a replacement material', async t => {
  const { workspace } = await offlineProject(t);
  const { Controller: FixtureController } = await import(pathToFileURL(path.join(workspace, 'src', 'core', 'controller.js')).href);
  const controller = new FixtureController();
  controller.payloads.set('old.json:agent', {});
  controller.matching = async () => [{ id: 'agent' }];
  controller.sync = async () => {
    assert.equal(controller.payloads.size, 0);
    return { windows: [{ mode: 'dark', theme: null }] };
  };
  controller.watch = () => {};
  const status = await controller.apply('offline-executable');
  assert.equal(status.phase, 'idle');
  assert.ok(controller.active);
});
