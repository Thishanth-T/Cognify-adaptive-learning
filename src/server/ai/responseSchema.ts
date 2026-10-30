
import { z } from 'zod'

export const aiAssessmentSchema = z.object({
  score: z.number().int().min(0).max(100),

  status: z.enum(['assessed', 'needs_review']),

  correct: z.boolean().nullable(),

  feedback: z.string().min(1).max(1000),

  strengths: z.array(z.string().min(1)).max(10),

  missingPoints: z.array(z.string().min(1)).max(10),

  misconceptions: z.array(z.string().min(1)).max(10),

  recommendedNextStep: z.string().min(1).max(500),
})

export type ValidatedAIAssessment = z.infer<
  typeof aiAssessmentSchema
>

export function validateAIAssessment(
  data: unknown,
): ValidatedAIAssessment {
  return aiAssessmentSchema.parse(data)
}
