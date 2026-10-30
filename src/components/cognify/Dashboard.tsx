// @ts-nocheck -- imported from original Cognify project (looser TS settings)

import { useEffect, useState } from 'react'

import LearningTwin from './LearningTwin'
import ConceptGraph from './ConceptGraph'
import AgentPanel from './AgentPanel'
import Workspace from './Workspace'

import { getConcepts, loadStudent } from '@/data/sampleData'

type DashboardProps = {
  initialSelectedConcept?: string
  initialContext?: string
  initialSubject: string
  initialTopic: string
  initialLevel: string
}

const navigation = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'concept-graph', label: 'Concept Graph', icon: '⌘' },
  { id: 'learning-workspace', label: 'Learning Workspace', icon: '▣' },
  { id: 'learning-twin', label: 'Learning Twin', icon: '◉' },
  { id: 'ai-agents', label: 'AI Agents', icon: '♙' },
  { id: 'progress', label: 'Progress', icon: '♧' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function Dashboard({
  initialSelectedConcept,
  initialContext,
  initialSubject,
  initialTopic,
  initialLevel,
}: DashboardProps) {
  const concepts = getConcepts(initialSubject, initialTopic)

  const matchingConcept = concepts.find(
    (concept) =>
      concept.id === initialSelectedConcept ||
      concept.label.toLowerCase() === initialSelectedConcept?.toLowerCase()
  )

  const [selectedConcept, setSelectedConcept] = useState<string | null>(
    matchingConcept?.id ?? concepts[0]?.id ?? null
  )

  const [activeNav, setActiveNav] = useState('home')
  const [logs, setLogs] = useState<string[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [savedResponses, setSavedResponses] = useState<
    { concept: string; response: string; timestamp: number }[]
  >([])

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('cognify-theme') as 'dark' | 'light') || 'dark'
  })

  const [preferences, setPreferences] = useState({
    animations: true,
    soundEffects: false,
    compactMode: false,
  })

  const selectedConceptData = concepts.find(
    (concept) => concept.id === selectedConcept
  )

  const selectedConceptLabel = selectedConceptData?.label ?? initialTopic

  // Load saved responses for the current learning path.
  const refreshSavedResponses = () => {
    const student = loadStudent(initialSubject, initialTopic)

    setSavedResponses(
      [...student.answerHistory].sort(
        (a, b) => b.timestamp - a.timestamp
      )
    )
  }

  useEffect(() => {
    refreshSavedResponses()
  }, [initialSubject, initialTopic])

  const pushLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    setLogs((previous) => [
      `${timestamp} — ${message}`,
      ...previous,
    ])
  }

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    setLogs([
      `${timestamp} — ${
        initialContext ?? `Started ${initialSubject} / ${initialTopic}`
      }`,
    ])
  }, [initialContext, initialSubject, initialTopic])

  useEffect(() => {
    localStorage.setItem('cognify-theme', theme)
  }, [theme])

  const handleConceptSelect = (conceptId: string) => {
    const concept = concepts.find((item) => item.id === conceptId)
    if (!concept) return

    setSelectedConcept(concept.id)
    pushLog(`Selected concept: ${concept.label}`)
  }

  const openPage = (page: string) => {
    setActiveNav(page)
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  const activePage = navigation.find((item) => item.id === activeNav)

  const pageDescriptions: Record<string, string> = {
    home: 'Your personalized learning environment.',
    'concept-graph': 'Explore the connections between concepts.',
    'learning-workspace': 'Study, explain and practise what you learn.',
    'learning-twin': 'Explore your recorded learning profile.',
    'ai-agents': 'Explore the specialized roles in Cognify.',
    progress: 'Your learning statistics and milestones.',
    settings: 'Customize your Cognify experience.',
  }

  return (
    <div
      data-theme={theme}
      className={`min-h-screen bg-[#050916] text-white lg:flex lg:h-screen lg:overflow-hidden ${
        preferences.compactMode ? 'cognify-compact' : ''
      } ${preferences.animations ? '' : 'reduce-motion'}`}
    >
      {/* SIDEBAR */}
      <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.07] bg-[#070D1C] lg:h-screen lg:w-[240px] lg:border-b-0 lg:border-r">
        <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-2xl text-violet-300 shadow-[0_0_22px_rgba(155,124,255,0.12)]">
            ✿
          </div>
          <span className="text-2xl font-bold tracking-tight">Cognify</span>
        </div>

        <nav className="flex flex-1 gap-2 overflow-x-auto px-3 py-4 lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-6">
          {navigation.map((item) => {
            const active = activeNav === item.id

            return (
              <button
                key={item.id}
                onClick={() => openPage(item.id)}
                className={`flex shrink-0 items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
                  active
                    ? 'border-violet-400/20 bg-violet-600/25 text-violet-200 shadow-[0_0_22px_rgba(139,92,246,0.12)]'
                    : 'border-transparent text-slate-300 hover:bg-white/[0.045] hover:text-white'
                }`}
              >
                <span className="w-5 text-center text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="m-4 hidden shrink-0 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-4 lg:block">
          <div className="mb-3 text-2xl text-blue-300">✦</div>
          <p className="text-sm font-medium leading-relaxed text-slate-200">
            Smarter learning starts with you.
          </p>
          <p className="mt-2 text-xs text-slate-500">◆ Cognify AI</p>
        </div>
      </aside>

      {/* MAIN APPLICATION */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:min-h-0">
        {/* HEADER */}
        <header className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-5 border-b border-white/[0.06] px-6 py-5 xl:px-9">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_#9B7CFF]" />
              Adaptive Learning Environment
            </div>

            <h1 className="text-2xl font-semibold tracking-tight xl:text-3xl">
              {activeNav === 'home' ? 'Good morning, Learner' : activePage?.label}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              {pageDescriptions[activeNav]}
            </p>

            {activeNav === 'home' && (
              <div className="mt-3">
                <p className="text-xl font-semibold text-cyan-200">
                  {selectedConceptLabel}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  ◆ {initialSubject} · {initialTopic} · {initialLevel}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden min-w-[220px] rounded-xl border border-white/[0.08] bg-[#101A32] p-4 sm:block">
              <p className="text-xs text-slate-400">Learning path</p>
              <p className="mt-1.5 text-sm font-semibold text-white">
                {initialSubject} / {initialTopic}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Level: {initialLevel}
              </p>
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setProfileOpen(false)
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-xl text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-violet-200"
              >
                ♧
                {logs.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#35D9FF]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-14 z-50 w-[min(340px,90vw)] rounded-2xl border border-violet-400/20 bg-[#0C152B] p-4 shadow-2xl shadow-black/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <span className="text-xs text-violet-300">
                      {logs.length} updates
                    </span>
                  </div>

                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="py-5 text-center text-sm text-slate-400">
                        You're all caught up.
                      </p>
                    ) : (
                      logs.slice(0, 6).map((log, index) => (
                        <div
                          key={`${log}-${index}`}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300"
                        >
                          <span className="mr-2 text-cyan-300">●</span>
                          {log}
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setNotificationsOpen(false)
                      openPage('progress')
                    }}
                    className="mt-3 w-full rounded-lg bg-violet-500/10 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                  >
                    View progress →
                  </button>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="relative">
              <button
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationsOpen(false)
                }}
                className="flex h-11 items-center gap-2 rounded-full border border-violet-300/30 bg-gradient-to-br from-violet-500 to-indigo-700 px-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(139,92,246,0.16)] transition hover:scale-[1.03]"
              >
                AL
                <span className="text-xs">⌄</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-violet-400/20 bg-[#0C152B] p-4 shadow-2xl shadow-black/50">
                  <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 font-semibold">
                      AL
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Learner</p>
                      <p className="text-xs text-slate-400">Cognify student</p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-3">
                    <button
                      onClick={() => openPage('learning-twin')}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      ◉ My Learning Twin
                    </button>
                    <button
                      onClick={() => openPage('progress')}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      ↗ My Progress
                    </button>
                    <button
                      onClick={() => openPage('settings')}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      ⚙ Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-0 flex-1 overflow-y-auto p-5 xl:p-8">
          {/* HOME */}
          {activeNav === 'home' && (
            <div className="mx-auto max-w-6xl animate-fade-in">
              <section className="mb-8 rounded-2xl border border-violet-400/15 bg-gradient-to-r from-[#111936] via-[#11142E] to-[#10152A] p-7 xl:p-9">
                <p className="text-xs font-semibold tracking-[0.2em] text-violet-300">
                  YOUR LEARNING JOURNEY
                </p>
                <h2 className="mt-3 text-2xl font-semibold xl:text-3xl">
                  Welcome to your learning space.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 xl:text-base">
                  Continue exploring {initialTopic}, discover how concepts
                  connect, and practise what you learn at your own pace.
                </p>
                <button
                  onClick={() => openPage('concept-graph')}
                  className="btn-primary mt-6"
                >
                  Explore concept graph →
                </button>
              </section>

              <div className="mb-5">
                <p className="section-label">YOUR ENVIRONMENT</p>
                <h2 className="mt-2 text-xl font-semibold">Explore Cognify</h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  {
                    id: 'concept-graph',
                    icon: '⌘',
                    title: 'Concept Graph',
                    description: 'Explore the visual knowledge map and discover relationships between concepts.',
                  },
                  {
                    id: 'learning-workspace',
                    icon: '▣',
                    title: 'Learning Workspace',
                    description: 'Study concepts, write explanations and practise applying what you understand.',
                  },
                  {
                    id: 'learning-twin',
                    icon: '◉',
                    title: 'Learning Twin',
                    description: 'View your recorded mastery levels, confidence estimates and learning profile.',
                  },
                  {
                    id: 'ai-agents',
                    icon: '♙',
                    title: 'AI Agent Team',
                    description: 'Explore the specialized agent roles in the Cognify learning workflow.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openPage(item.id)}
                    className="rounded-2xl border border-white/[0.08] bg-[#0C152B] p-6 text-left transition duration-300 hover:border-violet-400/40 hover:bg-[#111D38]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-2xl text-violet-300">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {item.description}
                    </p>
                    <p className="mt-5 text-sm font-medium text-violet-300">
                      Open {item.title} →
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CONCEPT GRAPH */}
          {activeNav === 'concept-graph' && (
            <div className="flex min-h-[650px] flex-col animate-fade-in">
              <div className="mb-5">
                <p className="section-label">NEURAL KNOWLEDGE MAP</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {initialTopic} Roadmap
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Select a concept to explore its connections and details.
                </p>
              </div>

              <section className="min-h-[600px] flex-1 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#080F22] p-4">
                <ConceptGraph
                  selectedConcept={selectedConcept}
                  onSelect={handleConceptSelect}
                  onExplore={() => openPage('learning-workspace')}
                  pushLog={pushLog}
                  subject={initialSubject}
                  topic={initialTopic}
                />
              </section>
            </div>
          )}

          {/* WORKSPACE */}
          {activeNav === 'learning-workspace' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <Workspace
                selectedConcept={selectedConcept}
                pushLog={pushLog}
                subject={initialSubject}
                topic={initialTopic}
                level={initialLevel}
                onAnswerSaved={refreshSavedResponses}
              />
            </div>
          )}

          {/* LEARNING TWIN */}
          {activeNav === 'learning-twin' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <div className="mb-6">
                <p className="section-label">STUDENT MODEL</p>
                <h2 className="mt-2 text-2xl font-semibold">Your Learning Twin</h2>
                <p className="mt-2 text-sm text-slate-400">
                  A view of your recorded mastery, confidence and learning activity.
                </p>
              </div>
              <LearningTwin
                subject={initialSubject}
                topic={initialTopic}
              />
            </div>
          )}

          {/* AI AGENTS */}
          {activeNav === 'ai-agents' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <div className="mb-6">
                <p className="section-label">MULTI-AGENT SYSTEM</p>
                <h2 className="mt-2 text-2xl font-semibold">Cognify AI Agent Team</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Explore the different specialized roles in the learning workflow.
                </p>
              </div>
              <AgentPanel pushLog={pushLog} />
            </div>
          )}

          {/* PROGRESS */}
          {activeNav === 'progress' && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <div className="mb-7">
                <p className="section-label">LEARNING ANALYTICS</p>
                <h2 className="mt-2 text-2xl font-semibold">Your Progress</h2>
                <p className="mt-2 text-sm text-slate-400">
                  A snapshot of your saved learning activity.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-cyan-400/15 bg-[#0C152B] p-6">
                  <p className="text-sm text-slate-400">Concepts available</p>
                  <p className="mt-3 text-4xl font-semibold text-cyan-300">
                    {concepts.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">In your current topic</p>
                </div>

                <div className="rounded-2xl border border-violet-400/15 bg-[#0C152B] p-6">
                  <p className="text-sm text-slate-400">Concepts explored</p>
                  <p className="mt-3 text-4xl font-semibold text-violet-300">
                    {new Set(
                      logs
                        .filter((log) => log.includes('Selected concept:'))
                        .map((log) => log.split('Selected concept: ')[1])
                    ).size}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Unique selections this session</p>
                </div>

                <div className="rounded-2xl border border-emerald-400/15 bg-[#0C152B] p-6">
                  <p className="text-sm text-slate-400">Responses submitted</p>
                  <p className="mt-3 text-4xl font-semibold text-emerald-300">
                    {savedResponses.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Saved in this learning path</p>
                </div>

                <div className="rounded-2xl border border-amber-400/15 bg-[#0C152B] p-6">
                  <p className="text-sm text-slate-400">Session activities</p>
                  <p className="mt-3 text-4xl font-semibold text-amber-300">
                    {logs.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Actions recorded this session</p>
                </div>
              </div>

              {/* CURRENT LEARNING PATH */}
              <section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0C152B] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="section-label">CURRENT LEARNING PATH</p>
                    <h3 className="mt-2 text-lg font-semibold">
                      {initialSubject} · {initialTopic}
                    </h3>
                  </div>
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
                    {initialLevel}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {concepts.map((concept) => {
                    const explored = logs.some((log) =>
                      log.includes(`Selected concept: ${concept.label}`)
                    )

                    return (
                      <div
                        key={concept.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${explored ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span className="text-sm text-slate-200">{concept.label}</span>
                        </div>
                        <span className={`text-xs ${explored ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {explored ? 'Explored' : 'Not explored'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* SAVED RESPONSES */}
              <section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0C152B] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="section-label">PRACTICE HISTORY</p>
                    <h3 className="mt-2 text-lg font-semibold">
                      Your submitted responses
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Responses saved for {initialSubject} / {initialTopic}.
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5 text-xs text-cyan-200">
                    {savedResponses.length} saved
                  </span>
                </div>

                {savedResponses.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center">
                    <div className="text-3xl text-slate-500">▤</div>
                    <p className="mt-3 text-sm font-medium text-slate-300">
                      No responses submitted yet
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Visit the Learning Workspace and submit an explanation to see it here.
                    </p>
                    <button
                      onClick={() => openPage('learning-workspace')}
                      className="mt-5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
                    >
                      Open Learning Workspace →
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {savedResponses.map((record, index) => (
                      <article
                        key={`${record.timestamp}-${index}`}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-cyan-200">
                            {record.concept}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            {new Date(record.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-slate-400">
                          {record.response.length > 280
                            ? `${record.response.slice(0, 280)}...`
                            : record.response}
                        </p>

                        <p className="mt-3 text-[10px] tracking-wider text-emerald-300/80">
                          ✓ SAVED · NOT YET ASSESSED
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Submitted responses are stored in your browser. Their correctness
                  is not evaluated yet because AI assessment is not connected.
                </p>
              </section>
            </div>
          )}

          {/* SETTINGS */}
          {activeNav === 'settings' && (
            <div className="mx-auto max-w-4xl animate-fade-in">
              <p className="section-label">PREFERENCES</p>
              <h2 className="mt-2 text-2xl font-semibold">Settings</h2>
              <p className="mt-2 text-sm text-slate-400">
                Customize how Cognify looks and behaves.
              </p>

              <section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0D1730] p-6">
                <h3 className="text-lg font-semibold">Appearance</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Choose the interface theme you prefer.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`rounded-xl border p-4 text-left transition ${
                      theme === 'dark'
                        ? 'border-violet-400/50 bg-violet-500/10'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="mb-3 h-20 rounded-lg border border-white/10 bg-[#050916] p-3">
                      <div className="h-2 w-1/2 rounded bg-violet-400/70" />
                      <div className="mt-3 h-8 rounded bg-[#182442]" />
                    </div>
                    <p className="font-medium text-white">Dark mode</p>
                    <p className="mt-1 text-xs text-slate-400">Neural Command Center</p>
                    {theme === 'dark' && <p className="mt-2 text-xs text-violet-300">✓ Selected</p>}
                  </button>

                  <button
                    onClick={() => setTheme('light')}
                    className={`rounded-xl border p-4 text-left transition ${
                      theme === 'light'
                        ? 'border-violet-400/50 bg-violet-500/10'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="mb-3 h-20 rounded-lg border border-slate-200 bg-slate-100 p-3">
                      <div className="h-2 w-1/2 rounded bg-violet-500" />
                      <div className="mt-3 h-8 rounded bg-white" />
                    </div>
                    <p className="font-medium text-white">Light mode</p>
                    <p className="mt-1 text-xs text-slate-400">Bright, clean workspace</p>
                    {theme === 'light' && <p className="mt-2 text-xs text-violet-300">✓ Selected</p>}
                  </button>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0D1730] p-6">
                <h3 className="text-lg font-semibold">Learning environment</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Adjust interface behavior.
                </p>

                {[
                  {
                    key: 'animations' as const,
                    title: 'Interface animations',
                    description: 'Enable transitions and motion effects.',
                  },
                  {
                    key: 'soundEffects' as const,
                    title: 'Sound effects',
                    description: 'Enable interface sound effects when available.',
                  },
                  {
                    key: 'compactMode' as const,
                    title: 'Compact layout',
                    description: 'Reduce spacing across supported interface sections.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                    </div>

                    <button
                      role="switch"
                      aria-checked={preferences[item.key]}
                      onClick={() =>
                        setPreferences((previous) => ({
                          ...previous,
                          [item.key]: !previous[item.key],
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        preferences[item.key] ? 'bg-violet-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                          preferences[item.key] ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </section>

              <section className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0D1730] p-6">
                <h3 className="text-lg font-semibold">Current learning path</h3>
                {[
                  ['Subject', initialSubject],
                  ['Topic', initialTopic],
                  ['Difficulty', initialLevel],
                  ['AI assessment', 'Not connected'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] py-4 last:border-0"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-medium text-white">{value}</span>
                  </div>
                ))}
                <p className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-4 text-xs leading-relaxed text-amber-200/80">
                  AI assessment is not connected yet. Cognify currently records
                  learning activity but does not verify answer correctness.
                </p>
              </section>
            </div>
          )}
        </main>

        <footer className="hidden shrink-0 border-t border-white/[0.04] px-5 py-3 text-center lg:block">
          <p className="text-[10px] tracking-[0.2em] text-slate-600">
            COGNIFY · ADAPTIVE LEARNING ENVIRONMENT
          </p>
        </footer>
      </div>
    </div>
  )
}
