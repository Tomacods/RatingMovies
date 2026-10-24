import { serverEnv } from './firebase';
export class TmdbError extends Error {
  status: number;
  constructor(message: string, status = 503) { super(message); this.status = status; }
}
export async function tmdbRequest(path: string, params: Record<string,string> = {}) {
  const token = serverEnv('TMDB_READ_ACCESS_TOKEN');
  const key = serverEnv('TMDB_API_KEY');
  if (!token && !key) throw new TmdbError('La búsqueda de TMDB todavía no está configurada. Podés completar la ficha manualmente.');
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('language','es-AR');
  for(const [name,value] of Object.entries(params)) url.searchParams.set(name,value);
  if (!token) url.searchParams.set('api_key',key);
  let response: Response;
  try { response = await fetch(url, {headers: token ? {Authorization:`Bearer ${token}`} : {}, signal:AbortSignal.timeout(10000)}); }
  catch { throw new TmdbError('No pudimos conectarnos con TMDB. Intentá de nuevo o completá la ficha manualmente.'); }
  if (!response.ok) {
    if (response.status === 429) throw new TmdbError('TMDB recibió demasiadas consultas. Esperá unos segundos e intentá de nuevo.',429);
    if (response.status === 404) throw new TmdbError('Ese título ya no está disponible en TMDB. Probá otra búsqueda.',404);
    throw new TmdbError('TMDB no pudo responder. Intentá de nuevo o completá la ficha manualmente.');
  }
  try { return await response.json(); } catch { throw new TmdbError('La respuesta de TMDB no se pudo leer. Intentá de nuevo.'); }
}
