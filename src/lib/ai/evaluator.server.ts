// @ts-nocheck -- imported from original Cognify project (looser TS settings)

import { getAssessmentRubric } from './assessmentRubrics.server'
import { generateJson, AIUnavailableError } from './gateway.server'
import { ASSESSMENT_SYSTEM, buildAssessmentPrompt } from './assessmentPrompt.server'
import { validateAIAssessment, assessmentJsonSchema } from './responseSchema'

export type AssessmentInput = {
  concept: string
  question: string
  answer: string
  subject?: string | undefined
  topic?: string | undefined
  level?: string | undefined
  knownMisconceptionTags?: string[] | undefined
}

export type CriterionEvaluation = {
  id: string
  description: string
  status: 'demonstrated' | 'partially_demonstrated' | 'missing' | 'incorrect'
  pointsEarned: number
  maxPoints: number
  evidence?: string
}

export type AssessmentResult = {
  score: number | null
  status: 'assessed' | 'needs_review'
  correct: boolean | null
  feedback: string
  strengths: string[]
  missingPoints: string[]
  misconceptions: string[]
  recommendedNextStep: string
  misconceptionTags?: string[]
  evaluationMethod: 'ai_model' | 'rubric_phrase_match' | 'manual_review'
  aiUnavailableReason?: string
  criteria?: CriterionEvaluation[]
}

function normalize(text?: string | null): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Stem a word using simple suffix removal.
 * Good enough for conceptual matching: "pointers" → "pointer", "stores" → "store".
 */
function stem(word: string): string {
  if (word.length <= 4) return word
  if (word.endsWith('ing')) return word.slice(0, -3)
  if (word.endsWith('tion')) return word.slice(0, -4)
  if (word.endsWith('ness')) return word.slice(0, -4)
  if (word.endsWith('ment')) return word.slice(0, -4)
  if (word.endsWith('ers') && word.length > 5) return word.slice(0, -2)  // pointers → pointer
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2)
  if (word.endsWith('s') && word.length > 4) return word.slice(0, -1)
  return word
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'of', 'to', 'and', 'or', 'with',
  'by', 'at', 'on', 'as', 'that', 'this', 'be', 'are', 'was', 'were',
  'its', 'for', 'from', 'has', 'have', 'can', 'which', 'what', 'where',
  'how', 'who', 'will', 'do', 'does', 'did',
])

/** Tokenize and stem a phrase into an array of meaningful content tokens. */
function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .map(stem)
}

/**
 * Check whether an acceptedIdea phrase is semantically matched in the answer.
 *
 * Three-pass strategy (cascading, fastest-first):
 *   1. Exact normalized substring match (e.g. "memory address" in answer verbatim).
 *   2. All key content tokens of the idea appear anywhere in the answer (order-independent).
 *      e.g. "address of a variable" → tokens [address, variabl] → both present in answer.
 *   3. All stemmed tokens of the idea appear in the stemmed answer tokens.
 *
 * This ensures that semantically equivalent phrasings, paraphrases, and word-order
 * variants are recognized without requiring exact phrase matching.
 */
function ideaMatchesAnswer(
  idea: string,
  answerNorm: string,
  answerTokens: string[],
  answerStemmed: string[],
): boolean {
  // 1. Exact normalized substring
  const normIdea = normalize(idea)
  if (normIdea && answerNorm.includes(normIdea)) return true

  const ideaTokens = tokenize(idea)
  if (ideaTokens.length === 0) return false

  // 2. All key tokens present in the answer tokens (stemmed)
  if (ideaTokens.every(t => answerTokens.includes(t))) return true

  // 3. Fully stemmed comparison
  const ideaStemmed = ideaTokens.map(stem)
  if (ideaStemmed.every(t => answerStemmed.includes(t))) return true

  return false
}

/**
 * Evaluate a single rubric criterion against the answer.
 * Returns true if ANY of the acceptedIdeas matches via ideaMatchesAnswer.
 */
