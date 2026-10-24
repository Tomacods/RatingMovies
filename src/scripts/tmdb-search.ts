import type { TmdbResult, TmdbMetadata } from '../lib/tmdb';
const search = document.querySelector<HTMLFormElement>('[data-tmdb-search]');
const titleForm = document.querySelector<HTMLFormElement>('[data-title-form]');
if (search && titleForm) {
  const results = document.querySelector<HTMLUListElement>('[data-tmdb-results]')!;
  const status = document.querySelector<HTMLElement>('[data-tmdb-status]')!;
  const selected = document.querySelector<HTMLElement>('[data-tmdb-selected]')!;
  const more = document.querySelector<HTMLButtonElement>('[data-tmdb-more]')!;
  const submit = search.querySelector<HTMLButtonElement>('button[type=submit]')!;
  let page = 1, query = '', sequence = 0;
  let controller: AbortController | undefined;
  const api = async (path: string, data: unknown, signal: AbortSignal) => {
    const response = await fetch(`/api/tmdb/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':search.dataset.csrf ?? ''},body:JSON.stringify(data),signal});
    const result = await response.json();
    if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció. Volvé a ingresar para buscar en TMDB.' : result.error);
    return result;
  };
  const setValue = (name: string, value: string | number | null) => {
    const field = titleForm.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (field) { field.value = value === null ? '' : String(value); field.removeAttribute('aria-invalid'); }
    const error = titleForm.querySelector<HTMLElement>(`[data-error-for="${name}"]`); if (error) error.hidden = true;
  };
  const useTitle = async (result: TmdbResult) => {
    if(titleForm.getAttribute('aria-busy') === 'true') return;
    controller?.abort(); controller = new AbortController();
    const current = ++sequence;
    const save = titleForm.querySelector<HTMLButtonElement>('button[type=submit]')!;
    save.disabled = true;
    status.textContent = `Completando la ficha de ${result.title}…`;
    try {
      const data = await api('details',{id:result.tmdbId,kind:result.kind},controller.signal);
      if(current !== sequence) return;
      const metadata = data.metadata as TmdbMetadata;
      for (const name of ['title','originalTitle','year','runtime','genre','summary','poster','backdrop','kind','tmdbId'] as const) setValue(name,metadata[name]);
      const poster = titleForm.querySelector<HTMLImageElement>('[data-poster-preview]')!;
      poster.src = metadata.poster; poster.alt = `Portada de ${metadata.title}`;
      selected.textContent = `Ficha vinculada a TMDB: ${metadata.title}.`;
      selected.hidden = false;
      results.replaceChildren(); more.hidden = true;
      status.textContent = metadata.runtime && metadata.year ? 'Ficha completada. Agregá tu valoración y los datos de visualización.' : 'Ficha completada. TMDB no informa el año o la duración: completá los campos que falten.';
      titleForm.querySelector<HTMLInputElement>('[name=score]')?.focus();
    } catch(error) { if(current === sequence) status.textContent = error instanceof Error && !(error instanceof TypeError) ? error.message : 'No pudimos conectarnos con TMDB. Intentá de nuevo.'; }
    finally { if(current === sequence) save.disabled = false; }
  };
  const findTitles = async (append: boolean) => {
    controller?.abort(); controller = new AbortController();
    const current = ++sequence;
    // A new search cancels any pending detail selection and restores saving.
    titleForm.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = false;
    submit.disabled = true; more.disabled = true; search.setAttribute('aria-busy','true');
    status.textContent = 'Buscando en TMDB…';
    if (!append) results.replaceChildren();
    try {
      const data = await api('search',{query,page},controller.signal);
      if(current !== sequence) return;
      for (const result of data.results as TmdbResult[]) {
        const li = document.createElement('li');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'tmdb-result';
        const image = document.createElement('img'); image.src = result.poster; image.alt = ''; image.width = 48; image.height = 72;
        image.addEventListener('error',()=>{image.src='/images/placeholder.svg';},{once:true});
        const text = document.createElement('span');
        const title = document.createElement('strong'); title.textContent = result.title;
        const facts = document.createElement('span'); facts.textContent = `${result.kind === 'movie' ? 'Película' : 'Serie'} · ${result.year ?? 'Año sin informar'}`;
        text.append(title,facts); button.append(image,text); button.addEventListener('click',()=>void useTitle(result)); li.append(button); results.append(li);
      }
      more.hidden = !data.hasMore;
      status.textContent = results.children.length ? 'Seleccioná la obra para completar su ficha.' : 'No encontramos películas o series con ese nombre. Probá otra búsqueda o cargá la ficha manualmente.';
    } catch(error) { if(current === sequence) {status.textContent = error instanceof Error && !(error instanceof TypeError) ? error.message : 'No pudimos conectarnos con TMDB. Intentá de nuevo.'; more.hidden = true;} }
    finally { if(current === sequence) {submit.disabled = false; more.disabled = false; search.removeAttribute('aria-busy');} }
  };
  search.addEventListener('submit',event=>{event.preventDefault(); query=(search.elements.namedItem('query') as HTMLInputElement).value.trim();page=1;void findTitles(false);});
  more.addEventListener('click',()=>{page+=1;void findTitles(true);});
  titleForm.querySelector<HTMLSelectElement>('[name=kind]')?.addEventListener('change',()=>{setValue('tmdbId','');selected.hidden=true;});
}
