import React, { useState } from 'react'

interface Props {
  onDone: (folder: string, backupFolder?: string) => void
  initialFolder?: string
  initialBackupFolder?: string
}

export default function WelcomeDialog({ onDone, initialFolder = '', initialBackupFolder = '' }: Props) {
  const [folder, setFolder] = useState(initialFolder)
  const [backupFolder, setBackupFolder] = useState(initialBackupFolder)
  const [error, setError] = useState('')

  const pick = async () => {
    const f = await window.api.selectFolder()
    if (f) { setFolder(f); setError('') }
  }

  const pickBackup = async () => {
    const f = await window.api.selectFolder()
    if (f) setBackupFolder(f)
  }

  const submit = () => {
    if (!folder) { setError('Please select a folder first.'); return }
    onDone(folder, backupFolder || undefined)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f1a] p-6">
      <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="text-5xl mb-4">🛍️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Mindobix</h1>
          <p className="text-[#94a3b8] text-sm leading-relaxed">
            Your personal local app store. Browse, clone, and launch Mindobix apps right from your desktop.
          </p>
        </div>

        {/* Steps */}
        <div className="px-8 pb-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#5b5ef4]/20 text-[#5b5ef4] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <div>
              <div className="text-sm font-medium text-white">Choose your apps folder</div>
              <div className="text-xs text-[#64748b] mt-0.5">All Mindobix apps will be cloned into this folder.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#5b5ef4]/20 text-[#5b5ef4] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <div>
              <div className="text-sm font-medium text-white">Browse and clone apps</div>
              <div className="text-xs text-[#64748b] mt-0.5">One-click cloning from the app grid.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#5b5ef4]/20 text-[#5b5ef4] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <div>
              <div className="text-sm font-medium text-white">Launch instantly</div>
              <div className="text-xs text-[#64748b] mt-0.5">Static apps open in your browser. Server apps start automatically.</div>
            </div>
          </div>
        </div>

        {/* Folder pickers */}
        <div className="px-8 pb-8 space-y-5">
          {/* Apps folder (required) */}
          <div>
            <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Apps Folder</div>
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#64748b] cursor-pointer hover:border-[#5b5ef4]/50 transition-colors truncate"
                onClick={pick}
                title={folder || 'Click to choose folder'}
              >
                {folder ? (
                  <span className="text-white truncate">{folder}</span>
                ) : (
                  <span>Click to choose a folder…</span>
                )}
              </div>
              <button
                onClick={pick}
                className="px-4 py-3 rounded-xl bg-[#22223b] hover:bg-[#2d2d4a] border border-white/10 text-sm text-white transition-colors flex-shrink-0"
              >
                Browse
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          {/* Appstore backup folder (optional) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Appstore Backup Folder</div>
              <span className="text-[10px] text-[#4a5568] bg-[#22223b] px-1.5 py-0.5 rounded-md">Optional</span>
            </div>
            <div className="text-xs text-[#64748b] mb-2">Auto-saves your settings backups here whenever you export them to Downloads.</div>
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#64748b] cursor-pointer hover:border-[#f59e0b]/50 transition-colors truncate"
                onClick={pickBackup}
                title={backupFolder || 'Click to choose folder'}
              >
                {backupFolder ? (
                  <span className="text-[#f59e0b] truncate">{backupFolder}</span>
                ) : (
                  <span>Click to choose a folder…</span>
                )}
              </div>
              <button
                onClick={pickBackup}
                className="px-4 py-3 rounded-xl bg-[#22223b] hover:bg-[#2d2d4a] border border-white/10 text-sm text-white transition-colors flex-shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!folder}
            className="w-full py-3 rounded-xl bg-[#5b5ef4] hover:bg-[#4748d4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  )
}
