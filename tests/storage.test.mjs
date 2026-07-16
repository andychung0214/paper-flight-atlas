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

test('falls back to defaults when storage throws', () => {
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
  assert.equal(preferences.setTheme('wine'), 'forest');
  assert.deepEqual(preferences.toggleFavorite('sky-arrow'), []);
});
