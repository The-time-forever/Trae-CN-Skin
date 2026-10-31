# Skin guide

For people making or editing skins, and for agents doing it on their behalf. After a change, run `node skin.mjs apply` and then `node skin.mjs check` to see whether the live page still has light blocks or low-contrast text.

## Material library and active folder

```text
materials/<name>/      material library, not read at runtime
  background.jpg
  dark.json
  light.json

themes/                active material, read directly
  background.jpg
  dark.json
  light.json
```

One image and two configs form a complete material. Both configs reference the same image through `image`; each has its own colors, opacity and crop settings. PNG, JPEG and WebP images also work, up to 8 MiB per image. Keep image pixels unchanged and use the crop controls below.

Contribute materials under `materials/<name>/` with source and redistribution information described in [SOURCES.md](SOURCES.md). To use one, replace the old files in `themes/` with its image and configs, then run `start.bat`. Copy the contents, not the enclosing folder. The runtime scans only JSON files directly inside `themes/`; nested directories and `materials/` are ignored.

Config file names are ASCII, start with a letter or digit, and may contain letters, digits, dots, underscores and hyphens before `.json` (case-insensitive). Image file names use the same characters and a supported image extension. `dark.json` and `light.json` are conventions: `mode` determines the mode regardless of file name. A config's file stem is the internal ID reported by `check`.

Keep at most one config for each mode. One mode alone is supported; the missing mode keeps TRAE's native appearance. Empty active folders, invalid configs, duplicate modes, missing images and oversized images fail validation. `node skin.mjs list` runs this validation offline, and `start.bat` runs it before starting TRAE. Material names and previous choices are not stored.

## JSON config fields

Unknown fields are dropped. Out-of-range values are rejected, never silently corrected.

| Field | Values | Purpose |
| --- | --- | --- |
| `schemaVersion` | `1` | Format version |
| `name` | 1–40 characters | Name shown in status messages and `skin.mjs list` |
| `mode` | `dark` / `light`, required | Which TRAE light/dark mode this skin applies to; the colors must suit it. TRAE settings are never changed |
| `image` | File name directly inside `themes/` | Background image; both configs can reference the same file |
| `imageWidth` | 30–100 | Image width as a percentage of the window, anchored right with a fade on the left edge |
| `focusX` / `focusY` | 0–100 | Crop focus, same as `background-position` percentages |
| `intensity` | 0–100 | Image opacity on the home (new task) page |
| `taskIntensity` | 0–100 | Image opacity on task chat pages; usually lower so text stays readable |
| `surfaceOpacity` | 0–100 | Opacity of panels such as the sidebar, composer and cards; menus and popovers use at least 88 |
| `blur` | 0–40 | Backdrop blur for the composer and popovers (px) |
| `ideSurfaceOpacity` | 0–100, optional | Opacity of the IDE window's side panes (explorer, AI chat, bottom panel, SOLO AI sidebar). Defaults to `surfaceOpacity`; lower it to let the image show through. The AI chat composer keeps `surfaceOpacity` |
| `ideBlur` | 0–40, optional | Backdrop blur for those IDE panes (px); defaults to `blur`, and 0 turns it off |
| `radius` | 0–24 | Corner radius for the composer and popovers (px) |
| `background` | `#rrggbb` | Window base color, also the color the image fades into |
| `surface` | `#rrggbb` | Panel color |
| `text` | `#rrggbb` | Primary text and icons |
| `muted` | `#rrggbb` | Secondary text and placeholders |
| `accent` | `#rrggbb` | Brand color: primary buttons, focus rings, selection |

Optional `#rrggbb` overrides preserve existing mappings and native Git colors when omitted:

| Field | Purpose |
| --- | --- |
| `brandText` | Brand and highlighted text |
| `onAccent` | On-accent text and icons; check contrast against each background that uses it |
| `invertBackground` | Inverted panel background and its hover and active variants |
| `gitUntracked`, `gitIgnored`, `gitModified`, `gitDeleted` | IDE Git decoration colors |
| `success` | Success color in the IDE and the Agent chat; light skins mix the native green toward `text` when it is omitted |

Keep at least 4.5:1 contrast between `text` and both `surface` and `background`.

## Injection structure (read before editing src/core)

`installTheme(theme, image, contract, revision)` in `inject.js` is serialized and run inside the TRAE page, so it must be self-contained: no references to other module variables and no Node APIs. It creates:

