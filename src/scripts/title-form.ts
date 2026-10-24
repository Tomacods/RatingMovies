import { OTHER_PLATFORM_VALUE } from '../data/platforms';

const form = document.querySelector<HTMLFormElement>('[data-title-form]');
const platformSelect = form?.querySelector<HTMLSelectElement>('[name=platform]');
const otherPlatformField = form?.querySelector<HTMLElement>('[data-other-platform-field]');
const otherPlatformInput = form?.querySelector<HTMLInputElement>('[name=platformOther]');
const updatePlatformField = () => {
  const custom = platformSelect?.value === OTHER_PLATFORM_VALUE;
  if (otherPlatformField) otherPlatformField.hidden = !custom;
  if (otherPlatformInput) { otherPlatformInput.disabled = !custom; otherPlatformInput.required = custom; }
};
platformSelect?.addEventListener('change', updatePlatformField);
updatePlatformField();
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const fields = form.querySelector('fieldset')!;
  if (fields.disabled) return;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const label = button.textContent;
  const message = form.querySelector<HTMLElement>('[data-form-message]')!;
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach(error => error.hidden = true);
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  message.hidden = true;
  const data = Object.fromEntries(new FormData(form));
  if (data.platform === OTHER_PLATFORM_VALUE) data.platform = String(data.platformOther ?? '').trim();
  delete data.platformOther;
  fields.disabled = true; button.textContent = 'Guardando…'; form.setAttribute('aria-busy', 'true');
  try {
    const id = form.dataset.id;
    const response = await fetch(id ? `/api/titles/${encodeURIComponent(id)}` : '/api/titles', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': form.dataset.csrf ?? '' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) {
      for (const [name, text] of Object.entries(result.fields ?? {})) {
        const error = form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(name)}"]`);
        if (error) { error.textContent = String(text); error.hidden = false; }
        form.querySelector(`[name="${CSS.escape(name)}"]`)?.setAttribute('aria-invalid', 'true');
      }
      throw new Error(response.status === 401 ? 'Tu sesión venció. Abrí Ingresar en otra pestaña; tus datos siguen acá.' : result.error);
    }
    window.location.assign(`/titulos/${encodeURIComponent(result.slug)}`);
  } catch (error) {
    message.textContent = error instanceof Error && !(error instanceof TypeError) ? error.message : 'No pudimos conectarnos. Tus datos siguen en el formulario; intentá de nuevo.';
    message.hidden = false; message.focus();
  } finally { fields.disabled = false; button.textContent = label; form.removeAttribute('aria-busy'); }
});
const poster = document.querySelector<HTMLImageElement>('[data-poster-preview]');
document.querySelector<HTMLInputElement>('[name=poster]')?.addEventListener('change', event => {
  const value = (event.target as HTMLInputElement).value.trim();
  if (poster) poster.src = value.startsWith('https://') ? value : '/images/placeholder.svg';
});
