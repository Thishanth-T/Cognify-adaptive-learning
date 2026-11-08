type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type GlobalTelemetry = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: ErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __telemetryEvents?: GlobalTelemetry;
    __reportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const stack = error instanceof Error ? error.stack : undefined;
  const message = describeThrown(error);

  console.error("[Cognify Error Boundary]", { message, context, stack });

  // Global telemetry hooks if configured
  window.__telemetryEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  window.__reportRuntimeError?.({
    message,
    ...(stack !== undefined && { stack }),
    filename: window.location.pathname,
  });
}

const MAX_SERIALIZED_LENGTH = 2000;

function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (typeof error === "string") return truncate(error);
  if (error instanceof Error) {
    return truncate(`${error.name}: ${error.message}`);
  }
  if (typeof error === "object" && error !== null) {
    try {
      return truncate(JSON.stringify(error));
    } catch {
      return "[Unserializable object]";
    }
  }
  return truncate(String(error));
}

function truncate(s: string): string {
  return s.length > MAX_SERIALIZED_LENGTH
    ? s.slice(0, MAX_SERIALIZED_LENGTH) + "..."
    : s;
}
