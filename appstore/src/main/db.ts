import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface Settings {
  localFolder: string
  firstRun: boolean
  appstoreBackupFolder?: string
}

interface CloneRecord {
  clonedAt: string
  path: string
}

export interface BackupRecord {
  fileName: string
  copiedAt: string
  destPath: string
}

interface DbData {
  settings: Settings
  cloneHistory: Record<string, CloneRecord>
  backupFolders: Record<string, string>
  backupHistory: Record<string, BackupRecord>
  favorites: string[]
}

const defaults: DbData = {
  settings: { localFolder: '', firstRun: true },
  cloneHistory: {},
  backupFolders: {},
  backupHistory: {},
  favorites: []
}

function dbPath(): string {
  return path.join(app.getPath('userData'), 'appstore.json')
}

function load(): DbData {
  try {
    const p = dbPath()
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      return {
        ...defaults,
        ...raw,
        settings: { ...defaults.settings, ...raw.settings }
      }
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

export function getBackupFolders(): Record<string, string> {
  return load().backupFolders
}

export function setBackupFolder(appId: string, folderPath: string): void {
  const db = load()
  db.backupFolders[appId] = folderPath
  save(db)
}

export function getBackupHistory(): Record<string, BackupRecord> {
  return load().backupHistory
}

export function recordBackup(appId: string, record: BackupRecord): void {
  const db = load()
  db.backupHistory[appId] = record
  save(db)
}

export function getFavorites(): string[] {
  return load().favorites ?? []
}

export function saveFavorites(ids: string[]): void {
  const db = load()
  db.favorites = ids
  save(db)
}