- `#trae-snow-ink-style`: all CSS.
- `#trae-snow-ink-background`: a `position:fixed; z-index:-1` layer; the image is drawn on its `::before`. It gets `data-home` on the home page, which switches to `intensity`.
- `html[data-tws-mode]`: every override rule is scoped under this attribute, so removing it reverts everything.
- A listener on `html[data-theme]`: when TRAE switches to a mode other than `theme.mode`, the style is disabled and the layer hidden immediately; the watcher then swaps in the matching skin or removes the injection.
- `[data-tws-part="…"]`: part markers placed on TRAE nodes according to `adapter.js`; a MutationObserver re-marks them after DOM changes.

### How colors take effect

Most TRAE components read tokens instead of hard-coded colors:

- `--bg-bg-*`, `--text-text-*`, `--icon-icon-*`, `--border-border-*` (solo-lite components)
- `--color-bg-*`, `--color-text-*`, `--color-fill-*`, `--color-border-*` (Arco components)
- `--vscode-*`, `--vscode-icube-*` (VS Code layer)

TRAE redeclares these tokens at several levels: `html[data-theme]`, `body.vs.solo-lite` / `body.vs-dark.solo-lite` and `.solo-theme[data-theme]`. The rule built from `tokenScope` in `inject.js` overrides them at the same levels; overriding only `html` is not enough.

Fix colors through the token mapping, not by adding per-component selectors from screenshots. When a light block appears:

1. Find the element's class with `check`.
2. Search for that class in `resources/app/node_modules/@byted-icube/solo-lite/dist/*.css` under the TRAE install folder and note which `var(--…)` it reads.
3. Add the missing token to the `tokenScope` rule.

Tokens deliberately left alone: brand gradients, `--status-*` status colors, `--code-*` syntax colors, `--accent-accent-*`, and `--bg-bg-white`, which is white in both native themes.

### Don'ts

- Don't force `color` on every descendant of an area, e.g. `[data-tws-part="dialog"] * { color: … }`. TRAE's tooltips and UID label are inverted by design (`--bg-bg-invert` light background with `--text-text-onaccent` dark text); forcing light text makes them blank.
- Don't add translucent backgrounds or borders to nested part nodes; the colors stack and darken. Only the outermost node gets the panel color.
- Don't change layout sizes, positioning, or the shape of the top-right IDE / sidebar buttons.

### adapter.js

`adapters` holds one contract per surface. `page` is the URL suffix used to match CDP targets, `root` must exist before injecting, and `required` lists the parts that must match for `full`.

**`agent`** (`solo/solo-lite.html`, the Agent workbench):

| Part | Purpose |
| --- | --- |
| `sidebar` | Left task list; the outermost node gets the panel color |
| `main` / `thread` / `home` | Main area, chat stream, home page; made transparent so the image shows through |
| `composer` | Composer shell, translucent glass |
| `dialog` | Menus, dialogs, dropdowns; popover color |

**`ide`** (`workbench/workbench.html`, the IDE window; SOLO mode is a layout of the same page):

| Part | Purpose |
| --- | --- |
| `editor` | Editor area; transparent, with `--vscode-editor-background` set to transparent |
| `pane` | Sidebar, auxiliary bar (AI chat), panel, and SOLO's `soloaisidebar`; one translucent surface each |
| `chrome` | Title bar (including SOLO's `soloTitlebar`), activity bar, status bar; transparent |
| `dialog` | Same as above |

In SOLO layout the tool area sits inside a grid node (`.monaco-grid-branch-node.aichatview-marked`) that TRAE paints with `--bg-bg-base-default`; the IDE rules clear it so it doesn't stack under the pane surface.

IDE colors come from `--vscode-*` variables that TRAE writes on `:root`, so the IDE rules override them on `html[data-tws-mode]`. The AI chat inside the auxiliary bar is the same solo-lite component, so it also picks up the shared token overrides. The terminal (xterm canvas), minimap and extension webviews are drawn outside CSS reach; syntax colors come from TRAE's color theme.

`full` is reported when every `required` part matches. That only means the key nodes exist, not that the page looks right, so still run `check`.

TRAE updates may rename classes: watch for `match=basic` in `check`, then compare class names in the dist folder above, or in `resources/app/out/vs/workbench/workbench.desktop.main.css` for the IDE.
