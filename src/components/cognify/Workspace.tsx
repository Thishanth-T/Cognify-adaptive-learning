// @ts-nocheck -- imported from original Cognify project (looser TS settings)

import { useEffect, useMemo, useState } from 'react'
import {
  getConcepts,
  loadStudent,
  saveStudent,
  isUncertainResponse,
  updateUncertainConcepts,
  type AnswerRecord,
  type AnswerStatus,
} from '@/data/sampleData'

type WorkspaceProps = {
  selectedConcept: string | null
  pushLog: (message: string) => void
  subject?: string
  topic?: string
  level?: string
  onAnswerSaved?: () => void
}

type AssessmentResult = {
  score: number | null
  status: 'assessed' | 'needs_review'
  correct: boolean | null
  feedback: string
  strengths: string[]
  missingPoints: string[]
  misconceptions: string[]
  recommendedNextStep: string
  evaluationMethod: 'rubric_phrase_match' | 'manual_review'
}

export default function Workspace({
  selectedConcept,
  pushLog,
  subject = 'General',
  topic = 'Learning',
  level = 'Beginner',
  onAnswerSaved,
}: WorkspaceProps) {
  const [answer, setAnswer] = useState('')
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const concepts = useMemo(
    () => getConcepts(subject, topic),
    [subject, topic]
  )

  const concept = concepts.find(
    item => item.id === selectedConcept
  )

  const question = concept
    ? `Explain "${concept.label}" in your own words. Include a simple example and describe why this concept is useful.`
    : ''

  useEffect(() => {
    const student = loadStudent(subject, topic)
    setSavedCount(student.answerHistory.length)
  }, [subject, topic])

  useEffect(() => {
    setAnswer('')
    setAssessment(null)
    setEditorFocused(false)
    setErrorMessage('')
  }, [selectedConcept, subject, topic])

  const handleSubmit = async () => {
    if (!answer.trim() || !concept || isSubmitting || assessment) return

    setIsSubmitting(true)
    setErrorMessage('')

    const submittedAnswer = answer.trim()

    try {
      const student = loadStudent(subject, topic)

      let result: AssessmentResult
      let answerStatus: AnswerStatus

      // Detect uncertainty before sending the answer
      // to the rubric evaluator.
      if (isUncertainResponse(submittedAnswer)) {
        answerStatus = 'uncertain'

        result = {
          score: null,
          status: 'needs_review',
          correct: null,
          feedback: "That's completely okay! Recognizing when you don't know something is an important part of learning. Let's build your understanding step by step.",
          strengths: [
            'You identified that you need help with this concept.',
          ],
          missingPoints: [],
          misconceptions: [],
          recommendedNextStep: `Start by reviewing the fundamentals of ${concept.label}. Then try explaining the concept again in your own words.`,
          evaluationMethod: 'manual_review',
        }
      } else {
        // Normal answers are evaluated by the backend.
        const response = await fetch('/api/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            concept: concept.label,
            question,
            answer: submittedAnswer,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || 'The assessment could not be completed.'
          )
        }

        result = data.assessment as AssessmentResult

        answerStatus =
          result.status === 'assessed' && result.correct === true
            ? 'correct'
            : result.status === 'assessed' && result.correct === false
              ? 'incorrect'
              : 'unassessed'
      }

      const newRecord: AnswerRecord = {
        concept: concept.label,
        question,
        response: submittedAnswer,
        correct: answerStatus === 'correct'
          ? true
          : answerStatus === 'incorrect'
            ? false
            : null,
        status: answerStatus,
        timestamp: Date.now(),
      }

      const updatedStudent = updateUncertainConcepts(
        {
          ...student,
          answerHistory: [
            ...student.answerHistory,
            newRecord,
          ],
        },
        concept.label,
        answerStatus
      )

      saveStudent(updatedStudent, subject, topic)

      setAssessment(result)
      setSavedCount(updatedStudent.answerHistory.length)

      if (answerStatus === 'uncertain') {
        pushLog(
          `Student requested help with ${concept.label}`
        )
      } else {
        pushLog(
          `Assessed and saved a practice response for ${concept.label}`
        )
      }

      onAnswerSaved?.()
    } catch (error) {
      console.error('Assessment error:', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      )

      pushLog(`Assessment failed for ${concept.label}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setAnswer('')
    setAssessment(null)
    setErrorMessage('')
  }

  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).length
    : 0

  if (!selectedConcept || !concept) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#0C152B] p-8">
        <p className="section-label mb-2">LEARNING WORKSPACE</p>

        <h2 className="text-2xl font-semibold text-white">
          Your practice studio
        </h2>

        <div className="mt-7 rounded-2xl border border-dashed border-violet-400/25 bg-violet-500/[0.04] p-12 text-center">
          <div className="mb-4 text-5xl text-violet-300">◇</div>

          <h3 className="text-xl font-semibold text-white">
            Select a concept to begin
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Choose a node from the Concept Graph. Its explanation,
            practice question and writing area will appear here.
          </p>
        </div>
      </section>
    )
  }

  const isUncertain = assessment !== null &&
    assessment.score === null &&
    assessment.evaluationMethod === 'manual_review' &&
    assessment.feedback.startsWith("That's completely okay!")

  return (
    <section className="space-y-6 animate-fade-in">

      {/* WORKSPACE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-label mb-2">
            INTERACTIVE LEARNING STUDIO
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Learning Workspace
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Understand it. Explain it. Make it yours.
          </p>
        </div>

        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200">
          {level} level
        </span>
      </div>

      {/* CURRENT CONCEPT */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#101E3B] via-[#0D1730] to-[#10112B] p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/[0.07] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#35D9FF]" />

            <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-300">
              CURRENT CONCEPT
            </p>
          </div>

          <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            {concept.label}
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {concept.description}
          </p>

          {concept.prerequisites.length > 0 && (
            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                KNOWLEDGE PREREQUISITES
              </p>

              <div className="flex flex-wrap gap-2">
                {concept.prerequisites.map(prerequisite => (
                  <span
                    key={prerequisite}
                    className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs text-cyan-100"
                  >
                    {prerequisite}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRACTICE QUESTION */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#191638] via-[#15152F] to-[#10182D] p-6 shadow-[0_0_35px_rgba(139,92,246,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/[0.10] blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-lg text-violet-200">
                ✧
              </span>

              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-violet-300">
                  CHALLENGE 01
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Concept understanding
                </p>
              </div>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-300">
              OPEN QUESTION
            </span>
          </div>

          <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-slate-400">
            YOUR MISSION
          </p>

          <h3 className="mt-4 max-w-4xl text-2xl font-semibold leading-relaxed tracking-tight text-white sm:text-3xl lg:text-[34px]">
            {question}
          </h3>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-4">
            <span className="text-lg text-violet-300">💡</span>

            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              Think about the concept first. Try explaining it as if
              you were teaching it to someone who has never learned it.
            </p>
          </div>
        </div>
      </div>

      {/* ANSWER EDITOR */}
      <div
        className={`overflow-hidden rounded-2xl border bg-[#0C152B] transition-all duration-300 ${
          editorFocused
            ? 'border-cyan-400/40 shadow-[0_0_30px_rgba(53,217,255,0.08)]'
            : 'border-white/[0.09]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-white">
              Your thinking space
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Write your explanation below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-[10px] font-medium tracking-wider text-slate-400">
              {assessment ? 'ASSESSMENT COMPLETE' : 'EDITOR READY'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <textarea
            value={answer}
            onChange={event => {
              setAnswer(event.target.value)
              setAssessment(null)
              setErrorMessage('')
            }}
            onFocus={() => setEditorFocused(true)}
            onBlur={() => setEditorFocused(false)}
            placeholder={`Start explaining ${concept.label}...

Try to include:
• What it means
• How it works
• A simple example
• Where it is useful`}
            rows={11}
            disabled={isSubmitting || !!assessment}
            className="min-h-[260px] w-full resize-y rounded-xl border border-white/[0.08] bg-[#070E20] p-5 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30 focus:bg-[#091329] disabled:opacity-70 sm:p-6 sm:text-base"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-5 text-xs text-slate-500">
              <span>{wordCount} words</span>
              <span>{answer.length} characters</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={(!answer && !assessment && !errorMessage) || isSubmitting}
              className="rounded-lg border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-400/[0.06] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Try again
            </button>
          </div>
        </div>

        {/* EDITOR FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] bg-white/[0.015] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium text-slate-300">
              {isSubmitting ? 'Evaluating your answer...' : 'Ready to submit?'}
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Your response will be assessed and saved to this learning path.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting || !!assessment}
            className="rounded-xl border border-violet-300/30 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(139,92,246,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            {isSubmitting ? 'Evaluating...' : 'Submit response'}
            <span className="ml-2">↗</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-4 text-sm text-rose-200">
          <p className="font-semibold">Assessment could not be completed</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
            {errorMessage}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Your response has not been saved. You can try submitting again.
          </p>
        </div>
      )}

      {/* ASSESSMENT RESULTS */}
      {assessment && (
        <div className="animate-fade-in space-y-5">

          <div className={`overflow-hidden rounded-2xl border p-6 ${
            isUncertain
              ? 'border-amber-400/25 bg-gradient-to-br from-[#292318] to-[#10182D]'
              : 'border-cyan-400/25 bg-gradient-to-br from-[#10263B] to-[#10182D]'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={`text-[10px] font-semibold tracking-[0.2em] ${
                  isUncertain ? 'text-amber-300' : 'text-cyan-300'
                }`}>
                  {isUncertain ? 'LEARNING SUPPORT' : 'ASSESSMENT RESULTS'}
                </p>

                <h3 className="mt-2 text-xl font-semibold text-white">
                  {isUncertain
                    ? 'It is okay not to know yet.'
                    : assessment.status === 'assessed'
                      ? 'Your answer has been evaluated'
                      : 'Your answer needs further review'}
                </h3>
              </div>

              {assessment.score !== null && (
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.08]">
                  <span className="text-2xl font-bold text-cyan-200">
                    {assessment.score}
                  </span>
                  <span className="text-[9px] tracking-wider text-cyan-300">
                    OUT OF 100
                  </span>
                </div>
              )}

              {isUncertain && (
                <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200">
                  UNCERTAIN
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              {assessment.feedback}
            </p>

            {!isUncertain && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[10px] text-slate-300">
                  {assessment.evaluationMethod === 'rubric_phrase_match'
                    ? 'Rubric phrase matching'
                    : 'Manual review required'}
                </span>

                <span className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-200">
                  {savedCount} saved responses
                </span>
              </div>
            )}
          </div>

          {assessment.strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-[#0C2023] p-6">
              <h4 className="text-sm font-semibold text-emerald-300">
                ✓ What you did well
              </h4>

              <ul className="mt-4 space-y-3">
                {assessment.strengths.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="text-emerald-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.missingPoints.length > 0 && (
            <div className="rounded-2xl border border-amber-400/20 bg-[#211D16] p-6">
              <h4 className="text-sm font-semibold text-amber-300">
                ◇ Areas to improve
              </h4>

              <ul className="mt-4 space-y-3">
                {assessment.missingPoints.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="text-amber-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.misconceptions.length > 0 && (
            <div className="rounded-2xl border border-rose-400/20 bg-[#26171F] p-6">
              <h4 className="text-sm font-semibold text-rose-300">
                ! Possible misconceptions
              </h4>

              <ul className="mt-4 space-y-3">
                {assessment.misconceptions.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="text-rose-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-6">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-violet-300">
              RECOMMENDED NEXT STEP
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              {assessment.recommendedNextStep}
            </p>
          </div>

          {!isUncertain && (
            <p className="text-[11px] leading-relaxed text-slate-500">
              This assessment uses predefined rubric phrase matching.
              It may not fully recognize differently worded but correct explanations.
            </p>
          )}
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
        <p className="text-xs text-slate-500">
          {subject} / {topic}
        </p>

        <p className="text-[10px] tracking-wider text-slate-600">
          COGNIFY · PRACTICE MODE
        </p>
      </div>
    </section>
  )
}
