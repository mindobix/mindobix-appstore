import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import net from 'net'
import { spawn, ChildProcess } from 'child_process'
import * as db from './db'

interface ServerProc extends ChildProcess {
  port: number
}

const runningServers = new Map<string, ServerProc>()

// Track open app windows — one per appId, bring to front if already open
const openAppWindows = new Map<string, BrowserWindow>()

function openAppWindow(appId: string, title: string, url: string): void {
  const existing = openAppWindows.get(appId)
  if (existing && !existing.isDestroyed()) {
    existing.show()
    existing.focus()
    return
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,        // allow local file:// assets to load freely
      allowRunningInsecureContent: true,
    }
  })

  win.setTitle(title)

  if (url.startsWith('file://')) {
    win.loadURL(url)
  } else {
    win.loadURL(url)
  }

  win.on('closed', () => openAppWindows.delete(appId))
  openAppWindows.set(appId, win)
}

function findFreePort(start = 5000): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(start, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      server.close(() => resolve(addr.port))
    })
    server.on('error', () => {
      if (start < 6000) findFreePort(start + 1).then(resolve).catch(reject)
      else reject(new Error('No free port found'))
    })
  })
}

export function setupIPC(mainWindow: BrowserWindow): () => void {
  ipcMain.handle('get-settings', () => db.getSettings())

  ipcMain.handle('save-settings', (_e, settings: Record<string, unknown>) => {
    db.saveSettings(settings as Parameters<typeof db.saveSettings>[0])
    return { ok: true }
  })

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select folder for Mindobix apps'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('get-app-statuses', (_e, appIds: string[]) => {
    const { localFolder } = db.getSettings()
    const result: Record<string, boolean> = {}
    for (const id of appIds) {
      result[id] = localFolder ? fs.existsSync(path.join(localFolder, id)) : false
    }
    return result
  })

  ipcMain.handle('clone-app', (_e, appId: string, repoUrl: string) => {
    const { localFolder } = db.getSettings()
    if (!localFolder) return { error: 'No local folder set' }

    const destPath = path.join(localFolder, appId)
    if (fs.existsSync(destPath)) return { error: 'App already exists at that path' }

    return new Promise<{ ok: true; path: string } | { error: string; lines?: string[] }>((resolve) => {
      const proc = spawn('git', ['clone', '--progress', repoUrl, destPath], { stdio: ['ignore', 'pipe', 'pipe'] })
      const lines: string[] = []

      const onData = (data: Buffer) => {
        const line = data.toString().trim()
        if (line) {
          lines.push(line)
          if (!mainWindow.isDestroyed()) mainWindow.webContents.send('clone-progress', { appId, line })
        }
      }

      proc.stdout.on('data', onData)
      proc.stderr.on('data', onData)

      proc.on('close', (code) => {
        if (code === 0) {
          db.recordClone(appId, destPath)
          resolve({ ok: true, path: destPath })
        } else {
          try { fs.rmSync(destPath, { recursive: true, force: true }) } catch {}
          resolve({ error: `git clone failed (exit ${code})`, lines })
        }
      })

      proc.on('error', (err) => resolve({ error: err.message }))
    })
  })

  // Opens a GitHub URL in the system browser (not an app window)
  ipcMain.handle('open-repo', (_e, url: string) => shell.openExternal(url))

  // Launches a static app in its own Electron window
  ipcMain.handle('launch-static', (_e, appId: string, title: string, indexFile = 'index.html') => {
    const { localFolder } = db.getSettings()
    if (!localFolder) return { error: 'No local folder set' }
    const filePath = path.join(localFolder, appId, indexFile)
    if (!fs.existsSync(filePath)) return { error: `File not found: ${filePath}` }
    openAppWindow(appId, title, `file://${filePath}`)
    return { ok: true }
  })

  // Launches a server app in its own Electron window
  ipcMain.handle('launch-url', (_e, appId: string, title: string, url: string) => {
    openAppWindow(appId, title, url)
    return { ok: true }
  })

  ipcMain.handle('start-server', async (_e, appId: string, startScript: string) => {
    const { localFolder } = db.getSettings()
    if (!localFolder) return { error: 'No local folder set' }

    const appPath = path.join(localFolder, appId)
    if (!fs.existsSync(appPath)) return { error: 'App not installed' }

    const existing = runningServers.get(appId)
    if (existing) return { ok: true, port: existing.port }

    let port: number
    try {
      port = await findFreePort(5000)
    } catch {
      return { error: 'Could not find a free port' }
    }

    return new Promise<{ ok: true; port: number } | { error: string }>((resolve) => {
      const parts = startScript.split(' ')
      const cmd = parts[0]
      const args = parts.slice(1)

      const proc = spawn(cmd, args, {
        cwd: appPath,
        env: { ...process.env, PORT: String(port), FLASK_RUN_PORT: String(port), FLASK_ENV: 'development' },
        stdio: ['ignore', 'pipe', 'pipe']
      }) as ServerProc

      proc.port = port
      runningServers.set(appId, proc)

      let resolved = false
      const tryResolve = () => {
        if (!resolved) { resolved = true; resolve({ ok: true, port }) }
      }

      const onLog = (data: Buffer) => {
        const text = data.toString().trim()
        if (text && !mainWindow.isDestroyed()) mainWindow.webContents.send('server-log', { appId, line: text })
        if (text.match(/running|started|listening|serving|\d{4}/i)) tryResolve()
      }

      proc.stdout.on('data', onLog)
      proc.stderr.on('data', onLog)

      proc.on('error', (err) => {
        runningServers.delete(appId)
        if (!resolved) { resolved = true; resolve({ error: err.message }) }
      })

      proc.on('close', () => {
        runningServers.delete(appId)
        if (!mainWindow.isDestroyed()) mainWindow.webContents.send('server-stopped', { appId })
      })

      setTimeout(tryResolve, 3000)
    })
  })

  ipcMain.handle('stop-server', (_e, appId: string) => {
    const proc = runningServers.get(appId)
    if (proc) { proc.kill(); runningServers.delete(appId) }
    // Close the app window too if open
    const win = openAppWindows.get(appId)
    if (win && !win.isDestroyed()) win.close()
    return { ok: true }
  })

  ipcMain.handle('get-servers', () => {
    const result: Record<string, number> = {}
    for (const [id, proc] of runningServers.entries()) result[id] = proc.port
    return result
  })

  return () => {
    for (const proc of runningServers.values()) proc.kill()
    runningServers.clear()
    for (const win of openAppWindows.values()) {
      if (!win.isDestroyed()) win.close()
    }
    openAppWindows.clear()
  }
}
