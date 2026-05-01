# CLAUDE.md — Mindobix App Store

## Project overview

Electron desktop app that lets users browse, clone, and launch Mindobix local web apps. Built with electron-vite + React + TypeScript + Tailwind CSS.

The app lives in `appstore/`. The repo root also contains `index.html` — a legacy web-only version of the store that is no longer the primary artifact.

---

## Architecture

```
Main process (Node.js / Electron)
  src/main/index.ts   — window, tray, single-instance kill
  src/main/ipc.ts     — all IPC handlers
  src/main/db.ts      — JSON settings persistence (userData/appstore.json)

Preload
  src/preload/index.ts — contextBridge exposing window.api

Renderer (React + Tailwind)
  src/renderer/src/App.tsx                  — root, first-run gate
  src/renderer/src/pages/Store.tsx          — main store page
  src/renderer/src/components/AppCard.tsx   — per-app card
  src/renderer/src/components/WelcomeDialog.tsx
  src/renderer/src/components/CloneProgress.tsx
  src/renderer/src/components/InstalledRing.tsx
```

---

## Key conventions

### App registry
`clones.json` is the single source of truth for which apps are shown. It exists in **two places** that must be kept in sync:
- `appstore/clones.json` — used by electron-builder packaging
- `appstore/src/renderer/src/clones.json` — imported by the renderer at build time

When adding or editing an app, update **both files**.

### IPC pattern
All Electron APIs are behind IPC. Renderer calls `window.api.<method>()` → preload invokes `ipcRenderer.invoke(channel)` → main handles via `ipcMain.handle(channel)`.

Never add `nodeIntegration: true` to any window. All Node access goes through the preload bridge.

### App windows
Each app opens in its own `BrowserWindow` via `openAppWindow()` in `ipc.ts`. Windows are tracked in `openAppWindows: Map<appId, BrowserWindow>` — a second click brings the existing window to front rather than opening a duplicate.

Static apps load via `file://` with `webSecurity: false` so local assets load freely.
Server apps (Python/npm) get a free port assigned, the process is spawned, and the window loads `http://localhost:PORT`.

### Single instance
On startup `killAllPreviousInstances()` runs `pkill -f` to kill any stale processes by name before the new instance starts. This is intentional — `npm run dev` should always produce a fresh window.

### Settings persistence
Settings are stored in `app.getPath('userData')/appstore.json`. The `db.ts` functions (`getSettings`, `saveSettings`, `recordClone`) must only be called after `app.whenReady()` because `app.getPath()` requires the app to be ready.

---

## Dev commands

```bash
cd appstore
npm install       # first time only
npm run dev       # start dev server + Electron window
npm run build     # production build (no window)
npm run dist:mac  # build + package DMG
```

---

## Common tasks

### Add a new app
1. Add an entry to `appstore/clones.json`
2. Add the same entry to `appstore/src/renderer/src/clones.json`
3. Run `npm run dev` — it appears immediately, no code changes needed

### Change the app icon
Replace `appstore/build/icon.png` with a 1024×1024 PNG.  
Or regenerate the default orb: `node appstore/scripts/gen-icon.js`

### Change window size / title bar
Edit `createWindow()` in `src/main/index.ts`.

### Add a new IPC handler
1. Add `ipcMain.handle('channel-name', handler)` in `src/main/ipc.ts`
2. Expose it in `src/preload/index.ts` via `contextBridge.exposeInMainWorld`
3. Add the type signature to the `window.api` interface in `src/renderer/src/App.tsx`

---

## What NOT to do

- Do not call `app.getPath()` at module load time — only inside functions called after `app.whenReady()`
- Do not use `shell.openExternal()` to launch local apps — use `openAppWindow()` so they open in Electron windows
- Do not add apps to the store by editing only one copy of `clones.json`
- Do not set `nodeIntegration: true` on any BrowserWindow
