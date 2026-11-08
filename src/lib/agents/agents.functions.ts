import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { HistoryEntry } from "@/lib/learning/twin";

const pathFields = {
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(120),
  level: z.string().trim().min(1).max(40),
};

const historyEntry = z.object({
  concept: z.string().max(200),
  score: z.number().int().min(0).max(100).nullable().optional(),
  correct: z.boolean().nullable(),
  status: z.enum(["correct", "incorrect", "uncertain", "unassessed"]).optional(),
  misconceptionTags: z.array(z.string().max(60)).max(6).optional(),
  timestamp: z.number(),
});

const assessFields = {
  ...pathFields,
  conceptId: z.string().min(1).max(80),
  question: z.string().trim().min(1).max(1000),
  answer: z.string().trim().min(1, "Write an answer first.").max(5000, "Answers are limited to 5000 characters."),
};

/** Guest mode: stateless pipeline; history is supplied by the browser. */
export const assessGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ...assessFields, history: z.array(historyEntry).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { runPipeline, rateLimit } = await import("./pipeline.server");
    rateLimit("assess", 12);
    return runPipeline(data as typeof data & { history: HistoryEntry[] });
  });

/** Signed-in mode: history is loaded from the database and the result is saved under the user's account. */
export const assessSignedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object(assessFields).parse(d))
  .handler(async ({ data, context }) => {
    const { runPipeline, rateLimit } = await import("./pipeline.server");
    rateLimit("assess:" + context.userId, 20);
    const { data: rows, error } = await context.supabase
      .from("assessments")
      .select("concept, score, correct, status, misconceptions, created_at")
      .eq("subject", data.subject)
      .eq("topic", data.topic)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("Could not load your assessment history.");
    const history: HistoryEntry[] = (rows ?? []).map((r) => ({
      concept: r.concept,
      score: r.score,
      correct: r.correct,
      misconceptionTags: Array.isArray(r.misconceptions) ? (r.misconceptions as string[]) : [],
      timestamp: new Date(r.created_at).getTime(),
    }));
    const result = await runPipeline({ ...data, history });
    const a = result.assessment;
    const { data: insertedRow, error: insertError } = await context.supabase
      .from("assessments")
      .insert({
        user_id: context.userId,
        subject: data.subject,
        topic: data.topic,
        concept: result.entry.concept,
        question: data.question,
        answer: data.answer,
        score: a.score,
        status: a.status,
        correct: a.correct,
        feedback: a.feedback,
        strengths: a.strengths,
        missing_points: a.missingPoints,
        misconceptions: result.misconceptionReport.detected,
        recommended_next_step: a.recommendedNextStep,
        evaluation_method: a.evaluationMethod,
      })
      .select("id")
      .maybeSingle();

      if (insertError || !insertedRow?.id) {
        throw new Error(
          "Your answer was assessed but could not be saved. Please try again."
        );
      }
      return {
        ...result,
        dbId: insertedRow.id,
        savedToDatabase: true,
      };
  });

export const getLesson = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      ...pathFields,
      concept: z.string().min(1).max(200),
      prerequisites: z.array(z.string().max(200)).max(10),
      weakPoints: z.array(z.string().max(400)).max(5).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateLesson, rateLimit, aiErrorMessage } = await import("./pipeline.server");
    try {
      rateLimit("lesson", 15);
      return { ok: true as const, lesson: await generateLesson(data) };
    } catch (e) {
      return { ok: false as const, error: aiErrorMessage(e) };
    }
  });

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      ...pathFields,
      concept: z.string().min(1).max(200),
      question: z.string().trim().min(1).max(1000),
      context: z.string().max(1500).optional(),
      // Structured assessment evidence from the pipeline — avoids re-evaluating the answer.
      // The tutor uses this to tailor explanations to what the student actually demonstrated vs. missed.
      assessmentEvidence: z.object({
        demonstratedCriteria: z.array(z.string().max(400)).max(10),
        missingCriteria: z.array(z.string().max(400)).max(10),
        incorrectStatements: z.array(z.string().max(400)).max(10),
      }).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tutorAnswer, rateLimit, aiErrorMessage } = await import("./pipeline.server");
    try {
      rateLimit("tutor", 20);
      return { ok: true as const, ...(await tutorAnswer(data)) };
    } catch (e) {
      return { ok: false as const, error: aiErrorMessage(e) };
    }
  });
