import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { AppDef, Settings } from '../types'
import AppCard from '../components/AppCard'
import CloneProgress from '../components/CloneProgress'
import InstalledRing from '../components/InstalledRing'
import clones from '../clones.json'

const APPS = clones as AppDef[]

interface Props {
  settings: Settings
  onChangeFolder: () => void
}

type Filter = 'all' | 'installed' | 'available' | string

interface CloneState {
  appId: string
  lines: string[]
  done: boolean
  error?: string
}

export default function Store({ settings, onChangeFolder }: Props) {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({})
  const [servers, setServers] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [cloneState, setCloneState] = useState<CloneState | null>(null)
  const [cloningIds, setCloningIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const loadStatuses = useCallback(async () => {
    const ids = APPS.map(a => a.id)
    const [s, srv] = await Promise.all([window.api.getAppStatuses(ids), window.api.getServers()])
    setStatuses(s)
    setServers(srv)
  }, [])

  useEffect(() => {
    loadStatuses()

    const offProgress = window.api.onCloneProgress(({ appId, line }) => {
      setCloneState(prev => {
        if (!prev || prev.appId !== appId) return prev
        return { ...prev, lines: [...prev.lines, line] }
      })
    })

    const offStopped = window.api.onServerStopped(({ appId }) => {
      setServers(s => { const n = { ...s }; delete n[appId]; return n })
    })

    return () => { offProgress(); offStopped() }
  }, [loadStatuses])

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  const handleClone = async (app: AppDef) => {
    setCloningIds(s => new Set(s).add(app.id))
    setCloneState({ appId: app.id, lines: [], done: false })
    const result = await window.api.cloneApp(app.id, app.repo + '.git')
    setCloningIds(s => { const n = new Set(s); n.delete(app.id); return n })
    if (result.ok) {
      setCloneState(prev => prev ? { ...prev, done: true } : null)
      setStatuses(s => ({ ...s, [app.id]: true }))
      showToast(`${app.displayName} cloned successfully`)
    } else {
      setCloneState(prev => prev ? { ...prev, done: true, error: result.error } : null)
    }
  }

  const handleLaunch = async (app: AppDef) => {
    const srv = servers[app.id]
    if (srv) {
      await window.api.launchUrl(app.id, app.displayName, `http://localhost:${srv}`)
      return
    }
    const result = await window.api.launchStatic(app.id, app.displayName, app.indexFile)
    if (result.error) showToast(`Error: ${result.error}`)
  }

  const handleStartServer = async (app: AppDef) => {
    if (!app.startScript) return
    showToast(`Starting ${app.displayName}…`)
    const result = await window.api.startServer(app.id, app.startScript)
    if (result.ok && result.port) {
      setServers(s => ({ ...s, [app.id]: result.port! }))
      await window.api.launchUrl(app.id, app.displayName, `http://localhost:${result.port}`)
    } else if (result.error) {
      showToast(`Failed to start: ${result.error}`)
    }
  }

  const handleStopServer = async (app: AppDef) => {
    await window.api.stopServer(app.id)
    setServers(s => { const n = { ...s }; delete n[app.id]; return n })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStatuses()
    setRefreshing(false)
    showToast('Refreshed ✓')
  }

  const categories = [...new Set(APPS.map(a => a.category))].sort()
  const installedCount = Object.values(statuses).filter(Boolean).length

  const filtered = APPS.filter(app => {
    if (filter === 'installed' && !statuses[app.id]) return false
    if (filter === 'available' && statuses[app.id]) return false
    if (filter !== 'all' && filter !== 'installed' && filter !== 'available' && app.category !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${app.id} ${app.displayName} ${app.description} ${app.category}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const showFeatured = filter === 'all' && !search
  const featuredApps = APPS.filter(a => a.featured)
  const featuredIds = new Set(featuredApps.map(a => a.id))
  // Only exclude featured apps from the grid when they are all shown in the Featured strip
  const gridApps = showFeatured ? filtered.filter(a => !featuredIds.has(a.id)) : filtered
  const totalVisible = showFeatured ? filtered.length : gridApps.length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f1a]">
      {/* Top bar — pt-10 gives traffic-light clearance on macOS hiddenInset */}
      <header className="drag-region flex items-center gap-4 px-5 pt-10 pb-3 border-b border-white/[0.08] bg-[#0f0f1a]/90 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2.5 mr-2 no-drag">
          <span className="text-xl">🛍️</span>
          <span className="font-bold text-white text-[15px]">Mindobix</span>
        </div>

        <input
          className="no-drag flex-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[#5b5ef4]/60 transition-colors"
          placeholder="Search apps…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="no-drag ml-auto flex items-center gap-3">
          <InstalledRing installed={installedCount} total={APPS.length} />

          <button
            onClick={handleRefresh}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[#64748b] hover:text-white hover:bg-white/10 transition-colors ${refreshing ? 'spinning' : ''}`}
            title="Refresh status"
          >
            ⟳
          </button>

          <button
            onClick={onChangeFolder}
            title={`Apps folder: ${settings.localFolder}`}
            className="text-[#4a5568] hover:text-white transition-colors text-lg"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/[0.08] bg-[#0f0f1a]/80 overflow-x-auto flex-shrink-0 no-drag">
        {(['all', 'installed', 'available'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors flex-shrink-0 ${filter === f ? 'bg-[#5b5ef4] text-white' : 'text-[#64748b] hover:text-white hover:bg-white/[0.08]'}`}
          >
            {f}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0" />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${filter === cat ? 'bg-[#5b5ef4] text-white' : 'text-[#64748b] hover:text-white hover:bg-white/[0.08]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 py-5 no-drag">
        {/* Featured strip */}
        {showFeatured && featuredApps.length > 0 && (
          <section className="mb-7">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Featured</div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {featuredApps.map(app => (
                <AppCard
                  key={app.id}
                  app={app}
                  installed={!!statuses[app.id]}
                  serverPort={servers[app.id]}
                  cloning={cloningIds.has(app.id)}
                  onClone={() => handleClone(app)}
                  onLaunch={() => handleLaunch(app)}
                  onStartServer={() => handleStartServer(app)}
                  onStopServer={() => handleStopServer(app)}
                  onOpenRepo={() => window.api.openRepo(app.repo)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All apps grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              {filter === 'all' ? 'All Apps' : filter === 'installed' ? 'Installed' : filter === 'available' ? 'Available' : `${filter} Apps`}
            </div>
            <div className="text-xs text-[#4a5568]">{totalVisible} app{totalVisible !== 1 ? 's' : ''}</div>
          </div>

          {gridApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold text-white">No apps found</div>
              <div className="text-[#64748b] text-sm mt-1">Try a different filter or search term</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {gridApps.map(app => (
                <AppCard
                  key={app.id}
                  app={app}
                  installed={!!statuses[app.id]}
                  serverPort={servers[app.id]}
                  cloning={cloningIds.has(app.id)}
                  onClone={() => handleClone(app)}
                  onLaunch={() => handleLaunch(app)}
                  onStartServer={() => handleStartServer(app)}
                  onStopServer={() => handleStopServer(app)}
                  onOpenRepo={() => window.api.openRepo(app.repo)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Clone progress modal */}
      {cloneState && (() => {
        const app = APPS.find(a => a.id === cloneState.appId)!
        return (
          <CloneProgress
            appId={cloneState.appId}
            displayName={app?.displayName ?? cloneState.appId}
            icon={app?.icon ?? '📦'}
            bg={app?.bg ?? 'rgba(91,94,244,.15)'}
            lines={cloneState.lines}
            done={cloneState.done}
            error={cloneState.error}
            onClose={() => setCloneState(null)}
          />
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-white/[0.15] rounded-xl px-5 py-3 text-sm text-white shadow-xl z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}
