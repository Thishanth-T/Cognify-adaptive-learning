/**
 * Universal runtime environment variable resolver supporting:
 * 1. Client-side SSR-injected variables (`window.__ENV__`)
 * 2. Request-scoped Cloudflare Worker runtime bindings (`request.runtime.cloudflare.env` in Nitro v3)
 * 3. Cloudflare Worker runtime bindings (`globalThis.__env__` set by Nitro module handler)
 * 4. Cloudflare Worker global scope bindings (`globalThis[key]`)
 * 5. Client-side Vite build-time replacement (`import.meta.env`)
 * 6. Node.js server environment (`process.env`)
 */
export function getRuntimeEnv(key: string, request?: unknown): string | undefined {
  // 1. Client-side SSR-injected runtime config (for Cloudflare Workers runtime variables in the browser)
  if (typeof window !== 'undefined') {
    try {
      const injected = (window as any).__ENV__?.[key];
      if (typeof injected === 'string' && injected.trim()) {
        return injected.trim();
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Request-scoped Cloudflare Worker runtime bindings (Nitro v3: request.runtime.cloudflare.env)
  if (request && typeof request === 'object') {
    try {
      const cfEnv = (request as any).runtime?.cloudflare?.env?.[key];
      if (typeof cfEnv === 'string' && cfEnv.trim()) {
        return cfEnv.trim();
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Cloudflare Worker runtime bindings (populated on globalThis.__env__ by Nitro module handler)
  if (typeof globalThis !== 'undefined') {
    try {
      const cfEnv = (globalThis as any).__env__?.[key];
      if (typeof cfEnv === 'string' && cfEnv.trim()) {
        return cfEnv.trim();
      }
    } catch {
      /* ignore */
    }

    try {
      const cfGlobal = (globalThis as any)[key];
      if (typeof cfGlobal === 'string' && cfGlobal.trim()) {
        return cfGlobal.trim();
      }
    } catch {
      /* ignore */
    }
  }

  // 4. Client-side Vite build-time inlining
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteVal = import.meta.env[key];
      if (typeof viteVal === 'string' && viteVal.trim()) {
        return viteVal.trim();
      }
    }
  } catch {
    /* ignore */
  }

  // 5. Node.js process.env (read-only)
  if (typeof process !== 'undefined' && process.env) {
    try {
      const procVal = process.env[key];
      if (typeof procVal === 'string' && procVal.trim()) {
        return procVal.trim();
      }
    } catch {
      /* ignore */
    }
  }

  return undefined;
}
