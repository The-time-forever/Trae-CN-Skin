// Self-contained function serialized into the selected TRAE renderer. No Electron privileges.
export function installTheme(theme, image, contract, revision) {
  const KEY = '__traeSnowInkV1';
  const prior = window[KEY];
  if (prior?.revision === revision && prior.inspect().installed) return prior.inspect();
  if (!document.querySelector(contract.root)) throw new Error('TRAE root element is not ready');
  const old = prior ? { theme: prior.theme, image: prior.image, contract: prior.contract, revision: prior.revision } : null;
  prior?.dispose();
  const root = document.documentElement;
  const style = document.createElement('style'); style.id = 'trae-snow-ink-style';
  const layer = document.createElement('div'); layer.id = 'trae-snow-ink-background'; layer.setAttribute('aria-hidden','true');
  const marked = new Map(); let observer; let timer; let disposed = false;
  const oldMode = root.getAttribute('data-tws-mode');
  root.setAttribute('data-tws-mode', theme.mode);
  const surface = `color-mix(in srgb, ${theme.surface} ${theme.surfaceOpacity}%, transparent)`;
  const overlayOpacity = Math.max(theme.surfaceOpacity, 88);
  const overlaySurface = `color-mix(in srgb, ${theme.surface} ${overlayOpacity}%, transparent)`;
  const fade = (color, pct) => `color-mix(in srgb,${color} ${pct}%,transparent)`;
  const tint = pct => fade(`color-mix(in srgb,${theme.text} ${pct}%,${theme.surface})`, theme.surfaceOpacity);
  // "Invert" panels pair with on-accent text: light cream in light mode, a mid gray in dark mode so neither a light block nor unreadable text appears; on-accent text stays dark in dark mode (accent is mid-tone) and dark brown in light mode.
  const invertBg = theme.mode === 'dark' ? `color-mix(in srgb,${theme.text} 22%,${theme.surface})` : theme.surface;
  const invertHover = theme.mode === 'dark' ? `color-mix(in srgb,${theme.text} 30%,${theme.surface})` : `color-mix(in srgb,${theme.surface} 84%,${theme.text})`;
  const invertActive = theme.mode === 'dark' ? `color-mix(in srgb,${theme.text} 34%,${theme.surface})` : theme.background;
  const onAccent = theme.mode === 'dark' ? theme.background : theme.text;
  // solo-lite redeclares hardcoded tokens on html[data-theme], body.vs.solo-lite and .solo-theme[data-theme]; override at each scope.
  const tokenScope = 'html[data-tws-mode], html[data-tws-mode] body, html[data-tws-mode] .solo-theme, html[data-tws-mode] [data-theme]';
  style.textContent = `
    html[data-tws-mode] {
      --vscode-foreground:${theme.text}!important; --vscode-descriptionForeground:${theme.muted}!important; --vscode-input-placeholderForeground:${theme.muted}!important; --vscode-focusBorder:${theme.accent}!important; --vscode-button-background:${theme.accent}!important; --vscode-button-foreground:${theme.background}!important; --vscode-input-background:${surface}!important; --vscode-input-foreground:${theme.text}!important;
      --vscode-widget-background:${overlaySurface}!important; --vscode-widget-border:color-mix(in srgb,${theme.text} 18%,transparent)!important; --vscode-widget-shadow:0 8px 24px #0008!important; --vscode-editorWidget-background:${overlaySurface}!important; --vscode-editorWidget-border:color-mix(in srgb,${theme.text} 18%,transparent)!important; --vscode-dropdown-background:${overlaySurface}!important; --vscode-dropdown-foreground:${theme.text}!important; --vscode-menu-background:${overlaySurface}!important; --vscode-menu-foreground:${theme.text}!important; --vscode-menu-border:color-mix(in srgb,${theme.text} 18%,transparent)!important; --vscode-menu-selectionBackground:color-mix(in srgb,${theme.accent} 26%,${theme.surface})!important; --vscode-menu-selectionForeground:${theme.text}!important; --vscode-menu-separatorBackground:color-mix(in srgb,${theme.text} 14%,transparent)!important; --vscode-quickInput-background:${overlaySurface}!important; --vscode-quickInput-foreground:${theme.text}!important; --vscode-quickInputList-focusBackground:color-mix(in srgb,${theme.accent} 26%,${theme.surface})!important; --vscode-quickInputList-focusForeground:${theme.text}!important; --vscode-inputOption-activeBackground:color-mix(in srgb,${theme.accent} 20%,${theme.surface})!important;
      --vscode-icube-colorBg1:${overlaySurface}!important; --vscode-icube-colorBg2:${overlaySurface}!important; --vscode-icube-colorBg3:${overlaySurface}!important; --vscode-icube-colorBg5:color-mix(in srgb,${theme.text} 7%,transparent)!important; --vscode-icube-lite-colorBg1:${overlaySurface}!important;
      --vscode-icube--bg-bg-base-default:${surface}!important; --vscode-icube--bg-bg-base-secondary:${surface}!important; --vscode-icube--bg-bg-base-tertiary:${surface}!important; --vscode-icube--bg-bg-menu:${overlaySurface}!important; --vscode-icube--bg-bg-tooltip:${overlaySurface}!important; --vscode-icube--bg-bg-overlay-l1:color-mix(in srgb,${theme.text} 6%,transparent)!important; --vscode-icube--bg-bg-overlay-l2:color-mix(in srgb,${theme.text} 9%,transparent)!important; --vscode-icube--bg-bg-overlay-l3:color-mix(in srgb,${theme.text} 13%,transparent)!important; --vscode-icube--bg-bg-overlay-l4:color-mix(in srgb,${theme.text} 18%,transparent)!important;
      --vscode-icube-colorDefaultText:${theme.text}!important; --vscode-icube-colorTextDefault:${theme.text}!important; --vscode-icube--text-text-default:${theme.text}!important; --vscode-icube--text-text-default-hover:${theme.text}!important; --vscode-icube--text-text-default-active:${theme.text}!important; --vscode-icube--text-text-secondary:${theme.muted}!important; --vscode-icube--text-text-secondary-hover:${theme.text}!important; --vscode-icube-colorTextGray:${theme.muted}!important; --vscode-icube-colorGrayText:${theme.muted}!important; --vscode-icube-colorGrayText2:${theme.muted}!important; --vscode-icube-colorTextDisable:color-mix(in srgb,${theme.muted} 62%,transparent)!important; --vscode-icube-colorDisableText:color-mix(in srgb,${theme.muted} 62%,transparent)!important;
      --vscode-icube--icon-icon-default:${theme.text}!important; --vscode-icube--icon-icon-secondary:${theme.muted}!important; --vscode-icube--icon-icon-tertiary:${theme.muted}!important; --vscode-icube-colorBgLine1:color-mix(in srgb,${theme.text} 12%,transparent)!important; --vscode-icube-colorLine1:color-mix(in srgb,${theme.text} 12%,transparent)!important; --vscode-icube-colorLine2:color-mix(in srgb,${theme.text} 18%,transparent)!important; --vscode-icube-modalLayoutBg:${overlaySurface}!important; --vscode-icube-modalOverlay:rgba(0,0,0,.5)!important;
      --vscode-icube--bg-bg-brand:${theme.accent}!important; --vscode-icube--bg-bg-brand-hover:color-mix(in srgb,${theme.accent} 86%,${theme.text})!important; --vscode-icube--bg-bg-brand-disabled:color-mix(in srgb,${theme.accent} 24%,transparent)!important; --vscode-icube--bg-bg-invert:${invertBg}!important; --vscode-icube--bg-bg-invert-hover:${invertHover}!important; --vscode-icube--bg-bg-invert-active:${invertActive}!important; --vscode-icube--bg-bg-invert-disabled:color-mix(in srgb,${theme.muted} 18%,transparent)!important;
      --vscode-icube--border-border-neutral-l1:color-mix(in srgb,${theme.text} 10%,transparent)!important; --vscode-icube--border-border-neutral-l2:color-mix(in srgb,${theme.text} 16%,transparent)!important; --vscode-icube--border-border-neutral-l3:color-mix(in srgb,${theme.text} 22%,transparent)!important;
      --vscode-icube--icon-icon-disabled:color-mix(in srgb,${theme.muted} 58%,transparent)!important; --vscode-icube--icon-icon-onaccent:${onAccent}!important; --vscode-icube--icon-icon-secondary-hover:${theme.text}!important; --vscode-icube--text-text-brand:color-mix(in srgb,${theme.accent} 70%,${theme.text})!important; --vscode-icube--text-text-disabled:color-mix(in srgb,${theme.muted} 58%,transparent)!important; --vscode-icube--text-text-onaccent:${onAccent}!important; --vscode-icube--text-text-tertiary:${theme.muted}!important;
      --vscode-icube-colorBgTr1:color-mix(in srgb,${theme.text} 7%,transparent)!important; --vscode-icube-colorBgTr2:color-mix(in srgb,${theme.text} 11%,transparent)!important; --vscode-icube-colorBlackText1:${theme.text}!important; --vscode-icube-colorHighlightText:color-mix(in srgb,${theme.accent} 60%,${theme.text})!important; --vscode-icube-colorTextHighlight:${theme.accent}!important; --vscode-icube-emptyExplorerButtonTextColor:${theme.text}!important; --vscode-icube-agentReviewSummaryBg:${surface}!important; --vscode-icube-qualityBackgroundColor:${surface}!important; --vscode-icube-qualityForeground:${theme.text}!important; --icube-statusBar-background:${surface}!important; --icube-statusBar-color:${theme.text}!important;
      --vscode-icube-box-shadow1:0 4px 12px #0005!important; --vscode-icube-box-shadow2:0 8px 24px #0007!important; --vscode-icube-box-shadow3:0 14px 38px #0009!important; --vscode-icube-elevation-100-tooltip:0 4px 12px #0006!important; --vscode-icube-elevation-200-menu-panel:0 8px 24px #0008!important; --vscode-icube-elevation-300-modal-panel:0 14px 38px #0009!important;
    }
    ${tokenScope} {
      --bg-bg-base-default:${surface}!important; --bg-bg-base-secondary:${tint(4)}!important; --bg-bg-base-tertiary:${tint(8)}!important; --bg-bg-menu:${overlaySurface}!important; --bg-bg-tooltip:${overlaySurface}!important;
      --bg-bg-overlay-l1:${fade(theme.text,6)}!important; --bg-bg-overlay-l2:${fade(theme.text,9)}!important; --bg-bg-overlay-l3:${fade(theme.text,13)}!important; --bg-bg-overlay-l4:${fade(theme.text,18)}!important;
      --bg-bg-brand:${theme.accent}!important; --bg-bg-brand-hover:color-mix(in srgb,${theme.accent} 86%,${theme.text})!important; --bg-bg-brand-disabled:${fade(theme.accent,24)}!important;
      --bg-bg-invert:${theme.text}!important; --bg-bg-invert-hover:color-mix(in srgb,${theme.text} 88%,${theme.surface})!important; --bg-bg-invert-active:${theme.muted}!important; --bg-bg-invert-disabled:${fade(theme.muted,18)}!important;
      --text-text-default:${theme.text}!important; --text-text-default-hover:${theme.text}!important; --text-text-default-active:${theme.text}!important; --text-text-secondary:${theme.muted}!important; --text-text-secondary-hover:${theme.text}!important; --text-text-secondary-active:${theme.text}!important;
      --text-text-tertiary:${fade(theme.muted,78)}!important; --text-text-disabled:${fade(theme.muted,58)}!important; --text-text-brand:color-mix(in srgb,${theme.accent} 70%,${theme.text})!important; --text-text-brand-hover:${theme.text}!important; --text-text-onbrand:${theme.background}!important; --text-text-onaccent:${theme.background}!important;
      --icon-icon-default:${theme.text}!important; --icon-icon-default-hover:${theme.text}!important; --icon-icon-default-active:${theme.text}!important; --icon-icon-secondary:${theme.muted}!important; --icon-icon-secondary-hover:${theme.text}!important; --icon-icon-secondary-active:${theme.text}!important;
      --icon-icon-tertiary:${fade(theme.muted,78)}!important; --icon-icon-disabled:${fade(theme.muted,58)}!important; --icon-icon-brand:${theme.accent}!important; --icon-icon-brand-hover:${theme.text}!important; --icon-icon-onbrand:${theme.background}!important; --icon-icon-onaccent:${theme.background}!important;
      --bg-bg-input:${surface}!important; --bg-bg-card:${tint(4)}!important; --bg-bg-card-hover:${tint(8)}!important; --bg-bg-float:${overlaySurface}!important; --bg-bg-neutral-solid:${tint(18)}!important; --bg-bg-overlay-l0:${fade(theme.text,3)}!important;
      --bg-bg-base-hover:${fade(theme.text,8)}!important; --bg-bg-hover:${fade(theme.text,8)}!important; --bg-bg-neutral-l1:${fade(theme.text,8)}!important; --bg-bg-active:${fade(theme.text,12)}!important; --bg-bg-brand-popup:${fade(theme.accent,12)}!important;
      --text-text-default-reverse:${theme.background}!important; --text-text-on-inverse:${theme.background}!important; --border-border-focus:${theme.accent}!important; --icon-icon-accent:${theme.accent}!important;
      --border-border-neutral-l1:${fade(theme.text,10)}!important; --border-border-neutral-l2:${fade(theme.text,16)}!important; --border-border-neutral-l3:${fade(theme.text,22)}!important; --border-border-contrast:${theme.text}!important; --border-border-brand:${theme.accent}!important;
      --color-bg-1:${surface}!important; --color-bg-2:${overlaySurface}!important; --color-bg-3:${overlaySurface}!important; --color-bg-4:${overlaySurface}!important; --color-bg-5:${overlaySurface}!important; --color-menu-light-bg:${overlaySurface}!important;
      --color-text-1:${theme.text}!important; --color-text-2:${theme.text}!important; --color-text-3:${theme.muted}!important; --color-text-4:${fade(theme.muted,58)}!important;
      --color-fill-1:${fade(theme.text,4)}!important; --color-fill-2:${fade(theme.text,7)}!important; --color-fill-3:${fade(theme.text,10)}!important; --color-fill-4:${fade(theme.text,14)}!important;
      --color-border-1:${fade(theme.text,8)}!important; --color-border-2:${fade(theme.text,12)}!important; --color-border-3:${fade(theme.text,18)}!important; --color-border-4:${fade(theme.text,24)}!important;
    }
    html[data-tws-mode] body { background:${theme.background}!important; color:${theme.text}!important; isolation:isolate; }
    #trae-snow-ink-background { position:fixed; inset:0; pointer-events:none; z-index:-1; background-color:${theme.background}; }
    #trae-snow-ink-background::before { content:''; position:absolute; inset:0 0 0 auto; width:${theme.imageWidth}%; background-image:linear-gradient(to right,${theme.background},transparent 35%),url("${image}"); background-position:center,${theme.focusX}% ${theme.focusY}%; background-size:cover; opacity:${theme.taskIntensity/100}; }
    #trae-snow-ink-background[data-home]::before { opacity:${theme.intensity/100}; }
    .context-view, .monaco-menu-container, .monaco-select-box-dropdown-container, .quick-input-widget { background:transparent!important; border-color:transparent!important; box-shadow:none!important; outline:none!important; color:${theme.text}!important; }
    .context-view *, .monaco-menu-container *, .monaco-select-box-dropdown-container *, .quick-input-widget * { color:${theme.text}!important; }
    .context-view .monaco-menu, .context-view .monaco-list, .monaco-menu-container .monaco-menu, .monaco-menu-container .monaco-list, .monaco-select-box-dropdown-container .monaco-list, .quick-input-widget { background:${theme.surface}!important; border:1px solid color-mix(in srgb,${theme.text} 16%,transparent)!important; border-radius:${theme.radius}px!important; box-shadow:0 12px 32px #0009!important; backdrop-filter:blur(${theme.blur}px); color-scheme:${theme.mode}; }
    .context-view .monaco-scrollable-element, .monaco-menu-container .monaco-scrollable-element, .monaco-select-box-dropdown-container .monaco-scrollable-element { background:transparent!important; }
    ${contract.surface === 'ide' ? ideRules() : agentRules()}
  `;
  // IDE window (and its SOLO layout): VS Code reads --vscode-* colors from :root, so making the base
  // layers transparent lets the background show while panels keep a translucent surface.
  function ideRules() {
    // Side panes (explorer, AI chat, panel, SOLO AI sidebar) get their own opacity and blur so the image shows through.
    const pane = `color-mix(in srgb, ${theme.surface} ${theme.ideSurfaceOpacity}%, transparent)`;
    const clear = '.monaco-workbench, .monaco-workbench .part.editor, .monaco-workbench .part.editor > .content, .monaco-workbench .editor-group-container, .monaco-workbench .editor-container, .monaco-workbench .monaco-editor, .monaco-workbench .monaco-editor .margin, .monaco-workbench .monaco-editor-background, .monaco-workbench .monaco-editor .inputarea.ime-input, .monaco-workbench .split-view-view, .monaco-workbench .monaco-grid-view';
    return `
    html[data-tws-mode] {
      --vscode-editor-background:transparent!important; --vscode-editorGutter-background:transparent!important; --vscode-editorGroup-emptyBackground:transparent!important; --vscode-editorGroupHeader-tabsBackground:${surface}!important; --vscode-editorGroupHeader-noTabsBackground:${surface}!important;
      --vscode-tab-activeBackground:${tint(6)}!important; --vscode-tab-inactiveBackground:transparent!important; --vscode-tab-activeForeground:${theme.text}!important; --vscode-tab-inactiveForeground:${theme.muted}!important; --vscode-tab-border:transparent!important;
      --vscode-sideBar-background:${pane}!important; --vscode-sideBarSectionHeader-background:transparent!important; --vscode-sideBar-foreground:${theme.text}!important; --vscode-sideBarTitle-foreground:${theme.text}!important;
      --vscode-panel-background:${pane}!important; --vscode-panel-border:${fade(theme.text,12)}!important; --vscode-terminal-background:transparent!important;
      --vscode-activityBar-background:transparent!important; --vscode-activityBar-foreground:${theme.text}!important; --vscode-activityBar-inactiveForeground:${theme.muted}!important;
      --vscode-titleBar-activeBackground:${surface}!important; --vscode-titleBar-inactiveBackground:${surface}!important; --vscode-titleBar-activeForeground:${theme.text}!important; --vscode-titleBar-inactiveForeground:${theme.muted}!important;
      --vscode-statusBar-background:transparent!important; --vscode-statusBar-foreground:${theme.muted}!important; --vscode-statusBar-noFolderBackground:transparent!important;
      --vscode-list-hoverBackground:${fade(theme.text,8)}!important; --vscode-list-activeSelectionBackground:${fade(theme.accent,26)}!important; --vscode-list-inactiveSelectionBackground:${fade(theme.text,10)}!important; --vscode-list-activeSelectionForeground:${theme.text}!important;
      --vscode-editor-lineHighlightBackground:${fade(theme.text,5)}!important; --vscode-editor-lineHighlightBorder:transparent!important; --vscode-editorLineNumber-foreground:${fade(theme.muted,70)}!important; --vscode-editorLineNumber-activeForeground:${theme.text}!important;
      --vscode-minimap-background:transparent!important; --vscode-breadcrumb-background:transparent!important; --vscode-editorStickyScroll-background:${overlaySurface}!important;
      /* Git decoration and success colors are TRAE-native (#00aa62 untracked, #8e8e90 ignored, #f0a50f modified, #ad0707 deleted, #26a57b success) and tuned for its own backgrounds; mix each toward the skin text so labels stay readable on the skin surface in both modes. */
      --vscode-gitDecoration-untrackedResourceForeground:color-mix(in srgb,#00aa62 65%,${theme.text})!important; --vscode-gitDecoration-ignoredResourceForeground:${theme.muted}!important; --vscode-gitDecoration-modifiedResourceForeground:color-mix(in srgb,#f0a50f 45%,${theme.text})!important; --vscode-gitDecoration-deletedResourceForeground:color-mix(in srgb,#ad0707 85%,${theme.text})!important; --vscode-icube-colorSuccess:color-mix(in srgb,#26a57b 65%,${theme.text})!important;
      --vscode-icube-colorSnow:${tint(10)}!important; --vscode-icube-colorBlack:${theme.text}!important;
    }
    ${clear} { background-color:transparent!important; }
    .monaco-workbench .part.sidebar, .monaco-workbench .part.auxiliarybar, .monaco-workbench .part.panel, .monaco-workbench .part.soloaisidebar { background-color:${pane}!important; backdrop-filter:${theme.ideBlur ? `blur(${theme.ideBlur}px)` : 'none'}; }
    .monaco-workbench .part.sidebar .composite, .monaco-workbench .part.sidebar .pane-composite-part > .content, .monaco-workbench .part.sidebar .split-view-view > .pane, .monaco-workbench .part.sidebar .pane-body, .monaco-workbench .part.sidebar .monaco-list, .monaco-workbench .part.sidebar .monaco-list-rows, .monaco-workbench .part.auxiliarybar .composite, .monaco-workbench .part.soloaisidebar .content { background-color:transparent!important; }
    .monaco-workbench .part.editor .title.tabs, .monaco-workbench .part.editor .tabs-container, .monaco-workbench .part.editor .editor-actions { background-color:${surface}!important; }
    .monaco-workbench .messageInputContainer { background-color:${surface}!important; border-radius:${theme.radius}px!important; }
    .monaco-workbench .part.titlebar, .monaco-workbench .part.statusbar, .monaco-workbench .part.activitybar { background-color:transparent!important; }
    /* SOLO wraps the tool area in a grid node painted with --bg-bg-base-default; it would stack under the pane surface. */
    .monaco-workbench.solo-mode .monaco-grid-branch-node.aichatview-marked, .solo-mode .monaco-grid-branch-node.aichatview-marked { background-color:transparent!important; }
    .monaco-workbench .monaco-editor .minimap canvas { opacity:.6; }
    `;
  }
  function agentRules() {
    return `
    html[data-tws-mode] #root { background:transparent!important; color:${theme.text}!important; }
    [data-tws-part="main"], [data-tws-part="home"], [data-tws-part="thread"] { background:transparent!important; }
    .chat-input-v2-container, .chat-input-v2-input-box-wrapper, .chat-input-v2-editor-part { background:transparent!important; color:${theme.text}!important; opacity:1!important; }
    .chat-input-v2-editor-part * { color:${theme.text}!important; }
    .chat-input-v2-editor-part [class*="placeholder"], .chat-input-v2-editor-part [data-placeholder] { color:${theme.muted}!important; }
    [data-tws-part="sidebar"]:not([data-tws-part="sidebar"] *), [data-tws-part="composer"] { background:${surface}!important; background-image:none!important; color:${theme.text}!important; border:1px solid color-mix(in srgb,${theme.text} 16%,transparent)!important; }
    [data-tws-part="dialog"] { background:${overlaySurface}!important; background-image:none!important; color:${theme.text}!important; border:1px solid color-mix(in srgb,${theme.text} 16%,transparent)!important; }
    [data-tws-part="sidebar"] .task-list-heading, [data-tws-part="sidebar"] .task-list-group-header-wrapper { color:${theme.muted}!important; }
    [data-tws-part="home"] [class*="description"], [data-tws-part="home"] [class*="subtitle"] { color:${theme.muted}!important; }
    [data-tws-part="dialog"] { box-shadow:0 12px 32px #0009!important; color-scheme:${theme.mode}; }
    [data-tws-part="dialog"] .monaco-menu, [data-tws-part="dialog"] .monaco-list, [data-tws-part="dialog"] .monaco-list-rows, [data-tws-part="dialog"] .select-box-dropdown-list-container { background:transparent!important; }
    [data-tws-part="dialog"] .monaco-list-row:hover { background:color-mix(in srgb,${theme.text} 10%,transparent)!important; }
    [data-tws-part="dialog"] .monaco-list-row.focused, [data-tws-part="dialog"] .monaco-list-row.selected { background:color-mix(in srgb,${theme.accent} 24%,transparent)!important; }
    .panel-content { border-color:transparent!important; box-shadow:none!important; }
    [data-tws-part="composer"] .chat-input-v2-container, [data-tws-part="composer"] .chat-input-v2-input-box-wrapper, [data-tws-part="composer"] .chat-input-v2-editor-part { background:transparent!important; color:${theme.text}!important; box-shadow:none!important; }
    [data-tws-part="composer"] .chat-input-v2-editor-part * { color:${theme.text}!important; }
    [data-tws-part="composer"] .chat-input-v2-editor-part [class*="placeholder"], [data-tws-part="composer"] .chat-input-v2-editor-part [data-placeholder] { color:${theme.muted}!important; }
    [data-tws-part="composer"] button, [data-tws-part="composer"] [role="button"] { color:${theme.muted}!important; opacity:1!important; }
    [data-tws-part="composer"] button svg, [data-tws-part="composer"] [role="button"] svg { color:inherit!important; opacity:1!important; }
    [data-tws-part="home"] button:not([data-tws-part="composer"] button) { color:${theme.text}!important; background:${surface}!important; border:1px solid color-mix(in srgb,${theme.text} 18%,transparent)!important; box-shadow:none!important; }
    [data-tws-part="home"] button:not([data-tws-part="composer"] button):hover { background:color-mix(in srgb,${theme.surface} 92%,${theme.accent})!important; }
    [data-tws-part="sidebar"] ::-webkit-scrollbar-track, [data-tws-part="sidebar"] ::-webkit-scrollbar-corner { background:transparent!important; }
    [data-tws-part="sidebar"] ::-webkit-scrollbar-thumb { background:color-mix(in srgb,${theme.muted} 24%,transparent)!important; border:2px solid transparent!important; background-clip:padding-box!important; border-radius:8px!important; }
    [data-tws-part="composer"], [data-tws-part="dialog"] { border-radius:${theme.radius}px!important; backdrop-filter:blur(${theme.blur}px); }
    [data-tws-part="composer"] { box-shadow:0 12px 35px #00000020; }
    @media (prefers-reduced-transparency:reduce) { [data-tws-part] { backdrop-filter:none!important; } [data-tws-part="composer"], [data-tws-part="dialog"] { background:${theme.surface}!important; } }
    `;
  }
  function reconcile() {
    if (disposed) return;
    if (!style.isConnected) document.head.append(style);
    if (!layer.isConnected) document.body.prepend(layer);
    for (const [node, original] of marked) {
      if (!node.isConnected || !Object.values(contract.parts).some(selector => node.matches(selector))) {
        if (original === null) node.removeAttribute('data-tws-part'); else node.setAttribute('data-tws-part', original);
        marked.delete(node);
      }
    }
    for (const [part, selector] of Object.entries(contract.parts)) for (const node of document.querySelectorAll(selector)) {
      if (!marked.has(node)) marked.set(node, node.getAttribute('data-tws-part'));
      if (node.getAttribute('data-tws-part') !== part) node.setAttribute('data-tws-part',part);
    }
    const home = !!contract.parts.home && !!document.querySelector(contract.parts.home);
    if (layer.hasAttribute('data-home') !== home) layer.toggleAttribute('data-home',home);
  }
  function inspect() {
    const parts = Object.fromEntries(Object.keys(contract.parts).map(part => [part, document.querySelectorAll(`[data-tws-part="${part}"]`).length]));
    return { revision, surface: contract.surface, installed: style.isConnected && layer.isConnected, enabled: !style.disabled, level: contract.required.every(part => parts[part]) ? 'full' : 'basic', parts, background: getComputedStyle(layer).backgroundColor };
  }
  function dispose() {
    disposed = true; clearTimeout(timer); observer?.disconnect(); style.remove(); layer.remove();
    for (const [node, original] of marked) { if (original === null) node.removeAttribute('data-tws-part'); else node.setAttribute('data-tws-part',original); }
    if (oldMode === null) root.removeAttribute('data-tws-mode'); else root.setAttribute('data-tws-mode',oldMode);
    delete window[KEY];
  }
  // Follow TRAE's own light/dark setting: switch the skin off the moment TRAE leaves the mode it was made for,
  // so a wrong-mode skin never lingers until the watcher swaps or removes it.
  function follow() {
    const value = root.getAttribute('data-theme');
    const on = (value === 'light' ? 'light' : value === 'dark' || value === 'dark-blue' ? 'dark' : null) === theme.mode;
    style.disabled = !on; layer.hidden = !on;
  }
  try {
    reconcile(); follow();
    observer = new MutationObserver(records => {
      if (records.some(record => record.target === root && record.attributeName === 'data-theme')) follow();
      if (!timer) timer = setTimeout(() => { timer = null; reconcile(); },150);
    });
    observer.observe(document.body, { childList:true, subtree:true });
    observer.observe(root, { attributes:true, attributeFilter:['data-theme'] });
    window[KEY] = { theme, image, contract, revision, inspect, dispose };
    return inspect();
  } catch (error) { dispose(); if (old) installTheme(old.theme,old.image,old.contract,old.revision); throw error; }
}
