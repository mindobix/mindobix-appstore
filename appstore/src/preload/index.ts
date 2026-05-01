import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s: Record<string, unknown>) => ipcRenderer.invoke('save-settings', s),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getAppStatuses: (ids: string[]) => ipcRenderer.invoke('get-app-statuses', ids),
  cloneApp: (appId: string, repoUrl: string) => ipcRenderer.invoke('clone-app', appId, repoUrl),
  openRepo: (url: string) => ipcRenderer.invoke('open-repo', url),
  launchStatic: (appId: string, title: string, indexFile?: string) => ipcRenderer.invoke('launch-static', appId, title, indexFile),
  launchUrl: (appId: string, title: string, url: string) => ipcRenderer.invoke('launch-url', appId, title, url),
  startServer: (appId: string, startScript: string) => ipcRenderer.invoke('start-server', appId, startScript),
  stopServer: (appId: string) => ipcRenderer.invoke('stop-server', appId),
  getServers: () => ipcRenderer.invoke('get-servers'),

  onCloneProgress: (cb: (data: { appId: string; line: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { appId: string; line: string }) => cb(data)
    ipcRenderer.on('clone-progress', handler)
    return () => ipcRenderer.removeListener('clone-progress', handler)
  },

  onServerLog: (cb: (data: { appId: string; line: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { appId: string; line: string }) => cb(data)
    ipcRenderer.on('server-log', handler)
    return () => ipcRenderer.removeListener('server-log', handler)
  },

  onServerStopped: (cb: (data: { appId: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { appId: string }) => cb(data)
    ipcRenderer.on('server-stopped', handler)
    return () => ipcRenderer.removeListener('server-stopped', handler)
  },

  getBackupState: () => ipcRenderer.invoke('get-backup-state'),
  setBackupFolder: (appId: string) => ipcRenderer.invoke('set-backup-folder', appId),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),

  onBackupCopied: (cb: (data: { appId: string; record: { fileName: string; copiedAt: string; destPath: string } }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { appId: string; record: { fileName: string; copiedAt: string; destPath: string } }) => cb(data)
    ipcRenderer.on('backup-copied', handler)
    return () => ipcRenderer.removeListener('backup-copied', handler)
  },

  backupAppstore: () => ipcRenderer.invoke('backup-appstore'),
  restoreAppstore: () => ipcRenderer.invoke('restore-appstore'),
})
