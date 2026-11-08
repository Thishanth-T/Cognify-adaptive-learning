// @ts-nocheck
import { useState } from 'react'

const WALKTHROUGH_KEY = 'cognify_walkthrough_dismissed'

const steps = [
  {
    code: '01',
    color: '#0D9488',
    title: 'Command Center Dashboard',
    description:
      'Your central adaptive study overview. Displays current mastery telemetry, curriculum milestone DAG progression, and cooperative multi-agent activity updated live with every assessment.',
    action: null,
  },
  {
    code: '02',
    color: '#2563EB',
    title: 'Prerequisite Concept Map',
    description:
      'A topological directed graph of all concepts in your study track. Dynamic gates unlock as you meet mastery thresholds (≥60%) on prerequisites.',
    action: null,
  },
  {
    code: '03',
    color: '#059669',
    title: 'Learning Workspace & Study Desk',
    description:
      'Where active practice happens. Read the diagnostic challenge question, formulate your explanation, and receive rigorous semantic AI evaluation.',
    action: 'learning-workspace',
    actionLabel: 'Go to Workspace →',
  },
  {
    code: '04',
    color: '#D97706',
    title: 'Semantic AI Rubric Evaluation',
    description:
      'The Assessment Agent evaluates conceptual understanding against weighted rubrics. It isolates demonstrated knowledge, missing mechanisms, and misconceptions without phrase-matching bias.',
    action: null,
  },
  {
    code: '05',
    color: '#E11D48',
    title: 'Bayesian Learning Twin',
    description:
      'A mathematical cognitive model tracking verified understanding across attempts. Calculates mastery decay, statistical confidence, and longitudinal misconception histories.',
    action: 'learning-twin',
    actionLabel: 'View Learning Twin →',
  },
  {
    code: '06',
    color: '#0D9488',
    title: '5 Autonomous AI Agents',
    description:
      'Cooperative pipeline orchestration: Evaluator, Misconception Detector, Twin Engine, Learning Planner, and AI Tutor collaborate on every student interaction.',
    action: 'ai-agents',
    actionLabel: 'See AI Agents →',
  },
]

type WalkthroughProps = {
  onNavigate?: (page: string) => void
  onDismiss?: () => void
}

export function shouldShowWalkthrough(): boolean {
  try {
    return !localStorage.getItem(WALKTHROUGH_KEY)
  } catch {
    return true
  }
}

export function dismissWalkthrough() {
  try {
    localStorage.setItem(WALKTHROUGH_KEY, '1')
  } catch {}
}

export function resetWalkthrough() {
  try {
    localStorage.removeItem(WALKTHROUGH_KEY)
  } catch {}
}

export default function Walkthrough({ onNavigate, onDismiss }: WalkthroughProps) {
  const [step, setStep] = useState(0)
  const current = steps[step]

  const handleDismiss = () => {
    dismissWalkthrough()
    onDismiss?.()
  }

  const handleAction = () => {
    if (current.action) {
      onNavigate?.(current.action)
    }
    handleDismiss()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(11, 15, 23, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
    >
      <div className="relative w-full max-w-lg animate-fade-in overflow-hidden rounded-3xl border border-slate-800 bg-[#0F172A] p-7 shadow-2xl">
        {/* Step dots */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step ? 'w-6 bg-teal-500' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-400 hover:text-white"
          >
            Skip ✕
          </button>
        </div>

        {/* Step Code Badge */}
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl font-mono text-sm font-bold"
          style={{
            background: `${current.color}18`,
            border: `1px solid ${current.color}40`,
            color: current.color,
          }}
        >
          {current.code}
        </div>

        {/* Content */}
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-400 font-mono">
          Orientation · Step {step + 1} of {steps.length}
        </div>
        <h2 className="text-xl font-bold text-white font-display">{current.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{current.description}</p>

        {/* Navigation */}
        <div className="mt-7 flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary text-xs disabled:opacity-30"
          >
            ← Back
          </button>

          <div className="flex gap-2">
            {current.action && (
              <button
                onClick={handleAction}
                className="rounded-xl border border-teal-500/40 bg-teal-500/15 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-500/25 transition"
              >
                {current.actionLabel}
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary text-xs"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="btn-primary text-xs"
              >
                Enter Platform ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