function matchCriterion(
  criterion: { id: string; description: string; acceptedIdeas: string[]; points: number },
  answerNorm: string,
  answerTokens: string[],
  answerStemmed: string[],
): boolean {
  return criterion.acceptedIdeas.some(idea =>
    ideaMatchesAnswer(idea, answerNorm, answerTokens, answerStemmed)
  )
}

export function evaluateWithRubric(input: AssessmentInput): AssessmentResult {
  const answer = normalize(input.answer)

  if (!answer) {
    return {
      score: null,
      status: 'needs_review',
      correct: null,
      feedback: 'Your answer is empty. Write an explanation to receive evaluation.',
      strengths: [],
      missingPoints: ['A substantive response to the question'],
      misconceptions: [],
      recommendedNextStep: 'Try explaining the concept in your own words.',
      evaluationMethod: 'manual_review',
    }
  }

  // Check if answer is an explicit expression of uncertainty
  const uncertainMarkers = [
    'dont know',
    'don t know',
    'do not know',
    'not sure',
    'im not sure',
    'i m not sure',
    'i am not sure',
    'no idea',
    'help me',
    'unsure',
    'cant remember',
    'can t remember',
    'cannot remember',
  ]
  const isUncertain = uncertainMarkers.some((marker) => answer.includes(marker)) && answer.split(' ').length < 15
  if (isUncertain) {
    return {
      score: null,
      status: 'needs_review',
      correct: null,
      feedback: `Recognizing when you're unsure about ${input.concept} is a valuable step in learning. No score penalty is applied; foundational guidance is activated.`,
      strengths: ['Identified needing guidance rather than guessing'],
      missingPoints: [`Core definition and purpose of ${input.concept}`, `Execution mechanism or syntax of ${input.concept}`],
      misconceptions: [],
      recommendedNextStep: `Review the foundational explanation of ${input.concept} with the AI Tutor before attempting another answer.`,
      evaluationMethod: 'manual_review',
      aiUnavailableReason: 'Foundational guidance mode activated.',
    }
  }

  const rubric = getAssessmentRubric(input.concept, input.subject, input.topic)

  // Pre-compute answer representations once for all criteria
  const answerTokens = tokenize(answer)
  const answerStemmed = answerTokens.map(stem)
  const wordCount = answer.split(' ').filter(Boolean).length

  // Minimum substance: at least 4 meaningful words required to earn any points.
  // This excludes empty/single-word non-answers while allowing concise but complete definitions.
  const hasSubstance = wordCount >= 4

  const strengths: string[] = []
  const missingPoints: string[] = []
  const criteriaEvaluations: CriterionEvaluation[] = []
  let earnedScore = 0

  const detectedMisconceptions = rubric.commonMisconceptions
    .filter((misconception) => {
      // Guard against false positives when the student explicitly refutes the misconception
      // e.g. "stores memory address instead of direct value" vs "stores value instead of address"
      if (
        misconception.description.toLowerCase().includes('value') &&
        (/address.*(instead of|rather than|not).*(value|direct)/.test(answer) ||
          /(instead of|rather than|not).*(direct|actual)?\s*value.*address/.test(answer))
      ) {
        return false
      }

      return misconception.indicators.some((indicator) =>
        ideaMatchesAnswer(indicator, answer, answerTokens, answerStemmed),
      )
    })
    .map((misconception) => misconception.description)

  for (const criterion of rubric.criteria) {
    // Check if the student's answer actively asserted a misconception on this criterion
    const isContradicted = detectedMisconceptions.some(
      (m) =>
        (criterion.description.toLowerCase().includes('stores') &&
          m.toLowerCase().includes('value') &&
          (answer.includes('stores the actual value') || answer.includes('stores the value instead')))
    )

    if (isContradicted) {
      criteriaEvaluations.push({
        id: criterion.id,
        description: criterion.description,
        status: 'incorrect',
        pointsEarned: 0,
        maxPoints: criterion.points,
      })
      continue
    }

    // Each criterion is evaluated independently using semantic token matching.
    // A correct definition earns its criterion's points even if no example is given.
    // A missing example only loses the example criterion's points — not the definition's.
    const matched = hasSubstance && matchCriterion(criterion, answer, answerTokens, answerStemmed)

    if (matched) {
      earnedScore += criterion.points
      strengths.push(criterion.description)
      criteriaEvaluations.push({
        id: criterion.id,
        description: criterion.description,
        status: 'demonstrated',
        pointsEarned: criterion.points,
        maxPoints: criterion.points,
      })
    } else {
      missingPoints.push(criterion.description)
      criteriaEvaluations.push({
        id: criterion.id,
        description: criterion.description,
        status: 'missing',
        pointsEarned: 0,
        maxPoints: criterion.points,
      })
    }
  }

  // Penalize for detected misconceptions (evidence of incorrect statements only)
  let score = earnedScore
  if (detectedMisconceptions.length > 0) {
    score = Math.max(0, score - 20 * detectedMisconceptions.length)
  }

  score = Math.min(100, Math.max(0, score))

  const correct = score >= 70 && detectedMisconceptions.length === 0

  let feedback = ''
  if (detectedMisconceptions.length > 0) {
    feedback = `Your answer touches on ${input.concept}, but contains a potential misconception: "${detectedMisconceptions[0]}". Review the distinction and try clarifying your explanation.`
  } else if (score >= 80) {
    feedback = `Excellent explanation of ${input.concept}. You accurately addressed the core purpose, mechanics, and provided clear illustrative detail.`
  } else if (score >= 60) {
    feedback = `Good conceptual progress on ${input.concept}. You demonstrated key ideas, but would benefit from further elaborating on: ${missingPoints.slice(0, 2).join('; ')}.`
  } else if (score > 0) {
    feedback = `You touched on some ideas regarding ${input.concept}, but your response is incomplete. To improve, ensure you define the primary purpose and provide a concrete example.`
  } else {
    feedback = `Your answer does not yet address the core criteria for ${input.concept}. Be sure to clearly define what it is, how it operates, and include a concrete example.`
  }

  return {
    score,
    status: 'assessed',
    correct,
    feedback,
    strengths,
    missingPoints,
    misconceptions: detectedMisconceptions,
    misconceptionTags: detectedMisconceptions.map((d) => d.toLowerCase().slice(0, 60)),
    recommendedNextStep:
      missingPoints.length > 0
        ? `Review: ${missingPoints[0]}`
        : `Practice applying ${input.concept} in more advanced coding scenarios.`,
    evaluationMethod: 'rubric_phrase_match',
    criteria: criteriaEvaluations,
  }
}

