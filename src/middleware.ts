import { randomBytes } from 'node:crypto';
import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/server/sessions';
import { SESSION_COOKIE, CSRF_COOKIE, cookieOptions } from './lib/server/security';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.isAdmin = false;
  const session = context.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    try {
      context.locals.isAdmin = await verifySession(session);
    } catch { context.cookies.delete(SESSION_COOKIE, { path: '/' }); }
  }
  const existingCsrf = context.cookies.get(CSRF_COOKIE)?.value;
  const csrf = existingCsrf && /^[a-f0-9]{64}$/.test(existingCsrf) ? existingCsrf : randomBytes(32).toString('hex');
  context.locals.csrfToken = csrf;
  if (csrf !== existingCsrf) context.cookies.set(CSRF_COOKIE, csrf, { ...cookieOptions(context.url), sameSite: 'strict' });
  const response = context.url.pathname.startsWith('/administrar') && !context.locals.isAdmin ? context.redirect('/ingresar', 303) : await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
});
