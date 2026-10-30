
import { useEffect, useMemo, useState } from 'react'
import type { StudentMastery } from '@/data/sampleData'
import {
  loadStudent,
  getMasteryPercentage,
  getConceptMastery,
  getAssessmentStats,
} from '@/data/sampleData'

type LearningTwinProps = {
  subject?: string
  topic?: string
}

export default function LearningTwin({
  subject = 'General',
  topic = 'Learning',
}: LearningTwinProps) {
  const [student, setStudent] = useState<StudentMastery | null>(null)

  useEffect(() => {
    const refreshStudent = () => {
      try {
        setStudent(loadStudent(subject, topic))
      } catch (error) {
        console.error('Could not load Learning Twin data:', error)
        setStudent(null)
      }
    }

    refreshStudent()

    // Refresh when the user returns to this browser tab.
    window.addEventListener('focus', refreshStudent)

    return () => {
      window.removeEventListener('focus', refreshStudent)
    }
  }, [subject, topic])

  const stats = useMemo(() => {
    if (!student) {
      return null
    }

    const assessment = getAssessmentStats(student)
    const mastery = getMasteryPercentage(student)

    const concepts = [
      ...new Set(
        student.answerHistory.map(answer => answer.concept)
      ),
    ]

    const conceptBreakdown = concepts.map(concept => ({
      concept,
      percentage: getConceptMastery(student, concept),
      attempts: student.answerHistory.filter(
        answer => answer.concept === concept
      ).length,
    }))

    const strongAreas = conceptBreakdown.filter(
      item => item.percentage !== null && item.percentage >= 70
    ).length

    const areasToRevisit = conceptBreakdown.filter(
      item => item.percentage !== null && item.percentage < 40
    ).length

    return {
      assessment,
      mastery,
      conceptBreakdown,
      strongAreas,
      areasToRevisit,
    }
  }, [student])

  const radius = 72
  const circumference = 2 * Math.PI * radius

  const progress =
    stats?.mastery !== null && stats?.mastery !== undefined
      ? (stats.mastery / 100) * circumference
      : 0

  const getMasteryColor = (value: number) => {
    if (value >= 70) return '#34D399'
    if (value >= 40) return '#A78BFA'
    return '#FBBF24'
  }

  const getMasteryLabel = (value: number) => {
    if (value >= 70) return 'Strong'
    if (value >= 40) return 'Developing'
    return 'Needs attention'
  }

  if (!student || !stats) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-violet-400/15 bg-[#0B1227] p-6">
        <p className="text-sm text-slate-400">
          Loading Learning Twin...
        </p>
      </section>
    )
  }

  const hasAssessment = stats.mastery !== null

  return (
    <section className="flex min-h-0 flex-col gap-6 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-[#10152D] via-[#0D142B] to-[#080E1F] p-5 shadow-[0_0_35px_rgba(139,92,246,0.06)] sm:p-7">

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_#A78BFA]" />

            <h2 className="text-xl font-semibold text-white">
              Learning Twin
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            A snapshot of your learning patterns and assessed mastery
          </p>

          <p className="mt-1 text-xs text-violet-300/80">
            {subject} / {topic}
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-1.5 text-[10px] font-bold tracking-wider text-cyan-300">
          LIVE LOCAL DATA
        </span>
      </div>

      {/* MAIN MASTERY OVERVIEW */}
      <div className="grid gap-6 rounded-2xl border border-violet-400/15 bg-[#080F22]/70 p-5 sm:grid-cols-[minmax(220px,0.9fr)_1.1fr] sm:items-center sm:p-7">

        {/* MASTERY RING */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex h-[230px] w-[230px] items-center justify-center sm:h-[270px] sm:w-[270px]">
            <svg
              viewBox="0 0 180 180"
              className="-rotate-90 h-full w-full overflow-visible"
              aria-label={
                hasAssessment
                  ? `Overall assessed accuracy ${stats.mastery}%`
                  : 'Mastery has not been assessed yet'
              }
              role="img"
            >
              <defs>
                <linearGradient
                  id="twinMasteryGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>

                <filter id="twinMasteryGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#222B46"
                strokeWidth="11"
              />

              {hasAssessment && (
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="url(#twinMasteryGradient)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${progress} ${circumference}`}
                  filter="url(#twinMasteryGlow)"
                  className="transition-all duration-1000"
                />
              )}
            </svg>

            <div className="absolute flex flex-col items-center text-center">
              <span className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                {hasAssessment ? `${stats.mastery}%` : '--'}
              </span>

              <span className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Overall mastery
              </span>

              <span className="mt-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] text-violet-200">
                {hasAssessment ? 'Assessed' : 'Not assessed'}
              </span>
            </div>
          </div>

          <p className="mt-2 max-w-[240px] text-center text-xs leading-relaxed text-slate-500">
            {hasAssessment
              ? 'Calculated from answers that have actually been evaluated.'
              : 'Your mastery score will appear after your answers are evaluated.'}
          </p>
        </div>

        {/* STATISTICS */}
        <div className="flex flex-col gap-3">
          <div className="mb-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Learning overview
            </p>

            <h3 className="mt-1 text-lg font-semibold text-white">
              Your learning snapshot
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] p-4">
              <div className="text-2xl font-bold text-violet-300">
                {stats.conceptBreakdown.length}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Explored concepts
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
              <div className="text-2xl font-bold text-cyan-300">
                {stats.assessment.totalResponses}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Recorded attempts
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
              <div className="text-2xl font-bold text-emerald-300">
                {stats.strongAreas}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Strong concepts
              </p>
            </div>

            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-4">
              <div className="text-2xl font-bold text-amber-300">
                {stats.areasToRevisit}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Concepts to revisit
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Assessed accuracy
              </span>

              <span className="text-lg font-bold text-violet-300">
                {hasAssessment ? `${stats.mastery}%` : '--'}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-1000"
                style={{
                  width: `${stats.mastery ?? 0}%`,
                }}
              />
            </div>

            <p className="mt-2 text-[10px] text-slate-500">
              {stats.assessment.correctAnswers} correct ·{' '}
              {stats.assessment.incorrectAnswers} incorrect ·{' '}
              {stats.assessment.unassessedAnswers} awaiting evaluation
            </p>
          </div>
        </div>
      </div>

      {/* CONCEPT MASTERY BREAKDOWN */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#080F22]/50 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Performance analysis
            </p>

            <h3 className="mt-1 text-lg font-semibold text-white">
              Concept mastery breakdown
            </h3>
          </div>

          <span className="text-xs text-slate-500">
            {stats.conceptBreakdown.length} concepts
          </span>
        </div>

        {stats.conceptBreakdown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
            <p className="text-sm font-medium text-slate-300">
              No practice data yet
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Submit answers in your Learning Workspace to start
              building your Learning Twin.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {stats.conceptBreakdown.map((item, index) => {
              const percentage = item.percentage
              const color =
                percentage === null
                  ? '#64748B'
                  : getMasteryColor(percentage)

              return (
                <div key={`${item.concept}-${index}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                          color,
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}35`,
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {item.concept}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {percentage === null
                            ? 'Awaiting assessment'
                            : getMasteryLabel(percentage)}
                          {' · '}
                          {item.attempts} attempts
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color }}
                    >
                      {percentage === null ? '--' : `${percentage}%`}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    {percentage !== null && (
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                          boxShadow: `0 0 12px ${color}55`,
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* INTERPRETATION */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg text-cyan-300">◇</span>

            <h3 className="text-sm font-semibold text-cyan-200">
              What this represents
            </h3>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Your saved practice activity and performance on answers
            that have been evaluated. Unassessed answers are not
            included in mastery calculations.
          </p>
        </div>

        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg text-amber-300">!</span>

            <h3 className="text-sm font-semibold text-amber-200">
              Assessment status
            </h3>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {stats.assessment.assessedAnswers > 0
              ? 'The displayed accuracy is calculated from evaluated answers. AI-based evaluation is not connected yet.'
              : 'No answers have been evaluated yet. Your mastery score will remain unavailable until assessment is connected.'}
          </p>
        </div>
      </div>

      <p className="border-t border-white/[0.06] pt-4 text-center text-[10px] text-slate-500">
        COGNIFY LEARNING TWIN · ASSESSMENT-BASED ANALYTICS
      </p>
    </section>
  )
}
