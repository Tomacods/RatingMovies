import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTitle, ValidationError, validTitleId } from '../src/lib/title.ts';
import { validMutation, readJson } from '../src/lib/server/security.ts';

const valid = { title: 'Una película', kind: 'movie', year: 2024, runtime: '120 min', score: 8, watchedOn: '2026-10-24', platform: 'Cine' };
test('accepts a title without optional images and preserves personal fields', () => {
  const data = validateTitle(valid);
  assert.equal(data.poster, '/images/placeholder.svg');
  assert.equal(data.score, 8);
  assert.equal(data.platform, 'Cine');
  assert.equal(data.originalTitle, valid.title);
});
for (const [field, value] of [['score', 0], ['score', 11], ['score', 8.5], ['score', ''], ['watchedOn', '2026-02-30'], ['title', '  '], ['kind', 'other'], ['poster', 'javascript:alert(1)'], ['poster', 'http://example.com/a.jpg'], ['backdrop', 'https://user:password@example.com/a.jpg'], ['note', 'x'.repeat(3001)]]) {
  test(`rejects invalid ${field}: ${String(value).slice(0, 45)}`, () => assert.throws(() => validateTitle({...valid, [field as string]: value}), error => error instanceof ValidationError && Boolean(error.fields[field as string])));
}
test('only accepts document ids without path traversal', () => {
  for(const id of ['../private', 'a/b', '', undefined]) assert.equal(validTitleId(id), false);
  assert.equal(validTitleId('a-safe_123'), true);
});
test('requires exact origin and matching CSRF token on mutations', () => {
  const url = new URL('https://ratingmovies.example/api/titles');
  const request = (origin?: string, site = 'same-origin') => new Request(url, { method: 'POST', headers: { ...(origin ? { Origin: origin } : {}), 'Sec-Fetch-Site': site } });
  assert.equal(validMutation(request(url.origin), url, 'secret', 'secret'), true);
  assert.equal(validMutation(request('https://attacker.example'), url, 'secret', 'secret'), false);
  assert.equal(validMutation(request(), url, 'secret', 'secret'), false);
  assert.equal(validMutation(request(url.origin, 'cross-site'), url, 'secret', 'secret'), false);
  assert.equal(validMutation(request(url.origin), url, 'secret', 'other'), false);
  assert.equal(validMutation(request(url.origin), url, '', ''), false);
});
test('rejects oversized or malformed JSON, including absent content length', async () => {
  const request = (body: string) => new Request('https://example.com', {method:'POST', headers:{'Content-Type':'application/json'}, body});
  await assert.rejects(readJson(request(JSON.stringify({note:'x'.repeat(33000)}))));
  await assert.rejects(readJson(request('{')));
  assert.deepEqual(await readJson(request('{"title":"Cine"}')), {title:'Cine'});
});
