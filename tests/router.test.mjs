import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAboutHash,
  buildCatalogHash,
  buildHomeHash,
  buildPlaneHash,
  parseHash,
} from '../src/router.js';

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

test('builds canonical hashes for each page', () => {
  assert.equal(buildHomeHash(), '#home');
  assert.equal(buildCatalogHash(), '#catalog');
  assert.equal(buildPlaneHash('sky-arrow'), '#plane/sky-arrow/step/0');
  assert.equal(buildPlaneHash('sky-arrow', 3), '#plane/sky-arrow/step/3');
  assert.equal(buildAboutHash(), '#about');
});
