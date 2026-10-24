import type { APIRoute } from 'astro';
import { deleteSession } from '../../lib/server/sessions';
import { mutationGuard, SESSION_COOKIE, json } from '../../lib/server/security';
export const POST: APIRoute = async context => {
  const rejected = mutationGuard(context);
  if (rejected) return rejected;
  try {
    await deleteSession(context.cookies.get(SESSION_COOKIE)!.value);
    context.cookies.delete(SESSION_COOKIE, { path: '/' });
    return json({ ok: true });
  } catch { return json({ error: 'No pudimos cerrar la sesión. Intentá de nuevo.' }, 503); }
};
