# TRAE CN Skin

Injects a local background image and color scheme into TRAE CN's Agent workbench and IDE window (including SOLO mode) without modifying TRAE's install files or settings. Injection goes through TRAE's debug port (127.0.0.1:9341 only), and the skin follows TRAE's own light/dark mode.

## Preview

Previews of `SUBARU-Light` in TRAE CN. Personal names, project names, task titles, source code and chat content have been replaced with Lorem ipsum placeholders; account avatars use generic icons.

### Agent workbench

![SUBARU-Light in the TRAE CN Agent workbench, with an illustrated background and translucent panels](docs/images/subaru-light-agent.png)

### IDE window

![SUBARU-Light in the TRAE CN IDE window, with the background visible through the editor and AI chat panel](docs/images/subaru-light-ide.png)

## Usage

Requires Node.js 22 or later. No `npm install` needed.

- **start.bat**: starts TRAE CN and applies the skin. On success the window closes after 3 seconds. A hidden background watcher stays behind: it re-applies the skin after page reloads, switches or removes it when TRAE changes light/dark mode, and exits when TRAE closes.
- **stop.bat**: stops the watcher and removes the skin, then closes.

On failure the window stays open with the reason; press any key to close it.

Material validation is silent on success. When the script launches TRAE, TRAE's own console output goes to `%APPDATA%\trae-work-skin\trae.stdout.log` and `trae.stderr.log` instead of the startup window; these files are overwritten on the next scripted launch. The startup window only shows connection, apply and watcher status.

TRAE CN must be started by start.bat, because injection needs the debug port and a normally launched TRAE doesn't open it. If TRAE is already running, start.bat asks you to fully quit it (including the tray icon) first; it never closes TRAE for you. TRAE's install folder is read from the installer's registry entry, so there is nothing to configure.

## Light and dark mode

Pick dark, light or follow-system in TRAE's theme menu and the skin follows:

| TRAE mode | Skin |
| --- | --- |
| Dark (including Deep Blue) | The JSON config in `themes/` with `"mode": "dark"` |
| Light | The JSON config in `themes/` with `"mode": "light"` |

If a mode has no config, switching to it removes the injection and TRAE shows its native look; switching back re-applies the skin. For example, remove `themes/light.json` and TRAE's light mode stays native.

Keep at most one config per mode. Duplicate modes, invalid configs and missing or oversized images are reported before TRAE starts. `node skin.mjs list` validates and lists the active configs offline. The watcher log is `%APPDATA%\trae-work-skin\watcher.log`.

## Changing materials

`materials/` is the material library; `themes/` contains the files currently in use. A complete material has one image and two JSON configs that reference that same image:

```text
materials/subaru/       example material in the library
  background.jpg
  dark.json
  light.json

themes/                active files, read directly by start.bat
  background.jpg
  dark.json
  light.json
```

To switch, replace the previous material's files in `themes/` with the contents of one material folder, then run `start.bat` again. Copy the files directly into `themes/`, without the enclosing folder. Remove old JSON configs before copying so that each mode has only one config. No material name, selection menu or saved choice is needed; `materials/` is never scanned at runtime.

JSON file names do not determine the mode: each config must explicitly declare `"mode": "dark"` or `"mode": "light"`. Both configs can use `"image": "background.jpg"`. Image names may differ between materials; use ASCII file names and JPG/JPEG, PNG or WebP images up to 8 MiB. Run `node skin.mjs list` to check the files before starting TRAE.

## Making your own skin

Copy `materials/subaru/` to a new folder under `materials/`, replace the image, and edit `dark.json` and `light.json`. Each config keeps its own colors, opacity and crop settings. Preserve the original image pixels; cropping and fading happen through CSS. Keep source and redistribution information with your contribution; see [docs/SOURCES.md](docs/SOURCES.md).

Copy the material's files into `themes/` to activate it. With TRAE open through the debug port, edit the active JSON configs or the injection code in `src/core/`, then run `start.bat` again to see the change without restarting TRAE. `node skin.mjs check` reports any light blocks or low-contrast text left on the page.

Fields and injection structure are documented in [docs/THEMING.md](docs/THEMING.md). Hand that file to anyone, or any agent, editing a skin.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for Bug/Feature Issue templates, material, bug-fix and feature PR templates, source information and validation requirements. You can report problems or request features without submitting code. Documentation and maintenance changes use the default PR template.

## Layout

```text
start.bat / stop.bat    double-click entry points
scripts/                PowerShell: find TRAE, launch it, manage the watcher
skin.mjs                CLI: watch / apply / restore / check / list
materials/<name>/       material library: one image + dark/light JSON configs
themes/                 active image + JSON configs (one per mode)
src/core/               injection core (no dependencies)
docs/                   architecture, skin guide, sources
```

## Scope

Windows only, TRAE CN (China edition) only. Covers the Agent workbench and the IDE window in both IDE and SOLO layouts. Out of scope: the native title bar buttons, terminal text drawn on canvas, extension webviews, and syntax highlighting colors (use a TRAE color theme for those). The bundled SUBARU and Relay images in `materials/` and the active Relay copy in `themes/` are personal local reference material with no assumed right to redistribute; see [docs/SOURCES.md](docs/SOURCES.md).

## License

Project source code, scripts, documentation and theme JSON configs are licensed under the [MIT License](LICENSE).

Image assets retain their respective authors' rights and licenses and are excluded from the project's MIT grant. The bundled SUBARU background has no established redistribution permission. See [docs/SOURCES.md](docs/SOURCES.md) and each material's `source.md` for image sources, permissions and attribution.