export async function evaluateAnswer(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  if (!normalize(input.answer)) return evaluateWithRubric(input)

  // AI grading is the primary path for any subject/topic; set COGNIFY_AI_PROVIDER=rubric to force the fallback.
  if (process.env['COGNIFY_AI_PROVIDER'] !== 'rubric') {
    try {
      const rubric = getAssessmentRubric(input.concept, input.subject, input.topic)
      const raw = await generateJson({
        system: ASSESSMENT_SYSTEM,
        user: buildAssessmentPrompt({
          subject: input.subject ?? 'General',
          topic: input.topic ?? input.concept,
          level: input.level ?? 'Beginner',
          concept: input.concept,
          question: input.question,
          answer: input.answer,
          rubricHints: rubric?.criteria.map((c) => c.description),
          criteriaList: rubric?.criteria.map((c) => ({
            id: c.id,
            description: c.description,
            points: c.points,
          })),
          knownMisconceptionTags: input.knownMisconceptionTags,
        }),
        schemaName: 'assessment',
        schema: assessmentJsonSchema,
      })
      const result = validateAIAssessment(raw)
      return { ...result, evaluationMethod: 'ai_model' }
    } catch (error) {
      console.warn('AI assessment unavailable, evaluating via curriculum criteria rubric:', error instanceof Error ? error.message : error)
      const fallback = evaluateWithRubric(input)
      return {
        ...fallback,
        aiUnavailableReason: error instanceof AIUnavailableError ? error.message : 'Evaluated via curriculum criteria matching.',
      }
    }
  }

  const fallback = evaluateWithRubric(input)
  return { ...fallback, aiUnavailableReason: 'Evaluated via curriculum criteria matching.' }
}
