// Independent AI Gateway with direct provider support (Google Gemini & OpenAI)
import dns from "node:dns";
import { getRuntimeEnv } from "@/lib/env";
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  /* ignore */
}

export const TEXT_MODEL = "openai/gpt-4o-mini" as const;
export const GEMINI_MODEL = "gemini-3.8-flash" as const;

export class AIUnavailableError extends Error {
  constructor(message: string, public readonly reason: "credits" | "rate_limit" | "config" | "other") {
    super(message);
  }
}

/** Helper to retrieve an environment variable from runtime context, process.env, or fallback to .env file */
function getEnv(name: string): string | undefined {
  const runtimeVal = getRuntimeEnv(name) || getRuntimeEnv(`VITE_${name}`);
  if (runtimeVal) return runtimeVal;

  if (process.env[name]) return process.env[name];
  if (process.env[`VITE_${name}`]) return process.env[`VITE_${name}`];
  try {
    const fs = typeof require !== "undefined" ? require("fs") : null;
    const path = typeof require !== "undefined" ? require("path") : null;
    if (fs && path) {
      const candidates = [
        path.resolve(process.cwd(), ".env"),
        typeof __dirname !== "undefined" ? path.resolve(__dirname, "../../..", ".env") : null,
        "T:\\Cognify\\Cognify-adaptive-learning\\.env",
      ].filter(Boolean);

      for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf8");
          const match = content.match(new RegExp(`^${name}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, "m"));
          if (match && match[1]) {
            process.env[name] = match[1];
            return match[1];
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function callOpenAI(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<unknown> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `${opts.system}\n\nOutput MUST be valid JSON adhering to the ${opts.schemaName} schema.` },
        { role: "user", content: opts.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new AIUnavailableError(`OpenAI API error (${res.status}): ${errorText.slice(0, 150)}`, "other");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AIUnavailableError("OpenAI returned an empty response.", "other");
  return JSON.parse(content);
}

async function callGemini(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<unknown> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  const model = getEnv("GEMINI_MODEL") || GEMINI_MODEL;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${opts.system}\n\nYou must return valid JSON matching the ${opts.schemaName} schema.` }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new AIUnavailableError(`Gemini API error (${res.status}): ${errorText.slice(0, 150)}`, "other");
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const textPart = parts.find((p: any) => p.text && !p.thought) ?? parts[parts.length - 1];
  const text = textPart?.text;
  if (!text) throw new AIUnavailableError("Gemini returned an empty response.", "other");

  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }
  return JSON.parse(cleanText.trim());
}

/** Calls the configured provider with strict JSON output and returns the parsed JSON (unvalidated). */
export async function generateJson(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<unknown> {
  // 1. Try Google Gemini API if configured
  if (getEnv("GEMINI_API_KEY")) {
    try {
      const geminiResult = await callGemini(opts);
      if (geminiResult) return geminiResult;
    } catch (geminiErr) {
      if (geminiErr instanceof AIUnavailableError) throw geminiErr;
      console.warn("Gemini evaluation error:", geminiErr);
    }
  }

  // 2. Try direct OpenAI API if configured
  if (getEnv("OPENAI_API_KEY")) {
    try {
      const openAiResult = await callOpenAI(opts);
      if (openAiResult) return openAiResult;
    } catch (openAiErr) {
      if (openAiErr instanceof AIUnavailableError) throw openAiErr;
      console.warn("OpenAI fallback failed:", openAiErr);
    }
  }

  throw new AIUnavailableError(
    "AI provider is not configured. Please ensure GEMINI_API_KEY is defined in your environment.",
    "config"
  );
}
