import { z } from "zod";

/** Validates every model response before it reaches the student. */
export const aiAssessmentSchema = z
  .object({
    score: z.number().int().min(0).max(100).nullable(),
    status: z.enum(["assessed", "needs_review"]),
    correct: z.boolean().nullable(),
    feedback: z.string().min(1).max(1500),
    strengths: z.array(z.string().min(1).max(400)).max(10),
    missingPoints: z.array(z.string().min(1).max(400)).max(10),
    misconceptions: z.array(z.string().min(1).max(400)).max(10),
    misconceptionTags: z.array(z.string().min(1).max(60)).max(6).default([]),
    recommendedNextStep: z.string().min(1).max(600),
  })
  .refine((v) => (v.status === "needs_review" ? v.score === null && v.correct === null : v.score !== null), {
    message: "needs_review requires null score/correct; assessed requires a score",
  });

export type ValidatedAIAssessment = z.infer<typeof aiAssessmentSchema>;

export function validateAIAssessment(data: unknown): ValidatedAIAssessment {
  return aiAssessmentSchema.parse(data);
}

/** JSON schema mirror sent to the model for strict structured output. */
export const assessmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "status", "correct", "feedback", "strengths", "missingPoints", "misconceptions", "misconceptionTags", "recommendedNextStep"],
  properties: {
    score: { type: ["integer", "null"] },
    status: { type: "string", enum: ["assessed", "needs_review"] },
    correct: { type: ["boolean", "null"] },
    feedback: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    missingPoints: { type: "array", items: { type: "string" } },
    misconceptions: { type: "array", items: { type: "string" } },
    misconceptionTags: { type: "array", items: { type: "string" } },
    recommendedNextStep: { type: "string" },
  },
} as const;
