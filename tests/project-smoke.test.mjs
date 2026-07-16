import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const moduleRoot = pathToFileURL(`${root}/`);

function countMatches(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

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
    dump() {
      return Object.fromEntries(store.entries());
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
    this.focused = false;
  }

  focus() {
    this.focused = true;
  }
}

class FakeDialog extends FakeElement {
  constructor() {
    super('diagram-dialog');
    this.open = false;
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  setAttribute(name) {
    if (name === 'open') {
      this.open = true;
    }
  }

  removeAttribute(name) {
    if (name === 'open') {
      this.open = false;
    }
  }

  closest(selector) {
    return selector === '[data-diagram-dialog]' ? this : null;
  }
}

class FakeMetaElement extends FakeElement {}

class FakeDocument {
  constructor({ includeMetadata = true } = {}) {
    this.title = '初始標題';
    this.documentElement = { dataset: {} };
    this.listeners = new Map();
    this.nodes = new Map([
      ['app', new FakeElement('app')],
      ['live-region', new FakeElement('live-region')],
    ]);
    this.dialog = new FakeDialog();
    this.meta = new Map();

    if (includeMetadata) {
      for (const selector of [
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]',
        'meta[name="theme-color"]',
      ]) {
        this.meta.set(selector, new FakeMetaElement());
      }
    }
  }

  getElementById(id) {
    return this.nodes.get(id) ?? null;
  }

  querySelector(selector) {
    if (selector === '[data-diagram-dialog]') {
      return this.dialog;
    }

    return this.meta.get(selector) ?? null;
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event) {
    const listeners = this.listeners.get(type) ?? [];
    for (const handler of listeners) {
      handler(event);
    }
  }
}

class FakeWindow {
  constructor(hash = '#home', storage = createMemoryStorage()) {
    this.location = { hash };
    this.localStorage = storage;
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  }

  dispatch(type) {
    const listeners = this.listeners.get(type) ?? [];
    for (const handler of listeners) {
      handler();
    }
  }
}

class FakeActionTarget {
  constructor(dataset, { disabled = false } = {}) {
    this.dataset = dataset;
    this.disabled = disabled;
    this.focused = false;
  }

  closest(selector) {
    return selector === '[data-action]' ? this : null;
  }

  focus() {
    this.focused = true;
  }
}

test('static project shell exposes required entry and SEO files', () => {
  for (const file of ['index.html', 'styles.css', 'package.json']) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`);
  }
  assert.equal(existsSync(resolve(root, 'og-image.svg')), false, 'og-image.svg should not exist');

  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /<main[^>]+id="app"/);
  assert.match(html, /property="og:title"/);
  assert.ok(!html.includes('property="og:image"'));
  assert.ok(!html.includes('property="og:image:alt"'));
  assert.ok(!html.includes('name="twitter:image"'));
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /type="module"\s+src="\.\/src\/main\.js"/);
});

test('skip link keeps the current route and focuses the main region', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#catalog');
  let prevented = false;

  assert.match(html, /<a[^>]+href="#app"[^>]+data-action="skip"/);
  assert.match(html, /<main[^>]+id="app"[^>]+tabindex="-1"/);

  mountApp(documentRef, windowRef);
  documentRef.dispatch('click', {
    target: new FakeActionTarget({ action: 'skip' }),
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(windowRef.location.hash, '#catalog');
  assert.equal(documentRef.getElementById('app').focused, true);
});

test('delivery documents exist with required Traditional Chinese sections', () => {
  for (const file of [
    'sitemap.xml',
    'robots.txt',
    'README.md',
    'docs/PLAN.md',
    'docs/ART-DIRECTION.md',
    'docs/TEST-PLAN.md',
    'CONTRIBUTING.md',
    'LICENSE',
  ]) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`);
  }

  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  for (const section of ['遊戲介紹', '操作方式', 'GitHub Pages', '已知限制', '授權']) {
    assert.match(readme, new RegExp(section));
  }

  const testPlan = readFileSync(resolve(root, 'docs/TEST-PLAN.md'), 'utf8');
  for (const section of ['行動裝置', '無障礙']) {
    assert.match(testPlan, new RegExp(section));
  }
});

