import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import App from "@/components/cognify/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cognify — Your Adaptive Learning Partner" },
      { name: "description", content: "Cognify maps your concept mastery, diagnoses gaps, and guides you through adaptive learning." },
      { property: "og:title", content: "Cognify" },
      { property: "og:description", content: "Map your concept mastery and learn adaptively with Cognify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg?v=3", type: "image/svg+xml", sizes: "any" },
      { rel: "icon", href: "/favicon.png?v=3", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon.ico?v=3", type: "image/x-icon" },
      { rel: "shortcut icon", href: "/favicon.ico?v=3" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=3" },
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
