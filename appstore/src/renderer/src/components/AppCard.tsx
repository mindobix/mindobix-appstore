import React from 'react'
import type { AppDef } from '../types'

interface Props {
  app: AppDef
  installed: boolean
  serverPort?: number
  onClone: () => void
  onLaunch: () => void
  onStartServer: () => void
  onStopServer: () => void
  onOpenRepo: () => void
  cloning?: boolean
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" />
      <polyline points="10 1 15 1 15 6" />
      <line x1="15" y1="1" x2="7" y2="9" />
    </svg>
  )
}

export default function AppCard({ app, installed, serverPort, onClone, onLaunch, onStartServer, onStopServer, onOpenRepo, cloning }: Props) {
  const isServer = app.startType === 'python' || app.startType === 'npm'
  const serverRunning = serverPort !== undefined

  return (
    <div
      className="app-card relative bg-[#1a1a2e] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/[0.15]"
      style={{ boxShadow: installed ? `0 0 20px ${app.bg.replace('.15', '.08')}` : undefined }}
    >
      {/* Top row: icon + badges */}
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: app.bg }}
        >
          {app.icon}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Circular installed badge */}
          <div className="relative w-7 h-7">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="none" stroke="#22223b" strokeWidth="2.5" />
              {installed && (
                <circle cx="14" cy="14" r="10" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="62.8 62.8" transform="rotate(-90 14 14)" />
              )}
            </svg>
            {installed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] text-[#22c55e] font-bold">✓</span>
              </div>
            )}
          </div>

          {/* GitHub link */}
          <button
            onClick={onOpenRepo}
            title="View on GitHub"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5568] hover:text-white hover:bg-white/10 transition-colors"
          >
            <GitHubIcon />
          </button>

          {/* Launch in browser (static apps only, when installed) */}
          {installed && !isServer && (
            <button
              onClick={onLaunch}
              title="Open in browser (file://)"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4a5568] hover:text-[#5b5ef4] hover:bg-white/10 transition-colors"
            >
              <ExternalLinkIcon />
            </button>
          )}
        </div>
      </div>

      {/* App name + category */}
      <div>
        <div className="font-semibold text-white text-[15px] leading-tight">{app.displayName}</div>
        <div className="text-xs mt-0.5" style={{ color: app.color }}>{app.category}</div>
      </div>

      {/* Description */}
      <div className="text-[#64748b] text-xs leading-relaxed flex-1 line-clamp-3">{app.description}</div>

      {/* Action area */}
      <div className="mt-auto pt-1">
        {!installed && (
          <button
            onClick={onClone}
            disabled={cloning}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: cloning ? '#22223b' : `${app.color}22`,
              color: cloning ? '#64748b' : app.color,
              border: `1px solid ${app.color}33`
            }}
          >
            {cloning ? '⏳ Cloning…' : '↓ Clone'}
          </button>
        )}

        {installed && !isServer && (
          <button
            onClick={onLaunch}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-[#5b5ef4]/20 hover:bg-[#5b5ef4]/30 text-[#5b5ef4] border border-[#5b5ef4]/30 transition-colors"
          >
            Open App ↗
          </button>
        )}

        {installed && isServer && !serverRunning && (
          <button
            onClick={onStartServer}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: `${app.color}22`,
              color: app.color,
              border: `1px solid ${app.color}33`
            }}
          >
            ▶ Start &amp; Launch
          </button>
        )}

        {installed && isServer && serverRunning && (
          <div className="flex gap-2">
            <button
              onClick={onLaunch}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] border border-[#22c55e]/30 transition-colors"
            >
              Open ↗ :{serverPort}
            </button>
            <button
              onClick={onStopServer}
              className="px-3 py-2 rounded-xl text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
              title="Stop server"
            >
              ■
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
