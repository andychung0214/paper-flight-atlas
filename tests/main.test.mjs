import test from 'node:test';
import assert from 'node:assert/strict';

import { mountApp } from '../src/main.js';

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

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.dataset = {};
    this.content = '';
  }
}

class FakeDocument {
  constructor() {
    this.title = '初始標題';
    this.documentElement = { dataset: {} };
    this.listeners = new Map();
    this.nodes = new Map([
      ['app', new FakeElement('app')],
      ['live-region', new FakeElement('live-region')],
    ]);
    this.meta = new Map([
      ['meta[name="description"]', new FakeElement()],
      ['meta[property="og:title"]', new FakeElement()],
      ['meta[property="og:description"]', new FakeElement()],
      ['meta[name="twitter:title"]', new FakeElement()],
      ['meta[name="twitter:description"]', new FakeElement()],
      ['meta[name="theme-color"]', new FakeElement()],
    ]);
  }

  getElementById(id) {
    return this.nodes.get(id) ?? null;
  }

  querySelector(selector) {
    return this.meta.get(selector) ?? null;
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }
}

class FakeWindow {
  constructor(hash = '#home') {
    this.location = { hash };
    this.localStorage = createMemoryStorage();
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }
}

test('mountApp writes the normalized catalog page for a missing plane route', () => {
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#plane/missing-plane/step/2');

  mountApp(documentRef, windowRef);

  assert.equal(windowRef.location.hash, '#catalog');
  assert.equal(documentRef.documentElement.dataset.page, 'catalog');
  assert.match(documentRef.getElementById('app').innerHTML, /data-page="catalog"/);
});
