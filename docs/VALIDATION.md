# Validation record

Target: local TRAE CN 1.107.1 (Electron 39.2.7 / Chrome 142), `D:\SoftWare\Trae CN\Trae CN.exe`, Agent workbench `solo-lite.html` and IDE window `workbench.html` (IDE and SOLO layouts).

## Light-mode link and success contrast (2026-10-31, offline)

- [x] Native values read from `resources/app/out/vs/workbench/workbench.desktop.main.js`: `textLink.foreground` `#006AB1` light / `#3794FF` dark, `icube.colorSuccess` `#00AA62` light / `#26A57B` dark.
- [x] Contrast math against SUBARU-Light's opaque background `#e8e9e7` reproduces the two recorded flags: `#00AA62` 2.49 and `#3794FF` 2.52 (recorded 2.50 and 2.87 with the translucent surface sampled differently).
- [x] New mappings in `inject.js`: links use 65% `accent` into `text` (`#404f5a`, 6.94:1 on `background`, 7.81:1 on `surface`); light skins use 60% native green into `text` (`#0f764c`, 4.64:1 and 5.22:1). A `success` override still wins.
- [x] Dark mode is untouched: native `#26A57B` on `#23252a` is 4.97:1 and `#3794FF` is 5.00:1, so the new rules only apply to light skins.
- [x] `node --test` and `node skin.mjs list` pass; all JavaScript files pass `node --check`.
- [ ] Live `node skin.mjs check` in light mode: not possible during this change. TRAE CN was already running without the debug port, and an isolated second instance exited through the single-instance lock.

## Active material layout (2026-10-16, offline)

- [x] `node --test`: 11 regression checks passed using temporary material fixtures and in-memory controller sessions; no TRAE process or CDP connection was used.
- [x] Covered one shared image, config names independent of mode, one-mode materials, ignored nested folders, duplicate modes, empty folders, required mode, invalid JSON/ranges/colors, UTF-8 BOM, unknown fields, missing/oversized images, and local image file restrictions.
- [x] Verified that the CLI ignores a malformed old selection file without rewriting it, rejects old theme-ID arguments, and rejects duplicate modes before executable discovery or injection.
- [x] Mock controller checks covered separate Agent/IDE modes, Deep Blue, mode changes, missing-mode removal, newer-owner handoff and clearing payloads on a new apply. These checks exercise control flow without rendering TRAE.
- [x] `node skin.mjs list`: active `dark.json` and `light.json` both validate and reference `background.jpg`.
- [x] All JavaScript files pass `node --check`; all PowerShell scripts parse in Windows PowerShell 5.1 and retain UTF-8 BOM; both BAT wrappers remain ASCII.
- [x] Git blob hashes confirm that the active and library image copies and both JSON configs are byte-identical to the previous SUBARU files.

### Pending for this change

- [ ] Run start.bat with the flat active folder and confirm the foreground apply and hidden watcher.
- [ ] Switch materials and rerun start.bat; confirm the replacement image and settings in Agent, IDE and SOLO layouts.
- [ ] Switch TRAE light/dark with both configs present, then with only one config; confirm apply/removal and return to the supported mode.
- [ ] Confirm stop.bat removal with the flat active folder.

The live checks below describe the earlier per-directory layout and remain historical evidence.

## Startup console fix (2026-10-16)

The user-provided cold-start output contains a successful apply and watcher startup, followed by continued TRAE application logs in the same console. The startup command now redirects TRAE stdout/stderr to separate files, suppresses successful material-list output and exits explicitly on success.

- [x] Windows PowerShell 5.1 stub checks: successful launch/exit, silent validation, separate log paths, visible validation errors and no watcher after failed apply. All 14 offline checks passed; no TRAE process or CDP connection was started.
- [ ] Actual File Explorer cold start: startup window closes after success while TRAE stays open; application logs stay out of the startup console.

## PR templates (2026-10-16, offline)

- [x] Added material, bug-fix, feature and default PR templates, with selection instructions in CONTRIBUTING.md. Confirmed the documented material validation command against the bundled material and the template flag in local `gh pr create --help`.
- [ ] Templates selected through GitHub after the template files reach the default branch. No PR was opened or published by these checks.

## Done (2026-10-10, live via CDP)

- [x] Located the levels where TRAE actually declares its tokens; with the dark skin the home page has no light blocks and no text below 3:1 contrast (`node skin.mjs check`).
- [x] Skin follows TRAE light/dark: TRAE dark → SUBARU-Dark, light → SUBARU-Light, swapped within one watcher cycle; TRAE `settings.json` untouched throughout.
- [x] With no skin for the current mode (light skin temporarily moved away, then switched to light), the injection is removed and the watcher keeps running; switching back to dark re-injects the dark skin.
- [x] Tooltips and the UID label (inverted by design) are no longer blanked by forced light text (confirmed by user).
- [x] Main panel rounded border and top-right buttons are back to native (confirmed by user).
- [x] When two Controllers apply one after the other, the earlier one stops watching.
- [x] Edits to `theme.json` and `inject.js` take effect on the next apply without restarting.
- [x] start.bat connects to a TRAE already running with the port, injects, and exits after 7 seconds; the watcher has no window and re-injects after a page reload.
- [x] stop.bat stops the watcher, removes the injection, and exits after 4 seconds.
- [x] TRAE path comes from the uninstall registry entry; `skin.mjs` also finds it when run directly.
- [x] .ps1 files parse without errors in Windows PowerShell 5.1 (UTF-8 BOM).
- [x] All code messages and tracked docs are in English; CLI, scripts and watcher log output verified.
- [x] IDE window injected alongside the Agent workbench; editor shows the background, sidebar / auxiliary bar / tabs share one translucent surface; `check` reports 0 light blocks and 0 low-contrast text in both dark and light.
- [x] IDE side panes use `ideSurfaceOpacity` / `ideBlur` (SUBARU 50/48% and 4px): the image shows through the AI chat panel, and `check` still reports 0 light blocks and 0 low-contrast text in both modes.
- [x] SOLO layout inspected live: the AI sidebar and tool area each have one translucent layer (SOLO's `aichatview-marked` grid node is cleared); `check` reports 0 light blocks and 0 low-contrast text in both modes.
- [x] Both windows follow TRAE dark/light together; SOLO parts (`soloaisidebar`, `soloTitlebar`) are matched by the IDE rules.

## Pending

- [ ] Readability of task chat, settings, and file / diff / terminal panels in both modes.
- [ ] Chinese IME input, sending, scrolling, selection, copy and drag are unaffected.
- [ ] Several Agent workbench windows injected at once.
- [ ] IDE terminal, diff editor, settings editor and extension webviews.
- [ ] start.bat launching TRAE when it is not running; start.bat's quit prompt when TRAE was launched normally.
- [ ] Watcher exiting about 15 seconds after TRAE closes.
- [ ] Double-clicking start.bat / stop.bat in File Explorer (so far verified via Start-Process).
- [ ] Switching from TRAE's theme menu (so far simulated by rewriting settings.json); follow-system tracking Windows light/dark.
- [ ] Light blocks and contrast for SUBARU-Light in light mode (`check`'s light-block detection only runs for dark skins). Before the link/success fix, `check` reported 2 low-contrast items: a markdown file link (2.87) and a `+6` diff count (2.50); the live re-check after the fix is still pending.
