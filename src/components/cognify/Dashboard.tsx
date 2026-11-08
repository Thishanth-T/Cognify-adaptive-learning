// @ts-nocheck
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLearningData } from '@/lib/learning/useLearningData'
import LearningTwin from './LearningTwin'
import ConceptGraph from './ConceptGraph'
import AgentPanel from './AgentPanel'
import Workspace from './Workspace'
import Walkthrough, { shouldShowWalkthrough, resetWalkthrough } from './Walkthrough'

type DashboardProps = {
  initialSelectedConcept?: string
  initialContext?: string
  initialSubject: string
  initialTopic: string
  initialLevel: string
  onChangeTopic?: () => void
  onSignOut?: () => void
}

const navigation = [
  { id: 'home', label: 'Home' },
  { id: 'concept-graph', label: 'Concept Graph' },
  { id: 'learning-workspace', label: 'Learning Workspace' },
  { id: 'learning-twin', label: 'Learning Twin' },
  { id: 'ai-agents', label: 'AI Agents' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
]

function NavIcon({ id, className = "w-4 h-4" }: { id: string; className?: string }) {
  switch (id) {
    case 'home':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    case 'concept-graph':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="18" cy="6" r="3"/>
          <circle cx="12" cy="18" r="3"/>
          <line x1="8.5" y1="7.5" x2="10.5" y2="15.5"/>
          <line x1="15.5" y1="7.5" x2="13.5" y2="15.5"/>
        </svg>
      )
    case 'learning-workspace':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="m9 10 2 2-2 2"/>
          <path d="M13 14h2"/>
        </svg>
      )
    case 'learning-twin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      )
    case 'ai-agents':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4"/>
          <path d="m4.93 4.93 2.83 2.83"/>
          <path d="M2 12h4"/>
          <path d="m4.93 19.07 2.83-2.83"/>
          <path d="M12 22v-4"/>
          <path d="m19.07 19.07-2.83-2.83"/>
          <path d="M22 12h-4"/>
          <path d="m19.07 4.93-2.83 2.83"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      )
    case 'progress':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10"/>
          <line x1="12" x2="12" y1="20" y2="4"/>
          <line x1="6" x2="6" y1="20" y2="14"/>
        </svg>
      )
    case 'settings':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    default:
      return null
  }
}

