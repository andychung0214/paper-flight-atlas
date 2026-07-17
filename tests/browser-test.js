(function registerBrowserTests(global) {
  'use strict';

  var namespace = global.PaperFlightAtlas || {};
  var boundary = global.__paperFlightAtlasBrowserBoundary || { errors: [], expectedScriptOrder: [] };
  var start = null;

  global.addEventListener('message', function (event) {
    var payload = event && event.data;

    if (payload && payload.type === 'paper-flight-atlas-entry-contract') {
      boundary.entryContract = payload.contract;
      if (start) {
        start();
      }
    }
  });

  function createTest(name, run) {
    return { name: name, run: run };
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || '測試條件不成立');
    }
  }

  function assertEqual(actual, expected, message) {
    assert(actual === expected, message || '值不相等');
  }

  function assertDeepEqual(actual, expected, message) {
    assertEqual(JSON.stringify(actual), JSON.stringify(expected), message || '物件不相等');
  }

  function assertMatch(value, pattern, message) {
    assert(pattern.test(String(value)), message || '文字不符合預期');
  }

  function assertNotMatch(value, pattern, message) {
    assert(!pattern.test(String(value)), message || '文字包含不應出現的內容');
  }

  function countMatches(value, pattern) {
    var matches = String(value).match(pattern);
    return matches ? matches.length : 0;
  }

  function createMemoryStorage(initial) {
    var store = new Map(Object.entries(initial || {}));

    return {
      getItem: function getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem: function setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem: function removeItem(key) {
        store.delete(key);
      },
      dump: function dump() {
        var result = {};
        store.forEach(function (value, key) {
          result[key] = value;
        });
        return result;
      },
    };
  }

  function parseFocusControls(html, documentRef) {
    var controls = new Map();
    var buttonPattern = /<button\b[^>]*>/g;
    var attributePattern = /data-([a-z-]+)="([^"]*)"/g;
    var buttonMatch;

    while ((buttonMatch = buttonPattern.exec(String(html))) !== null) {
      var element = new FakeElement('', documentRef);
      var attributeMatch;

      while ((attributeMatch = attributePattern.exec(buttonMatch[0])) !== null) {
        var key = attributeMatch[1].replace(/-([a-z])/g, function (_, letter) {
          return letter.toUpperCase();
        });
        element.dataset[key] = attributeMatch[2];
      }

      if (element.dataset.focusKey) {
        controls.set(element.dataset.focusKey, element);
      }
    }

    return controls;
  }

  function FakeElement(id, documentRef) {
    this.id = id || '';
    this.documentRef = documentRef || null;
    this.innerHTML = '';
    this.textContent = '';
    this.dataset = {};
    this.content = '';
    this.disabled = false;
    this.focused = false;
  }

  FakeElement.prototype.focus = function focus() {
    this.focused = true;
    if (this.documentRef) {
      this.documentRef.activeElement = this;
    }
  };

  FakeElement.prototype.closest = function closest(selector) {
    if (selector === '[data-action]' && this.dataset.action) {
      return this;
    }

    if (selector === '[data-diagram-dialog]' && this.dataset.diagramDialog) {
      return this;
    }

    return null;
  };

  function FakeDialog(documentRef) {
    FakeElement.call(this, 'diagram-dialog', documentRef);
    this.open = false;
    this.dataset.diagramDialog = 'true';
  }

  FakeDialog.prototype = Object.create(FakeElement.prototype);
  FakeDialog.prototype.constructor = FakeDialog;
  FakeDialog.prototype.showModal = function showModal() {
    this.open = true;
  };
  FakeDialog.prototype.close = function close() {
    this.open = false;
  };
  FakeDialog.prototype.setAttribute = function setAttribute(name) {
    if (name === 'open') {
      this.open = true;
    }
  };
  FakeDialog.prototype.removeAttribute = function removeAttribute(name) {
    if (name === 'open') {
      this.open = false;
    }
  };

  function FakeDocument(options) {
    var settings = options || {};
    var self = this;

    this.title = '初始標題';
    this.documentElement = { dataset: {} };
    this.listeners = new Map();
    this.focusControls = new Map();
    this.activeElement = null;
    this.meta = new Map();
    this.dialog = new FakeDialog(this);

    var appRoot = new FakeElement('app', this);
    Object.defineProperty(appRoot, 'innerHTML', {
      configurable: true,
      get: function get() {
        return self.appHtml || '';
      },
      set: function set(html) {
        self.appHtml = html;
        self.focusControls = parseFocusControls(html, self);
      },
    });

    this.nodes = new Map([
      ['app', appRoot],
      ['live-region', new FakeElement('live-region', this)],
    ]);

    if (settings.includeMetadata !== false) {
      [
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]',
        'meta[name="theme-color"]',
      ].forEach(function (selector) {
        self.meta.set(selector, new FakeElement('', self));
      });
    }
  }

  FakeDocument.prototype.getElementById = function getElementById(id) {
    return this.nodes.get(id) || null;
  };

  FakeDocument.prototype.querySelector = function querySelector(selector) {
    var focusMatch = /^\[data-focus-key="([^"]+)"\]$/.exec(selector);

    if (focusMatch) {
      return this.focusControls.get(focusMatch[1]) || null;
    }

    if (selector === '[data-diagram-dialog]') {
      return this.dialog;
    }

    return this.meta.get(selector) || null;
  };

  FakeDocument.prototype.addEventListener = function addEventListener(type, handler) {
    var listeners = this.listeners.get(type) || [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  };

  FakeDocument.prototype.dispatch = function dispatch(type, event) {
    (this.listeners.get(type) || []).forEach(function (handler) {
      handler(event || {});
    });
  };

  function FakeWindow(hash, storage) {
    this.location = { hash: hash || '#home' };
    this.localStorage = storage || createMemoryStorage();
    this.listeners = new Map();
  }

  FakeWindow.prototype.addEventListener = function addEventListener(type, handler) {
    var listeners = this.listeners.get(type) || [];
    listeners.push(handler);
    this.listeners.set(type, listeners);
  };

  FakeWindow.prototype.dispatch = function dispatch(type) {
    (this.listeners.get(type) || []).forEach(function (handler) {
      handler();
    });
  };

  function FakeActionTarget(dataset, options) {
    var settings = options || {};
    this.dataset = dataset || {};
    this.disabled = settings.disabled || false;
    this.focused = false;
  }

  FakeActionTarget.prototype.closest = function closest(selector) {
    return selector === '[data-action]' ? this : null;
  };

  FakeActionTarget.prototype.focus = function focus() {
    this.focused = true;
  };

  function getApi() {
    return {
      data: namespace.data,
      diagrams: namespace.diagrams,
      router: namespace.router,
      storage: namespace.storage,
      render: namespace.render,
      app: namespace.app,
    };
  }

  function testScriptBoundary() {
    var entryContract = boundary.entryContract;
    var expected = boundary.expectedScriptOrder;
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script[data-app-script]'));
    var actual = scripts.map(function (script) {
      return script.getAttribute('src');
    });

    assertDeepEqual(actual, expected, '腳本順序不符');
    scripts.forEach(function (script, index) {
      assertEqual(script.getAttribute('type') || '', '', '第 ' + (index + 1) + ' 支腳本不可使用 type=module');
    });
    assert(!document.querySelector('[data-app-root]'), '測試頁不可自動掛載應用程式');
    assert(document.getElementById('test-summary'), '缺少測試摘要');
    assert(document.getElementById('test-results'), '缺少測試結果區');

    assert(entryContract, '尚未收到入口頁契約訊息');
    assertEqual(entryContract.lang, 'zh-Hant', '入口頁 lang 不正確');
    assertEqual(entryContract.hasViewport, true, '入口頁缺少 viewport');
    assertEqual(entryContract.hasDescription, true, '入口頁缺少 description');
    assertEqual(entryContract.hasCanonical, true, '入口頁缺少 canonical');
    assertEqual(entryContract.hasOgTitle, true, '入口頁缺少 Open Graph title');
    assertEqual(entryContract.hasOgDescription, true, '入口頁缺少 Open Graph description');
    assertEqual(entryContract.hasTwitterCard, true, '入口頁缺少 Twitter card');
    assertEqual(entryContract.hasProductSchema, true, '入口頁缺少 Product JSON-LD');
    assertEqual(entryContract.hasSkipLink, true, '入口頁缺少 Skip Link');
    assertEqual(entryContract.hasAppRoot, true, '入口頁缺少 app root 契約');
    var entryScriptSources = entryContract.scriptSources;
    var entryExpected = expected.map(function (source) {
      return source.replace('../', './');
    });
    assertDeepEqual(entryScriptSources, entryExpected, '入口頁腳本順序不符');
    entryContract.scriptTypes.forEach(function (type) {
      assertEqual(type, '', '入口頁不可使用 type=module');
    });
    assertEqual(entryContract.hasNamespace, true, '入口頁未建立 PaperFlightAtlas');
    assertEqual(entryContract.hasRenderedApp, true, '入口頁未完成掛載');
  }

  function testNamespaceBoundary() {
    assertEqual(boundary.errors.length, 0, boundary.errors.join(' | '));
    var api = getApi();

    [
      ['data.planes', api.data && api.data.planes],
      ['diagrams.renderFoldDiagram', api.diagrams && api.diagrams.renderFoldDiagram],
      ['router.resolveHash', api.router && api.router.resolveHash],
      ['router.parseHash', api.router && api.router.parseHash],
      ['router.buildHomeHash', api.router && api.router.buildHomeHash],
      ['router.buildCatalogHash', api.router && api.router.buildCatalogHash],
      ['router.buildPlaneHash', api.router && api.router.buildPlaneHash],
      ['router.buildAboutHash', api.router && api.router.buildAboutHash],
      ['storage.createPreferenceStore', api.storage && api.storage.createPreferenceStore],
      ['render.escapeHtml', api.render && api.render.escapeHtml],
      ['render.renderHome', api.render && api.render.renderHome],
      ['render.renderCatalog', api.render && api.render.renderCatalog],
      ['render.renderGuide', api.render && api.render.renderGuide],
      ['render.renderAbout', api.render && api.render.renderAbout],
      ['render.renderApp', api.render && api.render.renderApp],
      ['app.mountApp', api.app && api.app.mountApp],
    ].forEach(function (entry) {
      var value = entry[1];
      assert(entry[0] === 'data.planes' ? Array.isArray(value) : typeof value === 'function', '缺少 ' + entry[0]);
    });
  }

  function testPlaneCatalog() {
    var planes = namespace.data.planes;
    var summary = namespace.data.getDifficultySummary();

    assertEqual(planes.length, 8, '機型數量不正確');
    assertDeepEqual(summary.map(function (item) { return item.count; }), [2, 2, 2, 2], '難度分布不正確');
    assertEqual(new Set(planes.map(function (plane) { return plane.id; })).size, 8, '機型 id 必須唯一');

    planes.forEach(function (plane) {
      assert(plane.summary.length > 20, plane.id + ' 缺少完整摘要');
      assert(plane.materials.length >= 2, plane.id + ' 缺少紙材');
      assert(plane.steps.length >= 5, plane.id + ' 步驟不足');
      plane.steps.forEach(function (step) {
        ['title', 'instruction', 'tip', 'commonMistake', 'diagram'].forEach(function (key) {
          assert(typeof step[key] === 'string' && step[key].length > 0, plane.id + ' 缺少 ' + key);
        });
      });
    });

    assertEqual(namespace.data.getPlaneById('sky-arrow').name, 'Sky Arrow');
    assertEqual(namespace.data.getPlaneById('unknown-plane'), undefined);
  }

  function testRouter() {
    var router = namespace.router;

    assertDeepEqual(router.parseHash('#plane/sky-arrow/step/3'), { page: 'plane', id: 'sky-arrow', step: 3 });
    assertDeepEqual(router.parseHash('#not-a-real-route'), { page: 'home' });
    assertDeepEqual(router.resolveHash('#not-a-real-route'), {
      route: { page: 'home' },
      recoveryHash: '#home',
    });
    assertDeepEqual(router.resolveHash('#home'), {
      route: { page: 'home' },
      recoveryHash: null,
    });
    assertEqual(router.buildHomeHash(), '#home');
    assertEqual(router.buildCatalogHash(), '#catalog');
    assertEqual(router.buildPlaneHash('sky-arrow'), '#plane/sky-arrow/step/0');
    assertEqual(router.buildPlaneHash('sky-arrow', 3), '#plane/sky-arrow/step/3');
    assertEqual(router.buildAboutHash(), '#about');
  }

  function testStorage() {
    var storageApi = namespace.storage;
    var preferences = storageApi.createPreferenceStore(createMemoryStorage());

    assertDeepEqual(preferences.getFavorites(), []);
    assertEqual(preferences.isFavorite('sky-arrow'), false);
    assertDeepEqual(preferences.toggleFavorite('sky-arrow'), ['sky-arrow']);
    assertEqual(preferences.isFavorite('sky-arrow'), true);
    assertDeepEqual(preferences.toggleFavorite('sky-arrow'), []);
    assertEqual(preferences.isFavorite('sky-arrow'), false);

    var unavailable = storageApi.createPreferenceStore({
      getItem: function getItem() { throw new Error('storage unavailable'); },
      setItem: function setItem() { throw new Error('storage unavailable'); },
      removeItem: function removeItem() { throw new Error('storage unavailable'); },
    });
    assertEqual(unavailable.getTheme(), 'forest');
    assertEqual(unavailable.setTheme('wine'), 'wine');
    assertDeepEqual(unavailable.toggleFavorite('sky-arrow'), ['sky-arrow']);

    var persisted = storageApi.createPreferenceStore({
      getItem: function getItem(key) {
        return key === 'paper-flight-atlas.theme' ? 'wine' : JSON.stringify(['classic-dart']);
      },
      setItem: function setItem() { throw new Error('storage unavailable'); },
      removeItem: function removeItem() { throw new Error('storage unavailable'); },
    });
    assertEqual(persisted.getTheme(), 'wine');
    assertDeepEqual(persisted.getFavorites(), ['classic-dart']);
    assertEqual(persisted.setTheme('london'), 'london');
    assertDeepEqual(persisted.toggleFavorite('classic-dart'), []);
  }

  function testDiagrams() {
    var diagramApi = namespace.diagrams;
    var ids = ['crease-center', 'fold-nose', 'shape-wing', 'reinforce-body', 'finish-tip', 'master-lock'];

    ids.forEach(function (id) {
      var svg = diagramApi.renderFoldDiagram(id, '將紙張向中心線對摺');
      assertMatch(svg, /^<svg/);
      assertMatch(svg, /role="img"/);
      assertMatch(svg, /aria-label="將紙張向中心線對摺"/);
      assertMatch(svg, /viewBox=/);
      assertNotMatch(svg, /<script/i);
    });

    namespace.data.planes.forEach(function (plane) {
      plane.steps.forEach(function (step) {
        var svg = diagramApi.renderFoldDiagram(step.diagram, plane.name + ' ' + step.title);
        assertMatch(svg, /^<svg/);
        assertMatch(svg, /role="img"/);
      });
    });

    var totalSteps = namespace.data.planes.reduce(function (total, plane) {
      return total + plane.steps.length;
    }, 0);
    assertEqual(totalSteps, 40, '步驟總數必須為 40');

    assertMatch(diagramApi.renderFoldDiagram('invalid', '預設示意圖'), /aria-label="預設示意圖"/);
    assertMatch(diagramApi.renderFoldDiagram('__proto__', '測試'), /^<svg/);
    var unsafe = diagramApi.renderFoldDiagram('crease-center', '中心線 "雙向" & <安全>');
    assertMatch(unsafe, /aria-label="中心線 &quot;雙向&quot; &amp; &lt;安全&gt;"/);
    assertNotMatch(unsafe, /aria-label="[^"]*<[^\"]*"/);
  }

  function testRenderers() {
    var planes = namespace.data.planes;
    var render = namespace.render;
    var escaped = render.escapeHtml('折線 <安全> & "安靜" \'紙張\'');
    assertEqual(escaped, '折線 &lt;安全&gt; &amp; &quot;安靜&quot; &#39;紙張&#39;');

    var home = render.renderHome({ planes: planes, favorites: ['classic-dart', 'wabi-sabi-crane'] });
    assertMatch(home, /紙翼圖鑑/);
    assertMatch(home, /日式侘寂紙工坊/);
    assertMatch(home, /今日推薦/);
    assertMatch(home, /Classic Dart/);
    assertMatch(home, /已收藏 2 張機型/);
    assertMatch(home, /data-hash="#catalog"/);

    var catalog = render.renderCatalog({ planes: planes, favorites: ['classic-dart'] });
    assertEqual(countMatches(catalog, /class="plane-card\b/g), 8);
    assertMatch(catalog, /查看教學/);
    assertMatch(catalog, /收藏/);
    var filtered = render.renderCatalog({ planes: planes, favorites: [], activeDifficulty: 'master' });
    assertEqual(countMatches(filtered, /class="plane-card\b/g), 2);
    assertMatch(filtered, /aria-pressed="true"[^>]*>大師/);
    assertMatch(catalog, /紙樣標本卡/);
    assertNotMatch(catalog, /Paper specimen cards/);

    var guide = render.renderGuide({ plane: planes[1], stepIndex: 2, favorites: [planes[1].id] });
    assertMatch(guide, new RegExp(planes[1].steps[2].title));
    assertMatch(guide, /aria-live="polite"/);
    assertMatch(guide, /第 3 步 \/ 共 5 步/);
    assertMatch(guide, /<svg[\s\S]*role="img"/);
    assertMatch(guide, /摺紙提醒/);
    assertMatch(guide, /常見失手/);
    assertMatch(guide, /data-action="step"/);

    var dialogGuide = render.renderGuide({ plane: planes[0], stepIndex: 1, favorites: [] });
    assertMatch(dialogGuide, /data-action="open-diagram"/);
    assertMatch(dialogGuide, /aria-haspopup="dialog"/);
    assertMatch(dialogGuide, /aria-controls="diagram-dialog-classic-dart-1"/);
    assertMatch(dialogGuide, /<dialog[^>]+id="diagram-dialog-classic-dart-1"/);
    assertEqual(countMatches(dialogGuide, /<svg\b/g), 2);

    var about = render.renderAbout();
    assertMatch(about, /紙材安全提示/);
    assertMatch(about, /請避開潮濕紙張與過度鋒利的紙角/);
    assertMatch(about, /內容授權與使用說明/);
    assertMatch(about, /MIT License/);
    assertMatch(about, /href="\.\/LICENSE"/);
    assertMatch(about, /工坊筆記/);
    assertMatch(about, /典藏說明/);
    assertNotMatch(about, /Workshop notes|Archive/);

    var missing = render.renderApp({
      route: { page: 'plane', id: 'missing-plane', step: 2 },
      planes: planes,
      theme: 'forest',
      favorites: [],
    });
    assertMatch(missing.title, /找不到機型｜紙翼圖鑑/);
    assertEqual(missing.page, 'catalog');
    assertMatch(missing.html, /data-page="catalog"/);
    assertNotMatch(missing.html, /data-page="plane"/);

    var unsafePlane = Object.assign({}, planes[0], {
      name: '<紙翼 & 樣本>',
      summary: '試著避開 <script> 與未轉義標記。',
      flightTraits: ['安定 & 延展'],
      materials: ['A4 <薄紙>'],
      steps: [Object.assign({}, planes[0].steps[0], {
        title: '對齊 <中心線>',
        instruction: '先向內 & 再壓平。',
        tip: '保持 "安靜" 的手勢。',
        commonMistake: '不要插入 <b> 標籤。</b>',
      })],
    });
    var unsafeApp = render.renderApp({
      route: { page: 'plane', id: unsafePlane.id, step: 0 },
      planes: [unsafePlane].concat(planes.slice(1)),
      theme: 'wine',
      favorites: [unsafePlane.id],
    });
    assertMatch(unsafeApp.html, /&lt;紙翼 &amp; 樣本&gt;/);
    assertMatch(unsafeApp.html, /對齊 &lt;中心線&gt;/);
    assertMatch(unsafeApp.html, /A4 &lt;薄紙&gt;/);
    assertNotMatch(unsafeApp.html, /<script/i);
    assertNotMatch(unsafeApp.html, /<b> 標籤/);
  }

  function testMountAndInteractions() {
    var storage = createMemoryStorage({
      'paper-flight-atlas.theme': 'wine',
      'paper-flight-atlas.favorites': JSON.stringify(['classic-dart']),
    });
    var documentRef = new FakeDocument();
    var windowRef = new FakeWindow('#plane/classic-dart/step/1', storage);

    namespace.app.mountApp(documentRef, windowRef);

    var app = documentRef.getElementById('app');
    var description = documentRef.querySelector('meta[name="description"]');
    var ogTitle = documentRef.querySelector('meta[property="og:title"]');
    var twitterDescription = documentRef.querySelector('meta[name="twitter:description"]');
    assertMatch(documentRef.title, /Classic Dart｜紙翼圖鑑教學/);
    assertMatch(description.content, /第 2 步/);
    assertMatch(ogTitle.content, /Classic Dart｜紙翼圖鑑教學/);
    assertMatch(twitterDescription.content, /第 2 步/);
    assertEqual(documentRef.documentElement.dataset.theme, 'wine');
    assertMatch(app.innerHTML, /data-page="plane"/);
    assertMatch(app.innerHTML, /收藏中/);
    assertMatch(documentRef.getElementById('live-region').textContent, /Classic Dart｜紙翼圖鑑教學/);

    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'theme', theme: 'london' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(documentRef.documentElement.dataset.theme, 'london');
    assertEqual(storage.dump()['paper-flight-atlas.theme'], 'london');
    assertMatch(app.innerHTML, /data-theme="london"/);

    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'favorite', planeId: 'classic-dart' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(storage.dump()['paper-flight-atlas.favorites'], undefined);
    assertMatch(app.innerHTML, /加入收藏/);
    assertMatch(app.innerHTML, /第 2 步 \/ 共 5 步/);

    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'navigate', hash: '#catalog' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(windowRef.location.hash, '#catalog');
    windowRef.dispatch('hashchange');
    assertMatch(documentRef.title, /機型圖鑑｜紙翼圖鑑/);
    assertMatch(app.innerHTML, /data-page="catalog"/);
    assertEqual(countMatches(app.innerHTML, /class="plane-card\b/g), 8);

    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'filter', difficulty: 'master', focusKey: 'filter:master' }),
      preventDefault: function preventDefault() {},
    });
    assertMatch(app.innerHTML, /aria-pressed="true"[^>]*>大師/);
    assertEqual(countMatches(app.innerHTML, /class="plane-card\b/g), 2);

    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'step', hash: '#plane/classic-dart/step/2' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(windowRef.location.hash, '#plane/classic-dart/step/2');
    windowRef.dispatch('hashchange');
    assertMatch(description.content, /第 3 步/);
    assertMatch(app.innerHTML, /第 3 步 \/ 共 5 步/);
  }

  function testFocusSkipAndDialog() {
    var scenarios = [
      { hash: '#catalog', focusKey: 'favorite:classic-dart' },
      { hash: '#catalog', focusKey: 'filter:basic' },
      { hash: '#home', focusKey: 'theme:wine' },
    ];

    scenarios.forEach(function (scenario) {
      var documentRef = new FakeDocument();
      var windowRef = new FakeWindow(scenario.hash);
      namespace.app.mountApp(documentRef, windowRef);
      var original = documentRef.querySelector('[data-focus-key="' + scenario.focusKey + '"]');
      assert(original, scenario.focusKey + ' 應該有可恢復的焦點控制項');
      documentRef.dispatch('click', {
        target: original,
        preventDefault: function preventDefault() {},
      });
      var replacement = documentRef.querySelector('[data-focus-key="' + scenario.focusKey + '"]');
      assert(replacement !== original, scenario.focusKey + ' 應該被重新建立');
      assertEqual(documentRef.activeElement, replacement, scenario.focusKey + ' 應恢復焦點');
    });

    var routeDocument = new FakeDocument();
    var routeWindow = new FakeWindow('#home');
    namespace.app.mountApp(routeDocument, routeWindow);
    routeDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'navigate', hash: '#catalog', focusKey: 'nav:catalog' }),
      preventDefault: function preventDefault() {},
    });
    routeWindow.dispatch('hashchange');
    assertEqual(
      routeDocument.activeElement,
      routeDocument.querySelector('[data-focus-key="nav:catalog"]'),
      '主要導覽跨路由後應恢復焦點',
    );

    var stepDocument = new FakeDocument();
    var stepWindow = new FakeWindow('#plane/classic-dart/step/0');
    namespace.app.mountApp(stepDocument, stepWindow);
    stepDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'step', hash: '#plane/classic-dart/step/1', focusKey: 'step:next' }),
      preventDefault: function preventDefault() {},
    });
    stepWindow.dispatch('hashchange');
    assertEqual(
      stepDocument.activeElement,
      stepDocument.querySelector('[data-focus-key="step:next"]'),
      '教學步驟切換後應恢復焦點',
    );

    var skipDocument = new FakeDocument();
    var skipWindow = new FakeWindow('#catalog');
    namespace.app.mountApp(skipDocument, skipWindow);
    var skipPrevented = false;
    skipDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'skip' }),
      preventDefault: function preventDefault() { skipPrevented = true; },
    });
    assertEqual(skipPrevented, true);
    assertEqual(skipWindow.location.hash, '#catalog');
    assertEqual(skipDocument.activeElement, skipDocument.getElementById('app'));

    var documentRef = new FakeDocument();
    var windowRef = new FakeWindow('#plane/classic-dart/step/2');
    namespace.app.mountApp(documentRef, windowRef);
    var buttonOpener = new FakeActionTarget({ action: 'open-diagram' });
    documentRef.dispatch('click', { target: buttonOpener, preventDefault: function preventDefault() {} });
    assertEqual(documentRef.dialog.open, true);
    documentRef.dispatch('click', {
      target: new FakeActionTarget({ action: 'close-diagram' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(documentRef.dialog.open, false);
    assertEqual(buttonOpener.focused, true);

    var escapeOpener = new FakeActionTarget({ action: 'open-diagram' });
    documentRef.dispatch('click', { target: escapeOpener, preventDefault: function preventDefault() {} });
    var cancelPrevented = false;
    documentRef.dispatch('cancel', {
      target: documentRef.dialog,
      preventDefault: function preventDefault() { cancelPrevented = true; },
    });
    assertEqual(cancelPrevented, true);
    assertEqual(documentRef.dialog.open, false);
    assertEqual(escapeOpener.focused, true);
    assertEqual(windowRef.location.hash, '#plane/classic-dart/step/2');
  }

  function testHashchangeFocusRestoration() {
    var navigationDocument = new FakeDocument();
    var navigationWindow = new FakeWindow('#home');
    namespace.app.mountApp(navigationDocument, navigationWindow);
    navigationDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'navigate', hash: '#catalog', focusKey: 'nav:catalog' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(navigationWindow.location.hash, '#catalog');
    navigationWindow.dispatch('hashchange');
    var restoredNavigation = navigationDocument.querySelector('[data-focus-key="nav:catalog"]');
    assert(restoredNavigation, '缺少可恢復的主要導覽 focus key');
    assertEqual(
      navigationDocument.activeElement,
      restoredNavigation,
      '主要導覽跨 hashchange 後應恢復到對應導覽控制項',
    );

    var guideDocument = new FakeDocument();
    var guideWindow = new FakeWindow('#plane/classic-dart/step/1');
    namespace.app.mountApp(guideDocument, guideWindow);
    guideDocument.dispatch('click', {
      target: new FakeActionTarget({
        action: 'step',
        hash: '#plane/classic-dart/step/2',
        focusKey: 'step:next',
      }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(guideWindow.location.hash, '#plane/classic-dart/step/2');
    guideWindow.dispatch('hashchange');
    var restoredNextStep = guideDocument.querySelector('[data-focus-key="step:next"]');
    assert(restoredNextStep, '缺少可恢復的下一則 focus key');
    assertEqual(
      guideDocument.activeElement,
      restoredNextStep,
      '教學 step 跨 hashchange 後應恢復到下一則控制項',
    );

    guideDocument.dispatch('click', {
      target: new FakeActionTarget({
        action: 'step',
        hash: '#plane/classic-dart/step/1',
        focusKey: 'step:previous',
      }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(guideWindow.location.hash, '#plane/classic-dart/step/1');
    guideWindow.dispatch('hashchange');
    var restoredPreviousStep = guideDocument.querySelector('[data-focus-key="step:previous"]');
    assert(restoredPreviousStep, '缺少可恢復的上一則 focus key');
    assertEqual(
      guideDocument.activeElement,
      restoredPreviousStep,
      '教學 step 跨 hashchange 後應恢復到上一則控制項',
    );
  }

  function testFallbacksAndPageContract() {
    var missingMetadata = new FakeDocument({ includeMetadata: false });
    var missingMetadataWindow = new FakeWindow('#not-a-real-route');
    namespace.app.mountApp(missingMetadata, missingMetadataWindow);
    assertMatch(missingMetadata.title, /紙翼圖鑑/);
    assertMatch(missingMetadata.getElementById('app').innerHTML, /紙翼圖鑑/);
    assertEqual(missingMetadata.documentElement.dataset.page, 'home');

    var throwingWindow = new FakeWindow('#home');
    Object.defineProperty(throwingWindow, 'localStorage', {
      configurable: true,
      get: function get() { throw new Error('localStorage blocked'); },
    });
    var throwingDocument = new FakeDocument();
    namespace.app.mountApp(throwingDocument, throwingWindow);
    throwingDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'theme', theme: 'wine' }),
      preventDefault: function preventDefault() {},
    });
    throwingDocument.dispatch('click', {
      target: new FakeActionTarget({ action: 'favorite', planeId: 'classic-dart' }),
      preventDefault: function preventDefault() {},
    });
    assertEqual(throwingDocument.documentElement.dataset.theme, 'wine');
    assertMatch(throwingDocument.getElementById('app').innerHTML, /已收藏 1 張機型/);

    var skipLink = document.querySelector('a[href="#test-results"][data-action="skip"]');
    assert(skipLink, '測試頁應提供 Skip Link');
    assert(document.querySelector('meta[name="viewport"]'), '測試頁應有 viewport');
    assertMatch(document.title, /瀏覽器測試/);
    assertNotMatch(document.body.textContent, /視圖|質量|創建|集成|文檔/);
  }

  var tests = [
    createTest('入口頁與測試頁符合瀏覽器原生腳本邊界', testScriptBoundary),
    createTest('腳本載入與 PaperFlightAtlas API 邊界正確', testNamespaceBoundary),
    createTest('圖鑑有八種機型、四個難度與完整步驟', testPlaneCatalog),
    createTest('雜湊路由能解析、備援並建立標準網址', testRouter),
    createTest('收藏、主題與儲存失效備援可運作', testStorage),
    createTest('全部四十個步驟圖與安全 SVG 可產生', testDiagrams),
    createTest('首頁、圖鑑、教學、關於與安全文字可產生', testRenderers),
    createTest('掛載、導覽、收藏、主題與篩選互動可運作', testMountAndInteractions),
    createTest('Skip Link、焦點恢復、dialog 與取消操作可運作', testFocusSkipAndDialog),
    createTest('主要導覽與教學步驟跨 hashchange 焦點可恢復', testHashchangeFocusRestoration),
    createTest('未知路由、缺少中繼資料、儲存失效與頁面契約可運作', testFallbacksAndPageContract),
  ];

  function addResult(listNode, status, name, detail) {
    var item = document.createElement('li');
    item.className = status;
    item.textContent = status === 'pass'
      ? 'PASS：' + name
      : 'FAIL：' + name + ' — ' + detail;
    listNode.appendChild(item);
  }

  function run() {
    var summaryNode = document.getElementById('test-summary');
    var resultsNode = document.getElementById('test-results');
    var passed = 0;

    resultsNode.innerHTML = '';
    tests.forEach(function (testCase) {
      try {
        testCase.run();
        passed += 1;
        addResult(resultsNode, 'pass', testCase.name, '');
      } catch (error) {
        addResult(resultsNode, 'fail', testCase.name, error && error.message ? error.message : '未知錯誤');
      }
    });

    summaryNode.textContent = passed === tests.length
      ? '全部 ' + tests.length + ' 項測試通過。'
      : '通過 ' + passed + ' / ' + tests.length + ' 項測試。';

    return {
      total: tests.length,
      passed: passed,
      failed: tests.length - passed,
    };
  }

  global.PaperFlightAtlasBrowserTests = { run: run };

  var entryPreview = document.getElementById('entry-preview');
  var testsStarted = false;
  start = function startTests() {
    if (testsStarted) {
      return;
    }

    testsStarted = true;
    if (entryPreview) {
      entryPreview.dataset.testsStarted = 'true';
    }
    run();
  };

  if (entryPreview) {
    entryPreview.addEventListener('load', function () {
      global.setTimeout(start, 100);
    }, { once: true });
    global.setTimeout(start, 3000);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}(window));
