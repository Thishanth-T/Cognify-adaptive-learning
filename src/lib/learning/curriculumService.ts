// @ts-nocheck
import { generateJson, AIUnavailableError } from '@/lib/ai/gateway.server'

export type ConceptDefinition = {
  id: string
  label: string
  description: string
  prerequisites: string[]
  question: string
  rubricHints: string[]
  suggestedActivity: string
}

export type GeneratedCurriculum = {
  subject: string
  topic: string
  level: string
  description: string
  objectives: string[]
  prerequisites: string[]
  concepts: ConceptDefinition[]
  suggestedLearningOrder: string[]
  isAiGenerated: boolean
  timestamp: number
}

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
}

function getStorageKey(subject: string, topic: string): string {
  return `cognify:curriculum:v1:${normalizeKey(subject)}:${normalizeKey(topic)}`
}

/** Educational heuristic DAG generator when AI provider is not connected or returns an error. */
export function buildHeuristicCurriculum(
  subject: string,
  topic: string,
  level: string
): GeneratedCurriculum {
  const cleanSubject = subject.trim() || 'General'
  const cleanTopic = topic.trim() || 'Core Studies'
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const topicSlug = norm(cleanTopic)

  const fId = `${topicSlug}-foundations`
  const mId = `${topicSlug}-mechanisms`
  const pId = `${topicSlug}-patterns`
  const impId = `${topicSlug}-implementation`
  const pitId = `${topicSlug}-pitfalls`
  const advId = `${topicSlug}-synthesis`

  return {
    subject: cleanSubject,
    topic: cleanTopic,
    level,
    description: `A structured learning journey through ${cleanTopic} in ${cleanSubject}, pitched at the ${level} tier.`,
    objectives: [
      `Master fundamental mental models and definitions of ${cleanTopic}`,
      `Understand operational mechanics, data flow, and syntax conventions`,
      `Apply core patterns to solve real-world problems`,
      `Diagnose misconceptions, trade-offs, and edge cases in ${cleanTopic}`,
    ],
    prerequisites: [
      `Basic familiarity with ${cleanSubject} syntax and conventions`,
      `Foundational problem-solving concepts`,
    ],
    concepts: [
      {
        id: fId,
        label: `${cleanTopic}: Core Foundations`,
        description: `Fundamental mental model, core purpose, and terminology of ${cleanTopic} in ${cleanSubject}.`,
        prerequisites: [],
        question: `Explain what ${cleanTopic} is, why it is used in ${cleanSubject}, and give a clear introductory example.`,
        rubricHints: [
          `Clear definition of ${cleanTopic}`,
          `Practical purpose or problem it solves`,
          `Concrete illustrative example`,
        ],
        suggestedActivity: `Write a minimal code snippet or step-by-step example demonstrating the simplest use case of ${cleanTopic}.`,
      },
      {
        id: mId,
        label: `${cleanTopic}: Mechanisms & Execution`,
        description: `How ${cleanTopic} actually behaves under the hood during execution and lifecycle events.`,
        prerequisites: [fId],
        question: `Describe the internal mechanism or runtime flow of ${cleanTopic}. What happens step by step when it is invoked?`,
        rubricHints: [
          `Step-by-step lifecycle or runtime execution`,
          `State transitions or memory effects`,
          `Input and output relationships`,
        ],
        suggestedActivity: `Trace the execution of ${cleanTopic} on a whiteboard or debugger, noting state before and after.`,
      },
      {
        id: pId,
        label: `${cleanTopic}: Essential Idioms & Syntax`,
        description: `Standard conventions, idiomatic usage, and standard patterns expected in production code.`,
        prerequisites: [fId],
        question: `What are the standard syntax rules and best-practice idioms when working with ${cleanTopic}? What should developers do vs avoid?`,
        rubricHints: [
          `Idiomatic syntax structures`,
          `Best practices for clean and maintainable code`,
          `Common parameters or configurations`,
        ],
        suggestedActivity: `Refactor an imperative or naive implementation into idiomatic ${cleanTopic} patterns.`,
      },
      {
        id: impId,
        label: `${cleanTopic}: Practical Problem Solving`,
        description: `Applying ${cleanTopic} to resolve practical engineering scenarios and modular tasks.`,
        prerequisites: [mId, pId],
        question: `Given a realistic problem requiring ${cleanTopic}, explain how you would design and structure the solution.`,
        rubricHints: [
          `Modular architecture or function breakdown`,
          `Handling realistic inputs and edge cases`,
          `Justification of design choices`,
        ],
        suggestedActivity: `Build a small working utility or component utilizing ${cleanTopic} end-to-end.`,
      },
      {
        id: pitId,
        label: `${cleanTopic}: Pitfalls & Diagnostics`,
        description: `Frequent anti-patterns, edge cases, silent bugs, and diagnosis strategies.`,
        prerequisites: [impId],
        question: `What are the most dangerous misconceptions or common pitfalls with ${cleanTopic}, and how do you diagnose or prevent them?`,
        rubricHints: [
          `Identification of common mistakes or anti-patterns`,
          `Impact of subtle errors (memory, performance, unexpected states)`,
          `Defensive strategies or debugging tools`,
        ],
        suggestedActivity: `Review a buggy code snippet containing a subtle ${cleanTopic} anti-pattern and correct it.`,
      },
      {
        id: advId,
        label: `${cleanTopic}: Advanced Optimization & Trade-offs`,
        description: `Performance characteristics, architectural scalability, and advanced synthesis.`,
        prerequisites: [pitId],
        question: `Evaluate the trade-offs of ${cleanTopic} at scale. When should you use an alternative approach, and how do you optimize performance?`,
        rubricHints: [
          `Computational or architectural trade-offs`,
          `Performance implications and optimization levers`,
          `Appropriate boundary conditions for alternatives`,
        ],
        suggestedActivity: `Benchmark or profile a system using ${cleanTopic} under heavy load or edge conditions.`,
      },
    ],
    suggestedLearningOrder: [fId, mId, pId, impId, pitId, advId],
    isAiGenerated: false,
    timestamp: Date.now(),
  }
}

