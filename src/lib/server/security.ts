import { timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
export const SESSION_COOKIE = 'rm_session';
export const CSRF_COOKIE = 'rm_csrf';
export const SESSION_DURATION = 60 * 60 * 24 * 5;
export const cookieOptions = (url: URL) => ({ path: '/', httpOnly: true, secure: url.protocol === 'https:' || import.meta.env?.PROD === true, sameSite: 'lax' as const });
export function validMutation(request: Request, url: URL, expected: string, supplied: string | null): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  if (!expected || !supplied || supplied.length > 256) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' } });
}
export function mutationGuard(context: APIContext): Response | undefined {
  if (!validMutation(context.request, context.url, context.cookies.get(CSRF_COOKIE)?.value ?? '', context.request.headers.get('x-csrf-token'))) return json({ error: 'La solicitud venció. Recargá la página e intentá de nuevo.' }, 403);
  if (!context.locals.isAdmin) return json({ error: 'Iniciá sesión con la cuenta administradora.' }, 401);
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('invalid-body');
  // Bound the actual streamed bytes, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid-body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 32_768) { await reader.cancel(); throw new Error('invalid-body'); }
    chunks.push(chunk.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
