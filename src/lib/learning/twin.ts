// Learning Twin + Learning Planner logic (pure, shared by browser and server).
// Mastery is derived ONLY from recorded assessment history — no seeded or random values.

export type HistoryEntry = {
  concept: string;
  score?: number | null;
  correct: boolean | null;
  status?: "correct" | "incorrect" | "uncertain" | "unassessed";
  misconceptionTags?: string[];
  timestamp: number;
};

export type GraphConcept = { id: string; label: string; prerequisites: string[] };

export type ConceptState = "mastered" | "learning" | "weak" | "available" | "locked";

export type ConceptTwin = {
  id: string;
  label: string;
  mastery: number | null; // 0-100
  confidence: number; // 0-1
  attempts: number;
  scoredAttempts: number;
  trend: "up" | "down" | "flat" | null;
  state: ConceptState;
  lastAttempt: number | null;
};

export const MASTERED_AT = 75;
export const WEAK_BELOW = 40;
export const UNLOCK_AT = 60;

/** Numeric evidence for one attempt. Legacy records without a score map correct/incorrect to a conservative value. */
export function attemptScore(entry: HistoryEntry): number | null {
  if (typeof entry.score === "number") return entry.score;
  if (entry.correct === true) return 80;
  if (entry.correct === false) return 30;
  return null;
}

export function conceptMastery(history: HistoryEntry[], label: string) {
  const attempts = history
    .filter((h) => h.concept.toLowerCase() === label.toLowerCase())
    .sort((a, b) => a.timestamp - b.timestamp);
  const scores = attempts.map(attemptScore).filter((s): s is number => s !== null);
  if (scores.length === 0) {
    return { mastery: null, confidence: 0, attempts: attempts.length, scored: 0, trend: null, last: attempts.at(-1)?.timestamp ?? null };
  }
  // Exponential moving average: recent attempts weigh more.
  let ema = scores[0]!;
  for (const s of scores.slice(1)) ema = ema * 0.45 + s * 0.55;
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const evidence = 1 - 1 / (1 + n * 0.75); // 1→0.43, 2→0.6, 4→0.75
  const confidence = Math.max(0.1, Math.min(0.95, evidence - sd / 250));
  let trend: ConceptTwin["trend"] = null;
  if (n >= 2) {
    const d = scores[n - 1]! - scores[n - 2]!;
    trend = d > 5 ? "up" : d < -5 ? "down" : "flat";
  }
  return { mastery: Math.round(ema), confidence: Math.round(confidence * 100) / 100, attempts: attempts.length, scored: n, trend, last: attempts.at(-1)?.timestamp ?? null };
}

