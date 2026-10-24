import type { APIRoute } from 'astro';
import { mutationGuard, readJson, json } from '../../../lib/server/security';
import { tmdbRequest, TmdbError } from '../../../lib/server/tmdb';
import { mapTmdbDetails } from '../../../lib/tmdb';
export const POST: APIRoute = async context => {
  const rejected = mutationGuard(context); if (rejected) return rejected;
  let body: {id?:unknown;kind?:unknown};
  try { body = await readJson(context.request) as typeof body; } catch { return json({error:'Seleccioná un resultado de la búsqueda.'},400); }
  const id = Number(body?.id), kind = body?.kind;
  if (!Number.isSafeInteger(id) || id < 1 || (kind !== 'movie' && kind !== 'tv')) return json({error:'Seleccioná un resultado válido de la búsqueda.'},422);
  try {
    const data = await tmdbRequest(`${kind}/${id}`);
    if (data.id !== id) throw new TmdbError('La ficha de TMDB no se pudo leer. Probá otra búsqueda.');
    return json({metadata:mapTmdbDetails(data,kind)});
  } catch(error) { return json({error:error instanceof TmdbError ? error.message : 'No se pudo consultar la ficha de TMDB.'},error instanceof TmdbError ? error.status : 503); }
};
