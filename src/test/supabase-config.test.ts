import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveSupabaseUrl,
  resolveSupabaseKey,
  checkSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from '@/integrations/supabase/client';
import { getRuntimeEnv } from '@/lib/env';

describe('Supabase Configuration & Fallback', () => {
  const originalGlobalEnv = (globalThis as any).__env__;
  const originalWindowEnv = (globalThis as any).window?.__ENV__;

  afterEach(() => {
    (globalThis as any).__env__ = originalGlobalEnv;
    if ((globalThis as any).window) {
      (globalThis as any).window.__ENV__ = originalWindowEnv;
    }
  });

  it('exports helper functions and flags', () => {
    expect(typeof resolveSupabaseUrl).toBe('function');
    expect(typeof resolveSupabaseKey).toBe('function');
    expect(typeof checkSupabaseConfigured).toBe('function');
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('provides a safe guest-mode fallback when credentials are not configured', async () => {
    // Accessing auth methods should never throw an unhandled error
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();

    const sessionRes = await supabase.auth.getSession();
    expect(sessionRes).toHaveProperty('data');
    expect(sessionRes.data).toHaveProperty('session');

    const subRes = supabase.auth.onAuthStateChange(() => {});
    expect(subRes).toHaveProperty('data');
    expect(subRes.data.subscription).toHaveProperty('unsubscribe');
    expect(typeof subRes.data.subscription.unsubscribe).toBe('function');
  });

  it('provides a chainable database query builder in guest mode without crashing', async () => {
    const query = supabase.from('profiles').select('*').eq('id', 'test-user').maybeSingle();
    expect(query).toBeDefined();
    const result = await query;
    expect(result).toHaveProperty('data');
  });

  it('resolves Cloudflare Worker runtime bindings from globalThis.__env__', () => {
    (globalThis as any).__env__ = {
      VITE_SUPABASE_URL: 'https://test-cf-worker.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-cf-anon-key',
    };

    expect(getRuntimeEnv('VITE_SUPABASE_URL')).toBe('https://test-cf-worker.supabase.co');
    expect(getRuntimeEnv('VITE_SUPABASE_PUBLISHABLE_KEY')).toBe('test-cf-anon-key');
    expect(resolveSupabaseUrl()).toBe('https://test-cf-worker.supabase.co');
    expect(resolveSupabaseKey()).toBe('test-cf-anon-key');
  });

  it('resolves request-scoped Cloudflare Worker runtime bindings from request.runtime.cloudflare.env (Nitro v3)', () => {
    const mockRequest = {
      runtime: {
        cloudflare: {
          env: {
            SUPABASE_URL: 'https://nitro-cf-request.supabase.co',
            SUPABASE_PUBLISHABLE_KEY: 'nitro-cf-req-key',
          },
        },
      },
    };

    expect(getRuntimeEnv('SUPABASE_URL', mockRequest)).toBe('https://nitro-cf-request.supabase.co');
    expect(getRuntimeEnv('SUPABASE_PUBLISHABLE_KEY', mockRequest)).toBe('nitro-cf-req-key');
  });

  it('resolves SSR-injected runtime config from window.__ENV__ in browser context', () => {
    if (!(globalThis as any).window) {
      (globalThis as any).window = {};
    }
    (globalThis as any).window.__ENV__ = {
      VITE_SUPABASE_URL: 'https://injected-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'injected-pub-key',
    };

    expect(getRuntimeEnv('VITE_SUPABASE_URL')).toBe('https://injected-project.supabase.co');
    expect(getRuntimeEnv('VITE_SUPABASE_PUBLISHABLE_KEY')).toBe('injected-pub-key');
    expect(resolveSupabaseUrl()).toBe('https://injected-project.supabase.co');
    expect(resolveSupabaseKey()).toBe('injected-pub-key');
    expect(checkSupabaseConfigured()).toBe(true);
  });

  it('handles missing credentials cleanly without throwing', () => {
    (globalThis as any).__env__ = {};
    if ((globalThis as any).window) {
      (globalThis as any).window.__ENV__ = {};
    }

    // Must not throw even when no environment variables exist
    expect(() => {
      resolveSupabaseUrl();
      resolveSupabaseKey();
      checkSupabaseConfigured();
    }).not.toThrow();
  });
});
