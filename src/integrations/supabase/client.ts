import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getRuntimeEnv } from '@/lib/env';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

/**
 * Resolves the Supabase URL across all runtime contexts:
 * 1. Explicit VITE_SUPABASE_URL or SUPABASE_URL
 * 2. Derived from VITE_SUPABASE_PROJECT_ID or SUPABASE_PROJECT_ID
 */
export function resolveSupabaseUrl(): string | undefined {
  const explicitUrl = getRuntimeEnv('VITE_SUPABASE_URL') || getRuntimeEnv('SUPABASE_URL');
  if (explicitUrl) return explicitUrl;

  const projectId = getRuntimeEnv('VITE_SUPABASE_PROJECT_ID') || getRuntimeEnv('SUPABASE_PROJECT_ID');
  if (projectId) {
    return `https://${projectId}.supabase.co`;
  }

  return undefined;
}

/**
 * Resolves the Supabase public key across all runtime contexts:
 * Supports both PUBLISHABLE_KEY and ANON_KEY with or without VITE_ prefix.
 */
export function resolveSupabaseKey(): string | undefined {
  return (
    getRuntimeEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getRuntimeEnv('VITE_SUPABASE_ANON_KEY') ||
    getRuntimeEnv('SUPABASE_PUBLISHABLE_KEY') ||
    getRuntimeEnv('SUPABASE_ANON_KEY')
  );
}

/** Check whether Supabase is configured with valid URL & public key */
export function checkSupabaseConfigured(): boolean {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseKey());
}

/** Boolean flag indicating whether Supabase is configured */
export const isSupabaseConfigured: boolean = checkSupabaseConfigured();

// The public URL can be reachable only from the browser, so server requests go to the runtime URL of the same backend.
function serverSupabaseUrl(publicUrl: string, supabaseKey: string): string | undefined {
  if (typeof window !== 'undefined') return undefined;
  const serverUrl = resolveSupabaseUrl()?.replace(/\/+$/, '');
  const serverKey = resolveSupabaseKey();
  if (!serverUrl || serverUrl === publicUrl || serverKey !== supabaseKey) return undefined;
  return serverUrl;
}

function createSupabaseFetch(supabaseUrl: string, supabaseKey: string): typeof fetch {
  const publicUrl = supabaseUrl.replace(/\/+$/, '');
  const serverUrl = serverSupabaseUrl(publicUrl, supabaseKey);
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    if (serverUrl) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(`${publicUrl}/`)) {
        const target = serverUrl + url.slice(publicUrl.length);
        const request = typeof input === 'string' || input instanceof URL ? target : new Request(target, input);
        return fetch(request, { ...init, headers });
      }
    }
    return fetch(input, { ...init, headers });
  };
}

/**
 * Creates a safe guest-mode stub client when Supabase is not configured.
 * This guarantees the application runs seamlessly in offline/local Guest Mode
 * without throwing fatal exceptions or crashing the UI.
 */
function createGuestModeClient(): any {
  console.info(
    '[Cognify] Supabase credentials not found. Cognify is operating in Guest Mode with local storage persistence.'
  );

  const noopPromise = (val: any = { data: null, error: null }) => Promise.resolve(val);

  const queryBuilder: any = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: [], error: null });
        }
        return () => queryBuilder;
      },
    }
  );

  return {
    auth: {
      getSession: () => noopPromise({ data: { session: null }, error: null }),
      getUser: () => noopPromise({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () =>
        noopPromise({
          data: { user: null, session: null },
          error: new Error('Supabase authentication is not configured. Cognify is running in Guest Mode.'),
        }),
      signUp: () =>
        noopPromise({
          data: { user: null, session: null },
          error: new Error('Supabase authentication is not configured. Cognify is running in Guest Mode.'),
        }),
      signInWithOAuth: () =>
        noopPromise({
          data: null,
          error: new Error('Supabase authentication is not configured. Cognify is running in Guest Mode.'),
        }),
      signOut: () => noopPromise({ error: null }),
      getClaims: () => noopPromise({ data: { claims: null }, error: new Error('Not configured') }),
    },
    from: () => queryBuilder,
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
    removeAllChannels: () => {},
  };
}

function createSupabaseClient() {
  const SUPABASE_URL = resolveSupabaseUrl();
  const SUPABASE_KEY = resolveSupabaseKey();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return createGuestModeClient();
  }

  try {
    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_URL, SUPABASE_KEY),
      },
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return createGuestModeClient();
  }
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
