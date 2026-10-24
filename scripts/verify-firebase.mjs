// Opt-in integration test against the configured local app and Firebase project.
// Creates only clearly named temporary records and removes them in finally.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.loadEnvFile('.env.local');
if (process.env.RUN_FIREBASE_INTEGRATION !== '1') throw new Error('Set RUN_FIREBASE_INTEGRATION=1 to run this cloud integration check.');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4321';
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID }, 'integration-check');
const auth = getAuth(app), db = getFirestore(app);
const temporaryUid = `ratingmovies-test-${randomUUID()}`;
const testTitle = `[Prueba temporal] ${randomUUID()}`;
let slug, session, csrf, csrfCookie, step = 'initialization', temporaryUserCreated = false;
function pass(name) { console.log(`OK: ${name}`); }
async function loginToken(uid) {
  const customToken = await auth.createCustomToken(uid);
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.PUBLIC_FIREBASE_API_KEY}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token:customToken,returnSecureToken:true}) });
  assert.equal(response.status, 200, 'Firebase token exchange failed');
  return (await response.json()).idToken;
}
const request = (path, method, body, options = {}) => fetch(base + path, {
  method, redirect:'manual', headers:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':csrf, Cookie: [csrfCookie, options.anonymous ? '' : session].filter(Boolean).join('; '), ...options.headers}, body: body === undefined ? undefined : JSON.stringify(body)
});
try {
  step = 'csrf';
  const loginPage = await fetch(base+'/ingresar');
  const html = await loginPage.text();
  csrf = html.match(/data-csrf="([a-f0-9]+)"/)?.[1];
  assert.ok(csrf);
  csrfCookie = loginPage.headers.getSetCookie().find(value => value.startsWith('rm_csrf='))?.split(';')[0];
  assert.ok(csrfCookie);
  step = 'anonymous access';
  for(const [path,method] of [['/api/titles','POST'],['/api/titles/forbidden','PUT'],['/api/titles/forbidden','DELETE'],['/api/logout','POST'],['/api/tmdb/search','POST'],['/api/tmdb/details','POST']]) assert.equal((await request(path,method,{}, {anonymous:true})).status,401);
  assert.equal((await request('/api/session','POST',{idToken:'forged'})).status,401);
  pass('anonymous requests and forged tokens denied');
  step = 'non-administrator access';
  await auth.createUser({uid:temporaryUid}); temporaryUserCreated = true;
  const nonAdminToken = await loginToken(temporaryUid);
  assert.equal((await request('/api/session','POST',{idToken:nonAdminToken})).status,403);
  pass('valid Firebase user with another UID denied');
  step = 'administrator session';
  const adminToken = await loginToken(process.env.FIREBASE_ADMIN_UID);
  const sessionResponse = await request('/api/session','POST',{idToken:adminToken});
  assert.equal(sessionResponse.status,200);
  const cookie = sessionResponse.headers.getSetCookie().find(value=>value.startsWith('rm_session='));
  assert.ok(cookie?.toLowerCase().includes('httponly'));
  session = cookie.split(';')[0];
  assert.equal((await request('/administrar','GET')).status,200);
  pass('administrator accepted; HttpOnly session grants administration');
  step = 'CSRF protection';
  for (const headers of [{'X-CSRF-Token':'wrong'}, {Origin:'https://attacker.example'}, {'Sec-Fetch-Site':'cross-site'}]) assert.equal((await request('/api/titles','POST',{}, {headers})).status,403);
  pass('forged origin and CSRF tokens denied');
  let metadata = {};
  if (process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY) {
    step = 'TMDB movie search and details';
    const search = await request('/api/tmdb/search','POST',{query:'Interstellar'});
    assert.equal(search.status,200);
    const movie = (await search.json()).results.find(result=>result.kind==='movie');
    assert.ok(movie);
    const details = await request('/api/tmdb/details','POST',{id:movie.tmdbId,kind:movie.kind});
    assert.equal(details.status,200);
    metadata = (await details.json()).metadata;
    assert.equal(metadata.tmdbId,movie.tmdbId);
    assert.ok(metadata.poster.startsWith('https://image.tmdb.org/'));
    assert.ok(metadata.runtime.endsWith(' min'));
    const seriesSearch = await request('/api/tmdb/search','POST',{query:'Severance'});
    assert.equal(seriesSearch.status,200);
    const series = (await seriesSearch.json()).results.find(result=>result.kind==='tv');
    assert.ok(series);
    const seriesDetails = await request('/api/tmdb/details','POST',{id:series.tmdbId,kind:'tv'});
    assert.equal(seriesDetails.status,200);
    const seriesMetadata = (await seriesDetails.json()).metadata;
    assert.equal(seriesMetadata.kind,'tv');
    assert.ok(!seriesMetadata.runtime || seriesMetadata.runtime.endsWith(' por episodio'));
    pass('real TMDB movie and series searches populate details with the correct runtime meaning');
  }
  step = 'server validation';
  const entry = {...metadata,title:testTitle,kind:'movie',year:2024,runtime:'120 min',score:8,watchedOn:'2026-10-24',platform:'Prueba automática',summary:'Registro temporal de verificación.',note:'Se elimina al terminar.'};
  const invalid = await request('/api/titles','POST',{...entry,score:8.5});
  assert.equal(invalid.status,422);
  assert.ok((await invalid.json()).fields.score);
  pass('non-integer ratings rejected by the server');
  step = 'create';
  const saved = await request('/api/titles','POST',entry);
  assert.equal(saved.status,201);
  slug = (await saved.json()).slug;
  assert.equal((await db.collection('titles').doc(slug).get()).data().score,8);
  if (metadata.tmdbId) assert.equal((await db.collection('titles').doc(slug).get()).data().tmdbId, metadata.tmdbId);
  const publicDetail = await fetch(base+'/titulos/'+slug);
  assert.equal(publicDetail.status,200);
  assert.ok((await publicDetail.text()).includes(testTitle));
  assert.ok((await (await fetch(base+'/catalogo')).text()).includes(testTitle));
  assert.ok((await (await fetch(base+'/')).text()).includes(testTitle.toUpperCase()));
  pass('save persists in Firestore and appears on detail, catalog and home without authentication');
  step = 'edit';
  assert.equal((await request('/api/titles/'+slug,'PUT',{...entry,score:9,note:'Nota editada para la prueba.'})).status,200);
  assert.equal((await db.collection('titles').doc(slug).get()).data().score,9);
  assert.ok((await (await fetch(base+'/titulos/'+slug)).text()).includes('Nota editada para la prueba.'));
  if (metadata.tmdbId) {
    assert.equal((await request('/api/titles/'+slug,'PUT',{...entry,tmdbId:'',kind:'tv'})).status,200);
    const manual = (await db.collection('titles').doc(slug).get()).data();
    assert.equal('tmdbId' in manual,false);
    assert.equal('mediaType' in manual,false);
  }
  pass('edit persists and updates the public detail');
  step = 'delete';
  assert.equal((await request('/api/titles/'+slug,'DELETE')).status,200);
  assert.equal((await db.collection('titles').doc(slug).get()).exists,false);
  assert.equal((await fetch(base+'/titulos/'+slug)).status,404);
  pass('delete removes only the test record and its public detail');
  step = 'logout';
  assert.equal((await request('/api/logout','POST')).status,200);
  assert.equal((await request('/api/titles','POST',entry)).status,401);
  assert.equal((await request('/administrar','GET')).status,303);
  pass('logout invalidates the server session, including replay of its previous cookie');
} finally {
  if (slug) await db.collection('titles').doc(slug).delete();
  if (session) await request('/api/logout','POST').catch(()=>{});
  if (temporaryUserCreated) await auth.deleteUser(temporaryUid);
  console.log(`Cleanup complete; last step: ${step}`);
}
