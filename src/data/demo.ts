export type MediaKind = 'movie' | 'tv';
export interface Title {
  slug: string; title: string; originalTitle: string; year: number; kind: MediaKind;
  runtime: string; score: number; watchedOn: string; platform: string; genre: string;
  summary: string; note: string; backdrop: string; poster: string;
}
// Demonstration records only. These are not the owner's viewing history.
export const demoTitles: Title[] = [
  { slug:'dune', title:'Dune', originalTitle:'Dune', year:2021, kind:'movie', runtime:'155 min', score:9, watchedOn:'2026-10-18', platform:'Max', genre:'Ciencia ficción · Aventura', summary:'Paul Atreides llega a Arrakis, un mundo desértico donde se cruzan el poder, la supervivencia y un destino que todavía no comprende.', note:'De esas películas que se quedan un rato más. La escala, el silencio y un mundo en el que perderse.', backdrop:'/images/dune-backdrop.jpg', poster:'/images/dune-poster.jpg' },
  { slug:'interstellar', title:'Interstellar', originalTitle:'Interstellar', year:2014, kind:'movie', runtime:'169 min', score:10, watchedOn:'2026-10-11', platform:'Netflix', genre:'Ciencia ficción · Drama', summary:'Un grupo de exploradores emprende un viaje más allá del sistema solar para buscar un futuro para la humanidad.', note:'Enorme en la pantalla y muy cerca en lo que cuenta. El tiempo también se mide en las personas que dejamos atrás.', backdrop:'/images/interstellar-backdrop.jpg', poster:'/images/interstellar-poster.jpg' },
  { slug:'severance', title:'Severance', originalTitle:'Severance', year:2022, kind:'tv', runtime:'Variable por episodio', score:9, watchedOn:'2026-10-05', platform:'Apple TV+', genre:'Drama · Misterio', summary:'Un procedimiento separa los recuerdos laborales de la vida personal de un grupo de empleados. Esa frontera empieza a despertar preguntas.', note:'Cada pasillo es una pregunta nueva. Una serie que hace del silencio y los pequeños detalles su mejor misterio.', backdrop:'/images/severance-backdrop.jpg', poster:'/images/severance-poster.jpg' },
];
export const formatWatchedDate = (value: string) => new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00-03:00'));
export const kindLabel = (kind: MediaKind) => kind === 'movie' ? 'Película' : 'Serie';