const CURRICULUM_SYSTEM_PROMPT = `You are the Learning Planner Agent inside Cognify, an adaptive AI learning platform.
Given a subject, topic, and learner level, generate a pedagogical concept DAG (Directed Acyclic Graph).
RULES:
1. Generate between 5 and 7 distinct, cohesive concepts.
2. Each concept MUST have a slug id (lowercase letters and hyphens only), a human-readable label, a 1-2 sentence description, and an array of prerequisite concept IDs (must reference earlier concept IDs in the list).
3. The first concept MUST have empty prerequisites.
4. Each concept MUST have a targeted diagnostic challenge question, 2-4 key rubric hints for assessment, and a practical suggested activity.
5. All concepts must be directly relevant to the requested subject, topic, and level.
6. Return valid JSON only adhering strictly to the schema.`

const curriculumJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "objectives", "prerequisites", "concepts", "suggestedLearningOrder"],
  properties: {
    description: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    prerequisites: { type: "array", items: { type: "string" } },
    concepts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "description", "prerequisites", "question", "rubricHints", "suggestedActivity"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          prerequisites: { type: "array", items: { type: "string" } },
          question: { type: "string" },
          rubricHints: { type: "array", items: { type: "string" } },
          suggestedActivity: { type: "string" },
        },
      },
    },
    suggestedLearningOrder: { type: "array", items: { type: "string" } },
  },
} as const

/** Generates or loads the curriculum for any subject, topic, and level. */
export async function getOrGenerateCurriculum(
  subject: string,
  topic: string,
  level: string = 'Beginner',
  forceRegenerate: boolean = false
): Promise<GeneratedCurriculum> {
  const cleanSubject = subject.trim() || 'General'
  const cleanTopic = topic.trim() || 'Core Studies'
  const storageKey = getStorageKey(cleanSubject, cleanTopic)

  // 1. Check local cache unless forceRegenerate is true
  if (!forceRegenerate && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        const parsed = JSON.parse(cached) as GeneratedCurriculum
        if (parsed && Array.isArray(parsed.concepts) && parsed.concepts.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Could not read cached curriculum:', e)
    }
  }

  // 2. Attempt AI generation
  try {
    const userPrompt = `SUBJECT: ${cleanSubject}
TOPIC: ${cleanTopic}
LEARNER LEVEL: ${level}

Generate a comprehensive adaptive learning curriculum DAG for this topic. Include prerequisites, diagnostic questions, and criteria.`

    const raw = await generateJson({
      system: CURRICULUM_SYSTEM_PROMPT,
      user: userPrompt,
      schemaName: "curriculum",
      schema: curriculumJsonSchema,
    })

    const parsed = raw as any
    if (parsed && Array.isArray(parsed.concepts) && parsed.concepts.length >= 3) {
      // Clean and sanitize IDs to prevent loops
      const validIds = new Set(parsed.concepts.map((c: any) => c.id))
      const cleanedConcepts: ConceptDefinition[] = parsed.concepts.map((c: any) => ({
        id: c.id,
        label: c.label || c.id,
        description: c.description || '',
        prerequisites: (c.prerequisites || []).filter((p: string) => validIds.has(p) && p !== c.id),
        question: c.question || `Explain the core concepts of ${c.label} in ${cleanTopic}.`,
        rubricHints: c.rubricHints || [],
        suggestedActivity: c.suggestedActivity || `Apply ${c.label} in a small example.`,
      }))

      const curriculum: GeneratedCurriculum = {
        subject: cleanSubject,
        topic: cleanTopic,
        level,
        description: parsed.description || `Learning path for ${cleanTopic}`,
        objectives: parsed.objectives || [],
        prerequisites: parsed.prerequisites || [],
        concepts: cleanedConcepts,
        suggestedLearningOrder: parsed.suggestedLearningOrder || cleanedConcepts.map((c) => c.id),
        isAiGenerated: true,
        timestamp: Date.now(),
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(curriculum))
        } catch {
          // localStorage full or unavailable
        }
      }

      return curriculum
    }
  } catch (aiErr) {
    console.warn('AI curriculum generation offline or unavailable, falling back to structured topic heuristic:', aiErr instanceof Error ? aiErr.message : aiErr)
  }

  // 3. Fallback to heuristic topic DAG
  const heuristic = buildHeuristicCurriculum(cleanSubject, cleanTopic, level)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey, JSON.stringify(heuristic))
    } catch {
      // Ignore
    }
  }
  return heuristic
}
