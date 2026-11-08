// @ts-nocheck
import { useMemo } from 'react'

type LearningTwinProps = {
  subject?: string
  topic?: string
  learningData: any
  onSelectConcept?: (conceptId: string) => void
  onNavigateToWorkspace?: () => void
}

export default function LearningTwin({
  subject = 'C++',
  topic = 'Pointers',
  learningData,
  onSelectConcept,
  onNavigateToWorkspace,
}: LearningTwinProps) {
  const { twin, plan, history, assessments } = learningData

  const radius = 72
  const circumference = 2 * Math.PI * radius

  const hasAssessments = twin.overall !== null

  const progress = hasAssessments
    ? (twin.overall / 100) * circumference
    : 0

  const scoredNodes = useMemo(() => {
    return twin.nodes.filter((n: any) => n.mastery !== null)
  }, [twin])

  const avgConfidence = useMemo(() => {
    if (scoredNodes.length === 0) return 0
    const sum = scoredNodes.reduce((acc: number, n: any) => acc + (n.confidence || 0), 0)
    return Math.round((sum / scoredNodes.length) * 100)
  }, [scoredNodes])

  const getMasteryColor = (value: number | null) => {
    if (value === null) return '#64748B'
    if (value >= 75) return '#10B981'
    if (value >= 40) return '#0D9488'
    return '#F43F5E'
  }

  const getMasteryLabel = (value: number | null) => {
    if (value === null) return 'Not yet assessed'
    if (value >= 75) return 'Mastered'
    if (value >= 40) return 'Developing'
    return 'Needs Attention'
  }

  return (
    <section className="flex min-h-0 flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              Cognitive Knowledge State
            </p>
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            Your Learning Twin
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bayesian cognitive model tracking real conceptual mastery and confidence across {subject} · {topic}.
          </p>
        </div>

        <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-teal-700 dark:text-teal-300 font-mono">
          BAYESIAN ENGINE ACTIVE
        </span>
      </div>

      {/* OVERVIEW RING & METRICS */}
      <div className="cognify-card p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(220px,0.9fr)_1.1fr] sm:items-center">
          {/* MASTERY RING */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[240px] sm:w-[240px]">
              <svg
                viewBox="0 0 180 180"
                className="-rotate-90 h-full w-full overflow-visible"
                aria-label={`Overall mastery ${twin.overall ?? 0}%`}
                role="img"
              >
                <defs>
                  <linearGradient id="twinMasteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0D9488" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>

                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="10"
                />

                {hasAssessments && (
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="url(#twinMasteryGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${progress} ${circumference}`}
                    className="transition-all duration-1000"
                  />
                )}
              </svg>

              <div className="absolute flex flex-col items-center text-center px-2">
                <span className={`${hasAssessments ? 'text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display' : 'text-base font-bold text-slate-500 dark:text-slate-400'} tracking-tight`}>
                  {hasAssessments ? `${twin.overall}%` : 'Not Assessed Yet'}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Global Mastery
                </span>
                <span className="mt-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300 font-mono">
                  {hasAssessments ? `${avgConfidence}% Confidence` : 'Awaiting Attempt'}
                </span>
              </div>
            </div>

            <div className="mt-3 max-w-[260px] text-center">
              {hasAssessments ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculated from {twin.totalAttempts} evaluated practice {twin.totalAttempts === 1 ? 'assessment' : 'assessments'}.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2.5 text-center">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">No Assessment Data Yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Submit an explanation in the Learning Workspace to calibrate your cognitive model.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4-METRIC GRID */}
          <div className="flex flex-col gap-3">
            <div className="mb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Cognitive State
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white font-display">Competency Breakdown</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">{twin.nodes.length}</div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Curriculum Concepts</p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{twin.strong.length}</div>
                <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">Mastered (≥75%)</p>
              </div>

              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-display">
                  {twin.nodes.filter((n: any) => n.state === 'learning').length}
                </div>
                <p className="mt-1 text-xs text-teal-800 dark:text-teal-300">Developing (40-74%)</p>
              </div>

              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-display">{twin.weak.length}</div>
                <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">Needs Attention (&lt;40%)</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Verified Assessments</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{twin.totalAttempts} submissions</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Identified Misconceptions</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">{twin.misconceptions.length} recorded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECURRING MISCONCEPTIONS SECTION */}
      <div className="cognify-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Misconception Detection & Longitudinal Tracking
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Agent 2 isolates genuine factual and mechanical errors from mere omissions, tracking them over time.
            </p>
          </div>
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 font-mono">
            {twin.misconceptions.length} tracked
          </span>
        </div>

        {twin.misconceptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            ✦ No recurring misconceptions identified. Explanations show clean conceptual accuracy.
          </div>
        ) : (
          <div className="space-y-3">
            {twin.misconceptions.map((m: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 transition ${
                  m.recurring
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {m.recurring ? 'RECURRING' : 'OBSERVED'}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.tag}</span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                      m.recurring
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.count} occurrence{m.count === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                  Concept: {m.concepts.join(', ')}
                </p>
                {m.recurring && (
                  <p className="mt-1.5 text-[11px] text-rose-700 dark:text-rose-300 border-t border-rose-500/20 pt-1.5">
                    Recommendation: Request the AI Tutor in the Workspace for a step-by-step contrastive explanation.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONCEPT MASTERY BREAKDOWN */}
      <div className="cognify-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Longitudinal Matrix
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white font-display">Concept Mastery Progression</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{twin.nodes.length} concepts</span>
        </div>

        <div className="space-y-3.5">
          {twin.nodes.map((node: any, idx: number) => {
            const color = getMasteryColor(node.mastery)
            const label = getMasteryLabel(node.mastery)

            return (
              <div
                key={node.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3.5 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold font-mono"
                      style={{
                        color,
                        backgroundColor: `${color}15`,
                        border: `1px solid ${color}35`,
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{node.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {label} · {node.attempts} attempt{node.attempts === 1 ? '' : 's'} · {Math.round(node.confidence * 100)}% confidence
                        {node.trend && (
                          <span className="ml-2 font-semibold">
                            {node.trend === 'up' ? '↑ Improving' : node.trend === 'down' ? '↓ Declining' : '→ Steady'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
                      {node.mastery !== null ? `${node.mastery}%` : 'Unassessed'}
                    </span>
                    {onSelectConcept && onNavigateToWorkspace && (
                      <button
                        onClick={() => {
                          onSelectConcept(node.id)
                          onNavigateToWorkspace()
                        }}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                      >
                        Study →
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  {node.mastery !== null && (
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${node.mastery}%`,
                        backgroundColor: color,
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* LEARNING PLANNER ROADMAP */}
      <div className="cognify-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              Planner Sequence
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white font-display">Adaptive Study Path</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Agent 4 evaluates graph prerequisites and current mastery to determine highest-leverage study targets.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {plan.steps.slice(0, 6).map((step: any, sIdx: number) => (
            <div
              key={step.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                sIdx === 0
                  ? 'border-teal-500/40 bg-teal-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold font-mono ${sIdx === 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}`}>
                  #{String(sIdx + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{step.label}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{step.reason}</p>
                </div>
              </div>

              {onSelectConcept && onNavigateToWorkspace && (
                <button
                  onClick={() => {
                    onSelectConcept(step.id)
                    onNavigateToWorkspace()
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    sIdx === 0
                      ? 'btn-primary'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  {sIdx === 0 ? 'Recommended Next →' : 'Study Concept →'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
