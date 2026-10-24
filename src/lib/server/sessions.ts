import { createHash } from 'node:crypto';
import { auth, db, adminUid } from './firebase';
import { SESSION_DURATION } from './security';
const sessionRef = (cookie: string) => db().collection('_sessions').doc(createHash('sha256').update(cookie).digest('hex'));
export async function createSession(idToken: string) {
  const cookie = await auth().createSessionCookie(idToken, { expiresIn: SESSION_DURATION * 1000 });
  await sessionRef(cookie).set({ uid: adminUid(), expiresAt: Date.now() + SESSION_DURATION * 1000 });
  return cookie;
}
export async function verifySession(cookie: string) {
  const claims = await auth().verifySessionCookie(cookie, true);
  if (claims.uid !== adminUid()) return false;
  const session = await sessionRef(cookie).get();
  return session.exists && session.data()?.uid === claims.uid && session.data()?.expiresAt > Date.now();
}
export async function deleteSession(cookie: string) { await sessionRef(cookie).delete(); }