export default function Dashboard({
  initialSelectedConcept,
  initialContext,
  initialSubject,
  initialTopic,
  initialLevel,
  onChangeTopic,
  onSignOut,
}: DashboardProps) {
  const { user, profile, isGuest, signOut, openSignIn, openSignUp } = useAuth()

  const learningData = useLearningData(
    initialSubject,
    initialTopic,
    initialLevel,
    user?.id
  )

  const { concepts, assessments, twin, plan } = learningData

  const matchingConcept = concepts.find(
    (concept) =>
      concept.id === initialSelectedConcept ||
      concept.label.toLowerCase() === initialSelectedConcept?.toLowerCase()
  )

  // Ensure initial selected concept is not locked; fallback to plan.next or first unlocked concept
  const initialConceptId = (() => {
    if (matchingConcept) {
      const node = twin.nodes.find((n: any) => n.id === matchingConcept.id)
      if (node?.state !== 'locked') return matchingConcept.id
    }
    if (plan?.next?.id) return plan.next.id
    const firstUnlocked = concepts.find((c: any) => {
      const node = twin.nodes.find((n: any) => n.id === c.id)
      return node?.state !== 'locked'
    })
    return firstUnlocked?.id ?? concepts[0]?.id ?? null
  })()

  const [selectedConcept, setSelectedConcept] = useState<string | null>(initialConceptId)
  const [lockedGateConcept, setLockedGateConcept] = useState<any | null>(null)

  const [activeNav, setActiveNav] = useState('home')
  const [logs, setLogs] = useState<string[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('cognify-theme') as 'dark' | 'light') || 'dark'
  })

  const [showWalkthrough, setShowWalkthrough] = useState(() => shouldShowWalkthrough())

  const [preferences, setPreferences] = useState({
    animations: true,
    soundEffects: false,
    compactMode: false,
  })

  const selectedConceptData = concepts.find(
    (concept) => concept.id === selectedConcept
  )

  const selectedConceptLabel = selectedConceptData?.label ?? initialTopic

  const pushLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    setLogs((previous) => [`${timestamp} — ${message}`, ...previous.slice(0, 40)])
  }

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    setLogs([
      `${timestamp} — ${
        initialContext ?? `Initialized ${initialSubject} / ${initialTopic}`
      }`,
    ])
  }, [initialContext, initialSubject, initialTopic])

  useEffect(() => {
    localStorage.setItem('cognify-theme', theme)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.documentElement.classList.toggle('light', theme === 'light')
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const showLockedConceptGate = (conceptItem: any) => {
    const node = twin.nodes.find((n: any) => n.id === conceptItem.id)
    const prereqs = (conceptItem.prerequisites || []).map((pId: string) => {
      const pConcept = concepts.find((c: any) => c.id === pId)
      const pNode = twin.nodes.find((n: any) => n.id === pId)
      const mastery = pNode?.mastery ?? null
      return {
        id: pId,
        label: pConcept?.label || pNode?.label || pId,
        mastery,
        required: 60,
        met: mastery !== null && mastery >= 60,
      }
    })
    setLockedGateConcept({
      concept: conceptItem,
      node,
      prerequisites: prereqs,
    })
    pushLog(`🔒 ${conceptItem.label} is locked. Prerequisites needed before practice.`)
  }

  const handleConceptSelect = (conceptId: string) => {
    const c = concepts.find((item) => item.id === conceptId)
    if (!c) return
    const node = twin.nodes.find((n: any) => n.id === conceptId)
    if (node?.state === 'locked') {
      showLockedConceptGate(c)
      return
    }
    setSelectedConcept(c.id)
    pushLog(`Selected concept: ${c.label}`)
  }

  const openPage = (page: string) => {
    setActiveNav(page)
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  const activePage = navigation.find((item) => item.id === activeNav)

  const pageDescriptions: Record<string, string> = {
    home: 'Your personalized adaptive learning command center.',
    'concept-graph': 'Interactive knowledge map with real mastery-driven unlocking.',
    'learning-workspace': 'Explain concepts, test understanding, and consult the AI Tutor.',
    'learning-twin': 'Your cognitive student model, confidence metrics, and misconceptions.',
    'ai-agents': 'Live status and telemetry for the 5 specialized autonomous learning agents.',
    progress: 'Comprehensive assessment records and longitudinal learning metrics.',
    settings: 'Customization, appearance, and cloud account management.',
  }

  const userDisplayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'
  const userInitials = userDisplayName.slice(0, 2).toUpperCase()

  return (
    <div
      data-theme={theme}
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#050916] text-white' : 'bg-[#F8FAFC] text-slate-900'
      } lg:flex lg:h-screen lg:overflow-hidden ${
        preferences.compactMode ? 'cognify-compact' : ''
      } ${preferences.animations ? '' : 'reduce-motion'}`}
    >
      {showWalkthrough && (
        <Walkthrough
          onNavigate={(page) => {
            openPage(page)
            setShowWalkthrough(false)
          }}
          onDismiss={() => setShowWalkthrough(false)}
        />
      )}
      {/* SIDEBAR */}
      <aside className={`flex w-full shrink-0 flex-col border-b lg:h-screen lg:w-[245px] lg:border-b-0 lg:border-r ${
        theme === 'dark' ? 'border-white/[0.08] bg-[#0B0F17]' : 'border-slate-200 bg-white'
      }`}>
        {/* Brand Header */}
        <div className={`flex h-[72px] shrink-0 items-center justify-between border-b px-5 ${
          theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3"/>
                <path d="M12 2v5"/>
                <path d="M22 12h-5"/>
              </svg>
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Cognify
              </span>
              <span className="ml-1.5 inline-block text-[9px] font-mono uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                Adaptive
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-y-auto">
          {navigation.map((item) => {
            const active = activeNav === item.id

            return (
              <button
                key={item.id}
                onClick={() => openPage(item.id)}
                className={`group flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-150 ${
                  active
                    ? (theme === 'dark'
                        ? 'bg-teal-500/10 text-teal-300 font-semibold border-l-2 border-teal-400'
                        : 'bg-teal-50 text-teal-900 font-bold border-l-2 border-teal-600 shadow-xs')
                    : (theme === 'dark'
                        ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium')
                }`}
              >
                <span className={`transition-colors ${active ? 'text-teal-500 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
                  <NavIcon id={item.id} className="w-4 h-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Change Topic Button */}
        {onChangeTopic && (
          <div className="px-3 pb-2">
            <button
              onClick={onChangeTopic}
              className={`w-full flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5 hover:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              <span>Change Learning Path</span>
            </button>
          </div>
        )}

        {/* Path Status Footer */}
        <div className={`m-3 hidden shrink-0 rounded-lg border p-3.5 lg:block ${
          theme === 'dark'
            ? 'border-white/[0.08] bg-[#111726]'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <span>TRACK</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">{initialLevel}</span>
          </div>
          <p className="mt-1 text-xs font-bold truncate text-slate-900 dark:text-slate-100 font-display">
            {initialSubject} · {initialTopic}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Gemini AI Connected</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:min-h-0">
        {/* HEADER */}
        <header className={`relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b px-6 py-3.5 xl:px-8 ${
          theme === 'dark' ? 'border-white/[0.08] bg-[#0B0F17]' : 'border-slate-200 bg-white'
        }`}>
          {/* LEFT: Page title, breadcrumbs, and learning-path information */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 min-w-0">
            <div>
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>{initialSubject}</span>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{initialTopic}</span>
                <span>/</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">{selectedConceptLabel}</span>
              </div>

              <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
                {activeNav === 'home' ? `Welcome back, ${userDisplayName}` : activePage?.label}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {pageDescriptions[activeNav]}
              </p>
            </div>

            {/* Active Learning Path Pill (Left-aligned with title) */}
            <div className={`hidden md:flex items-center gap-3 rounded-xl border px-3.5 py-2 ${
              theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <span>TRACK</span>
              </div>
              <div className="text-xs font-bold font-display text-slate-900 dark:text-slate-100">
                {initialSubject} · {initialTopic}
              </div>
              <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-teal-700 dark:text-teal-300">
                {initialLevel}
              </span>
            </div>

            {/* Gemini Live Indicator (Left-aligned) */}
            <div className="hidden xl:inline-flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/5 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="font-mono">Gemini 3.8 Flash Active</span>
            </div>
          </div>

          {/* FAR RIGHT: User Account Section (Right-aligned, separate from learning path) */}
          <div className="ml-auto flex items-center gap-3">
            {/* Cloud vs Guest Pill */}
            {isGuest ? (
              <button
                onClick={openSignIn}
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 transition hover:bg-amber-500/20"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Guest Mode</span>
                <span className="ml-1 text-[11px] text-amber-700 dark:text-amber-300 underline font-medium">Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Cloud Synced</span>
              </div>
            )}

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setProfileOpen(false)
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  theme === 'dark'
                    ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-500/40 hover:bg-teal-50 hover:text-teal-900'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                {logs.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className={`absolute right-0 top-12 z-50 w-[min(340px,90vw)] rounded-2xl border p-4 shadow-2xl ${
                  theme === 'dark' ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white font-display">System Activity</h3>
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">{logs.length} events</span>
                  </div>

                  <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                    {logs.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">
                        No activity recorded yet.
                      </p>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={`${log}-${index}`}
                          className="rounded-lg border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.025] p-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-mono"
                        >
                          <span className="mr-1.5 text-teal-500">●</span>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE MENU */}
            <div className="relative">
              <button
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationsOpen(false)
                }}
                className="flex h-10 items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 text-xs font-bold text-teal-700 dark:text-teal-300 transition hover:bg-teal-500/20"
              >
                <span>{userInitials}</span>
                <span className="text-[10px]">⌄</span>
              </button>

              {profileOpen && (
                <div className={`absolute right-0 top-12 z-50 w-64 rounded-2xl border p-4 shadow-2xl animate-fade-in ${
                  theme === 'dark' ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/15 border border-teal-500/30 text-xs font-bold text-teal-600 dark:text-teal-300 font-mono">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate font-display">{userDisplayName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {isGuest ? 'Guest Learner' : user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-3">
                    <button
                      onClick={() => openPage('learning-twin')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      <span>◉</span> My Learning Twin
                    </button>
                    <button
                      onClick={() => openPage('progress')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      <span>↗</span> My Practice History
                    </button>
                    <button
                      onClick={() => openPage('settings')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-teal-600 dark:hover:text-teal-400"
                    >
                      <span>⚙</span> Preferences & Account
                    </button>

                    <div className="border-t border-slate-100 dark:border-white/[0.08] pt-2 mt-2">
                      {isGuest ? (
                        <button
                          onClick={() => {
                            setProfileOpen(false)
                            openSignIn()
                          }}
                          className="btn-primary w-full py-2 text-xs"
                        >
                          Sign In / Sign Up
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            setProfileOpen(false)
                            await signOut()
                            pushLog('Signed out successfully')
                            onSignOut?.()
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20"
                        >
                          Sign Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY VIEW */}
        <main className="min-h-0 flex-1 overflow-y-auto p-5 xl:p-8">
          {/* HOME — ADAPTIVE LEARNING COMMAND CANVAS */}
          {activeNav === 'home' && (
            <div className="mx-auto max-w-6xl animate-fade-in space-y-6">
              {/* ADAPTIVE HERO & COGNITIVE TELEMETRY (Asymmetric 2-Column) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Journey Focus & Horizon (7 cols) */}
                <div className={`lg:col-span-8 rounded-xl border p-6 xl:p-7 flex flex-col justify-between ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                }`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        Adaptive Curriculum
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-mono">
                        {initialSubject} · {initialLevel}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white xl:text-3xl font-display">
                      {initialTopic}
                    </h2>

                    <p className="mt-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      Cognify's five autonomous agents track your conceptual understanding in real time. Explain mechanics, inspect prerequisite chains, and eliminate misconceptions through evidence-backed feedback.
                    </p>
                  </div>

                  {/* Dynamic Next Step Recommender Banner */}
                  <div className={`mt-6 rounded-lg border p-4 ${
                    theme === 'dark' ? 'border-teal-500/25 bg-teal-950/20' : 'border-teal-200 bg-teal-50/70'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-teal-700 dark:text-teal-300">
                        RECOMMENDED NEXT LEARNING ACTIVITY
                      </span>
                      {plan.next && (
                        <span className="text-[10px] font-mono font-medium text-slate-500">
                          Prerequisites Satisfied
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                        {plan.next?.label || selectedConceptLabel}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        — {plan.next?.reason || 'Submit your initial explanation to generate cognitive baseline.'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => {
                          if (plan.next?.id) handleConceptSelect(plan.next.id)
                          openPage('learning-workspace')
                        }}
                        className="btn-primary"
                      >
                        <span>Open Study Desk</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => openPage('concept-graph')}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                          theme === 'dark'
                            ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>Inspect Knowledge DAG</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Cognitive Twin Radar Telemetry (4 cols) */}
                <div className={`lg:col-span-4 rounded-xl border p-6 flex flex-col justify-between ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                        COGNITIVE MODEL STATUS
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        twin.overall !== null && twin.overall >= 75
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : twin.overall !== null
                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {twin.overall !== null && twin.overall >= 75 ? 'Mastered' : twin.overall !== null ? 'Calibrated' : 'Awaiting Data'}
                      </span>
                    </div>

                    {/* Circular Mastery Indicator & Dial */}
                    <div className="mt-5 flex items-center gap-5">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="stroke-slate-200 dark:stroke-slate-800"
                            strokeWidth="3.2"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="stroke-teal-500 transition-all duration-700 ease-out"
                            strokeDasharray={`${twin.overall ?? 0}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
                            {twin.overall !== null ? `${twin.overall}%` : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          Bayesian Mastery
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {twin.overall !== null
                            ? `Derived from ${twin.totalAttempts} verified submissions.`
                            : 'No scored attempts recorded yet.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Stats Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                      <span className="text-[10px] text-slate-500 font-mono block">TOPIC CONCEPTS</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                        {twin.strong.length} / {concepts.length}
                      </span>
                      <span className="text-[9px] text-teal-600 dark:text-teal-400 block font-medium">Mastered</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                      <span className="text-[10px] text-slate-500 font-mono block">EVALUATIONS</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                        {assessments.length}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">Submissions saved</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* INTERACTIVE PREREQUISITE PROGRESSION RAILS */}
              <section className={`rounded-xl border p-5 xl:p-6 ${
                theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white font-display uppercase tracking-wider text-[11px] text-slate-500">
                      Curriculum DAG Progression
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Topological sequence of concepts. Click any unlocked concept to select it directly.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-semibold">
                    {concepts.length} Milestone Concepts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {concepts.map((conceptItem: any, idx: number) => {
                    const node = twin.nodes.find((n: any) => n.id === conceptItem.id)
                    const isSelected = selectedConcept === conceptItem.id
                    const isMastered = node?.state === 'mastered'
                    const isLearning = node?.state === 'learning'
                    const isLocked = node?.state === 'locked'

                    return (
                      <button
                        key={conceptItem.id}
                        onClick={() => {
                          if (isLocked) {
                            showLockedConceptGate(conceptItem)
                            return
                          }
                          handleConceptSelect(conceptItem.id)
                          openPage('learning-workspace')
                        }}
                        className={`group rounded-lg border p-3.5 text-left transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-1 ring-teal-500'
                            : isLocked
                            ? 'border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] opacity-75 cursor-pointer hover:border-amber-500/40'
                            : theme === 'dark'
                            ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            isMastered
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isLearning
                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                              : isLocked
                              ? 'bg-slate-200 dark:bg-white/5 text-slate-500'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}>
                            {isMastered ? 'Mastered' : isLearning ? 'Learning' : isLocked ? 'Locked' : 'Available'}
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-display group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {conceptItem.label}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>Mastery</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {node?.mastery !== null && node?.mastery !== undefined ? `${node.mastery}%` : '—'}
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="mt-1 h-1 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isMastered ? 'bg-emerald-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${node?.mastery ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* DUAL INTELLIGENCE LEDGER (Cognitive Health vs Autonomous Agents) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Cognitive Health & Misconceptions Ledger (6 cols) */}
                <div className={`lg:col-span-6 rounded-xl border p-5 xl:p-6 ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                        Cognitive Health & Knowledge Gaps
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                        Misconception Detector analysis
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Agent 2 Live
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {twin.misconceptions && twin.misconceptions.length > 0 ? (
                      <div className="space-y-2.5">
                        {twin.misconceptions.slice(0, 3).map((misc: any, i: number) => (
                          <div
                            key={i}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                ⚠ {misc.tag}
                              </span>
                              <span className="font-mono text-[10px] text-rose-500">
                                {misc.count} occurrence(s)
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                              Detected in: {misc.concepts.join(', ')}. Review this misconception with the AI Tutor.
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>Clean Cognitive Profile</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          No recurring misconceptions identified across verified evaluations. Knowledge gaps are isolated to unattempted criteria.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => openPage('learning-twin')}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                      >
                        Open full Learning Twin diagnostic →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Autonomous 5-Agent Status & Telemetry (6 cols) */}
                <div className={`lg:col-span-6 rounded-xl border p-5 xl:p-6 ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                        Five-Agent Pipeline Telemetry
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                        Autonomous cooperative workflow
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      All Active
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {[
                      { name: 'Assessment Agent', role: 'Evaluates criteria via Gemini 3.8 Flash', tag: 'Primary AI', status: 'Online' },
                      { name: 'Misconception Detector', role: 'Separates knowledge gaps from factual errors', tag: 'Analytical', status: 'Online' },
                      { name: 'Learning Twin', role: 'Bayesian mastery & uncertainty calibration', tag: 'Mathematical', status: 'Online' },
                      { name: 'Learning Planner', role: 'Selects optimal next concept in DAG', tag: 'Pathfinding', status: 'Online' },
                      { name: 'AI Tutor', role: 'On-demand pedagogical clarification with code', tag: 'Socratic AI', status: 'Online' },
                    ].map((agent, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/[0.04] p-2.5 bg-slate-50/50 dark:bg-white/[0.01]"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-display block truncate">
                            {agent.name}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {agent.role}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded">
                          {agent.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* RECENT ASSESSMENTS & EVIDENCE LEDGER */}
              {assessments && assessments.length > 0 && (
                <section className={`rounded-xl border p-5 xl:p-6 ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                        Recent Verified Submissions & Scores
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Stored evaluation evidence and criterion breakdowns
                      </p>
                    </div>
                    <button
                      onClick={() => openPage('progress')}
                      className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      View All History ({assessments.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {assessments.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white font-display">
                              {item.concept}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                              {item.evaluationMethod === 'ai_model' ? '✨ Gemini AI' : '📋 Rubric'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            "{item.answer}"
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            item.score !== null && item.score >= 70
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : item.score !== null
                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600'
                          }`}>
                            {item.score !== null ? `${item.score}/100` : 'Under Review'}
                          </span>
                          <button
                            onClick={() => {
                              handleConceptSelect(item.concept)
                              openPage('learning-workspace')
                            }}
                            className="text-xs text-slate-400 hover:text-teal-500"
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* CONCEPT GRAPH */}
          {activeNav === 'concept-graph' && (
            <div className="animate-fade-in">
              <ConceptGraph
                selectedConcept={selectedConcept}
                onSelect={handleConceptSelect}
                onExplore={() => openPage('learning-workspace')}
                pushLog={pushLog}
                subject={initialSubject}
                topic={initialTopic}
                learningData={learningData}
                theme={theme}
              />
            </div>
          )}

          {/* LEARNING WORKSPACE */}
          {activeNav === 'learning-workspace' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <Workspace
                selectedConcept={selectedConcept}
                pushLog={pushLog}
                subject={initialSubject}
                topic={initialTopic}
                level={initialLevel}
                onSelectConcept={handleConceptSelect}
                learningData={learningData}
                theme={theme}
              />
            </div>
          )}

          {/* LEARNING TWIN */}
          {activeNav === 'learning-twin' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <LearningTwin
                subject={initialSubject}
                topic={initialTopic}
                learningData={learningData}
                onSelectConcept={handleConceptSelect}
                onNavigateToWorkspace={() => openPage('learning-workspace')}
                theme={theme}
              />
            </div>
          )}

          {/* AI AGENTS */}
          {activeNav === 'ai-agents' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <AgentPanel
                pushLog={pushLog}
                learningData={learningData}
                onNavigateToWorkspace={() => openPage('learning-workspace')}
                theme={theme}
              />
            </div>
          )}

          {/* PROGRESS */}
          {activeNav === 'progress' && (
            <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
              <div>
                <p className="section-label">STUDENT ANALYTICS</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Your Progress & History</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Real evaluation records and mastery statistics across this learning path.
                </p>
              </div>

              {/* 4 Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`rounded-2xl border border-cyan-400/20 p-5 ${theme === 'dark' ? 'bg-[#0C152B]' : 'bg-white shadow-sm'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Concepts in Path</p>
                  <p className="mt-2 text-3xl font-extrabold text-cyan-300">{concepts.length}</p>
                </div>
                <div className={`rounded-2xl border border-emerald-400/20 p-5 ${theme === 'dark' ? 'bg-[#0C152B]' : 'bg-white shadow-sm'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Overall Mastery</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-300">
                    {twin.overall !== null ? `${twin.overall}%` : 'Not assessed'}
                  </p>
                </div>
                <div className={`rounded-2xl border border-violet-400/20 p-5 ${theme === 'dark' ? 'bg-[#0C152B]' : 'bg-white shadow-sm'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Evaluations Saved</p>
                  <p className="mt-2 text-3xl font-extrabold text-violet-300">{assessments.length}</p>
                </div>
                <div className={`rounded-2xl border border-amber-400/20 p-5 ${theme === 'dark' ? 'bg-[#0C152B]' : 'bg-white shadow-sm'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Concepts Mastered</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-300">{twin.strong.length}</p>
                </div>
              </div>

              {/* Submitted Responses List */}
              <section className={`rounded-2xl border p-6 ${theme === 'dark' ? 'border-white/[0.08] bg-[#0C152B]' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Submitted Answers & Evaluations</h3>
                    <p className="text-xs text-slate-400">Every response is evaluated and preserved.</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                    {assessments.length} Total
                  </span>
                </div>

                {assessments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <p>No assessments completed yet.</p>
                    <button
                      onClick={() => openPage('learning-workspace')}
                      className="mt-3 text-cyan-300 hover:underline font-semibold"
                    >
                      Go to Workspace to submit your first answer →
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3.5">
                    {assessments.map((record) => (
                      <article
                        key={record.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:bg-white/[0.035]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-7 w-20 items-center justify-center rounded-lg text-xs font-bold ${
                                record.score !== null && record.score >= 70
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : record.score !== null && record.score >= 40
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                                  : record.score !== null
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                              }`}
                            >
                              {record.score !== null ? `${record.score}%` : 'Under Review'}
                            </span>
                            <h4 className="text-sm font-semibold text-white">{record.concept}</h4>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="rounded bg-white/5 px-2 py-0.5">
                              {record.evaluationMethod === 'ai_model' ? '✨ AI Model' : '📋 Rubric'}
                            </span>
                            <span>{new Date(record.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="mt-2.5 text-xs text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
                          "{record.answer}"
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          <strong className="text-violet-300">Feedback: </strong>
                          {record.feedback}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* SETTINGS */}
          {activeNav === 'settings' && (
            <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
              <div>
                <p className="section-label">PREFERENCES</p>
                <h2 className="mt-1 text-2xl font-bold text-white">System Settings</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Configure environment behavior, appearance, and cloud account credentials.
                </p>
              </div>

              {/* Account management */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#0D1730] p-6">
                <h3 className="text-base font-semibold text-white">Student Account</h3>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-bold text-white">{userDisplayName}</p>
                    <p className="text-xs text-slate-400">
                      {isGuest ? 'Guest Mode (browser stored data)' : `Authenticated: ${user?.email}`}
                    </p>
                  </div>

                  <div>
                    {isGuest ? (
                      <button
                        onClick={openSignIn}
                        className="rounded-xl border border-violet-400/30 bg-violet-600/30 px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-600/40"
                      >
                        Sign In / Create Account
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await signOut()
                          pushLog('Signed out')
                          onSignOut?.()
                        }}
                        className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Theme Settings */}
              <section className={`rounded-2xl border p-6 ${theme === 'dark' ? 'border-white/[0.08] bg-[#0D1730]' : 'border-slate-200 bg-white'}`}>
                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Theme & Visuals</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`rounded-xl border p-4 text-left transition ${
                      theme === 'dark'
                        ? 'border-violet-500 bg-violet-500/10 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dark Neural Theme</p>
                    <p className="mt-1 text-xs text-slate-400">Midnight navy with neon glowing accents</p>
                    {theme === 'dark' && <p className="mt-2 text-xs text-violet-400 font-bold">✓ Selected</p>}
                  </button>

                  <button
                    onClick={() => setTheme('light')}
                    className={`rounded-xl border p-4 text-left transition ${
                      theme === 'light'
                        ? 'border-violet-500 bg-violet-500/10 shadow-sm'
                        : (theme === 'dark' ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-slate-50 text-slate-900')
                    }`}
                  >
                    <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Light Theme</p>
                    <p className="mt-1 text-xs text-slate-400">High-contrast bright interface</p>
                    {theme === 'light' && <p className="mt-2 text-xs text-violet-400 font-bold">✓ Selected</p>}
                  </button>
                </div>
              </section>

              {/* Walkthrough */}
              <section className={`rounded-2xl border p-6 ${theme === 'dark' ? 'border-white/[0.08] bg-[#0D1730]' : 'border-slate-200 bg-white'}`}>
                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Help & Onboarding</h3>
                <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Replay the first-time walkthrough to review how each feature works.
                </p>
                <button
                  onClick={() => {
                    resetWalkthrough()
                    setShowWalkthrough(true)
                  }}
                  className="mt-4 rounded-xl border border-violet-400/30 bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-600/30"
                >
                  ✦ Replay Feature Tour
                </button>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* PREREQUISITE GATE MODAL FOR LOCKED TOPICS */}
      {lockedGateConcept && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLockedGateConcept(null)
          }}
        >
          <div className={`relative w-full max-w-md rounded-2xl border p-6 sm:p-7 shadow-2xl ${
            theme === 'dark' ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'
          }`}>
            <button
              onClick={() => setLockedGateConcept(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  Prerequisite Gate
                </span>
                <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                  {lockedGateConcept.concept.label} is Locked
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              In accordance with your adaptive curriculum DAG, this topic cannot be practiced or assessed until each prerequisite concept reaches at least <strong>60% assessed mastery</strong>.
            </p>

            <div className="mt-4 space-y-2.5">
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                Prerequisites Checklist
              </p>
              {lockedGateConcept.prerequisites.map((prereq: any) => (
                <div
                  key={prereq.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                    prereq.met
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                      : 'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{prereq.met ? '✓' : '◇'}</span>
                      <span className="font-semibold">{prereq.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Current: {prereq.mastery !== null ? `${prereq.mastery}%` : 'Not attempted'} · Threshold: {prereq.required}%
                    </p>
                  </div>

                  {!prereq.met && (
                    <button
                      onClick={() => {
                        const targetId = prereq.id
                        setLockedGateConcept(null)
                        setSelectedConcept(targetId)
                        openPage('learning-workspace')
                        pushLog(`Navigating to prerequisite: ${prereq.label}`)
                      }}
                      className="btn-primary text-xs shrink-0 py-1.5 px-3"
                    >
                      Study Now →
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setLockedGateConcept(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
