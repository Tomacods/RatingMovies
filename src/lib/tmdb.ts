import type { MediaKind } from './title';
export interface TmdbResult { tmdbId: number; kind: MediaKind; title: string; year: number | null; poster: string; }
export interface TmdbMetadata extends TmdbResult { originalTitle: string; runtime: string; genre: string; summary: string; backdrop: string; }
type TmdbWork = {
  id: number; title?: string; name?: string; original_title?: string; original_name?: string;
  release_date?: string; first_air_date?: string; poster_path?: string | null; backdrop_path?: string | null;
  runtime?: number | null; episode_run_time?: number[]; last_episode_to_air?: {runtime?: number | null} | null;
  genres?: {name:string}[]; overview?: string; media_type?: string;
};
export function tmdbImage(path: string | null | undefined, size: 'w500' | 'w1280' = 'w500') {
  return path && /^\/[a-zA-Z0-9_.-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : '/images/placeholder.svg';
}
export function mapTmdbResult(work: TmdbWork, kind: MediaKind): TmdbResult {
  const date = kind === 'movie' ? work.release_date : work.first_air_date;
  const year = date && /^\d{4}-/.test(date) ? Number(date.slice(0,4)) : null;
  return { tmdbId:work.id, kind, title: (kind === 'movie' ? work.title : work.name) || 'Sin título', year, poster:tmdbImage(work.poster_path) };
}
export function mapTmdbDetails(work: TmdbWork, kind: MediaKind): TmdbMetadata {
  const minutes = kind === 'movie' ? work.runtime : work.episode_run_time?.find(value => value > 0) || work.last_episode_to_air?.runtime;
  return { ...mapTmdbResult(work,kind), originalTitle:(kind === 'movie' ? work.original_title : work.original_name) || '', runtime: minutes && minutes > 0 ? `${minutes} min${kind === 'tv' ? ' por episodio' : ''}` : '', genre:work.genres?.map(genre=>genre.name).join(' · ') || '', summary:work.overview || '', backdrop:tmdbImage(work.backdrop_path,'w1280') };
}
export function mapTmdbSearch(results: TmdbWork[]): TmdbResult[] {
  return results.filter(work=>['movie','tv'].includes(work.media_type ?? '') && Number.isSafeInteger(work.id) && work.id > 0).map(work=>mapTmdbResult(work,work.media_type as MediaKind));
}
