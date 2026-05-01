# Mindobix · App Store

A dynamic, offline-first App Store for all [Mindobix](https://github.com/mindobix) local web apps. No backend, no accounts — open `index.html` and go.

---

## What it does

- **Fetches all public repos** from the Mindobix GitHub org automatically on every load
- **Detects what's cloned** — shows a green **Open** button for locally installed apps and an indigo **Get** button for ones you haven't cloned yet
- **One-click clone** — clicking Get copies the full `git clone` command to your clipboard
- **Search + filter** — by All · Installed · Available · or any category tab
- **Refresh on demand** — re-scans GitHub and re-checks clone status without a full page reload

---

## Quick start

```bash
# 1. Clone this repo into your projects folder
git clone https://github.com/mindobix/local-web-apps.git

# 2. Serve the parent folder over HTTP (required for clone detection)
cd ..
python3 -m http.server 8080

# 3. Open the store
open http://localhost:8080/local-web-apps/
```

> **Why a local server?** Clone detection works by sending `HEAD` requests to sibling paths (`../repo-name/index.html`). Browsers block those requests on `file://` URLs. On `file://` the store still loads and shows all GitHub repos — it just can't auto-detect which are installed. Clicking **Try ↗** will still open a cloned app if it exists.

---

## Directory layout

All repos must live as **siblings** in the same parent folder:

```
projects/                              ← any name works
├── local-web-apps/                    ← this repo (the store)
│   └── index.html
├── local-trading-journal/
├── local-vibecoding-appideas/
├── MyCareerPulse/
├── local-my-pwds-keys/
├── local-api-web-proxy/
├── local-shareanyjson/
├── local-filesync/
├── local-keywords-files-finder/
├── local-recipebook/
├── myfamilytree/
├── local-billpay-tracker/
├── local-weekly-options-trade-plan/
├── local-habit-calendar/
├── local-dailywealth/
└── medreview/
```

Clone any subset — the store shows everything from GitHub and highlights only what you have installed.

---

## Adding a new app to the store

New public repos under the `mindobix` org appear in the store automatically on the next load. To add rich metadata (icon, color, category, featured flag), add an entry to the `META` object in `index.html`:

```js
'your-repo-name': { icon:'🚀', color:'#10b981', bg:'rgba(16,185,129,.15)', cat:'Dev Tools', featured:false },
```

A display name override can be added to `DISPLAY_NAMES` in the same file.
