import React, { useEffect, useRef } from 'react'

interface Props {
  appId: string
  displayName: string
  icon: string
  bg: string
  lines: string[]
  done: boolean
  error?: string
  onClose: () => void
}

export default function CloneProgress({ appId: _appId, displayName, icon, bg, lines, done, error, onClose }: Props) {
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [lines])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">Cloning {displayName}</div>
            {!done && !error && (
              <div className="text-xs text-[#64748b] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5b5ef4] animate-pulse inline-block" />
                Running git clone…
              </div>
            )}
            {done && !error && (
              <div className="text-xs text-[#22c55e] mt-0.5">✓ Cloned successfully</div>
            )}
            {error && (
              <div className="text-xs text-red-400 mt-0.5">✗ {error}</div>
            )}
          </div>
          {(done || error) && (
            <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors text-lg leading-none px-1">×</button>
          )}
        </div>

        {/* Terminal output */}
        <div
          ref={termRef}
          className="clone-terminal bg-[#0a0a14] text-[#94a3b8] px-5 py-4 h-52 overflow-y-auto"
        >
          {lines.length === 0 && (
            <span className="text-[#4a5568]">Waiting for output…</span>
          )}
          {lines.map((line, i) => (
            <div key={i} className={line.includes('error') || line.includes('Error') ? 'text-red-400' : line.includes('%') || line.includes('done') ? 'text-[#22c55e]' : ''}>
              {line}
            </div>
          ))}
          {!done && !error && <span className="inline-block w-2 h-4 bg-[#5b5ef4] animate-pulse ml-0.5 align-middle" />}
        </div>

        {/* Footer */}
        {(done || error) && (
          <div className="px-5 py-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#5b5ef4] hover:bg-[#4748d4] text-white text-sm font-medium transition-colors"
            >
              {error ? 'Dismiss' : 'Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
