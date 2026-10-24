import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign, verify } from 'node:crypto';

test('Firebase Admin loads when the host disables require(ESM), as in Vercel', () => {
  const result = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', "await import('firebase-admin/auth'); await import('firebase-admin/firestore');"], {encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr);
});

test('the compatible JOSE dependency still converts Firebase-style RSA signing keys', async () => {
  const require = createRequire(import.meta.url);
  const sdkRequire = createRequire(require.resolve('firebase-admin/auth'));
  const {retrieveSigningKeys} = sdkRequire('jwks-rsa/src/utils.js');
  const {publicKey,privateKey} = generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk = {...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
  const keys = await retrieveSigningKeys([jwk]);
  assert.equal(keys.length,1);
  assert.equal(keys[0].kid,'test-key');
  const payload = Buffer.from('Firebase signing-key compatibility');
  assert.equal(verify('sha256',payload,keys[0].getPublicKey(),sign('sha256',payload,privateKey)),true);
});
