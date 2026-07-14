/** Resolve after `ms` — used to simulate latency in the mock service. */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Lightweight unique id (mock service only; Supabase generates real UUIDs). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
