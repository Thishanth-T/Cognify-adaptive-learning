import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

export const TEXT_MODEL = "openai/gpt-6-astra" as const;

export class AIUnavailableError extends Error {
  constructor(message: string, public readonly reason: "credits" | "rate_limit" | "config" | "other") {
    super(message);
  }
}

/** Calls the model with strict JSON-schema output and returns the parsed JSON (unvalidated). */
export async function generateJson(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<unknown> {
  try {
    const res = await generateResponse({
      model: TEXT_MODEL,
      instructions: opts.system,
      input: [{ role: "user", content: opts.user }],
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: opts.schemaName, schema: opts.schema, strict: true } },
    });
    const text = extractText(res);
    if (!text) throw new AIUnavailableError("The AI model returned an empty response.", "other");
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof AIUnavailableError) throw error;
    if (error instanceof GatewayError) {
      const name = error.constructor.name;
      if (name === "PaymentRequiredError") throw new AIUnavailableError("AI credits are exhausted for this workspace.", "credits");
      if (name === "RateLimitError") throw new AIUnavailableError("The AI service is busy. Please try again shortly.", "rate_limit");
      if (name === "ConfigurationError" || name === "AuthenticationError") throw new AIUnavailableError("The AI service is not configured.", "config");
      console.error("AI gateway error", error.code, error.message);
    } else {
      console.error("AI call failed", error);
    }
    throw new AIUnavailableError("The AI model could not respond.", "other");
  }
}

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text" && c.text)
    .map((c) => c.text)
    .join("");
}
