export type MediaKind = 'movie' | 'tv';
export interface Title {
  slug: string; title: string; originalTitle: string; year: number; kind: MediaKind;
  runtime: string; score: number; watchedOn: string; platform: string; genre: string;
  summary: string; note: string; backdrop: string; poster: string;
  tmdbId?: number; mediaType?: MediaKind;
}
export type TitleInput = Omit<Title, 'slug'>;
export class ValidationError extends Error {
  fields: Record<string, string>;
  constructor(fields: Record<string, string>) { super('Revisá los campos indicados.'); this.fields = fields; }
}
export function validateTitle(input: unknown): TitleInput {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const text = (key: string, max: number, required = false) => {
    const value = typeof data[key] === 'string' ? data[key].trim() : '';
    if (required && !value) errors[key] = 'Completá este campo.';
    if (value.length > max) errors[key] = `Usá hasta ${max} caracteres.`;
    return value;
  };
  const title = text('title', 180, true);
  const originalTitle = text('originalTitle', 180) || title;
  const runtime = text('runtime', 100, true);
  const platform = text('platform', 100, true);
  const genre = text('genre', 180);
  const summary = text('summary', 5000);
  const note = text('note', 3000);
  const kind = data.kind === 'tv' ? 'tv' : 'movie';
  if (!['movie', 'tv'].includes(String(data.kind))) errors.kind = 'Elegí película o serie.';
  const year = Number(data.year);
  if (!Number.isInteger(year) || year < 1888 || year > new Date().getUTCFullYear() + 5) errors.year = 'Ingresá un año válido.';
  const score = Number(data.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) errors.score = 'Elegí un número entero del 1 al 10.';
  const watchedOn = text('watchedOn', 10, true);
  const date = new Date(watchedOn + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(watchedOn) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== watchedOn) errors.watchedOn = 'Ingresá una fecha válida.';
  const image = (key: string) => {
    const value = text(key, 2000);
    if (!value) return '/images/placeholder.svg';
    if (/^\/images\/[a-zA-Z0-9_-]+\.(?:svg|webp|jpg|jpeg|png)$/.test(value)) return value;
    try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Invalid URL is reported with its field. */ }
    errors[key] = 'Usá una URL de imagen que empiece con https://.';
    return value;
  };
  const poster = image('poster');
  const backdrop = image('backdrop');
  const tmdbId = data.tmdbId === undefined || data.tmdbId === '' ? undefined : Number(data.tmdbId);
  if (tmdbId !== undefined && (!Number.isSafeInteger(tmdbId) || tmdbId < 1)) errors.tmdbId = 'Seleccioná de nuevo el título de TMDB.';
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { title, originalTitle, year, kind, runtime, score, watchedOn, platform, genre, summary, note, poster, backdrop, ...(tmdbId ? {tmdbId, mediaType:kind} : {}) };
}
export const validTitleId = (id: string | undefined): id is string => Boolean(id && /^[a-zA-Z0-9_-]{1,100}$/.test(id));
export const formatWatchedDate = (value: string) => new Intl.DateTimeFormat('es-AR', { day:'numeric', month:'long', year:'numeric', timeZone:'America/Argentina/Buenos_Aires' }).format(new Date(value + 'T12:00:00-03:00'));
export const kindLabel = (kind: MediaKind) => kind === 'movie' ? 'Película' : 'Serie';
