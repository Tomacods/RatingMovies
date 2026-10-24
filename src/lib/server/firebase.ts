import { readFileSync } from 'node:fs';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirestore, getFirestore } from 'firebase-admin/firestore';

export function serverEnv(name: string): string {
  return process.env[name] || (import.meta.env.DEV ? import.meta.env[name] || '' : '');
}
export function adminUid(): string {
  const uid = serverEnv('FIREBASE_ADMIN_UID');
  if (!uid) throw new Error('Falta FIREBASE_ADMIN_UID.');
  return uid;
}
function app() {
  const existing = getApps().find(app => app.name === 'ratingmovies');
  if (existing) return existing;
  const projectId = serverEnv('FIREBASE_PROJECT_ID');
  if (!projectId) throw new Error('Falta FIREBASE_PROJECT_ID.');
  const json = serverEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
  const path = serverEnv('GOOGLE_APPLICATION_CREDENTIALS');
  const serviceAccount = json ? JSON.parse(json) : path ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
  if (serviceAccount && serviceAccount.project_id !== projectId) throw new Error('La credencial no coincide con el proyecto.');
  const instance = initializeApp({ projectId, credential: serviceAccount ? cert(serviceAccount) : applicationDefault() }, 'ratingmovies');
  initializeFirestore(instance, { preferRest: true });
  return instance;
}
export const auth = () => getAuth(app());
export const db = () => getFirestore(app());
