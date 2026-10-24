import { initializeApp, getApps } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const form = document.querySelector<HTMLFormElement>('[data-login]');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const fieldset = form.querySelector('fieldset')!;
  if (fieldset.disabled) return;
  const message = form.querySelector<HTMLElement>('[data-login-message]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const data = new FormData(form);
  message.hidden = true;
  fieldset.disabled = true;
  button.textContent = 'Ingresando…';
  form.setAttribute('aria-busy', 'true');
  let firebaseAuth: ReturnType<typeof getAuth> | undefined;
  try {
    const app = getApps()[0] ?? initializeApp({ apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY, authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID, appId: import.meta.env.PUBLIC_FIREBASE_APP_ID });
    firebaseAuth = getAuth(app);
    await setPersistence(firebaseAuth, inMemoryPersistence);
    const credential = await signInWithEmailAndPassword(firebaseAuth, String(data.get('email') ?? '').trim(), String(data.get('password') ?? ''));
    const response = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': form.dataset.csrf ?? '' }, body: JSON.stringify({ idToken: await credential.user.getIdToken() }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'No se pudo iniciar sesión. Intentá de nuevo.');
    await signOut(firebaseAuth);
    window.location.assign('/administrar');
  } catch (error) {
    const code = (error as { code?: string }).code;
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
      'auth/invalid-email': 'Revisá el formato del correo electrónico.',
      'auth/user-disabled': 'Esta cuenta está deshabilitada.',
      'auth/user-not-found': 'El correo o la contraseña no son correctos.',
      'auth/wrong-password': 'El correo o la contraseña no son correctos.',
      'auth/too-many-requests': 'Hubo demasiados intentos. Esperá unos minutos antes de volver a ingresar.',
      'auth/network-request-failed': 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
    };
    message.textContent = code ? (messages[code] ?? 'No se pudo iniciar sesión. Intentá de nuevo.') : error instanceof Error && !(error instanceof TypeError) ? error.message : 'No pudimos conectarnos. Intentá de nuevo.';
    message.hidden = false;
    message.focus();
    if (firebaseAuth) await signOut(firebaseAuth).catch(() => {});
  } finally {
    fieldset.disabled = false;
    button.textContent = 'Ingresar';
    form.removeAttribute('aria-busy');
  }
});
