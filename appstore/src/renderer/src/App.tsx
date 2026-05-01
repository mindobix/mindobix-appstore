import React, { useEffect, useState } from 'react'
import type { Settings, BackupRecord } from './types'
import WelcomeDialog from './components/WelcomeDialog'
import Store from './pages/Store'

declare global {
  interface Window {
    api: {
      getSettings: () => Promise<Settings>
      saveSettings: (s: Partial<Settings>) => Promise<{ ok: boolean }>
      selectFolder: () => Promise<string | null>
      getAppStatuses: (ids: string[]) => Promise<Record<string, boolean>>
      cloneApp: (appId: string, repoUrl: string) => Promise<{ ok?: true; path?: string; error?: string; lines?: string[] }>
      openRepo: (url: string) => Promise<void>
      launchStatic: (appId: string, title: string, indexFile?: string) => Promise<{ ok?: true; error?: string }>
      launchUrl: (appId: string, title: string, url: string) => Promise<{ ok?: true; error?: string }>
      startServer: (appId: string, startScript: string) => Promise<{ ok?: true; port?: number; error?: string }>
      stopServer: (appId: string) => Promise<{ ok: boolean }>
      getServers: () => Promise<Record<string, number>>
      onCloneProgress: (cb: (d: { appId: string; line: string }) => void) => () => void
      onServerLog: (cb: (d: { appId: string; line: string }) => void) => () => void
      onServerStopped: (cb: (d: { appId: string }) => void) => () => void
      getFavorites: () => Promise<string[]>
      saveFavorites: (ids: string[]) => Promise<{ ok: boolean }>
      getBackupState: () => Promise<{ folders: Record<string, string>; history: Record<string, BackupRecord> }>
      setBackupFolder: (appId: string) => Promise<string | null>
      openFolder: (folderPath: string) => Promise<string>
      onBackupCopied: (cb: (d: { appId: string; record: BackupRecord }) => void) => () => void
      backupAppstore: () => Promise<{ ok?: boolean; fileName?: string; error?: string }>
      restoreAppstore: () => Promise<{ ok: boolean; error?: string }>
    }
  }
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getSettings().then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const handleSetupDone = (folder: string, backupFolder?: string) => {
    const next: Settings = { localFolder: folder, firstRun: false, ...(backupFolder ? { appstoreBackupFolder: backupFolder } : {}) }
    setSettings(next)
    window.api.saveSettings(next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f1a]">
        <div className="w-8 h-8 border-2 border-[#5b5ef4] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!settings || settings.firstRun || !settings.localFolder) {
    return <WelcomeDialog onDone={handleSetupDone} initialFolder={settings?.localFolder} initialBackupFolder={settings?.appstoreBackupFolder} />
  }

  return <Store settings={settings} onChangeFolder={() => {
    const next = { ...settings, firstRun: true }
    setSettings(next)
    window.api.saveSettings(next)
  }} />
}
