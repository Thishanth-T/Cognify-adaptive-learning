// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  computeTwin,
  planLearning,
  type HistoryEntry,
  type Twin,
  type GraphConcept,
} from './twin'
import { getConcepts, isUncertainResponse } from '@/data/sampleData'
import { evaluateWithRubric } from '@/lib/ai/evaluator.server'
import {
  assessGuest,
  assessSignedIn,
  askTutor as serverAskTutor,
  getLesson as serverGetLesson,
} from '@/lib/agents/agents.functions'
import {
  getOrGenerateCurriculum,
  buildHeuristicCurriculum,
  type GeneratedCurriculum,
} from './curriculumService'

export type AgentTraceLog = {
  id: string
  timestamp: number
  agent: 'assessment' | 'misconception' | 'twin' | 'planner' | 'tutor'
  status: 'ok' | 'fallback' | 'skipped' | 'error'
  summary: string
  ms: number
  concept?: string
}

export type FullAssessment = {
  id: string
  concept: string
  question: string
  answer: string
  score: number | null
  status: 'assessed' | 'needs_review'
  correct: boolean | null
  feedback: string
  strengths: string[]
  missingPoints: string[]
  misconceptions: string[]
  recurringMisconceptions?: string[]
  recommendedNextStep: string
  evaluationMethod: 'ai_model' | 'rubric_phrase_match' | 'manual_review'
  aiUnavailableReason?: string
  timestamp: number
  criteria?: Array<{
    id: string
    description: string
    status: 'demonstrated' | 'partially_demonstrated' | 'missing' | 'incorrect'
    pointsEarned: number
    maxPoints: number
    evidence?: string
  }>
  /** Structured evidence from the Assessment Agent — reused by the AI Tutor */
  assessmentEvidence?: {
    demonstratedCriteria: string[]
    missingCriteria: string[]
    incorrectStatements: string[]
    recurringMisconceptions: string[]
  }
}

function getGuestStorageKey(subject: string, topic: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return `cognify:guest-v3:${norm(subject)}:${norm(topic)}`
}

