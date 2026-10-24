import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTmdbDetails, mapTmdbSearch, tmdbImage } from '../src/lib/tmdb.ts';
import { validateTitle } from '../src/lib/title.ts';
test('search excludes people and distinguishes films from series',()=>{
  const result=mapTmdbSearch([{id:1,media_type:'person',name:'Actor'},{id:2,media_type:'movie',title:'Película',release_date:'2024-01-01'},{id:3,media_type:'tv',name:'Serie',first_air_date:'2023-05-01'}]);
  assert.deepEqual(result.map(work=>[work.tmdbId,work.kind,work.year]),[[2,'movie',2024],[3,'tv',2023]]);
});
test('movie metadata never replaces personal rating or viewing information',()=>{
  const metadata=mapTmdbDetails({id:12,title:'Una película',runtime:155,genres:[{name:'Drama'}],overview:'Sinopsis'},'movie');
  assert.equal(metadata.runtime,'155 min');
  for(const field of ['score','watchedOn','platform','note']) assert.equal(field in metadata,false);
});
test('series use episode duration and keep missing duration and year editable',()=>{
  assert.equal(mapTmdbDetails({id:1,name:'Serie',episode_run_time:[50]},'tv').runtime,'50 min por episodio');
  assert.equal(mapTmdbDetails({id:1,name:'Serie',last_episode_to_air:{runtime:47}},'tv').runtime,'47 min por episodio');
  const absent=mapTmdbDetails({id:2,name:'Otra serie'},'tv');
  assert.equal(absent.runtime,'');assert.equal(absent.year,null);
});
test('missing and invalid image paths use the placeholder',()=>{
  assert.equal(tmdbImage(null),'/images/placeholder.svg');
  assert.equal(tmdbImage('//evil.example/image.jpg'),'/images/placeholder.svg');
  assert.equal(tmdbImage('/poster.jpg'),'https://image.tmdb.org/t/p/w500/poster.jpg');
});
test('saved metadata retains TMDB identity and personal score separately',()=>{
  const title=validateTitle({title:'Película',year:2024,kind:'movie',runtime:'120 min',score:7,watchedOn:'2026-10-24',platform:'Cine',tmdbId:'123'});
  assert.equal(title.tmdbId,123);assert.equal(title.mediaType,'movie');assert.equal(title.score,7);
});