export function computeTwin(history: HistoryEntry[], concepts: GraphConcept[]) {
  const base = new Map(concepts.map((c) => [c.id, conceptMastery(history, c.label)]));
  const nodes: ConceptTwin[] = concepts.map((c) => {
    const m = base.get(c.id)!;
    const prereqsMet = c.prerequisites.every((p) => {
      const pm = base.get(p);
      return pm && pm.mastery !== null && pm.mastery >= UNLOCK_AT;
    });
    let state: ConceptState;
    if (m.mastery !== null) {
      state = m.mastery >= MASTERED_AT ? "mastered" : m.mastery < WEAK_BELOW ? "weak" : "learning";
    } else if (m.attempts > 0) {
      state = "learning"; // attempted but not scorable (e.g. asked for help)
    } else {
      state = prereqsMet ? "available" : "locked";
    }
    return { id: c.id, label: c.label, mastery: m.mastery, confidence: m.confidence, attempts: m.attempts, scoredAttempts: m.scored, trend: m.trend, state, lastAttempt: m.last };
  });

  const scored = nodes.filter((n) => n.mastery !== null);
  const overall = scored.length ? Math.round(scored.reduce((a, n) => a + (n.mastery ?? 0), 0) / scored.length) : null;

  // Recurring misconceptions across history
  const tagCounts = new Map<string, { count: number; concepts: Set<string>; last: number }>();
  for (const h of history) {
    for (const raw of h.misconceptionTags ?? []) {
      const tag = raw.trim().toLowerCase();
      if (!tag) continue;
      const t = tagCounts.get(tag) ?? { count: 0, concepts: new Set<string>(), last: 0 };
      t.count += 1;
      t.concepts.add(h.concept);
      t.last = Math.max(t.last, h.timestamp);
      tagCounts.set(tag, t);
    }
  }
  const misconceptions = [...tagCounts.entries()]
    .map(([tag, v]) => ({ tag, count: v.count, concepts: [...v.concepts], recurring: v.count >= 2, last: v.last }))
    .sort((a, b) => b.count - a.count || b.last - a.last);

  // Progress over time: running overall mastery after each scored attempt
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const timeline: { timestamp: number; score: number; overall: number; concept: string }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = attemptScore(sorted[i]!);
    if (s === null) continue;
    const upTo = sorted.slice(0, i + 1);
    const ms = concepts.map((c) => conceptMastery(upTo, c.label).mastery).filter((x): x is number => x !== null);
    timeline.push({ timestamp: sorted[i]!.timestamp, score: s, overall: Math.round(ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)), concept: sorted[i]!.concept });
  }

  return {
    nodes,
    overall,
    strong: nodes.filter((n) => n.state === "mastered"),
    weak: nodes.filter((n) => n.state === "weak"),
    misconceptions,
    timeline,
    totalAttempts: history.length,
  };
}

export type Twin = ReturnType<typeof computeTwin>;

export type PlanStep = { id: string; label: string; reason: string; state: ConceptState };

/** Learning Planner: deterministic ordering over the prerequisite graph using real mastery. */
export function planLearning(twin: Twin, concepts: GraphConcept[]) {
  const order = topoOrder(concepts);
  const byId = new Map(twin.nodes.map((n) => [n.id, n]));
  const steps: PlanStep[] = [];
  const recurringConcepts = new Set(twin.misconceptions.filter((m) => m.recurring).flatMap((m) => m.concepts.map((c) => c.toLowerCase())));

  const weak = twin.nodes.filter((n) => n.state === "weak").sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0));
  for (const n of weak) steps.push({ id: n.id, label: n.label, state: n.state, reason: `Mastery ${n.mastery}% — review the fundamentals and retry.` });

  const learning = twin.nodes.filter((n) => n.state === "learning").sort((a, b) => (a.mastery ?? 50) - (b.mastery ?? 50));
  for (const n of learning)
    steps.push({
      id: n.id, label: n.label, state: n.state,
      reason: recurringConcepts.has(n.label.toLowerCase())
        ? "Recurring misconception detected — targeted practice recommended."
        : n.mastery === null ? "Started but not yet assessed — submit an explanation." : `Mastery ${n.mastery}% — one more strong answer reaches mastery.`,
    });

  for (const id of order) {
    const n = byId.get(id);
    if (n && n.state === "available") steps.push({ id, label: n.label, state: n.state, reason: "Prerequisites met — ready to learn." });
  }
  for (const id of order) {
    const n = byId.get(id);
    if (n && n.state === "locked") {
      const c = concepts.find((x) => x.id === id)!;
      const missing = c.prerequisites.map((p) => byId.get(p)).filter((p) => p && (p.mastery ?? 0) < UNLOCK_AT).map((p) => p!.label);
      steps.push({ id, label: n.label, state: n.state, reason: `Unlocks after: ${missing.join(", ")}.` });
    }
  }
  const next = steps.find((s) => s.state !== "locked") ?? null;
  return { steps, next, complete: twin.nodes.every((n) => n.state === "mastered") };
}

function topoOrder(concepts: GraphConcept[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const p of byId.get(id)?.prerequisites ?? []) visit(p);
    out.push(id);
  };
  concepts.forEach((c) => visit(c.id));
  return out;
}