test('historical task report clearly distinguishes stale implementation claims', () => {
  const report = readFileSync(resolve(root, '.superpowers/sdd/task-1-report.md'), 'utf8');

  assert.match(report, /歷史報告（非最終狀態）/);
  assert.match(report, /dataset\.appRoot/);
  assert.match(report, /og:locale/);
  assert.match(report, /目前程式碼與測試/);
});

test('application modules expose the interactive shell contract', async () => {
  const [
    mainModule,
    renderModule,
    routerModule,
    storageModule,
    diagramsModule,
    planesModule,
  ] = await Promise.all([
    import(new URL('./src/main.js', moduleRoot)),
    import(new URL('./src/render.js', moduleRoot)),
    import(new URL('./src/router.js', moduleRoot)),
    import(new URL('./src/storage.js', moduleRoot)),
    import(new URL('./src/diagrams.js', moduleRoot)),
    import(new URL('./src/data/planes.js', moduleRoot)),
  ]);

  assert.equal(typeof mainModule.mountApp, 'function');
  assert.equal(typeof renderModule.renderApp, 'function');
  assert.equal(typeof routerModule.parseHash, 'function');
  assert.equal(typeof storageModule.createPreferenceStore, 'function');
  assert.equal(typeof diagramsModule.renderFoldDiagram, 'function');
  assert.ok(Array.isArray(planesModule.planes));
});

test('mountApp renders from the route, updates metadata, and delegates application actions', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const storage = createMemoryStorage({
    'paper-flight-atlas.theme': 'wine',
    'paper-flight-atlas.favorites': JSON.stringify(['classic-dart']),
  });
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#plane/classic-dart/step/1', storage);

  mountApp(documentRef, windowRef);

  const app = documentRef.getElementById('app');
  const liveRegion = documentRef.getElementById('live-region');
  const description = documentRef.querySelector('meta[name="description"]');
  const ogTitle = documentRef.querySelector('meta[property="og:title"]');
  const twitterDescription = documentRef.querySelector('meta[name="twitter:description"]');

  assert.match(documentRef.title, /Classic Dart｜紙翼圖鑑教學/);
  assert.match(description.content, /第 2 步/);
  assert.match(ogTitle.content, /Classic Dart｜紙翼圖鑑教學/);
  assert.match(twitterDescription.content, /第 2 步/);
  assert.equal(documentRef.documentElement.dataset.theme, 'wine');
  assert.match(app.innerHTML, /data-page="plane"/);
  assert.match(app.innerHTML, /收藏中/);
  assert.match(liveRegion.textContent, /Classic Dart｜紙翼圖鑑教學/);

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'theme',
      theme: 'london',
    }),
    preventDefault() {},
  });

  assert.equal(documentRef.documentElement.dataset.theme, 'london');
  assert.equal(storage.dump()['paper-flight-atlas.theme'], 'london');
  assert.match(app.innerHTML, /data-theme="london"/);

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'favorite',
      planeId: 'classic-dart',
      hash: '#plane/classic-dart/step/1',
    }),
    preventDefault() {},
  });

  assert.equal(storage.dump()['paper-flight-atlas.favorites'], undefined);
  assert.equal(windowRef.location.hash, '#plane/classic-dart/step/1');
  assert.match(app.innerHTML, /加入收藏/);
  assert.match(app.innerHTML, /第 2 步 \/ 共 5 步/);

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'navigate',
      hash: '#catalog',
    }),
    preventDefault() {},
  });

  assert.equal(windowRef.location.hash, '#catalog');
  windowRef.dispatch('hashchange');

  assert.match(documentRef.title, /機型圖鑑｜紙翼圖鑑/);
  assert.match(app.innerHTML, /data-page="catalog"/);
  assert.equal(countMatches(app.innerHTML, /class="plane-card\b/g), 8);

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'filter',
      difficulty: 'master',
    }),
    preventDefault() {},
  });

  assert.match(app.innerHTML, /aria-pressed="true"[^>]*>大師/);
  assert.equal(countMatches(app.innerHTML, /class="plane-card\b/g), 2);

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'step',
      hash: '#plane/classic-dart/step/2',
    }),
    preventDefault() {},
  });

  assert.equal(windowRef.location.hash, '#plane/classic-dart/step/2');
  windowRef.dispatch('hashchange');

  assert.match(description.content, /第 3 步/);
  assert.match(app.innerHTML, /第 3 步 \/ 共 5 步/);
});

