export interface AppDef {
  id: string
  displayName: string
  repo: string
  description: string
  icon: string
  color: string
  bg: string
  category: string
  featured: boolean
  startType: 'static' | 'python' | 'npm'
  startScript?: string
  indexFile?: string
  backupPattern?: string
}

export interface BackupRecord {
  fileName: string
  copiedAt: string
  destPath: string
}

export interface Settings {
  localFolder: string
  firstRun: boolean
  appstoreBackupFolder?: string
}

export interface CloneProgress {
  appId: string
  lines: string[]
  done: boolean
  error?: string
}
