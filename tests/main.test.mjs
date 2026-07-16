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
  constructor(id = '', documentRef = null) {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.dataset = {};
    this.content = '';
    this.documentRef = documentRef;
  }

  closest(selector) {
    return selector === '[data-action]' && this.dataset.action ? this : null;
  }

  focus() {
    this.documentRef.activeElement = this;
  }
}

function parseFocusControls(html, documentRef) {
  const controls = new Map();

  for (const match of String(html).matchAll(/<button\b[^>]*>/g)) {
    const element = new FakeElement('', documentRef);

    for (const attribute of match[0].matchAll(/data-([a-z-]+)="([^"]*)"/g)) {
      const key = attribute[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      element.dataset[key] = attribute[2];
    }

    if (element.dataset.focusKey) {
      controls.set(element.dataset.focusKey, element);
    }
  }

  return controls;
}

class FakeDocument {
  constructor() {
    this.title = '初始標題';
    this.documentElement = { dataset: {} };
    this.listeners = new Map();
    this.focusControls = new Map();
    const appRoot = new FakeElement('app', this);

    Object.defineProperty(appRoot, 'innerHTML', {
      configurable: true,
      get: () => this.appHtml ?? '',
      set: html => {
        this.appHtml = html;
        this.focusControls = parseFocusControls(html, this);
      },
    });

    this.nodes = new Map([
      ['app', appRoot],
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
    const focusKey = selector.match(/^\[data-focus-key="([^"]+)"\]$/)?.[1];

    if (focusKey) {
      return this.focusControls.get(focusKey) ?? null;
    }

    return this.meta.get(selector) ?? null;
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event) {
    for (const handler of this.listeners.get(type) ?? []) {
      handler(event);
    }
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

test('rerender restores focus to the matching replacement preference control', () => {
  const scenarios = [
    { hash: '#catalog', focusKey: 'favorite:classic-dart' },
    { hash: '#catalog', focusKey: 'filter:basic' },
    { hash: '#home', focusKey: 'theme:wine' },
  ];

  for (const { hash, focusKey } of scenarios) {
    const documentRef = new FakeDocument();
    const windowRef = new FakeWindow(hash);

    mountApp(documentRef, windowRef);

    const originalControl = documentRef.querySelector(`[data-focus-key="${focusKey}"]`);
    assert.ok(originalControl, `${focusKey} should be rendered with a controlled focus key`);

    documentRef.dispatch('click', {
      target: originalControl,
      preventDefault() {},
    });

    const replacementControl = documentRef.querySelector(`[data-focus-key="${focusKey}"]`);
    assert.notEqual(replacementControl, originalControl, `${focusKey} should be replaced by innerHTML`);
    assert.equal(documentRef.activeElement, replacementControl, `${focusKey} replacement should receive focus`);
  }
});
