import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../lib/server/firebase';
import { mutationGuard, readJson, json } from '../../../lib/server/security';
import { validTitleId, validateTitle, ValidationError } from '../../../lib/title';

export const PUT: APIRoute = async context => {
  const rejected = mutationGuard(context); if (rejected) return rejected;
  if (!validTitleId(context.params.id)) return json({ error: 'No encontramos ese título.' }, 404);
  let body: unknown;
  try { body = await readJson(context.request); } catch { return json({ error: 'El formulario es inválido o demasiado grande.' }, 400); }
  try {
    const data = validateTitle(body);
    await db().collection('titles').doc(context.params.id).update({ ...data, tmdbId:data.tmdbId ?? FieldValue.delete(), mediaType:data.mediaType ?? FieldValue.delete() });
    return json({ slug: context.params.id });
  } catch (error) {
    if (error instanceof ValidationError) return json({ error: error.message, fields: error.fields }, 422);
    if ((error as { code?: number }).code === 5) return json({ error: 'Ese título ya no existe.' }, 404);
    return json({ error: 'No se pudo guardar. Intentá de nuevo.' }, 503);
  }
};
export const DELETE: APIRoute = async context => {
  const rejected = mutationGuard(context); if (rejected) return rejected;
  if (!validTitleId(context.params.id)) return json({ error: 'No encontramos ese título.' }, 404);
  try {
    await db().collection('titles').doc(context.params.id).delete();
    return json({ ok: true });
  } catch { return json({ error: 'No se pudo eliminar. Intentá de nuevo.' }, 503); }
};
