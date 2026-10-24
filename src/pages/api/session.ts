import type { APIRoute } from 'astro';
import { auth, adminUid } from '../../lib/server/firebase';
import { createSession } from '../../lib/server/sessions';
import { CSRF_COOKIE, SESSION_COOKIE, SESSION_DURATION, cookieOptions, validMutation, readJson, json } from '../../lib/server/security';

export const POST: APIRoute = async context => {
  if (!validMutation(context.request, context.url, context.cookies.get(CSRF_COOKIE)?.value ?? '', context.request.headers.get('x-csrf-token'))) return json({ error: 'Recargá la página e intentá de nuevo.' }, 403);
  let idToken: unknown;
  try { const body = await readJson(context.request) as { idToken?: unknown }; idToken = body?.idToken; } catch { return json({ error: 'Solicitud de acceso inválida.' }, 400); }
  if (typeof idToken !== 'string' || idToken.length > 15000) return json({ error: 'Solicitud de acceso inválida.' }, 400);
  try {
    const claims = await auth().verifyIdToken(idToken, true);
    if (claims.uid !== adminUid()) return json({ error: 'Esta cuenta no tiene permiso para administrar el catálogo.' }, 403);
    if (Date.now() / 1000 - claims.auth_time > 300) return json({ error: 'Volvé a iniciar sesión para continuar.' }, 401);
    const session = await createSession(idToken);
    context.cookies.set(SESSION_COOKIE, session, { ...cookieOptions(context.url), maxAge: SESSION_DURATION });
    return json({ ok: true });
  } catch { return json({ error: 'No se pudo validar el acceso. Volvé a iniciar sesión.' }, 401); }
};
