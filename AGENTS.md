# Cognify — Architecture Guidelines

- Cognify UI lives in `src/components/cognify` and renders client-only on `/` because progress and learning state are synchronized with browser storage and Supabase.
- Answer assessment runs in the `/api/assessment` server route using the five-agent cooperative pipeline (`src/lib/agents/pipeline.server.ts` and `src/lib/ai/evaluator.server.ts`) with Gemini 3.8 Flash live semantic evaluation and rubric fallback.
- Learning Twin mastery and adaptive planner logic are purely modeled in `src/lib/learning/twin.ts` and shared across client and server.
