import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { setupIPC } from './ipc'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let cleanup: (() => void) | null = null

function killAllPreviousInstances(): void {
  const myPid = process.pid
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // Kill every Electron process running this app except ourselves
      execSync(`pkill -f "mindobix-appstore" 2>/dev/null || true`)
      execSync(`pkill -f "Electron.*appstore" 2>/dev/null || true`)
    } else if (process.platform === 'win32') {
      execSync(`taskkill /F /FI "PID ne ${myPid}" /IM "Mindobix App Store.exe" 2>nul || exit 0`, { shell: 'cmd.exe' })
    }
  } catch { /* ignore — no previous instances */ }
}

killAllPreviousInstances()

function getAppIcon(): nativeImage {
  const candidates = [
    path.join(__dirname, '../../build/icon.png'),
    path.join(process.resourcesPath ?? '', 'icon.png'),
    path.join(app.getAppPath(), 'build', 'icon.png'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p)
  }
  return nativeImage.createEmpty()
}

function createTrayIcon(): nativeImage {
  const size = 22
  const buf  = Buffer.alloc(size * size * 4, 0)
  const cx = size / 2 - 0.5
  const cy = size / 2 - 0.5
  const outerR = 9, innerR = 5

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= outerR * outerR && d2 >= innerR * innerR) {
        const i = (y * size + x) * 4
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 255
      }
    }
  }

  const img = nativeImage.createFromBuffer(buf, { width: size, height: size })
  if (process.platform === 'darwin') img.setTemplateImage(true)
  return img
}

function createWindow(): void {
  const icon = getAppIcon()

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 740,
    minWidth: 800,
    minHeight: 560,
    show: false,
    icon,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Closing the window quits the app on all platforms
  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })

  cleanup = setupIPC(mainWindow)
}

function createTray(): void {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Mindobix App Store')

  const menu = Menu.buildFromTemplate([
    { label: 'Mindobix App Store', enabled: false },
    { type: 'separator' },
    { label: 'Open', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus() })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  app.on('activate', () => { mainWindow?.show(); mainWindow?.focus() })
})

app.on('window-all-closed', () => app.quit())

app.on('before-quit', () => cleanup?.())
