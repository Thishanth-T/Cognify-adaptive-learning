// @ts-nocheck
import { useState, useEffect } from 'react'
import type { FullAssessment } from '@/lib/learning/useLearningData'

type WorkspaceProps = {
  selectedConcept: string | null
  pushLog: (message: string) => void
  subject?: string
  topic?: string
  level?: string
  onSelectConcept?: (conceptId: string) => void
  learningData: any
  theme?: 'dark' | 'light'
}

function highlightCppCode(code: string): string {
  const keywords = /\b(int|char|bool|float|double|void|auto|const|return|class|struct|template|typename|public|private|protected|virtual|override|nullptr|new|delete|sizeof|if|else|while|for|include|using|namespace|static|switch|case|break|continue|typedef)\b/g
  const stdTypes = /\b(std::cout|std::cin|std::endl|std::string|std::vector|std::unique_ptr|std::shared_ptr|std::make_unique|std|cout|cin|endl|string|vector)\b/g
  const strings = /(".*?"|'.*?')/g
  const comments = /(\/\/.*$)/gm

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html
    .replace(strings, '<span class="text-amber-300">$1</span>')
    .replace(comments, '<span class="text-slate-400 italic">$1</span>')
    .replace(keywords, '<span class="text-teal-400 font-semibold">$1</span>')
    .replace(stdTypes, '<span class="text-cyan-300 font-semibold">$1</span>')

  return html
}

