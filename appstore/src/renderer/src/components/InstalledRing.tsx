import React from 'react'

interface Props {
  installed: number
  total: number
}

export default function InstalledRing({ installed, total }: Props) {
  const r = 18
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? installed / total : 0
  const dash = pct * circ

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg width="44" height="44" viewBox="0 0 44 44">
          {/* Track */}
          <circle cx="22" cy="22" r={r} fill="none" stroke="#22223b" strokeWidth="3.5" />
          {/* Progress */}
          <circle
            cx="22" cy="22" r={r}
            fill="none"
            stroke="#5b5ef4"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 22 22)"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white leading-none">{installed}</span>
        </div>
      </div>
      <div className="text-xs text-[#64748b] leading-tight">
        <div className="text-white font-semibold text-sm">{installed} / {total}</div>
        <div>installed</div>
      </div>
    </div>
  )
}
