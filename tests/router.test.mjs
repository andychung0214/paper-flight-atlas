import test from 'node:test';
import assert from 'node:assert/strict';

import * as routerModule from '../src/router.js';

const {
  buildAboutHash,
  buildCatalogHash,
  buildHomeHash,
  buildPlaneHash,
  parseHash,
} = routerModule;

test('parses a plane step hash into a plane route', () => {
  assert.deepEqual(parseHash('#plane/sky-arrow/step/3'), {
    page: 'plane',
    id: 'sky-arrow',
    step: 3,
  });
});

test('falls back to home for an unknown route', () => {
  assert.deepEqual(parseHash('#not-a-real-route'), {
    page: 'home',
  });
});

test('resolves unknown routes with a visible home hash recovery', () => {
  assert.equal(typeof routerModule.resolveHash, 'function');
  assert.deepEqual(routerModule.resolveHash('#not-a-real-route'), {
    route: { page: 'home' },
    recoveryHash: '#home',
  });
  assert.deepEqual(routerModule.resolveHash('#home'), {
    route: { page: 'home' },
    recoveryHash: null,
  });
});

test('builds canonical hashes for each page', () => {
  assert.equal(buildHomeHash(), '#home');
  assert.equal(buildCatalogHash(), '#catalog');
  assert.equal(buildPlaneHash('sky-arrow'), '#plane/sky-arrow/step/0');
  assert.equal(buildPlaneHash('sky-arrow', 3), '#plane/sky-arrow/step/3');
  assert.equal(buildAboutHash(), '#about');
});
