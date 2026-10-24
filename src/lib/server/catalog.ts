import { db } from './firebase';
import { validTitleId, validateTitle, type Title } from '../title';

function fromDocument(id: string, data: unknown): Title {
  return { ...validateTitle(data), slug: id };
}
export async function listTitles(): Promise<Title[]> {
  const snapshot = await db().collection('titles').orderBy('watchedOn', 'desc').get();
  return snapshot.docs.map(doc => fromDocument(doc.id, doc.data()));
}
export async function getTitle(id: string | undefined): Promise<Title | null> {
  if (!validTitleId(id)) return null;
  const snapshot = await db().collection('titles').doc(id).get();
  return snapshot.exists ? fromDocument(snapshot.id, snapshot.data()) : null;
}
export async function loadCatalog() {
  try { return { titles: await listTitles(), error: false }; }
  catch { console.error('[catalog] No se pudo consultar Firestore.'); return { titles: [] as Title[], error: true }; }
}
