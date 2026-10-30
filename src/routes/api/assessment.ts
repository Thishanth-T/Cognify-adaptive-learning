import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { evaluateAnswer } from "@/server/evaluator";

const assessmentRequestSchema = z.object({
  concept: z.string().min(1, "Concept is required").max(200),
  question: z.string().min(1, "Question is required").max(2000),
  answer: z.string().min(1, "Answer is required").max(5000),
});

export const Route = createFileRoute("/api/assessment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const validation = assessmentRequestSchema.safeParse(body);
        if (!validation.success) {
          return Response.json(
            { success: false, message: "Invalid assessment request", errors: validation.error.flatten() },
            { status: 400 },
          );
        }
        try {
          const assessment = await evaluateAnswer(validation.data);
          return Response.json({ success: true, assessment });
        } catch (error) {
          console.error("Assessment error:", error);
          return Response.json(
            { success: false, message: "Unable to evaluate this answer right now." },
            { status: 500 },
          );
        }
      },
    },
  },
});
