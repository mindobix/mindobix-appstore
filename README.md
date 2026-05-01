# Mindobix · App Store

A desktop App Store for all [Mindobix](https://github.com/mindobix) local web apps — built with Electron. Browse, clone, and launch apps without ever opening a terminal or browser.

---

## Download

| Platform | Architecture | File |
|---|---|---|
| macOS | Apple Silicon (M1/M2/M3/M4) | [Mindobix App Store-1.0.0-arm64.dmg](releases/latest/Mindobix%20App%20Store-1.0.0-arm64.dmg) |

> More platforms (macOS Intel, Windows, Linux) will appear here after each platform build via `npm run dist:*`.

---

## Features

- **Browse all apps** from the curated `clones.json` registry — no GitHub API calls needed
- **One-click clone** — clones the repo directly into your chosen local folder with live progress output
- **Launch in its own window** — each app opens in a dedicated Electron window, not your browser
- **Python / npm server apps** — auto-finds a free port, starts the server, and launches the app window
- **Favorites** — heart icon on every card; Favorites tab for quick access, persisted across sessions
- **Per-app backup folders** — set a local folder per app; files matching the app's pattern are auto-copied from `~/Downloads` as soon as they are stable
- **Appstore backup & restore** — export your settings/history to `~/Downloads` with one click (↓), restore from any backup file (↑); optional auto-copy when a backup lands in Downloads
- **Search + filter** — by All · Installed · Available · Favorites · or any category tab; active tab persists across restarts
- **Circular install badge** — each card shows a ring indicator when the app is installed
- **Install ring in the header** — shows X / Y apps installed at a glance
- **macOS hide-on-close** — red X hides to the tray; Quit / Force Quit in the tray menu exits completely
- **Single instance** — launching a second instance kills the previous one automatically
- **System tray** — lives in the menu bar / taskbar when running

---

## Quick start

```bash
git clone https://github.com/mindobix/mindobix-appstore.git
cd mindobix-appstore/appstore
npm install
npm run dev
```

On first launch a **Welcome dialog** asks you to choose a local apps folder and an optional appstore backup folder.

---

## Project layout

```
mindobix-appstore/
├── index.html                  ← legacy web-only store (static)
├── README.md
└── appstore/                   ← Electron desktop app
    ├── package.json
    ├── electron.vite.config.ts
    ├── electron-builder.yml
    ├── clones.json              ← app registry (source of truth for main process)
    ├── build/
    │   └── icon.png             ← 1024×1024 app icon (all platforms)
    ├── scripts/
    │   ├── gen-icon.js          ← regenerate icon.png programmatically
    │   └── publish-release.js   ← upload dist artifacts to GitHub Releases
    └── src/
        ├── main/
        │   ├── index.ts         ← Electron main process, tray, hide-on-close
        │   ├── ipc.ts           ← IPC handlers (clone, launch, server, backup)
        │   └── db.ts            ← settings persistence (userData/appstore.json)
        ├── preload/
        │   └── index.ts         ← contextBridge API surface
        └── renderer/
            └── src/
                ├── App.tsx
                ├── clones.json  ← copy of registry for the renderer
                ├── types.ts
                ├── pages/
                │   └── Store.tsx
                └── components/
                    ├── AppCard.tsx
                    ├── CloneProgress.tsx
                    ├── InstalledRing.tsx
                    └── WelcomeDialog.tsx
```

---

## Adding a new app

Edit **both** copies of `clones.json`:

- `appstore/clones.json`
- `appstore/src/renderer/src/clones.json`

Add an entry with this shape:

```json
{
  "id": "my-repo-name",
  "displayName": "My App",
  "repo": "https://github.com/mindobix/my-repo-name",
  "description": "One-line description shown on the card.",
  "icon": "🚀",
  "color": "#10b981",
  "bg": "rgba(16,185,129,.15)",
  "category": "Dev Tools",
  "featured": false,
  "startType": "static",
  "indexFile": "index.html",
  "backupPattern": "myapp-backup-*.json"
}
```

`startType` options:

| Value | Behaviour |
|---|---|
| `"static"` | Opens `file://localFolder/id/indexFile` in an Electron window |
| `"python"` | Runs `startScript` (e.g. `python3 app.py`), finds a free port, opens `http://localhost:PORT` |
| `"npm"` | Runs `startScript` (e.g. `npm start`), finds a free port, opens `http://localhost:PORT` |

`backupPattern` (optional) — a glob-style filename pattern (supports `*`). When set, the Downloads poller watches for matching files and copies them to the app's configured backup folder automatically.

---

## Building a distributable

```bash
# macOS (universal DMG)
npm run dist:mac

# Windows (NSIS installer)
npm run dist:win

# Linux (AppImage)
npm run dist:linux
```

Each command builds the app and then runs `scripts/publish-release.js` to upload artifacts to the matching GitHub Release tag.

---

## Replacing the app icon

Drop a 1024×1024 PNG at `appstore/build/icon.png`. electron-builder converts it to `.icns` (macOS), `.ico` (Windows), and uses the PNG directly for Linux. To regenerate the default orb icon:

```bash
node appstore/scripts/gen-icon.js
```
