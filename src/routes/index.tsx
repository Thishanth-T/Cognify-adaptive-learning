import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import App from "@/components/cognify/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cognify — Adaptive Learning Twin" },
      { name: "description", content: "Cognify maps your concept mastery, diagnoses gaps, and guides you through adaptive C++ learning." },
      { property: "og:title", content: "Cognify — Adaptive Learning Twin" },
      { property: "og:description", content: "Map your concept mastery and learn adaptively with Cognify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // App reads saved progress from browser storage, so render it client-side only.
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-[var(--cognify-bg)]" />}>
      <App />
    </ClientOnly>
  );
}
