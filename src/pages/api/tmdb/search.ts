import type { APIRoute } from 'astro';
import { mutationGuard, readJson, json } from '../../../lib/server/security';
import { tmdbRequest, TmdbError } from '../../../lib/server/tmdb';
import { mapTmdbSearch } from '../../../lib/tmdb';
export const POST: APIRoute = async context => {
  const rejected = mutationGuard(context); if (rejected) return rejected;
  let body: {query?:unknown;page?:unknown};
  try { body = await readJson(context.request) as typeof body; } catch { return json({error:'Ingresá un nombre para buscar.'},400); }
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  const page = Number(body?.page ?? 1);
  if (query.length < 2 || query.length > 100 || !Number.isInteger(page) || page < 1 || page > 500) return json({error:'Ingresá entre 2 y 100 caracteres para buscar.'},422);
  try {
    const data = await tmdbRequest('search/multi',{query,include_adult:'false',page:String(page)});
    if (!Array.isArray(data.results)) throw new TmdbError('La respuesta de TMDB no se pudo leer. Intentá de nuevo.');
    return json({results:mapTmdbSearch(data.results),page,hasMore:page < Math.min(data.total_pages,500)});
  } catch(error) { return json({error:error instanceof TmdbError ? error.message : 'No se pudo buscar en TMDB. Intentá de nuevo.'},error instanceof TmdbError ? error.status : 503); }
};
