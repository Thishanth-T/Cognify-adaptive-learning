// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

const DRAFT_KEY = 'cognify_onboarding_draft'

function saveDraft(data: {
  subject: string
  useCustomSubject: boolean
  customSubjectInput: string
  topic: string
  useCustomTopic: boolean
  customTopicInput: string
  level: string
}) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {}
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

type OnboardingData = {
  subject: string
  topic: string
  level: string
  concept?: string
}

const subjectCatalog: Array<{
  name: string
  icon: string
  color: string
  description: string
  topics: string[]
}> = [
  {
    name: 'C++',
    icon: '⚙',
    color: '#3B82F6',
    description: 'High-performance systems programming & memory control',
    topics: ['Pointers', 'Recursion', 'Arrays', 'Functions', 'OOP', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming'],
  },
  {
    name: 'Python',
    icon: '🐍',
    color: '#10B981',
    description: 'Clean syntax for scripting, data analysis, and AI',
    topics: ['Recursion', 'Lists', 'Functions', 'Basics', 'Variables', 'Strings', 'Dictionaries', 'OOP', 'File Handling'],
  },
  {
    name: 'Java',
    icon: '☕',
    color: '#F59E0B',
    description: 'Enterprise architecture, strict typing, and OOP',
    topics: ['Object Oriented Programming', 'Basics', 'Variables', 'Arrays', 'Functions', 'Inheritance', 'Interfaces', 'Collections'],
  },
  {
    name: 'JavaScript',
    icon: '⚡',
    color: '#EAB308',
    description: 'Modern asynchronous web and application runtime',
    topics: ['DOM Manipulation', 'Basics', 'Variables', 'Functions', 'Arrays', 'Objects', 'Promises', 'APIs'],
  },
  {
    name: 'Web Development',
    icon: '🌐',
    color: '#06B6D4',
    description: 'Full-stack user interfaces, styling, and APIs',
    topics: ['HTML & CSS', 'Responsive Design', 'React Fundamentals', 'React Hooks', 'State Management', 'REST APIs', 'Backend Basics'],
  },
  {
    name: 'Data Structures & Algorithms',
    icon: '⚯',
    color: '#8B5CF6',
    description: 'Core computer science problem solving and complexity',
    topics: ['Linked Lists', 'Arrays & Strings', 'Stacks & Queues', 'Trees', 'Graphs', 'Sorting', 'Binary Search', 'Dynamic Programming'],
  },
  {
    name: 'Artificial Intelligence',
    icon: '🤖',
    color: '#EC4899',
    description: 'Autonomous systems, reasoning, and heuristics',
    topics: ['AI Fundamentals', 'Search Algorithms', 'Neural Networks', 'Natural Language Processing', 'AI Agents', 'Generative AI'],
  },
  {
    name: 'Machine Learning',
    icon: '🧠',
    color: '#6366F1',
    description: 'Statistical models, training pipelines, and prediction',
    topics: ['ML Fundamentals', 'Data Preprocessing', 'Linear Regression', 'Classification', 'Model Evaluation', 'Deep Learning'],
  },
  {
    name: 'Mathematics',
    icon: '∑',
    color: '#14B8A6',
    description: 'Foundational analytical frameworks and calculus',
    topics: ['Matrices & Linear Algebra', 'Calculus', 'Probability & Statistics', 'Differentiation', 'Integration', 'Discrete Math'],
  },
  {
    name: 'Physics',
    icon: '⚛',
    color: '#84CC16',
    description: 'Physical principles, dynamics, and energy',
    topics: ["Newton's Laws of Motion", 'Classical Mechanics', 'Work & Energy', 'Electricity & Magnetism', 'Waves & Optics'],
  },
  {
    name: 'Chemistry',
    icon: '🧪',
    color: '#F43F5E',
    description: 'Molecular structures, bonding, and thermodynamics',
    topics: ['Atomic Structure', 'Chemical Bonding', 'Periodic Table', 'Thermodynamics', 'Organic Chemistry', 'Kinetics'],
  },
]

type Step = 'welcome' | 'subject' | 'topic' | 'level' | 'auth'

export default function Onboarding({
  onStart,
}: {
  onStart: (data: OnboardingData) => void
}) {
  const { user, profile, isGuest, openSignIn, openSignUp, signInWithGoogle, continueAsGuest } = useAuth()

  // Initialize state from saved draft (persisted across OAuth redirect)
  const draft = useMemo(() => loadDraft(), [])

  const [step, setStep] = useState<Step>(draft && user ? 'auth' : 'welcome')
  const [subject, setSubject] = useState(draft?.subject ?? 'C++')
  const [useCustomSubject, setUseCustomSubject] = useState(draft?.useCustomSubject ?? false)
  const [customSubjectInput, setCustomSubjectInput] = useState(draft?.customSubjectInput ?? '')

  const [topic, setTopic] = useState(draft?.topic ?? 'Pointers')
  const [useCustomTopic, setUseCustomTopic] = useState(draft?.useCustomTopic ?? false)
  const [customTopicInput, setCustomTopicInput] = useState(draft?.customTopicInput ?? '')
  const [topicSearch, setTopicSearch] = useState('')

  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(draft?.level ?? 'Beginner')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // When user authenticates (e.g. returns from OAuth redirect), advance to auth step
  useEffect(() => {
    if (user && step !== 'auth') {
      setStep('auth')
    }
  }, [user])

  // Sync selections to draft whenever they change (so redirect doesn't lose them)
  useEffect(() => {
    if (step === 'welcome') return // Don't persist until selections started
    saveDraft({ subject, useCustomSubject, customSubjectInput, topic, useCustomTopic, customTopicInput, level })
  }, [subject, useCustomSubject, customSubjectInput, topic, useCustomTopic, customTopicInput, level, step])

  const activeSubject = useCustomSubject ? customSubjectInput.trim() : subject
  const activeTopic = useCustomTopic ? customTopicInput.trim() : topic

  const currentSubjectObj = subjectCatalog.find((s) => s.name === activeSubject)

  const availableTopics = useMemo(() => {
    if (currentSubjectObj) {
      return currentSubjectObj.topics
    }
    return ['Fundamentals', 'Key Mechanisms', 'Patterns & Best Practices', 'Implementation', 'Pitfalls & Diagnostics', 'Advanced Applications']
  }, [currentSubjectObj])

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return availableTopics
    const q = topicSearch.toLowerCase().trim()
    return availableTopics.filter((t) => t.toLowerCase().includes(q))
  }, [availableTopics, topicSearch])

  const handleSelectSubject = (sName: string) => {
    setUseCustomSubject(false)
    setSubject(sName)
    const subj = subjectCatalog.find((s) => s.name === sName)
    if (subj?.topics?.[0]) {
      setTopic(subj.topics[0])
      setUseCustomTopic(false)
    }
  }

  const handleLaunch = () => {
    const finalSubject = activeSubject || 'General'
    const finalTopic = activeTopic || 'Core Studies'

    let concept: string | undefined
    if (finalSubject.toLowerCase() === 'c++') {
      const lowerTopic = finalTopic.toLowerCase()
      if (lowerTopic.includes('pointer')) concept = 'pointer-basics'
      else if (lowerTopic.includes('recursion')) concept = 'recursion-basics'
      else if (lowerTopic.includes('array')) concept = 'array-basics'
    }

    // Clear draft so sign-out returns to a clean state
    try { localStorage.removeItem(DRAFT_KEY) } catch {}

    onStart({
      subject: finalSubject,
      topic: finalTopic,
      level,
      concept,
    })
  }

  const handleGoogleAuth = async () => {
    setAuthError(null)
    setGoogleLoading(true)
    // Save draft so selections survive the OAuth page redirect
    saveDraft({ subject, useCustomSubject, customSubjectInput, topic, useCustomTopic, customTopicInput, level })
    try {
      const res = await signInWithGoogle()
      if (res?.error) {
        setAuthError(res.error.message || 'Google sign-in could not be completed.')
      }
      // Do NOT call handleLaunch() here — the user must click "Continue to Workspace" after returning
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please try email sign-in.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const stepsList: Array<{ id: Step; label: string }> = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'subject', label: 'Subject' },
    { id: 'topic', label: 'Topic' },
    { id: 'level', label: 'Level' },
    { id: 'auth', label: 'Launch' },
  ]

  const currentStepIndex = stepsList.findIndex((s) => s.id === step)

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden font-sans">
      {/* Subtle Ambient Radial Lighting */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-teal-600/10 blur-[130px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[130px]" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0F172A]/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all">
        {/* Top Header & Breadcrumbs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600/20 border border-teal-500/40 text-teal-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2.5" fill="currentColor" />
                <circle cx="5" cy="19" r="2.5" fill="currentColor" />
                <circle cx="19" cy="19" r="2.5" fill="currentColor" />
                <line x1="12" y1="7.5" x2="5" y2="16.5" opacity="0.6" />
                <line x1="12" y1="7.5" x2="19" y2="16.5" opacity="0.6" />
                <line x1="7.5" y1="19" x2="16.5" y2="19" opacity="0.6" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white font-display">Cognify</span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">Adaptive AI Learning Platform</p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2">
            {stepsList.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  if (idx <= currentStepIndex) setStep(s.id)
                }}
                disabled={idx > currentStepIndex}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  step === s.id
                    ? 'border border-teal-500/50 bg-teal-500/20 text-teal-200'
                    : idx < currentStepIndex
                    ? 'text-teal-400 hover:text-white cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <span className="font-mono">{idx + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME HERO */}
        {step === 'welcome' && (
          <div className="animate-fade-in text-center py-6 sm:py-8">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              Bayesian Mastery & Cooperative Multi-Agent Pipeline
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-display">
              Master complex concepts with your <span className="text-teal-400">AI Learning Twin</span>.
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-slate-300">
              Cognify calculates real semantic mastery using 5 specialized autonomous agents, mapping prerequisite dependencies and eliminating misconceptions through diagnostic practice.
            </p>

            {/* Feature Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="font-mono text-xs font-bold text-teal-400">01 / GRAPH</span>
                <h2 className="mt-2 text-sm font-bold text-white font-display">Prerequisite Topology</h2>
                <p className="mt-1 text-xs text-slate-400">Interactive DAG where nodes unlock dynamically based on your assessed mastery.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="font-mono text-xs font-bold text-blue-400">02 / MODEL</span>
                <h2 className="mt-2 text-sm font-bold text-white font-display">Bayesian Twin</h2>
                <p className="mt-1 text-xs text-slate-400">Exponential moving mastery, confidence intervals, and longitudinal misconception tracking.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="font-mono text-xs font-bold text-emerald-400">03 / MULTI-AGENT</span>
                <h2 className="mt-2 text-sm font-bold text-white font-display">5 Autonomous Agents</h2>
                <p className="mt-1 text-xs text-slate-400">Evaluator, Misconception Detector, Twin Engine, Planner, and AI Tutor.</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setStep('subject')}
                className="btn-primary rounded-xl px-8 py-3.5 text-sm font-bold"
              >
                <span>Begin Orientation</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT OR ENTER SUBJECT */}
        {step === 'subject' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Step 2 of 5</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">Select or enter your subject</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose from verified STEM curricula or enter any custom subject to initialize dynamic AI structure.
              </p>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {subjectCatalog.map((subj) => {
                const isSelected = !useCustomSubject && subject === subj.name
                return (
                  <button
                    key={subj.name}
                    type="button"
                    onClick={() => handleSelectSubject(subj.name)}
                    className={`rounded-2xl border p-4 text-left transition flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/15 shadow-sm'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{subj.icon}</span>
                      {isSelected && <span className="text-xs text-teal-400 font-bold font-mono">SELECTED</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-display">{subj.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{subj.description}</p>
                    </div>
                  </button>
                )
              })}

              {/* Custom Subject Button/Card */}
              <button
                type="button"
                onClick={() => setUseCustomSubject(true)}
                className={`rounded-2xl border p-4 text-left transition flex flex-col justify-between h-32 ${
                  useCustomSubject
                    ? 'border-teal-500 bg-teal-500/15'
                    : 'border-dashed border-slate-700 bg-slate-900/20 hover:border-teal-500/50 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl text-teal-400 font-mono">+</span>
                  {useCustomSubject && <span className="text-xs text-teal-400 font-bold font-mono">SELECTED</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-300 font-display">+ Custom Subject</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enter any domain or topic</p>
                </div>
              </button>
            </div>

            {/* Custom Subject Entry Box */}
            {useCustomSubject && (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-300">
                  Custom Subject Title
                </label>
                <div className="mt-2 flex gap-3">
                  <input
                    type="text"
                    required
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="e.g. React.js, Rust, Distributed Systems, Quantum Computing..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Cognify will dynamically compose an adaptive curriculum graph and assessment model for this subject.
                </p>
              </div>
            )}

            {/* Step Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="btn-secondary text-xs"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={useCustomSubject && !customSubjectInput.trim()}
                onClick={() => setStep('topic')}
                className="btn-primary text-xs disabled:opacity-50"
              >
                Continue to Topic →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT OR ENTER TOPIC */}
        {step === 'topic' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Step 3 of 5</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">
                Select topic for <span className="text-teal-400">{activeSubject}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pick an existing module or enter your own custom subtopic.
              </p>
            </div>

            {/* Search or Add Custom */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics in this subject..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => {
                  setUseCustomTopic(true)
                  setCustomTopicInput(topicSearch)
                }}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                  useCustomTopic
                    ? 'border-teal-500 bg-teal-500/20 text-teal-200'
                    : 'border-dashed border-slate-700 text-slate-300 hover:border-teal-500/50'
                }`}
              >
                + Custom Topic
              </button>
            </div>

            {/* Custom Topic Entry Box */}
            {useCustomTopic && (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-300">
                  Custom Topic Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    placeholder="e.g. React Hooks, Memory Safety, Grover's Algorithm, Transformers..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Topics Pills */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Modules</p>
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredTopics.map((topName) => {
                  const isSelected = !useCustomTopic && topic === topName
                  return (
                    <button
                      key={topName}
                      type="button"
                      onClick={() => {
                        setUseCustomTopic(false)
                        setTopic(topName)
                      }}
                      className={`rounded-xl border px-4 py-2 text-xs font-medium transition ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/20 text-teal-200 font-semibold'
                          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {topName} {isSelected && '✓'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('subject')}
                className="btn-secondary text-xs"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={useCustomTopic && !customTopicInput.trim()}
                onClick={() => setStep('level')}
                className="btn-primary text-xs disabled:opacity-50"
              >
                Continue to Level →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LEARNING LEVEL */}
        {step === 'level' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Step 4 of 5</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">Select your learning level</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calibrates challenge complexity, rubric depth, and AI tutor pedagogical pacing.
              </p>
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'Beginner' as const,
                  title: 'Beginner',
                  badge: 'Foundations',
                  icon: '🌱',
                  color: '#10B981',
                  description: 'Intuitive mental models, gentle pacing, plain-English explanations, and step-by-step diagnostic feedback.',
                },
                {
                  id: 'Intermediate' as const,
                  title: 'Intermediate',
                  badge: 'Application',
                  icon: '⚡',
                  color: '#0D9488',
                  description: 'Practical code patterns, common pitfalls, architectural trade-offs, and guided problem-solving.',
                },
                {
                  id: 'Advanced' as const,
                  title: 'Advanced',
                  badge: 'Mastery',
                  icon: '🔥',
                  color: '#2563EB',
                  description: 'Edge cases, memory/computational complexity, deep system internals, and comprehensive conceptual synthesis.',
                },
              ].map((tier) => {
                const isSelected = level === tier.id
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setLevel(tier.id)}
                    className={`rounded-2xl border p-5 text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/15 shadow-sm'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{tier.icon}</span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono"
                          style={{
                            background: `${tier.color}18`,
                            color: tier.color,
                            border: `1px solid ${tier.color}35`,
                          }}
                        >
                          {tier.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-3 font-display">{tier.title}</h3>
                      <p className="text-xs leading-relaxed text-slate-400 mt-1.5">{tier.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                      <span className={isSelected ? 'text-teal-400' : 'text-slate-500'}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Step Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('topic')}
                className="btn-secondary text-xs"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="btn-primary text-xs"
              >
                Continue to Launch →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: AUTHENTICATE OR LAUNCH GUEST */}
        {step === 'auth' && (
          <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Step 5 of 5</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">Ready to enter your study desk</h2>
              <p className="text-xs text-slate-400 mt-1">
                Save your progress with cloud persistence, or jump straight in with browser storage.
              </p>
            </div>

            {/* Selection Summary Pill */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Configured Learning Path</p>
                  <p className="text-base font-bold text-white mt-0.5 font-display">
                    {activeSubject} · {activeTopic}
                  </p>
                </div>
                <span className="rounded-full border border-teal-500/40 bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200 font-mono">
                  {level} Level
                </span>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <span className="font-semibold">Notice: </span>
                {authError}
              </div>
            )}

            {/* Authenticated user ready state */}
            {user ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-bold mb-2">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-white">
                    Signed in as {profile?.display_name || user.email}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assessments, concept graph, and Learning Twin sync automatically to Supabase.
                  </p>
                </div>

                <button
                  onClick={handleLaunch}
                  className="btn-primary w-full py-3 text-sm font-bold"
                >
                  Enter Workspace Now →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 py-3 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900 active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Email Sign In / Create Account */}
                <button
                  type="button"
                  onClick={openSignIn}
                  className="btn-secondary w-full py-3 text-xs font-semibold"
                >
                  Sign In or Create Account with Email
                </button>

                <div className="relative my-2 flex items-center justify-center">
                  <div className="w-full border-t border-slate-800" />
                  <span className="absolute bg-[#0F172A] px-3 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    or continue as guest
                  </span>
                </div>

                {/* Continue as Guest */}
                <button
                  type="button"
                  onClick={() => {
                    continueAsGuest()
                    handleLaunch()
                  }}
                  className="w-full rounded-xl border border-teal-500/30 bg-teal-500/10 py-3 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition"
                >
                  Continue as Guest (Store progress locally) →
                </button>
              </div>
            )}

            {/* Back Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('level')}
                className="btn-secondary text-xs"
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
