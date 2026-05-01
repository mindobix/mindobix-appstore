# Mindobix · App Store

A desktop App Store for all [Mindobix](https://github.com/mindobix) local web apps — built with Electron. Browse, clone, and launch apps without ever opening a terminal or browser.

---

## Features

- **Browse all apps** from the curated `clones.json` registry — no GitHub API calls needed
- **One-click clone** — clones the repo directly into your chosen local folder with live progress output
- **Launch in its own window** — each app opens in a dedicated Electron window, not your browser
- **Python / npm server apps** — auto-finds a free port, starts the server, and launches the app window
- **Circular install badge** — each card shows a ring indicator when the app is installed
- **Install ring in the header** — shows X / Y apps installed at a glance
- **Search + filter** — by All · Installed · Available · or any category tab
- **Single instance** — launching a second instance kills the previous one automatically
- **System tray** — lives in the menu bar / taskbar when running

---

## Quick start

```bash
git clone https://github.com/mindobix/mindbox-appstore.git
cd mindbox-appstore/appstore
npm install
npm run dev
```

On first launch a **Welcome dialog** asks you to choose a local folder. All apps will be cloned into that folder.

---

## Project layout

```
mindbox-appstore/
├── index.html                  ← legacy web-only store (static)
├── README.md
└── appstore/                   ← Electron desktop app
    ├── package.json
    ├── electron.vite.config.ts
    ├── electron-builder.yml
    ├── clones.json              ← app registry (source of truth)
    ├── build/
    │   └── icon.png             ← 1024×1024 app icon (all platforms)
    ├── scripts/
    │   └── gen-icon.js          ← regenerate icon.png programmatically
    └── src/
        ├── main/
        │   ├── index.ts         ← Electron main process
        │   ├── ipc.ts           ← IPC handlers (clone, launch, server)
        │   └── db.ts            ← settings persistence (JSON)
        ├── preload/
        │   └── index.ts         ← contextBridge API surface
        └── renderer/
            └── src/
                ├── App.tsx
                ├── clones.json  ← copy of registry for the renderer
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
  "indexFile": "index.html"
}
```

`startType` options:

| Value | Behaviour |
|---|---|
| `"static"` | Opens `file://localFolder/id/indexFile` in an Electron window |
| `"python"` | Runs `startScript` (e.g. `python3 app.py`), finds a free port, opens `http://localhost:PORT` |
| `"npm"` | Runs `startScript` (e.g. `npm start`), finds a free port, opens `http://localhost:PORT` |

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

Outputs land in `appstore/dist/`.

---

## Replacing the app icon

Drop a 1024×1024 PNG at `appstore/build/icon.png`. electron-builder converts it to `.icns` (macOS), `.ico` (Windows), and uses the PNG directly for Linux. To regenerate the default orb icon:

```bash
node appstore/scripts/gen-icon.js
```
