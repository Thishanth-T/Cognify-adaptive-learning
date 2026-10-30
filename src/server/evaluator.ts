
import { getAssessmentRubric } from './assessmentRubrics'
import { getAIProvider, getRegisteredProviders } from './ai/provider'

export type AssessmentInput = {
  concept: string
  question: string
  answer: string
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
  evaluationMethod: 'ai_model' | 'rubric_phrase_match' | 'manual_review'
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function evaluateWithRubric(input: AssessmentInput): AssessmentResult {
  const answer = normalize(input.answer)

  if (!answer) {
    return {
      score: null,
      status: 'needs_review',
      correct: null,
      feedback: 'Your answer is empty. Write an explanation first.',
      strengths: [],
      missingPoints: ['A response to the question'],
      misconceptions: [],
      recommendedNextStep: 'Try explaining the concept in your own words.',
      evaluationMethod: 'manual_review',
    }
  }

  const rubric = getAssessmentRubric(input.concept)

  if (!rubric) {
    return {
      score: null,
      status: 'needs_review',
      correct: null,
      feedback: `Cognify does not have an assessment rubric for ${input.concept} yet.`,
      strengths: [],
      missingPoints: [],
      misconceptions: [],
      recommendedNextStep:
        'This response needs a suitable concept-specific rubric or manual review.',
      evaluationMethod: 'manual_review',
    }
  }

  const strengths: string[] = []
  const missingPoints: string[] = []
  let score = 0

  for (const criterion of rubric.criteria) {
    const matched = criterion.acceptedIdeas.some((idea) =>
      answer.includes(normalize(idea)),
    )

    if (matched) {
      score += criterion.points
      strengths.push(criterion.description)
    } else {
      missingPoints.push(criterion.description)
    }
  }

  const detectedMisconceptions = rubric.commonMisconceptions
    .filter((misconception) =>
      misconception.indicators.some((indicator) =>
        answer.includes(normalize(indicator)),
      ),
    )
    .map((misconception) => misconception.description)

  score = Math.min(100, score)

  const correct = score >= 70 && detectedMisconceptions.length === 0

  let feedback = ''

  if (detectedMisconceptions.length > 0) {
    feedback =
      'Your answer contains a possible misconception. Review the feedback before relying on this score.'
  } else if (score >= 70) {
    feedback =
      'Your answer includes several of the key ideas in the assessment rubric.'
  } else {
    feedback =
      'Your answer is missing some important ideas from the assessment rubric.'
  }

  return {
    score,
    status: 'assessed',
    correct,
    feedback,
    strengths,
    missingPoints,
    misconceptions: detectedMisconceptions,
    recommendedNextStep:
      missingPoints.length > 0
        ? `Review: ${missingPoints[0]}`
        : 'Try applying this concept in a new example.',
    evaluationMethod: 'rubric_phrase_match',
  }
}

export async function evaluateAnswer(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  const answer = normalize(input.answer)

  if (!answer) {
    return evaluateWithRubric(input)
  }

  const selectedProvider = process.env.COGNIFY_AI_PROVIDER
  const availableProviders = getRegisteredProviders()

  if (selectedProvider && availableProviders.includes(selectedProvider)) {
    try {
      const provider = getAIProvider(selectedProvider)
      const result = await provider.evaluate(input)

      return {
        ...result,
        evaluationMethod: 'ai_model',
      }
    } catch (error) {
      console.error('AI assessment failed:', error)
      // Fall back to the existing rubric evaluator.
    }
  }

  return evaluateWithRubric(input)
}