function FormattedMessage({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          const firstLine = lines[0].trim().toLowerCase()
          const isLang = /^(cpp|c\+\+|c|python|javascript|js|tsx|jsx|ts|html|css|bash)$/.test(firstLine)
          const codeContent = isLang ? lines.slice(1).join('\n') : lines.join('\n')
          const highlighted = highlightCppCode(codeContent)

          return (
            <div key={idx} className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#060D1E] shadow-inner">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-1.5 text-[11px] font-mono text-slate-400">
                <span>{isLang ? firstLine.toUpperCase() : 'CODE SNIPPET'}</span>
                <span>syntax</span>
              </div>
              <pre className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-100">
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
              </pre>
            </div>
          )
        }

        return (
          <p key={idx} className="whitespace-pre-line leading-relaxed">
            {part}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Unified Assessment Submission & Evaluation Modal
 * Handles evaluating state (with orbital animation), error state (retry/edit),
 * and transitions smoothly into the rich results scorecard.
 */
function AssessmentSubmissionModal({
  isOpen,
  status,
  concept,
  studentAnswer,
  assessment,
  errorMessage,
  onClose,
  onRetry,
  onEditAnswer,
  onAskTutor,
  onSelectNextConcept,
  nextConcept,
  theme = 'dark',
}: {
  isOpen: boolean
  status: 'evaluating' | 'error' | 'results'
  concept: any
  studentAnswer: string
  assessment: FullAssessment | null
  errorMessage: string
  onClose: () => void
  onRetry: () => void
  onEditAnswer: () => void
  onAskTutor: (query: string) => void
  onSelectNextConcept?: (id: string) => void
  nextConcept?: any
  theme?: 'dark' | 'light'
}) {
  if (!isOpen) return null

  const isEvaluating = status === 'evaluating'
  const isError = status === 'error'
  const isResults = status === 'results' && assessment !== null

  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0

  // Result metrics
  const isUncertain =
    assessment?.score === null &&
    assessment?.status === 'needs_review' &&
    assessment?.evaluationMethod === 'manual_review'

  const score = assessment?.score ?? null
  const isMastered = !isUncertain && score !== null && score >= 70
  const isDeveloping = !isUncertain && score !== null && score >= 40 && score < 70

  const statusBadge = isUncertain
    ? {
        label: 'SUPPORT SESSION',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        title: 'It is okay to be unsure',
        desc: 'Recognizing gaps is a key learning milestone. Foundational guidance has been generated with no score penalty.',
        icon: '💡',
      }
    : isMastered
    ? {
        label: 'ACCEPTED & MASTERED',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        title: 'Strong Conceptual Understanding!',
        desc: 'Your explanation clearly demonstrated the core principles and mechanism of this concept.',
        icon: '✓',
      }
    : isDeveloping
    ? {
        label: 'DEVELOPING UNDERSTANDING',
        bg: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
        title: 'Partial Understanding Demonstrated',
        desc: 'You captured parts of the concept well, but some mechanisms or key details were omitted.',
        icon: '◇',
      }
    : {
        label: 'REVISION NEEDED',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
        title: 'Needs Additional Practice & Review',
        desc: 'Significant misconceptions or conceptual omissions were detected. Review the explanation below.',
        icon: '⚠️',
      }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        // Prevent dismissal while actively evaluating
        if (!isEvaluating && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`relative w-full max-w-3xl my-auto animate-fade-in overflow-hidden rounded-2xl border ${
          theme === 'dark'
            ? 'border-white/[0.12] bg-[#0E1526] text-white'
            : 'border-slate-200 bg-white text-slate-900 shadow-2xl'
        } p-6 sm:p-8 max-h-[92vh] overflow-y-auto`}
      >
        {/* ========================================================= */}
        {/* STATE 1: EVALUATING                                       */}
        {/* ========================================================= */}
        {isEvaluating && (
          <div className="py-8 text-center space-y-6">
            {/* Orbital Animation */}
            <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping opacity-40" />
              <div className="w-20 h-20 rounded-full border-3 border-teal-500 border-t-transparent animate-spin" />
              <div className="absolute w-12 h-12 rounded-full border-2 border-cyan-400 border-b-transparent animate-spin [animation-duration:1.4s]" />
              <span className="text-2xl animate-pulse">✨</span>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                Live AI Assessment
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight font-display text-white">
                Evaluating your understanding
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Evaluating conceptual understanding of <strong className="text-white">{concept.label}</strong> against topic-specific rubric criteria via Gemini 3.8 Flash.
              </p>
            </div>

            {/* Answer Preview Box */}
            <div className="max-w-xl mx-auto rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 border-b border-white/5 pb-1">
                <span>SUBMITTED EXPLANATION</span>
                <span>{wordCount} words</span>
              </div>
              <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed italic">
                "{studentAnswer.trim()}"
              </p>
            </div>

            {/* Honest Status Stream */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 max-w-lg mx-auto text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Evaluating definition, mechanism, and practical application...</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Scoring is computed independently across each criterion. Evidence from your explanation will be matched against rubric standards.
              </p>
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              Please wait • Submissions are locked during evaluation
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 2: ERROR                                            */}
        {/* ========================================================= */}
        {isError && (
          <div className="py-6 text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-2xl mx-auto text-rose-400">
              ⚠️
            </div>

            <div>
              <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider text-rose-300 uppercase">
                Evaluation Notice
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight font-display text-white">
                Could Not Complete Assessment
              </h2>
              <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {errorMessage || 'The assessment could not be evaluated by the AI model. Your explanation has been preserved.'}
              </p>
            </div>

            {/* Preserved answer snippet */}
            <div className="max-w-lg mx-auto rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                Preserved Answer:
              </div>
              <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed">
                "{studentAnswer.trim()}"
              </p>
            </div>

            {/* Error Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="btn-primary text-xs"
              >
                <span>Retry Evaluation</span>
                <span>↻</span>
              </button>

              <button
                type="button"
                onClick={onEditAnswer}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Edit Explanation
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 3: DETAILED RESULTS VIEW                            */}
        {/* ========================================================= */}
        {isResults && assessment && (
          <div>
            {/* Top Header */}
            <div className={`flex items-start justify-between gap-4 border-b pb-5 ${
              theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold border ${statusBadge.bg}`}
                >
                  {statusBadge.icon}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Concept: <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{concept.label}</strong>
                    </span>
                  </div>
                  <h2 className={`mt-1 text-xl font-bold tracking-tight font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {statusBadge.title}
                  </h2>
                  <p className={`mt-1 text-xs leading-relaxed max-w-xl ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {statusBadge.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition ${
                  theme === 'dark'
                    ? 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Score & Mastery Contribution */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`sm:col-span-1 rounded-xl border p-4 flex flex-col items-center justify-center text-center ${
                theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
              }`}>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Evaluated Score
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold font-display tabular-nums ${
                    score !== null && score >= 70
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : score !== null && score >= 40
                      ? 'text-teal-600 dark:text-teal-400'
                      : score !== null
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-amber-500 dark:text-amber-400'
                  }`}>
                    {score !== null ? score : 'Review'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">/ 100</span>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {score !== null ? 'Calculated via independent weighted criteria' : 'Support session (no score penalty)'}
                </p>
              </div>

              <div className={`sm:col-span-2 rounded-xl border p-4 flex flex-col justify-between ${
                theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Cognitive Mastery Contribution
                    </span>
                    <span className="rounded font-mono border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                      {assessment.evaluationMethod === 'ai_model' ? '✨ Gemini 3.8 Flash Live' : '📋 Curriculum Rubric Matching'}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {score !== null
                      ? `This result updates your Learning Twin's Bayesian moving average mastery for "${concept.label}".`
                      : `Your learning twin noted this concept for guided review without degrading overall mastery.`}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-mono">Timestamp: {new Date(assessment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span className={assessment.correct ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                    {assessment.correct ? 'Prerequisite criterion met' : 'Requires further reinforcement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Criterion-Wise Evaluation Matrix */}
            {assessment.criteria && assessment.criteria.length > 0 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                    <span>📋</span> Rubric Criteria Performance Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Independent weighted scoring
                  </span>
                </div>
                <div className="space-y-2.5">
                  {assessment.criteria.map((c: any, cIdx: number) => {
                    const statusStyle =
                      c.status === 'demonstrated'
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                        : c.status === 'partially_demonstrated'
                        ? 'border-teal-400/30 bg-teal-500/10 text-teal-300'
                        : c.status === 'incorrect'
                        ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                        : 'border-amber-400/30 bg-amber-500/10 text-amber-300'

                    const statusLabel =
                      c.status === 'demonstrated'
                        ? '✓ DEMONSTRATED'
                        : c.status === 'partially_demonstrated'
                        ? '◇ PARTIAL'
                        : c.status === 'incorrect'
                        ? '✕ INCORRECT'
                        : '○ MISSING'

                    return (
                      <div
                        key={cIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition hover:bg-white/[0.04]"
                      >
                        <div className="flex-1">
                          <div className="flex items-start sm:items-center gap-2">
                            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusStyle}`}>
                              {statusLabel}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {c.description}
                            </span>
                          </div>
                          {c.evidence && (
                            <p className="mt-1 text-[11px] text-slate-400 italic">
                              Evidence: "{c.evidence}"
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs font-bold self-end sm:self-auto">
                          <span className={c.pointsEarned > 0 ? 'text-emerald-300' : 'text-slate-400'}>
                            +{c.pointsEarned}
                          </span>
                          <span className="text-slate-500">/ {c.maxPoints} pts</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Your Submitted Answer Preview */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 font-mono">
                <span>YOUR SUBMITTED EXPLANATION</span>
                <span>{wordCount} words</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-black/20 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
                {assessment.answer}
              </p>
            </div>

            {/* Qualitative Feedback */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 font-display">
                <span>💬</span> Evaluator Feedback:
              </h3>
              <FormattedMessage
                text={assessment.feedback}
                className="text-xs sm:text-sm leading-relaxed text-slate-200"
              />
            </div>

            {/* Strengths & Missing Points Side-by-Side */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2 mb-2.5 font-mono">
                  <span>✓</span> Demonstrated Conceptual Criteria
                </h4>
                {assessment.strengths && assessment.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {assessment.strengths.map((str: string, sIdx: number) => (
                      <li key={sIdx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Continue practicing to articulate the core definitions clearly.
                  </p>
                )}
              </div>

              {/* Missing Points */}
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2 mb-2.5 font-mono">
                  <span>◇</span> Omitted or Incomplete Concepts
                </h4>
                {assessment.missingPoints && assessment.missingPoints.length > 0 ? (
                  <ul className="space-y-2">
                    {assessment.missingPoints.map((mp: string, mIdx: number) => (
                      <li key={mIdx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{mp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-300/90 font-medium">
                    No major conceptual gaps identified!
                  </p>
                )}
              </div>
            </div>

            {/* Misconceptions */}
            {assessment.misconceptions && assessment.misconceptions.length > 0 && (
              <div className="mt-5 rounded-2xl border border-rose-400/35 bg-rose-500/15 p-5">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2 mb-2 font-mono">
                  <span>⚠️</span> Misconceptions Detected in Your Answer:
                </h4>
                <ul className="space-y-2">
                  {assessment.misconceptions.map((misc: string, mcIdx: number) => (
                    <li key={mcIdx} className="text-xs text-rose-100 flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <span>{misc}</span>
                    </li>
                  ))}
                </ul>
                {assessment.recurringMisconceptions && assessment.recurringMisconceptions.length > 0 && (
                  <p className="mt-3 text-[11px] font-semibold text-rose-200 border-t border-rose-400/20 pt-2 font-mono">
                    🚨 Note: This gap is a recurring pattern across your assessments. Consulting the AI Tutor is strongly recommended.
                  </p>
                )}
              </div>
            )}

            {/* Core Concept Explanation & Reference Implementation */}
            <div className="mt-5 rounded-2xl border border-teal-500/20 bg-teal-950/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-teal-400">📖</span>
                <h3 className="text-sm font-bold text-teal-200 font-display">
                  Core Concept Mechanics & Reference Pattern
                </h3>
              </div>
              <FormattedMessage
                text={concept.description || `Understanding ${concept.label} is essential for building foundational mastery. A complete explanation defines its operational role, memory behavior, and syntactical usage.`}
                className="text-xs sm:text-sm text-slate-200 leading-relaxed"
              />

              <div className="mt-3 rounded-xl border border-teal-400/20 bg-[#050D1D] p-3 font-mono text-xs text-teal-100">
                {concept.suggestedActivity?.includes('int') || concept.label.toLowerCase().includes('pointer') ? (
                  <pre className="whitespace-pre overflow-x-auto leading-relaxed">
{`// C++ Reference: Pointer Declaration, Address-of (&), and Dereferencing (*)
int value = 42;
int* ptr = &value;    // ptr stores the memory address of value

std::cout << ptr;    // Prints memory address (e.g. 0x7ffd5e...)
std::cout << *ptr;   // Prints 42 (dereferencing accesses stored value)
*ptr = 99;           // Modifies original value through the pointer`}
                  </pre>
                ) : (
                  <pre className="whitespace-pre overflow-x-auto leading-relaxed">
{`// Applied Reference Pattern for ${concept.label}:
1. Define the operational role and primary purpose.
2. Articulate runtime mechanics and memory lifecycle.
3. Provide a practical application showing real-world utility.`}
                  </pre>
                )}
              </div>
            </div>

            {/* Recommended Next Step */}
            {assessment.recommendedNextStep && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-500/25 bg-teal-600/10 p-4">
                <span className="text-base text-teal-300">🚀</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 font-mono">
                    Recommended Next Learning Action
                  </span>
                  <p className="mt-0.5 text-xs font-medium text-slate-200 leading-relaxed">
                    {assessment.recommendedNextStep}
                  </p>
                </div>
              </div>
            )}

            {/* Action Recommendations */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAskTutor(`Could you explain why my answer for "${concept.label}" received this feedback: "${assessment.feedback}"? What is the correct way to explain this?`)}
                  className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 transition"
                >
                  <span>✧</span> Ask AI Tutor to Clarify
                </button>

                {nextConcept && nextConcept.id !== concept.id && onSelectNextConcept && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectNextConcept(nextConcept.id)
                      onClose()
                    }}
                    className="btn-primary text-xs"
                  >
                    <span>Proceed to Next: {nextConcept.label} →</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Keep Practicing ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Workspace({
  selectedConcept,
  pushLog,
  subject = 'C++',
  topic = 'Pointers',
  level = 'Beginner',
  onSelectConcept,
  learningData,
  theme = 'dark',
}: WorkspaceProps) {
  const { concepts, submitAnswer, askTutor, assessments, plan, twin } = learningData

  const [answer, setAnswer] = useState('')
  const [currentAssessment, setCurrentAssessment] = useState<FullAssessment | null>(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'practice' | 'tutor' | 'history'>('practice')

  // Unified Assessment Submission Dialog State
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'evaluating' | 'error' | 'results'>('evaluating')

  // AI Tutor State
  const [tutorQuery, setTutorQuery] = useState('')
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'student' | 'tutor'; text: string; followUps?: string[] }>>([])
  const [tutorLoading, setTutorLoading] = useState(false)

  // Find active concept
  const concept = concepts.find(
    (item: any) => item.id === selectedConcept || item.label.toLowerCase() === selectedConcept?.toLowerCase()
  ) || concepts[0]

  // Enforce Curriculum Locking via Twin Node State
  const nodeState = twin?.nodes?.find((n: any) => n.id === concept?.id)
  const isLocked = nodeState?.state === 'locked'

  // Determine unmet prerequisites if locked
  const unmetPrerequisites = (concept?.prerequisites || []).map((pId: string) => {
    const pNode = twin?.nodes?.find((n: any) => n.id === pId)
    const pConcept = concepts.find((c: any) => c.id === pId)
    const mastery = pNode?.mastery ?? null
    const met = mastery !== null && mastery >= 60
    return {
      id: pId,
      label: pConcept?.label || pNode?.label || pId,
      mastery,
      required: 60,
      met,
    }
  })

  const question = concept?.question || (concept
    ? `Explain "${concept.label}" in your own words. Include a simple code or practical example and describe why this concept is important.`
    : '')

  // Concept history
  const conceptHistory = assessments.filter(
    (a: FullAssessment) => a.concept.toLowerCase() === concept?.label?.toLowerCase()
  )

  useEffect(() => {
    setAnswer('')
    setCurrentAssessment(null)
    setSubmissionModalOpen(false)
    setErrorMessage('')
    setEditorFocused(false)
    setTutorMessages([])
    setTutorQuery('')
  }, [selectedConcept, subject, topic])

  const handleSubmit = async () => {
    // Strictly prevent submissions if topic is locked
    if (isLocked) {
      pushLog(`Cannot submit assessment: ${concept.label} is locked by prerequisites.`)
      return
    }

    if (!answer.trim() || !concept || isSubmitting) return

    setIsSubmitting(true)
    setSubmissionModalOpen(true)
    setModalStatus('evaluating')
    setErrorMessage('')

    try {
      pushLog(`Submitting explanation for ${concept.label}...`)
      const result = await submitAnswer(concept.id, question, answer.trim())
      setCurrentAssessment(result)
      setModalStatus('results')

      if (result.status === 'assessed') {
        pushLog(`Evaluation received: ${result.score}/100 via ${result.evaluationMethod === 'ai_model' ? 'Gemini 3.8 Flash' : 'Rubric Fallback'}`)
      } else {
        pushLog(`Assessment review completed for ${concept.label}`)
      }
    } catch (err: any) {
      console.error('Submission error:', err)
      const errText = err?.message || 'The assessment could not be completed. Please try again.'
      setErrorMessage(errText)
      setModalStatus('error')
      pushLog(`Assessment failed for ${concept.label}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setAnswer('')
    setCurrentAssessment(null)
    setSubmissionModalOpen(false)
    setErrorMessage('')
  }

  const handleAskTutor = async (queryText?: string) => {
    const q = (queryText || tutorQuery).trim()
    if (!q || tutorLoading || !concept) return

    setTutorLoading(true)
    const newMsg = { role: 'student' as const, text: q }
    setTutorMessages((prev) => [...prev, newMsg])
    setTutorQuery('')

    try {
      pushLog(`Asked AI Tutor about ${concept.label}`)
      const res = await askTutor(concept.label, q, currentAssessment?.feedback)
      setTutorMessages((prev) => [
        ...prev,
        { role: 'tutor' as const, text: res.answer, followUps: res.followUps },
      ])
    } catch (err: any) {
      setTutorMessages((prev) => [
        ...prev,
        {
          role: 'tutor' as const,
          text: 'I could not answer right now. Please try again shortly.',
          followUps: [],
        },
      ])
    } finally {
      setTutorLoading(false)
    }
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0

  if (!concept) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#0C152B] p-8 text-center">
        <p className="text-sm text-slate-400">Select a concept to begin practice.</p>
      </section>
    )
  }

  const isUncertain =
    currentAssessment !== null &&
    currentAssessment.score === null &&
    currentAssessment.status === 'needs_review' &&
    currentAssessment.evaluationMethod === 'manual_review'

  return (
    <section className="space-y-6 animate-fade-in">
      {/* ========================================================= */}
      {/* WORKSPACE HEADER                                          */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 shadow-sm" />
            <p className="font-mono text-[10px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400">
              Interactive Study Studio
            </p>
          </div>
          <h2 className={`mt-1 text-2xl font-bold tracking-tight font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Learning Workspace
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Explain concepts in your own words, receive multi-agent evaluation, and consult the AI Tutor.
          </p>
        </div>

        {/* Tab Selector */}
        <div className={`flex rounded-lg border p-1 ${
          theme === 'dark' ? 'border-white/10 bg-[#111726]' : 'border-slate-200 bg-slate-100'
        }`}>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'practice'
                ? (theme === 'dark' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-white text-teal-900 border border-slate-200 shadow-xs')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Challenge & Explanation</span>
          </button>
          <button
            onClick={() => setActiveTab('tutor')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'tutor'
                ? (theme === 'dark' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-white text-teal-900 border border-slate-200 shadow-xs')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Socratic AI Tutor</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'history'
                ? (theme === 'dark' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-white text-teal-900 border border-slate-200 shadow-xs')
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>History ({conceptHistory.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ACTIVE CONCEPT CONTEXT CARD                               */}
      {/* ========================================================= */}
      <div className={`rounded-xl border p-5 sm:p-6 ${
        theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
              isLocked
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400'
                : 'border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400'
            }`}>
              {isLocked ? '🔒 LOCKED TOPIC' : 'CURRENT TARGET'}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {subject} · {topic} · {level}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {nodeState?.mastery !== null && (
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Mastery: {nodeState.mastery}%
              </span>
            )}
          </div>
        </div>

        <h3 className={`mt-2.5 text-xl sm:text-2xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {concept.label}
        </h3>

        <p className={`mt-1.5 max-w-3xl text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {concept.description ||
            `${concept.label} is a core foundation of ${topic}. Deepen your conceptual grasp by explaining how it operates and why it is used.`}
        </p>

        {concept.prerequisites && concept.prerequisites.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              Prerequisites check:
            </span>
            {unmetPrerequisites.map((p) => (
              <span
                key={p.id}
                className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                  p.met
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                }`}
              >
                {p.met ? '✓' : '🔒'} {p.label} ({p.mastery ?? 0}% / 60%)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRACTICE & ASSESSMENT                              */}
      {/* ========================================================= */}
      {activeTab === 'practice' && (
        <div className="space-y-5">
          {/* ===================================================== */}
          {/* IF LOCKED: SHOW PREREQUISITE GATE VIEW                */}
          {/* ===================================================== */}
          {isLocked ? (
            <div className={`rounded-xl border p-6 sm:p-8 space-y-5 ${
              theme === 'dark'
                ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-[#111726] to-[#111726]'
                : 'border-amber-300 bg-amber-50/50 shadow-sm'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-2xl text-amber-500">
                  🔒
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                    PREREQUISITE GATE ACTIVE
                  </div>
                  <h3 className={`mt-1.5 text-xl sm:text-2xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {concept.label} is Locked
                  </h3>
                  <p className={`mt-1 text-xs sm:text-sm leading-relaxed max-w-2xl ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    This curriculum topic requires foundational mastery of prerequisite concepts before assessment. Complete the required prerequisites with at least <strong>60% assessed mastery</strong> to unlock this topic.
                  </p>
                </div>
              </div>

              {/* Prerequisites Progress Checklist */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/30 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-500 border-b border-slate-200/60 dark:border-white/10 pb-2">
                  <span>Prerequisite Requirement</span>
                  <span>Mastery Required: ≥60%</span>
                </div>

                <div className="space-y-2.5">
                  {unmetPrerequisites.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          p.met
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        }`}>
                          {p.met ? '✓' : '🔒'}
                        </span>
                        <div>
                          <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {p.label}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Assessed Mastery: <strong className={p.met ? 'text-emerald-500' : 'text-amber-500'}>{p.mastery ?? 0}%</strong> / 60%
                          </p>
                        </div>
                      </div>

                      {!p.met && onSelectConcept && (
                        <button
                          type="button"
                          onClick={() => onSelectConcept(p.id)}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          <span>Study {p.label}</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cognify protects against cognitive gaps by ensuring core prerequisites are mastered first.
                </p>

                {(() => {
                  const firstUnmet = unmetPrerequisites.find((p) => !p.met)
                  if (firstUnmet && onSelectConcept) {
                    return (
                      <button
                        type="button"
                        onClick={() => onSelectConcept(firstUnmet.id)}
                        className="btn-primary text-xs"
                      >
                        <span>Study Prerequisite: {firstUnmet.label} →</span>
                      </button>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          ) : (
            /* =================================================== */
            /* UNLOCKED: SHOW PROMPT CHALLENGE & EDITOR            */
            /* =================================================== */
            <>
              {/* CHALLENGE QUESTION CARD */}
              <div className={`rounded-xl border p-6 sm:p-7 ${
                theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
              }`}>
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                    PROMPT CHALLENGE
                  </span>
                  <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Live AI Assessment Active
                  </span>
                </div>

                <h3 className={`mt-3.5 text-lg sm:text-xl font-bold leading-relaxed font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {question}
                </h3>

                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">Guidance:</span>
                  <span>
                    Explain the definition, runtime mechanics, and purpose in your own words. Short but accurate explanations receive full credit. If uncertain, you can request a guided session without score penalty.
                  </span>
                </div>
              </div>

              {/* ANSWER EDITOR */}
              <div
                className={`rounded-xl border transition-all duration-200 ${
                  theme === 'dark' ? 'bg-[#111726] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
                } ${editorFocused ? 'ring-1 ring-teal-500 border-teal-500' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] px-5 py-3.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white font-display">Your Explanation</p>
                    <p className="text-[11px] text-slate-500">
                      Evaluated semantically against topic rubric criteria.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswer((prev) => prev ? `${prev}\n\n// Code demonstration:\nint value = 42;\n` : `// Code demonstration:\nint value = 42;\n`)}
                      className="text-[11px] font-mono text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-white/10 px-2 py-1 rounded transition"
                    >
                      + Insert Code Snippet
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <textarea
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value)
                      setCurrentAssessment(null)
                      setErrorMessage('')
                    }}
                    onFocus={() => setEditorFocused(true)}
                    onBlur={() => setEditorFocused(false)}
                    placeholder={`Explain ${concept.label} here in your own words...

Key points you can cover:
1. Definition: What is it fundamentally?
2. Mechanics: How does it work in memory or at runtime?
3. Purpose: Why do we use it in programming?
4. Code example or concrete illustration.`}
                    rows={10}
                    disabled={isSubmitting}
                    className="w-full min-h-[260px] resize-y rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs sm:text-sm font-sans leading-relaxed text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-[#0B0F17] disabled:opacity-70"
                  />

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
                    <div className="flex gap-4 text-[11px]">
                      <span>{wordCount} words</span>
                      <span>{answer.length} chars</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAnswer("I'm not sure yet how to explain this concept. Can you help me understand the fundamentals?")}
                        className="text-[11px] text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-sans transition"
                      >
                        I'm not sure (Guided Session)
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={!answer && !currentAssessment && !errorMessage}
                        className="text-[11px] text-slate-500 hover:text-rose-500 disabled:opacity-40 font-sans transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* ACTION BAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] px-5 py-3.5">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isSubmitting ? 'Evaluating via Gemini 3.8 Flash...' : 'Ready for evaluation?'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Triggers multi-agent assessment & updates your Learning Twin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit for Assessment</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR NOTICE (If closed without fixing) */}
              {errorMessage && !submissionModalOpen && (
                <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-xs text-rose-200 animate-fade-in flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">Evaluation Notice</p>
                    <p className="mt-1 leading-relaxed text-rose-200/80">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn-primary text-xs shrink-0"
                  >
                    Retry Assessment
                  </button>
                </div>
              )}

              {/* ASSESSMENT RESULTS PANEL */}
              {currentAssessment && (
                <div className="space-y-4 animate-fade-in">
                  {/* PRIMARY RESULT CARD */}
                  <div
                    className={`overflow-hidden rounded-xl border p-5 sm:p-6 ${
                      isUncertain
                        ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                        : currentAssessment.score !== null && currentAssessment.score >= 70
                        ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isUncertain
                                ? 'bg-amber-500'
                                : currentAssessment.score !== null && currentAssessment.score >= 70
                                ? 'bg-emerald-500'
                                : 'bg-teal-500'
                            }`}
                          />
                          <p
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isUncertain ? 'text-amber-700 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'
                            }`}
                          >
                            {isUncertain ? 'LEARNING SUPPORT MODE' : 'EVALUATION REPORT'}
                          </p>
                        </div>

                        <h3 className={`mt-1.5 text-lg font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isUncertain
                            ? 'It is okay to be unsure.'
                            : currentAssessment.score !== null && currentAssessment.score >= 70
                            ? 'Strong conceptual understanding demonstrated!'
                            : 'Answer evaluated — review feedback below'}
                        </h3>

                        <button
                          type="button"
                          onClick={() => {
                            setModalStatus('results')
                            setSubmissionModalOpen(true)
                          }}
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition"
                        >
                          <span>✦</span> Open Detailed Rubric Scorecard
                        </button>
                      </div>

                      {/* SCORE BADGE */}
                      {currentAssessment.score !== null && (
                        <div className={`flex h-16 w-20 flex-col items-center justify-center rounded-xl border ${
                          theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white shadow-xs'
                        }`}>
                          <span
                            className={`text-2xl font-bold font-display tabular-nums ${
                              currentAssessment.score >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : currentAssessment.score >= 40
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {currentAssessment.score}
                          </span>
                          <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-500">
                            / 100
                          </span>
                        </div>
                      )}

                      {isUncertain && (
                        <span className="rounded-md border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-200">
                          NO PENALTY
                        </span>
                      )}
                    </div>

                    <p className={`mt-3.5 text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                      {currentAssessment.feedback}
                    </p>

                    {/* METHODOLOGY BADGES */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/60 dark:border-white/10 pt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md font-mono border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {currentAssessment.evaluationMethod === 'ai_model' ? '✨ Gemini 3.8 Flash AI' : '📋 Curriculum Rubric Matching'}
                      </span>

                      {currentAssessment.correct !== null && (
                        <span
                          className={`rounded-md border font-mono px-2.5 py-1 text-[11px] font-semibold ${
                            currentAssessment.correct
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {currentAssessment.correct ? '✓ Concept Accepted' : '◇ Developing'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RECOMMENDED NEXT STEP */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 ${
                    theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
                  }`}>
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        PLANNER NEXT TARGET
                      </p>
                      <p className={`mt-0.5 text-xs font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {currentAssessment.recommendedNextStep}
                      </p>
                    </div>

                    {plan?.next && plan.next.id !== concept.id && onSelectConcept && (
                      <button
                        type="button"
                        onClick={() => onSelectConcept(plan.next.id)}
                        className="btn-primary text-xs"
                      >
                        <span>Proceed to Next: {plan.next.label} →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASK AI TUTOR                                       */}
      {/* ========================================================= */}
      {activeTab === 'tutor' && (
        <div className="space-y-5 animate-fade-in">
          <div className={`rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                ✧
              </div>
              <div>
                <h3 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Socratic AI Tutor
                </h3>
                <p className="text-xs text-slate-500">
                  Ask conceptual questions, request memory models, or clarify syntax for {concept.label}.
                </p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                `Explain ${concept.label} with a simple code example`,
                `What is the most common mistake with ${concept.label}?`,
                `How does ${concept.label} connect to its prerequisites?`,
                `Why should I use ${concept.label} instead of alternative approaches?`,
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskTutor(prompt)}
                  disabled={tutorLoading}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900'
                  }`}
                >
                  {prompt} →
                </button>
              ))}
            </div>

            {/* Chat conversation */}
            <div className="mt-5 space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {tutorMessages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 dark:border-white/10 p-8 text-center text-xs text-slate-500">
                  No conversation yet. Choose a prompt above or ask any question about {concept.label}.
                </div>
              ) : (
                tutorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 text-xs leading-relaxed ${
                      msg.role === 'student'
                        ? 'ml-auto max-w-[85%] border border-teal-500/30 bg-teal-500/10 text-slate-900 dark:text-teal-100'
                        : theme === 'dark'
                        ? 'mr-auto max-w-[90%] border border-white/[0.08] bg-white/[0.02] text-slate-200'
                        : 'mr-auto max-w-[90%] border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {msg.role === 'student' ? 'You' : 'Cognify Socratic Tutor'}
                    </div>
                    <FormattedMessage
                      text={msg.text}
                      className="text-xs sm:text-sm leading-relaxed"
                    />

                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="mt-3 border-t border-slate-200/60 dark:border-white/10 pt-2.5">
                        <p className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400">Suggested Follow-ups:</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {msg.followUps.map((fu, fIdx) => (
                            <button
                              key={fu + fIdx}
                              onClick={() => handleAskTutor(fu)}
                              className="rounded-md border border-teal-500/20 bg-teal-500/5 px-2.5 py-1 text-[11px] text-teal-700 dark:text-teal-300 hover:bg-teal-500/15 transition"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {tutorLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-600 dark:text-teal-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  <span>AI Tutor is preparing an explanation...</span>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskTutor()
                }}
                placeholder={`Ask the AI Tutor anything about ${concept.label}...`}
                disabled={tutorLoading}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-xs outline-none transition ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/[0.02] text-white placeholder-slate-500 focus:border-teal-500'
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => handleAskTutor()}
                disabled={!tutorQuery.trim() || tutorLoading}
                className="btn-primary text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PAST ATTEMPTS                                      */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className={`rounded-xl border p-5 sm:p-6 ${
            theme === 'dark' ? 'border-white/[0.08] bg-[#111726]' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <h3 className={`text-base font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Assessment History for {concept.label}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Review your earlier explanations, scores, and detected gaps.
            </p>

            {conceptHistory.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 dark:border-white/10 p-8 text-center text-xs text-slate-500">
                No previous attempts recorded for this concept yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {conceptHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`rounded-lg border p-4 transition ${
                      theme === 'dark' ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-14 items-center justify-center rounded font-mono text-[11px] font-bold ${
                            item.score !== null && item.score >= 70
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : item.score !== null && item.score >= 40
                              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                              : item.score !== null
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.score !== null ? `${item.score}%` : 'Review'}
                        </span>
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {item.status === 'assessed' ? (item.correct ? 'Mastered' : 'Needs Work') : 'Support Session'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()} · {item.evaluationMethod === 'ai_model' ? '✨ Gemini AI' : '📋 Rubric'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      "{item.answer}"
                    </p>

                    <p className="mt-2 text-xs text-slate-500 border-t border-slate-200/60 dark:border-white/[0.06] pt-2">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">Feedback: </span>
                      {item.feedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UNIFIED ASSESSMENT SUBMISSION & EVALUATION MODAL          */}
      {/* ========================================================= */}
      <AssessmentSubmissionModal
        isOpen={submissionModalOpen}
        status={modalStatus}
        concept={concept}
        studentAnswer={answer}
        assessment={currentAssessment}
        errorMessage={errorMessage}
        onClose={() => setSubmissionModalOpen(false)}
        onRetry={handleSubmit}
        onEditAnswer={() => setSubmissionModalOpen(false)}
        onAskTutor={(q) => {
          setSubmissionModalOpen(false)
          setActiveTab('tutor')
          handleAskTutor(q)
        }}
        onSelectNextConcept={onSelectConcept}
        nextConcept={plan?.next}
        theme={theme}
      />
    </section>
  )
}
