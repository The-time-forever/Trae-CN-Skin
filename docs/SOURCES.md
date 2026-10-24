# Sources

Project source code, scripts, documentation and theme JSON configs use the [MIT License](../LICENSE). Image assets are excluded from that grant and retain their respective authors' rights and licenses; material source records document any redistribution permissions and attribution requirements.

This project is written independently. It draws on the architecture and TRAE selector information of the projects below, without copying their applications, image libraries or license texts.

- Dream Work Theme, research snapshot `0a5f2fa97f5379b0fce18f6a07280746eccfc6f9`: https://github.com/xxxhh336/dream-work-theme
  - App registry, install discovery, CDP access, and the TRAE part names in `buildVsCodeWorkCss`.
  - Licensed Apache-2.0; porting code directly would require keeping its license and notices.
- Codex Dream Skin, research snapshot `34335d27d54300eccb325cc652f6c93fef428b84`: https://github.com/Fei-Away/Codex-Dream-Skin
  - Ideas for theme data, part contracts, graceful degradation on mismatch, and apply verification.
  - Licensed MIT; porting code directly would require keeping its copyright and license notice.

`.research/` holds the repositories fetched during research for reference only. It is git-ignored and not needed at runtime.

`materials/subaru/background.jpg`, its copy `materials/yuki/background.jpg` and the active copy `themes/background.jpg` are the original image supplied by the user. Their bytes are unchanged; the image is only cropped and masked with CSS. It is treated as personal local reference material, and no right to redistribute it publicly is assumed.

Community materials belong in `materials/<name>/`, with one image and dark/light JSON configs referencing that image. Include the image author, original source, redistribution permission or license, and required attribution in a `source.md` file alongside the material. Copy only the image and mode configs into `themes/` when activating it. Review redistribution permission before adding third-party images to public contributions.

Target studied locally: `D:\SoftWare\Trae CN\Trae CN.exe`. The install contains the Agent workbench page `resources/app/out/vs/code/electron-browser/solo/solo-lite.html` and the IDE page `.../workbench/workbench.html`; Agent part class names come from `@byted-icube/solo-lite/dist/`, IDE ones from VS Code's workbench parts in that install.

TRAE CN interface structure, from the official docs:
- Agent window quick start: https://docs.trae.cn/ide_get-started-with-the-agent-window
- TRAE quick start (Agent / IDE windows, IDE / SOLO modes): https://docs.trae.cn/ide_get-started-with-trae
- Chat (side chat panel): https://docs.trae.cn/ide_chat
