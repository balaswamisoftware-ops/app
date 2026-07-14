import type { SupabaseClient } from '@supabase/supabase-js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(() => r(), ms));

/**
 * Invoke a Supabase Edge Function with retries for TRANSIENT failures only —
 * 404 "function not found" (regional propagation), 5xx and network errors.
 * Real application errors are surfaced immediately and never retried.
 *
 * Shields the app from Supabase edge-network flakiness where a function 404s
 * on some nodes.
 */
export async function invokeWithRetry<T = unknown>(
  supabase: SupabaseClient,
  name: string,
  body: unknown,
  tries = 8,
): Promise<T> {
  let lastMessage = 'The server is temporarily unavailable.';

  for (let attempt = 1; attempt <= tries; attempt++) {
    const { data, error } = await supabase.functions.invoke(name, {
      body: body as Record<string, unknown>,
    });

    if (!error) {
      return data as T;
    }

    const status: number | undefined = (
      error as { context?: { status?: number } }
    )?.context?.status;
    const transient =
      status === undefined || status === 404 || status === 408 || status >= 500;

    if (!transient) {
      let message = error.message;
      try {
        const parsed = await (
          error as { context: { json: () => Promise<{ error?: string }> } }
        ).context.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        /* keep default */
      }
      throw new Error(message);
    }

    lastMessage = error.message || lastMessage;
    if (attempt < tries) await sleep(Math.min(300 * attempt, 1500));
  }

  throw new Error(`Could not reach the server. Please try again shortly. (${lastMessage})`);
}