test('favorite rerenders a filtered catalog in place', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const storage = createMemoryStorage();
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#catalog', storage);

  mountApp(documentRef, windowRef);
  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'filter',
      difficulty: 'master',
    }),
    preventDefault() {},
  });
  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'favorite',
      planeId: 'origami-falcon',
      hash: '#plane/origami-falcon/step/0',
    }),
    preventDefault() {},
  });

  const app = documentRef.getElementById('app');

  assert.equal(windowRef.location.hash, '#catalog');
  assert.deepEqual(
    JSON.parse(storage.dump()['paper-flight-atlas.favorites']),
    ['origami-falcon'],
  );
  assert.match(app.innerHTML, /aria-pressed="true"[^>]*>大師/);
  assert.equal(countMatches(app.innerHTML, /class="plane-card\b/g), 2);
  assert.match(app.innerHTML, /收藏中/);
});

test('mountApp replaces an unknown hash with the visible home hash', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#not-a-real-route');
  const replacements = [];

  windowRef.history = {
    replaceState(state, title, url) {
      replacements.push({ state, title, url });
      windowRef.location.hash = url;
    },
  };

  mountApp(documentRef, windowRef);

  assert.equal(windowRef.location.hash, '#home');
  assert.deepEqual(replacements, [{ state: null, title: '', url: '#home' }]);
  assert.equal(documentRef.documentElement.dataset.page, 'home');
});

test('diagram dialog closes by button or cancel and restores opener focus', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#plane/classic-dart/step/2');
  const closeTarget = new FakeActionTarget({ action: 'close-diagram' });
  const buttonOpener = new FakeActionTarget({ action: 'open-diagram' });

  mountApp(documentRef, windowRef);
  documentRef.dispatch('click', {
    target: buttonOpener,
    preventDefault() {},
  });

  assert.equal(documentRef.dialog.open, true);

  documentRef.dispatch('click', {
    target: closeTarget,
    preventDefault() {},
  });

  assert.equal(documentRef.dialog.open, false);
  assert.equal(buttonOpener.focused, true);

  const escapeOpener = new FakeActionTarget({ action: 'open-diagram' });
  let cancelPrevented = false;

  documentRef.dispatch('click', {
    target: escapeOpener,
    preventDefault() {},
  });
  documentRef.dispatch('cancel', {
    target: documentRef.dialog,
    preventDefault() {
      cancelPrevented = true;
    },
  });

  assert.equal(cancelPrevented, true);
  assert.equal(documentRef.dialog.open, false);
  assert.equal(escapeOpener.focused, true);
  assert.equal(windowRef.location.hash, '#plane/classic-dart/step/2');
});

test('mountApp tolerates missing metadata elements and still renders fallback content', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const documentRef = new FakeDocument({ includeMetadata: false });
  const windowRef = new FakeWindow('#not-a-real-route');

  assert.doesNotThrow(() => mountApp(documentRef, windowRef));
  assert.match(documentRef.title, /紙翼圖鑑/);
  assert.match(documentRef.getElementById('app').innerHTML, /紙翼圖鑑/);
  assert.equal(documentRef.documentElement.dataset.page, 'home');
});

test('mountApp keeps preferences operable when the localStorage getter throws', async () => {
  const { mountApp } = await import(new URL('./src/main.js', moduleRoot));
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow('#home');

  Object.defineProperty(windowRef, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('localStorage blocked');
    },
  });

  assert.doesNotThrow(() => mountApp(documentRef, windowRef));

  const app = documentRef.getElementById('app');

  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'theme',
      theme: 'wine',
    }),
    preventDefault() {},
  });
  documentRef.dispatch('click', {
    target: new FakeActionTarget({
      action: 'favorite',
      planeId: 'classic-dart',
    }),
    preventDefault() {},
  });

  assert.equal(documentRef.documentElement.dataset.theme, 'wine');
  assert.match(app.innerHTML, /data-theme="wine"/);
  assert.match(app.innerHTML, /已收藏 1 張機型/);
});
