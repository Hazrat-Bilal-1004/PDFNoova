// Client-side rate limiter for free tool usage.
// Enforces 5 operations per 24 hours. Stored in localStorage so it
// survives reloads. This is a soft limit — the architecture is ready
// for a server-backed subscription model to replace it later.
const KEY = "pdfnoova:usage:v1";
const WINDOW_MS = 24 * 60 * 60 * 1000;
export const DAILY_LIMIT = 5;

type Record = { ts: number[] };

function read(): Record {
  if (typeof window === "undefined") return { ts: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ts: [] };
    const parsed = JSON.parse(raw) as Record;
    const now = Date.now();
    return { ts: parsed.ts.filter((t) => now - t < WINDOW_MS) };
  } catch {
    return { ts: [] };
  }
}

function write(r: Record) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(r));
}

export function getRemaining(): number {
  return Math.max(0, DAILY_LIMIT - read().ts.length);
}

export function tryConsume(): { ok: boolean; remaining: number; resetInMs?: number } {
  const rec = read();
  if (rec.ts.length >= DAILY_LIMIT) {
    const oldest = Math.min(...rec.ts);
    return { ok: false, remaining: 0, resetInMs: WINDOW_MS - (Date.now() - oldest) };
  }
  rec.ts.push(Date.now());
  write(rec);
  return { ok: true, remaining: DAILY_LIMIT - rec.ts.length };
}

export function formatResetIn(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
