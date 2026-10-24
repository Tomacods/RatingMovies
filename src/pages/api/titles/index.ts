import type { APIRoute } from 'astro';
import { db } from '../../../lib/server/firebase';
import { mutationGuard, readJson, json } from '../../../lib/server/security';
import { validateTitle, ValidationError } from '../../../lib/title';
export const POST: APIRoute = async context => {
  const rejected = mutationGuard(context);
  if (rejected) return rejected;
  let body: unknown;
  try { body = await readJson(context.request); } catch { return json({ error: 'El formulario es inválido o demasiado grande.' }, 400); }
  try {
    const data = validateTitle(body);
    const doc = await db().collection('titles').add(data);
    return json({ slug: doc.id }, 201);
  } catch (error) {
    if (error instanceof ValidationError) return json({ error: error.message, fields: error.fields }, 422);
    return json({ error: 'No se pudo guardar. Tus datos siguen en el formulario; intentá de nuevo.' }, 503);
  }
};
