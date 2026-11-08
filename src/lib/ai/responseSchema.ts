import { z } from "zod";

export const criterionEvaluationSchema = z.object({
  id: z.string().max(80),
  description: z.string().max(400),
  status: z.enum(["demonstrated", "partially_demonstrated", "missing", "incorrect"]),
  pointsEarned: z.number().int().min(0).max(100),
  maxPoints: z.number().int().min(1).max(100),
  evidence: z.string().max(400).optional().default(""),
});

export type ValidatedCriterionEvaluation = z.infer<typeof criterionEvaluationSchema>;

/** Validates every model response before it reaches the student. */
export const aiAssessmentSchema = z
  .object({
    score: z.number().int().min(0).max(100).nullable(),
    status: z.preprocess((val) => (val === "evaluated" ? "assessed" : val), z.enum(["assessed", "needs_review"])),
    correct: z.boolean().nullable(),
    feedback: z.string().min(1).max(1500).default("Evaluation completed."),
    strengths: z.array(z.string().min(1).max(400)).max(10).default([]),
    missingPoints: z.array(z.string().min(1).max(400)).max(10).default([]),
    misconceptions: z.array(z.string().min(1).max(400)).max(10).default([]),
    misconceptionTags: z.array(z.string().min(1).max(60)).max(6).default([]),
    recommendedNextStep: z.string().min(1).max(600).default("Review the topic criteria and continue practicing."),
    criteria: z.array(criterionEvaluationSchema).default([]),
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
  required: [
    "score",
    "status",
    "correct",
    "feedback",
    "strengths",
    "missingPoints",
    "misconceptions",
    "misconceptionTags",
    "recommendedNextStep",
    "criteria",
  ],
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
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "description", "status", "pointsEarned", "maxPoints", "evidence"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["demonstrated", "partially_demonstrated", "missing", "incorrect"] },
          pointsEarned: { type: "integer" },
          maxPoints: { type: "integer" },
          evidence: { type: "string" },
        },
      },
    },
  },
} as const;
