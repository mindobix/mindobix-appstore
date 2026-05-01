# CLAUDE.md — Mindobix App Store

## Project overview

Electron desktop app that lets users browse, clone, and launch Mindobix local web apps. Built with electron-vite + React + TypeScript + Tailwind CSS.

The app lives in `appstore/`. The repo root also contains `index.html` — a legacy web-only version of the store that is no longer the primary artifact.

---

## Architecture

```
Main process (Node.js / Electron)
  src/main/index.ts   — window, tray, hide-on-close, single-instance kill
  src/main/ipc.ts     — all IPC handlers (clone, launch, server, backup)
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
- `appstore/clones.json` — used by electron-builder packaging and the main process
- `appstore/src/renderer/src/clones.json` — imported by the renderer at build time

When adding or editing an app, update **both files**.

### IPC pattern
All Electron APIs are behind IPC. Renderer calls `window.api.<method>()` → preload invokes `ipcRenderer.invoke(channel)` → main handles via `ipcMain.handle(channel)`.

Never add `nodeIntegration: true` to any window. All Node access goes through the preload bridge.

### App windows
Each app opens in its own `BrowserWindow` via `openAppWindow()` in `ipc.ts`. Windows are tracked in `openAppWindows: Map<appId, BrowserWindow>` — a second click brings the existing window to front rather than opening a duplicate.

Static apps load via `file://` with `webSecurity: false` so local assets load freely.
Server apps (Python/npm) get a free port assigned, the process is spawned, and the window loads `http://localhost:PORT`.

### macOS hide-on-close
The main window's `close` event calls `e.preventDefault()` and hides the window instead of quitting (macOS only). `app.isQuitting` is set to `true` only from the tray "Quit" / "Force Quit" menu items. This lets the red X hide the window while keeping the tray icon alive.

### Single instance
On startup `killAllPreviousInstances()` runs `pkill -f` to kill any stale processes by name before the new instance starts. This is intentional — `npm run dev` should always produce a fresh window.

### Settings persistence
Settings are stored in `app.getPath('userData')/appstore.json`. The `db.ts` functions must only be called after `app.whenReady()` because `app.getPath()` requires the app to be ready.

`db.ts` exports:
- `getSettings` / `saveSettings` — localFolder, firstRun, appstoreBackupFolder
- `recordClone` / `getCloneHistory`
- `getBackupFolders` / `setBackupFolder` — per-app backup folder paths, keyed by appId
- `getBackupHistory` / `recordBackup` — last copied file per appId (use `'__appstore__'` as the key for the appstore itself)

### Per-app backup system
Apps that declare `backupPattern` in `clones.json` support automatic backup:
1. User sets a backup folder via the amber folder icon on the app card.
2. `ipc.ts` runs a `setInterval` (3 s) polling `~/Downloads`.
3. Files matching the pattern are copied using a two-tick size-stability check (prevents partial-write copies).
4. `db.recordBackup(appId, record)` is called and `backup-copied` is emitted to the renderer.

`backupPattern` uses glob-style `*` wildcards. Write patterns at app-onboarding time in `clones.json`; no runtime detection needed.

### Appstore self-backup
The appstore can back up its own `appstore.json` settings file:
- `backup-appstore` IPC handler copies `appstore.json` → `~/Downloads/mindobix-appstore-backup-YYYY-MM-DD.json`
- `restore-appstore` opens a file picker, validates the JSON (must have a `settings` key), and overwrites `appstore.json`
- The Downloads poller also watches for `mindobix-appstore-backup-*.json` and auto-copies to `settings.appstoreBackupFolder` when set
- The sentinel appId `'__appstore__'` is used in `backupHistory` to track the last appstore backup
- Store header has ↓ (backup) and ↑ (restore) buttons; restore reloads the renderer window on success

### UI state persistence
- Active filter tab: `localStorage.getItem('activeTab')` — defaults to `'all'`
- Favorites: `localStorage.getItem('favorites')` — JSON array of appIds

### Releases
`scripts/publish-release.js` is called by `npm run dist:mac/win/linux` after the build. It reads the version from `package.json`, creates/updates a GitHub Release tagged `v{version}`, and uploads `.dmg`/`.exe`/`.AppImage` artifacts from `dist/` using the `gh` CLI.

---

## Dev commands

```bash
cd appstore
npm install       # first time only
npm run dev       # start dev server + Electron window
npm run build     # production build (no window)
npm run dist:mac  # build + package DMG + publish to GitHub Releases
```

---

## Common tasks

### Add a new app
1. Add an entry to `appstore/clones.json`
2. Add the same entry to `appstore/src/renderer/src/clones.json`
3. If the app exports backup files from its UI, add a `backupPattern` (e.g. `"myapp-backup-*.json"`) to both entries
4. Run `npm run dev` — it appears immediately, no code changes needed

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
- Do not add `backupPattern` via runtime detection — write it statically in `clones.json` at app-onboarding time
