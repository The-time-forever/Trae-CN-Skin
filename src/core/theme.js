import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const themesRoot = fileURLToPath(new URL('../../themes/', import.meta.url));
export const defaults = Object.freeze({
  schemaVersion: 1, name: 'Untitled', image: 'background.jpg',
  focusX: 76, focusY: 42, imageWidth: 52, intensity: 36, taskIntensity: 15,
  surfaceOpacity: 68, blur: 12, radius: 14,
  accent: '#c8d7df', text: '#eceff1', muted: '#a5aab2', background: '#141518', surface: '#23252a'
});
const ideFallback = { ideSurfaceOpacity: 'surfaceOpacity', ideBlur: 'blur' };
const ranges = { focusX: [0,100], focusY: [0,100], imageWidth: [30,100], intensity: [0,100], taskIntensity: [0,100], surfaceOpacity: [0,100], blur: [0,40], radius: [0,24], ideSurfaceOpacity: [0,100], ideBlur: [0,40] };
const imageTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const MAX_IMAGE = 8 * 1024 * 1024;
const CONFIG = /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/i;

// Only known fields survive; values are interpolated into CSS, so every one is type/range checked.
export function validateTheme(input, file) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid skin format');
  if ((input.schemaVersion ?? 1) !== 1) throw new Error('Unsupported schemaVersion');
  if (!CONFIG.test(file)) throw new Error('Skin configs must be ASCII JSON file names inside themes/');
  const result = { id: file.slice(0, -5), mode: input.mode };
  for (const key of Object.keys(defaults)) result[key] = input[key] ?? defaults[key];
  // IDE panes default to the shared values, so skins without these fields look the same as before.
  for (const [key, base] of Object.entries(ideFallback)) result[key] = input[key] ?? result[base];
  if (typeof result.name !== 'string' || !result.name.trim() || result.name.length > 40) throw new Error('name must be 1-40 characters');
  if (!['dark','light'].includes(result.mode)) throw new Error('mode must be dark or light');
  if (typeof result.image !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(result.image) || !imageTypes[path.extname(result.image).toLowerCase()]) throw new Error('image must be an ASCII jpg/png/webp file name inside themes/');
  for (const [key, [min,max]] of Object.entries(ranges)) {
    if (!Number.isFinite(result[key]) || result[key] < min || result[key] > max) throw new Error(`${key} must be between ${min} and ${max}`);
  }
  for (const key of ['accent','text','muted','background','surface']) if (!/^#[\da-f]{6}$/i.test(result[key])) throw new Error(`${key} must be #rrggbb`);
  return result;
}

export async function listThemes({ root = themesRoot } = {}) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const themes = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.json') continue;
    const { theme } = await loadTheme(entry.name, { image: false, root });
    const duplicate = themes.find(item => item.mode === theme.mode);
    if (duplicate) throw new Error(`Duplicate ${theme.mode} configs: ${duplicate.file} and ${entry.name}. Keep only one config per mode in themes/`);
    themes.push({ ...theme, file: entry.name });
  }
  if (!themes.length) throw new Error('No skin configs in themes/. Copy an image and dark/light JSON configs from materials/ into themes/');
  return themes;
}

// Reads from disk on every call so edits to the active config or image apply without restarting.
export async function loadTheme(file, { image = true, root = themesRoot } = {}) {
  if (!CONFIG.test(file)) throw new Error('Skin configs must be ASCII JSON file names inside themes/');
  let raw;
  try { raw = JSON.parse((await fs.readFile(path.join(root, file), 'utf8')).replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`Cannot read themes/${file}: ${error.message}`); }
  let theme;
  try { theme = validateTheme(raw, file); }
  catch (error) { throw new Error(`Invalid themes/${file}: ${error.message}`); }
  const imageFile = path.join(root, theme.image);
  const stat = await fs.stat(imageFile).catch(() => null);
  if (!stat?.isFile()) throw new Error(`Missing background image themes/${theme.image} referenced by ${file}`);
  if (stat.size > MAX_IMAGE) throw new Error('Background image must not exceed 8MB');
  if (!image) return { theme };
  const bytes = await fs.readFile(imageFile);
  return { theme, bytes, dataUrl: `data:${imageTypes[path.extname(imageFile).toLowerCase()]};base64,${bytes.toString('base64')}` };
}