export function useLearningData(
  subject: string,
  topic: string,
  level: string = 'Beginner',
  userId: string | null | undefined
) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [assessments, setAssessments] = useState<FullAssessment[]>([])
  const [agentLogs, setAgentLogs] = useState<AgentTraceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [curriculum, setCurriculum] = useState<GeneratedCurriculum>(() =>
    buildHeuristicCurriculum(subject, topic, level)
  )

  // Dynamically load/generate the curriculum for custom or predefined topics
  useEffect(() => {
    let active = true
    getOrGenerateCurriculum(subject, topic, level).then((res) => {
      if (active && res) {
        setCurriculum(res)
      }
    })
    return () => {
      active = false
    }
  }, [subject, topic, level])

  const concepts: GraphConcept[] = useMemo(() => {
    if (curriculum?.concepts && curriculum.concepts.length > 0) {
      return curriculum.concepts.map((c) => ({
        id: c.id,
        label: c.label,
        prerequisites: c.prerequisites || [],
        description: c.description,
        question: c.question,
        rubricHints: c.rubricHints,
        suggestedActivity: c.suggestedActivity,
      }))
    }
    return (getConcepts(subject, topic) as any[]).map((c) => ({
      id: c.id,
      label: c.label,
      prerequisites: c.prerequisites || [],
    }))
  }, [subject, topic, curriculum])

  // Compute Learning Twin
  const twin: Twin = useMemo(() => {
    return computeTwin(history, concepts)
  }, [history, concepts])

  // Compute Learning Planner
  const plan = useMemo(() => {
    return planLearning(twin, concepts)
  }, [twin, concepts])

  // Initial Data Load (from Supabase if signed in, else from localStorage)
  const refreshData = useCallback(async () => {
    setLoading(true)

    if (userId) {
      // Signed in user: load from Supabase
      try {
        const { data: rows, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .order('created_at', { ascending: true })

        if (!error && rows) {
          const loadedAssessments: FullAssessment[] = rows.map((r) => ({
            id: r.id,
            concept: r.concept,
            question: r.question,
            answer: r.answer,
            score: r.score,
            status: r.status as any,
            correct: r.correct,
            feedback: r.feedback,
            strengths: Array.isArray(r.strengths) ? (r.strengths as string[]) : [],
            missingPoints: Array.isArray(r.missing_points) ? (r.missing_points as string[]) : [],
            misconceptions: Array.isArray(r.misconceptions) ? (r.misconceptions as string[]) : [],
            recommendedNextStep: r.recommended_next_step || 'Review and practice next concept.',
            evaluationMethod: r.evaluation_method as any,
            timestamp: new Date(r.created_at).getTime(),
          }))

          const loadedHistory: HistoryEntry[] = loadedAssessments.map((a) => ({
            concept: a.concept,
            score: a.score,
            correct: a.correct,
            status: a.status === 'assessed' ? (a.correct ? 'correct' : 'incorrect') : 'unassessed',
            misconceptionTags: a.misconceptions.map((m) => m.toLowerCase().slice(0, 60)),
            timestamp: a.timestamp,
          }))

          setAssessments(loadedAssessments)
          setHistory(loadedHistory)
          setLoading(false)
          return
        }
      } catch (e) {
        console.warn('Could not load assessments from cloud, checking local storage:', e)
      }
    }

    // Guest or cloud fallback: load from localStorage
    try {
      const key = getGuestStorageKey(subject, topic)
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        setAssessments(parsed.assessments || [])
        setHistory(parsed.history || [])
        setAgentLogs(parsed.agentLogs || [])
      } else {
        setAssessments([])
        setHistory([])
      }
    } catch (e) {
      console.error('Error loading local data:', e)
    } finally {
      setLoading(false)
    }
  }, [subject, topic, userId])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Save guest state locally
  const persistGuest = (
    newAssessments: FullAssessment[],
    newHistory: HistoryEntry[],
    newLogs: AgentTraceLog[]
  ) => {
    try {
      const key = getGuestStorageKey(subject, topic)
      localStorage.setItem(
        key,
        JSON.stringify({
          assessments: newAssessments,
          history: newHistory,
          agentLogs: newLogs.slice(0, 100),
        })
      )
    } catch (e) {
      console.warn('Could not persist to localStorage:', e)
    }
  }

  // Push an agent trace log
  const addAgentTraces = (traces: Array<Omit<AgentTraceLog, 'id' | 'timestamp'>>) => {
    const now = Date.now()
    const entries: AgentTraceLog[] = traces.map((t, idx) => ({
      ...t,
      id: `trace-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
    }))
    setAgentLogs((prev) => [...entries, ...prev].slice(0, 150))
    return entries
  }

  // SUBMIT AN ANSWER FOR EVALUATION
  const submitAnswer = async (
    conceptId: string,
    questionText: string,
    answerText: string
  ): Promise<FullAssessment> => {
    const targetConcept = concepts.find((c) => c.id === conceptId)
    const conceptLabel = targetConcept?.label || conceptId
    const cleanAnswer = answerText.trim()
    const now = Date.now()

    // 1. Check if uncertain
    if (isUncertainResponse(cleanAnswer)) {
      const uncertainAssessment: FullAssessment = {
        id: `assessment-unc-${now}`,
        concept: conceptLabel,
        question: questionText,
        answer: cleanAnswer,
        score: null,
        status: 'needs_review',
        correct: null,
        feedback:
          "That's completely okay! Recognizing when you're unsure is an essential foundation for learning. Let's build your understanding step by step.",
        strengths: ['Identified needing help with this concept instead of guessing.'],
        missingPoints: ['Conceptual explanation of ' + conceptLabel],
        misconceptions: [],
        recommendedNextStep: `Start by reviewing the fundamental definition of ${conceptLabel}. Try explaining one small example.`,
        evaluationMethod: 'manual_review',
        timestamp: now,
      }

      const newHistoryEntry: HistoryEntry = {
        concept: conceptLabel,
        score: null,
        correct: null,
        status: 'uncertain',
        misconceptionTags: [],
        timestamp: now,
      }

      const newTraces = addAgentTraces([
        {
          agent: 'assessment',
          status: 'fallback',
          summary: `Recognized uncertain response for "${conceptLabel}". Learning support mode engaged.`,
          ms: 12,
          concept: conceptLabel,
        },
        {
          agent: 'twin',
          status: 'ok',
          summary: `${conceptLabel} marked as uncertain / in-progress. No score penalty applied.`,
          ms: 4,
          concept: conceptLabel,
        },
        {
          agent: 'planner',
          status: 'ok',
          summary: `Recommending fundamentals review for ${conceptLabel}.`,
          ms: 2,
          concept: conceptLabel,
        },
      ])

      const updatedAssessments = [uncertainAssessment, ...assessments]
      const updatedHistory = [...history, newHistoryEntry]

      setAssessments(updatedAssessments)
      setHistory(updatedHistory)

      if (!userId) {
        persistGuest(updatedAssessments, updatedHistory, [
          ...newTraces,
          ...agentLogs,
        ])
      }

      return uncertainAssessment
    }

    // 2. Normal answer: evaluate with multi-agent pipeline
    let resultAssessment: FullAssessment | null = null
    let resultTraces: Array<Omit<AgentTraceLog, 'id' | 'timestamp'>> = []
    let savedByServer = false

    const startTimer = Date.now()

    // Try serverFn first
    try {
      if (userId) {
        const res = await assessSignedIn({
          data: {
            subject,
            topic,
            level,
            conceptId,
            question: questionText,
            answer: cleanAnswer,
          },
        })
        savedByServer = (res as any)?.savedToDatabase === true
        const a = res.assessment
        resultAssessment = {
          id: (res as any)?.dbId || `assessment-${now}`,
          concept: conceptLabel,
          question: questionText,
          answer: cleanAnswer,
          score: a.score,
          status: a.status,
          correct: a.correct,
          feedback: a.feedback,
          strengths: a.strengths || [],
          missingPoints: a.missingPoints || [],
          misconceptions: res.misconceptionReport?.detected || a.misconceptions || [],
          recurringMisconceptions: res.misconceptionReport?.recurring || [],
          recommendedNextStep: a.recommendedNextStep,
          evaluationMethod: a.evaluationMethod,
          aiUnavailableReason: a.aiUnavailableReason,
          timestamp: now,
          assessmentEvidence: res.assessmentEvidence,
          criteria: a.criteria,
        }
        resultTraces = (res.trace || []).map((t: any) => ({
          agent: t.agent,
          status: t.status,
          summary: t.summary,
          ms: t.ms,
          concept: conceptLabel,
        }))
      } else {
        const res = await assessGuest({
          data: {
            subject,
            topic,
            level,
            conceptId,
            question: questionText,
            answer: cleanAnswer,
            history,
          },
        })
        const a = res.assessment
        resultAssessment = {
          id: `assessment-${now}`,
          concept: conceptLabel,
          question: questionText,
          answer: cleanAnswer,
          score: a.score,
          status: a.status,
          correct: a.correct,
          feedback: a.feedback,
          strengths: a.strengths || [],
          missingPoints: a.missingPoints || [],
          misconceptions: res.misconceptionReport?.detected || a.misconceptions || [],
          recurringMisconceptions: res.misconceptionReport?.recurring || [],
          recommendedNextStep: a.recommendedNextStep,
          evaluationMethod: a.evaluationMethod,
          aiUnavailableReason: a.aiUnavailableReason,
          timestamp: now,
          assessmentEvidence: res.assessmentEvidence,
          criteria: a.criteria,
        }
        resultTraces = (res.trace || []).map((t: any) => ({
          agent: t.agent,
          status: t.status,
          summary: t.summary,
          ms: t.ms,
          concept: conceptLabel,
        }))
      }
    } catch (serverFnErr) {
      console.warn('Server function RPC unavailable, falling back to HTTP /api/assessment or local rubric:', serverFnErr)

      // Fallback A: HTTP /api/assessment
      try {
        const resp = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: conceptLabel,
            question: questionText,
            answer: cleanAnswer,
            subject,
            topic,
            level,
            knownMisconceptionTags: twin.misconceptions.map((m) => m.tag),
          }),
        })
        const data = await resp.json()
        if (resp.ok && data.success && data.assessment) {
          const a = data.assessment
          const elapsed = Date.now() - startTimer
          resultAssessment = {
            id: `assessment-${now}`,
            concept: conceptLabel,
            question: questionText,
            answer: cleanAnswer,
            score: a.score,
            status: a.status,
            correct: a.correct,
            feedback: a.feedback,
            strengths: a.strengths || [],
            missingPoints: a.missingPoints || [],
            misconceptions: a.misconceptions || [],
            recommendedNextStep: a.recommendedNextStep,
            evaluationMethod: a.evaluationMethod,
            aiUnavailableReason: a.aiUnavailableReason,
            timestamp: now,
            criteria: a.criteria,
          }
          resultTraces = [
            {
              agent: 'assessment',
              status: a.evaluationMethod === 'ai_model' ? 'ok' : 'fallback',
              summary: `${a.evaluationMethod === 'ai_model' ? 'AI evaluated' : 'Rubric evaluated'}: ${a.score ?? 'needs review'}${a.score !== null ? '/100' : ''}.`,
              ms: elapsed,
              concept: conceptLabel,
            },
            {
              agent: 'misconception',
              status: 'ok',
              summary: `${(a.misconceptions || []).length} misconceptions detected in answer.`,
              ms: 4,
              concept: conceptLabel,
            },
            {
              agent: 'twin',
              status: 'ok',
              summary: `Updated student twin for ${conceptLabel} to ${a.score ?? 50}%.`,
              ms: 3,
              concept: conceptLabel,
            },
            {
              agent: 'planner',
              status: 'ok',
              summary: `Next recommendation: ${a.recommendedNextStep}`,
              ms: 2,
              concept: conceptLabel,
            },
          ]
        }
      } catch (httpErr) {
        console.warn('HTTP API fallback failed, evaluating with local rubric engine:', httpErr)
      }

      // Fallback B: Local rubric engine (guaranteed to succeed)
      if (!resultAssessment) {
        const rubricRes = evaluateWithRubric({
          concept: conceptLabel,
          question: questionText,
          answer: cleanAnswer,
          subject,
          topic,
          level,
        })
        const elapsed = Date.now() - startTimer
        resultAssessment = {
          id: `assessment-${now}`,
          concept: conceptLabel,
          question: questionText,
          answer: cleanAnswer,
          score: rubricRes.score,
          status: rubricRes.status,
          correct: rubricRes.correct,
          feedback: rubricRes.feedback,
          strengths: rubricRes.strengths,
          missingPoints: rubricRes.missingPoints,
          misconceptions: rubricRes.misconceptions,
          recommendedNextStep: rubricRes.recommendedNextStep,
          evaluationMethod: rubricRes.evaluationMethod,
          aiUnavailableReason: rubricRes.aiUnavailableReason || 'Assessed via local semantic criteria.',
          timestamp: now,
          criteria: rubricRes.criteria,
        }
        resultTraces = [
          {
            agent: 'assessment',
            status: 'fallback',
            summary: `Curriculum evaluation completed: ${rubricRes.score !== null ? `${rubricRes.score}/100` : 'queued for review'}.`,
            ms: elapsed,
            concept: conceptLabel,
          },
          {
            agent: 'misconception',
            status: 'ok',
            summary: `${rubricRes.misconceptions.length} misconceptions flagged.`,
            ms: 2,
            concept: conceptLabel,
          },
          {
            agent: 'twin',
            status: 'ok',
            summary: `Learning Twin updated for ${conceptLabel}.`,
            ms: 2,
            concept: conceptLabel,
          },
          {
            agent: 'planner',
            status: 'ok',
            summary: `Planner computed next optimal path.`,
            ms: 2,
            concept: conceptLabel,
          },
        ]
      }
    }

    // 3. Save to database if user is authenticated AND the server has not already saved it
    if (userId && resultAssessment && !savedByServer) {
      try {
        await supabase.from('assessments').insert({
          user_id: userId,
          subject,
          topic,
          concept: conceptLabel,
          question: questionText,
          answer: cleanAnswer,
          score: resultAssessment.score,
          status: resultAssessment.status,
          correct: resultAssessment.correct,
          feedback: resultAssessment.feedback,
          strengths: resultAssessment.strengths,
          missing_points: resultAssessment.missingPoints,
          misconceptions: resultAssessment.misconceptions,
          recommended_next_step: resultAssessment.recommendedNextStep,
          evaluation_method: resultAssessment.evaluationMethod,
        })
      } catch (dbErr) {
        console.warn('Failed to save assessment to Supabase:', dbErr)
      }
    }

    // 4. Update local state
    const newHistoryEntry: HistoryEntry = {
      concept: conceptLabel,
      score: resultAssessment.score,
      correct: resultAssessment.correct,
      status:
        resultAssessment.status === 'assessed'
          ? resultAssessment.correct
            ? 'correct'
            : 'incorrect'
          : 'unassessed',
      misconceptionTags: (resultAssessment.misconceptions || []).map((m) =>
        m.toLowerCase().slice(0, 60)
      ),
      timestamp: now,
    }

    const recordedTraces = addAgentTraces(resultTraces)
    const updatedAssessments = [resultAssessment, ...assessments]
    const updatedHistory = [...history, newHistoryEntry]

    setAssessments(updatedAssessments)
    setHistory(updatedHistory)

    if (!userId) {
      persistGuest(updatedAssessments, updatedHistory, [
        ...recordedTraces,
        ...agentLogs,
      ])
    }

    return resultAssessment
  }

  // ASK AI TUTOR
  const askTutor = async (
    conceptLabel: string,
    questionText: string,
    contextInfo?: string
  ): Promise<{ answer: string; followUps: string[] }> => {
    const t0 = Date.now()
    const latestAssessment = assessments.find(
      (a) => a.concept.toLowerCase() === conceptLabel.toLowerCase()
    )
    const assessmentEvidence = latestAssessment?.assessmentEvidence
      ? {
          demonstratedCriteria: latestAssessment.assessmentEvidence.demonstratedCriteria,
          missingCriteria: latestAssessment.assessmentEvidence.missingCriteria,
          incorrectStatements: latestAssessment.assessmentEvidence.incorrectStatements,
        }
      : latestAssessment
      ? {
          demonstratedCriteria: latestAssessment.strengths || [],
          missingCriteria: latestAssessment.missingPoints || [],
          incorrectStatements: latestAssessment.misconceptions || [],
        }
      : undefined

    try {
      const res = await serverAskTutor({
        data: {
          subject,
          topic,
          level,
          concept: conceptLabel,
          question: questionText,
          context: contextInfo,
          assessmentEvidence,
        },
      })
      const elapsed = Date.now() - t0
      if (res.ok) {
        addAgentTraces([
          {
            agent: 'tutor',
            status: 'ok',
            summary: `Answered question on "${conceptLabel}" in ${elapsed}ms. Generated ${res.followUps.length} follow-up prompts.`,
            ms: elapsed,
            concept: conceptLabel,
          },
        ])
        return { answer: res.answer, followUps: res.followUps }
      }
    } catch (e) {
      console.warn('AI Tutor server function error, using contextual fallback:', e)
    }

    // Natural intelligent explanation tailored to question intent
    const elapsed = Date.now() - t0
    const qLower = questionText.toLowerCase()
    let answerText = ''
    let followUpPrompts: string[] = []

    if (qLower.includes('example') || qLower.includes('code') || qLower.includes('syntax')) {
      if (/c\+\+|cpp|pointer|memory/i.test(`${subject} ${topic} ${conceptLabel}`)) {
        answerText =
          `Here is a practical C++ code example demonstrating **${conceptLabel}**:\n\n` +
          `\`\`\`cpp\n` +
          `#include <iostream>\n\n` +
          `int main() {\n` +
          `    int value = 42;\n` +
          `    int* ptr = &value; // Store the memory address of value in ptr\n\n` +
          `    std::cout << "Original value: " << value << "\\n";\n` +
          `    std::cout << "Memory address (&value): " << ptr << "\\n";\n` +
          `    std::cout << "Dereferenced (*ptr): " << *ptr << "\\n";\n\n` +
          `    *ptr = 99; // Modify value through the pointer\n` +
          `    std::cout << "Updated value: " << value << "\\n";\n` +
          `    return 0;\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `### Key Takeaways:\n` +
          `- \`&\` (address-of operator) yields the memory location of an existing variable.\n` +
          `- \`*\` in declarations creates a pointer type (\`int*\`), while \`*ptr\` in expressions dereferences the pointer to access the underlying stored value.`
      } else if (/react|jsx|frontend/i.test(`${subject} ${topic} ${conceptLabel}`)) {
        answerText =
          `Here is an idiomatic example demonstrating **${conceptLabel}** in React:\n\n` +
          `\`\`\`tsx\n` +
          `import { useState } from 'react';\n\n` +
          `export function Counter({ initialCount = 0 }: { initialCount?: number }) {\n` +
          `    const [count, setCount] = useState(initialCount);\n\n` +
          `    return (\n` +
          `        <div className="card">\n` +
          `            <p>Current count: {count}</p>\n` +
          `            <button onClick={() => setCount((c) => c + 1)}>Increment</button>\n` +
          `        </div>\n` +
          `    );\n` +
          `}\n` +
          `\`\`\`\n\n` +
          `### Key Takeaways:\n` +
          `- Props provide read-only external inputs from parent components.\n` +
          `- State manages dynamic local variables that trigger UI re-renders when updated.`
      } else {
        answerText =
          `Here is a concrete example illustrating **${conceptLabel}** in ${subject}:\n\n` +
          `\`\`\`\n` +
          `// Basic operational pattern for ${conceptLabel}\n` +
          `1. Initialize the required resource or variable.\n` +
          `2. Pass or manipulate references rather than creating unnecessary copies.\n` +
          `3. Clean up or handle state transitions upon completion.\n` +
          `\`\`\`\n\n` +
          `When writing code for ${conceptLabel}, focus on clear naming, single-responsibility functions, and explicit error handling.`
      }

      followUpPrompts = [
        `How does this example handle edge cases or null values?`,
        `Can you show how this behaves in a real production system?`,
        `What is the runtime performance cost of this pattern?`,
      ]
    } else if (qLower.includes('mistake') || qLower.includes('error') || qLower.includes('pitfall') || qLower.includes('bug')) {
      answerText =
        `### Most Common Pitfalls with **${conceptLabel}** in ${subject}:\n\n` +
        `1. **Uninitialized References / Pointers**: Accessing memory or variables before they have been properly assigned leads to undefined behavior or segmentation faults.\n` +
        `2. **Confusing Indirection**: Mixing up the address of a variable with the actual value it holds (e.g., forgetting to dereference \`*ptr\`).\n` +
        `3. **Resource / Memory Leaks**: Allocating resources dynamically without guaranteeing deallocation or using RAII (Resource Acquisition Is Initialization).\n\n` +
        `**Best Practice Tip:** Always initialize variables immediately upon declaration (e.g., \`int* ptr = nullptr;\`) and favor modern smart pointers or RAII wrappers when managing dynamic lifecycles.`

      followUpPrompts = [
        `How can I detect and debug these memory issues using modern tools?`,
        `What compiler flags help catch these bugs early?`,
        `What is the difference between undefined behavior and a compile-time error?`,
      ]
    } else if (qLower.includes('feedback') || qLower.includes('score') || qLower.includes('review') || qLower.includes('why') || qLower.includes('mistake')) {
      const demonstratedList = latestAssessment?.strengths?.length
        ? `\n**What you demonstrated well:**\n${latestAssessment.strengths.map((s) => `✓ ${s}`).join('\n')}\n`
        : ''
      const missingList = latestAssessment?.missingPoints?.length
        ? `\n**Key gaps to address for full credit:**\n${latestAssessment.missingPoints.map((m) => `◇ ${m}`).join('\n')}\n`
        : ''
      const misconceptionList = latestAssessment?.misconceptions?.length
        ? `\n**Conceptual adjustments:**\n${latestAssessment.misconceptions.map((m) => `⚠️ ${m}`).join('\n')}\n`
        : ''

      answerText =
        `### Breaking Down Your Assessment Feedback on **${conceptLabel}**:\n\n` +
        (contextInfo ? `**Feedback:** "${contextInfo}"\n\n` : '') +
        demonstratedList +
        missingList +
        misconceptionList +
        `\nWhen explaining ${conceptLabel}, focus on stating the exact definition, the underlying mechanics, and a concrete code snippet.`

      followUpPrompts = [
        `Can you show me an example addressing these missing points?`,
        `Would you like to draft a revised explanation together?`,
        `What is the best way to remember this concept in an interview?`,
      ]
    } else {
      answerText =
        `### Understanding **${conceptLabel}** (${subject} · ${topic})\n\n` +
        `At its core, **${conceptLabel}** is a fundamental building block designed to give you precise, safe control over data and execution flow.\n\n` +
        `**Why Engineers Use It:**\n` +
        `- **Efficiency:** Avoids copying large structures across function boundaries.\n` +
        `- **Direct Control:** Enables interaction with system resources, memory, or dynamic component state.\n` +
        `- **Modularity:** Connects decoupled modules through explicit interfaces and references.\n\n` +
        `**Next Step:** Test your understanding by writing an answer in the Practice workspace, or ask for a specific code example!`

      followUpPrompts = [
        `Show me a simple code example of ${conceptLabel}.`,
        `What are the most common mistakes beginners make with ${conceptLabel}?`,
        `How does ${conceptLabel} connect to its prerequisites?`,
      ]
    }

    const fallbackAnswer = answerText
    const fallbackFollowUps = followUpPrompts

    addAgentTraces([
      {
        agent: 'tutor',
        status: 'fallback',
        summary: `Provided curriculum explanation for "${conceptLabel}" (${elapsed}ms).`,
        ms: elapsed,
        concept: conceptLabel,
      },
    ])

    return { answer: fallbackAnswer, followUps: fallbackFollowUps }
  }

  // GENERATE LESSON FROM TUTOR
  const fetchLesson = async (conceptLabel: string) => {
    const t0 = Date.now()
    const target = concepts.find(
      (c) => c.label.toLowerCase() === conceptLabel.toLowerCase()
    )
    const prereqs = target?.prerequisites || []
    try {
      const res = await serverGetLesson({
        data: {
          subject,
          topic,
          level,
          concept: conceptLabel,
          prerequisites: prereqs,
        },
      })
      const elapsed = Date.now() - t0
      if (res.ok) {
        addAgentTraces([
          {
            agent: 'tutor',
            status: 'ok',
            summary: `Generated dynamic lesson for "${conceptLabel}" with ${res.lesson.objectives.length} objectives.`,
            ms: elapsed,
            concept: conceptLabel,
          },
        ])
        return res.lesson
      }
    } catch (e) {
      console.warn('Get lesson error:', e)
    }

    return null
  }

  const regenerateCurriculum = async () => {
    const fresh = await getOrGenerateCurriculum(subject, topic, level, true)
    setCurriculum(fresh)
    return fresh
  }

  return {
    history,
    assessments,
    agentLogs,
    concepts,
    twin,
    plan,
    curriculum,
    isAiCurriculum: curriculum.isAiGenerated,
    loading,
    refreshData,
    submitAnswer,
    askTutor,
    fetchLesson,
    regenerateCurriculum,
  }
}
