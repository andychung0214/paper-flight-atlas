import test from 'node:test';
import assert from 'node:assert/strict';

import { createPreferenceStore } from '../src/storage.js';

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('toggles favorites repeatedly and keeps a stable favorite list', () => {
  const preferences = createPreferenceStore(createMemoryStorage());

  assert.deepEqual(preferences.getFavorites(), []);
  assert.equal(preferences.isFavorite('sky-arrow'), false);

  assert.deepEqual(preferences.toggleFavorite('sky-arrow'), ['sky-arrow']);
  assert.equal(preferences.isFavorite('sky-arrow'), true);

  assert.deepEqual(preferences.toggleFavorite('sky-arrow'), []);
  assert.equal(preferences.isFavorite('sky-arrow'), false);
});

test('keeps in-memory preferences operable when storage access throws', () => {
  const preferences = createPreferenceStore({
    getItem() {
      throw new Error('storage unavailable');
    },
    setItem() {
      throw new Error('storage unavailable');
    },
    removeItem() {
      throw new Error('storage unavailable');
    },
  });

  assert.equal(preferences.getTheme(), 'forest');
  assert.deepEqual(preferences.getFavorites(), []);
  assert.equal(preferences.isFavorite('sky-arrow'), false);
  assert.equal(preferences.setTheme('wine'), 'wine');
  assert.equal(preferences.getTheme(), 'wine');
  assert.deepEqual(preferences.toggleFavorite('sky-arrow'), ['sky-arrow']);
  assert.deepEqual(preferences.getFavorites(), ['sky-arrow']);
  assert.equal(preferences.isFavorite('sky-arrow'), true);
});

test('preserves loaded preferences in memory when persistence writes fail', () => {
  const persisted = {
    'paper-flight-atlas.theme': 'wine',
    'paper-flight-atlas.favorites': JSON.stringify(['classic-dart']),
  };
  const preferences = createPreferenceStore({
    getItem(key) {
      return persisted[key] ?? null;
    },
    setItem() {
      throw new Error('storage unavailable');
    },
    removeItem() {
      throw new Error('storage unavailable');
    },
  });

  assert.equal(preferences.getTheme(), 'wine');
  assert.deepEqual(preferences.getFavorites(), ['classic-dart']);
  assert.equal(preferences.setTheme('london'), 'london');
  assert.equal(preferences.getTheme(), 'london');
  assert.deepEqual(preferences.toggleFavorite('classic-dart'), []);
  assert.deepEqual(preferences.getFavorites(), []);
});
