import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface Settings {
  localFolder: string
  firstRun: boolean
}

interface CloneRecord {
  clonedAt: string
  path: string
}

interface DbData {
  settings: Settings
  cloneHistory: Record<string, CloneRecord>
}

const defaults: DbData = {
  settings: { localFolder: '', firstRun: true },
  cloneHistory: {}
}

function dbPath(): string {
  return path.join(app.getPath('userData'), 'appstore.json')
}

function load(): DbData {
  try {
    const p = dbPath()
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch {}
  return JSON.parse(JSON.stringify(defaults))
}

function save(data: DbData): void {
  fs.writeFileSync(dbPath(), JSON.stringify(data, null, 2))
}

export function getSettings(): Settings {
  return load().settings
}

export function saveSettings(settings: Partial<Settings>): void {
  const db = load()
  db.settings = { ...db.settings, ...settings }
  save(db)
}

export function recordClone(appId: string, appPath: string): void {
  const db = load()
  db.cloneHistory[appId] = { clonedAt: new Date().toISOString(), path: appPath }
  save(db)
}

export function getCloneHistory(): Record<string, CloneRecord> {
  return load().cloneHistory
}
