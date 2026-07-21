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

  function testUniqueDiagramKeys() {
    var api = namespace.data;
    var keys = [];

    api.planes.forEach(function (plane) {
      plane.steps.forEach(function (step, stepIndex) {
        var expectedKey = plane.id + '-0' + (stepIndex + 1);
        assertEqual(step.diagram, expectedKey, plane.name + ' 第 ' + (stepIndex + 1) + ' 步圖解鍵值應對應機型與順序');
        keys.push(step.diagram);
      });
    });

    assertEqual(keys.length, 40, '應有四十個步驟圖解鍵值');
    assertEqual(new Set(keys).size, 40, '四十個圖解鍵值不得重複');
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
    var requiredDiagramMarkers = [
      'data-diagram-key=',
      'class="diagram-before"',
      'class="diagram-after"',
      'class="diagram-moving"',
      'class="diagram-crease"',
      'class="diagram-result-crease"',
      'class="diagram-direction"',
      'class="diagram-alignment"',
      'class="diagram-hint"',
      '<title>',
      '<desc>',
      '>折前<',
      '>折後<',
    ];

    namespace.data.planes.forEach(function (plane) {
      plane.steps.forEach(function (step, stepIndex) {
        var svg = diagramApi.renderFoldDiagram(step.diagram, plane.name + ' ' + step.title);
        requiredDiagramMarkers.forEach(function (marker) {
          assert(svg.includes(marker), step.diagram + ' 缺少 ' + marker);
        });
        assert(svg.includes('data-diagram-key="' + step.diagram + '"'), step.diagram + ' 應保留可追蹤鍵值');
      });
    });

    var totalSteps = namespace.data.planes.reduce(function (total, plane) {
      return total + plane.steps.length;
    }, 0);
    assertEqual(totalSteps, 40, '步驟總數必須為 40');

    var fallback = diagramApi.renderFoldDiagram('invalid', '預設示意圖');
    assertMatch(fallback, /data-diagram-key="fallback"/);
    assertMatch(fallback, /圖解準備中/);
    assertMatch(diagramApi.renderFoldDiagram('__proto__', '測試'), /data-diagram-key="fallback"/);
    var unsafe = diagramApi.renderFoldDiagram('classic-dart-01', '中心線 "雙向" & <安全>');
    assertMatch(unsafe, /aria-label="中心線 &quot;雙向&quot; &amp; &lt;安全&gt;"/);
    assertNotMatch(unsafe, /aria-label="[^"]*<[^\"]*"/);
  }

  function testDiagramStyles() {
    var request = new XMLHttpRequest();
    request.open('GET', '../styles.css', false);
    request.send(null);

    assert(request.responseText.length > 0, '無法讀取圖解樣式表');

    assertMatch(request.responseText, /\.diagram-before,\s*\.diagram-after\s*\{[^}]*fill\s*:\s*var\(--paper-bright\);[^}]*stroke\s*:\s*var\(--ink\);[^}]*stroke-width\s*:\s*3;/);

    [
      ['.diagram-moving', 'fill', '#e6b85f'],
      ['.diagram-moving', 'fill-opacity', '.42'],
      ['.diagram-moving', 'stroke', 'var(--accent)'],
      ['.diagram-moving', 'stroke-width', '2'],
      ['.diagram-crease', 'fill', 'none'],
      ['.diagram-crease', 'stroke', 'var(--muted)'],
      ['.diagram-crease', 'stroke-width', '2'],
      ['.diagram-crease', 'stroke-dasharray', '8 7'],
      ['.diagram-result-crease', 'fill', 'none'],
      ['.diagram-result-crease', 'stroke', 'var(--muted)'],
      ['.diagram-result-crease', 'stroke-width', '2'],
      ['.diagram-direction', 'fill', 'none'],
      ['.diagram-direction', 'stroke', 'var(--accent)'],
      ['.diagram-direction', 'stroke-width', '5'],
      ['.diagram-process', 'fill', 'none'],
      ['.diagram-process', 'stroke', 'var(--accent)'],
      ['#fold-arrow path', 'fill', 'var(--accent)'],
      ['.diagram-alignment', 'fill', 'var(--accent)'],
      ['.diagram-alignment', 'stroke', 'var(--paper-bright)'],
      ['.diagram-panel-label', 'fill', 'var(--ink)'],
      ['.diagram-panel-label', 'font', '700 18px/1 var(--font-utility)'],
      ['.diagram-hint', 'fill', 'var(--ink)'],
      ['.diagram-hint', 'font', '600 16px/1.4 var(--font-body)'],
      ['.diagram-fallback', 'fill', '#e8e2d8'],
    ].forEach(function (contract) {
      var selector = contract[0];
      var property = contract[1];
      var value = contract[2];
      var selectorPattern = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var rule = new RegExp(selectorPattern + '\\s*\\{([^}]*)\\}').exec(request.responseText);

      assert(rule, '缺少圖解樣式選擇器 ' + selector);
      assert(new RegExp(property + '\\s*:\\s*' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*;').test(rule[1]), selector + ' 缺少 ' + property + ': ' + value);
    });

    assertMatch(request.responseText, /\.diagram-frame svg\s*\{[^}]*width\s*:\s*100%;[^}]*max-width\s*:\s*100%;[^}]*min-width\s*:\s*0;[^}]*height\s*:\s*auto;/);
    assertMatch(request.responseText, /\.guide-layout__primary\s*\{[^}]*min-width\s*:\s*0;/);
    assertMatch(request.responseText, /\.guide-layout\s*\{[^}]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\);/);
    assertMatch(request.responseText, /\.diagram-legend\s*\{[^}]*grid-template-columns\s*:\s*1fr;/);
    assertMatch(request.responseText, /@media\s*\(min-width:\s*560px\)\s*\{[\s\S]*?\.diagram-legend\s*\{[^}]*grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
    assertMatch(request.responseText, /@media\s*\(max-width:\s*419px\)\s*\{[\s\S]*?\.diagram-dialog__canvas\s*\{[^}]*overflow-x\s*:\s*auto;[^}]*overflow-y\s*:\s*hidden;/);
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
    assertMatch(guide, /class="diagram-legend"/);
    assertMatch(guide, /虛線＝這一步的新折線/);
    assertMatch(guide, /箭頭＝紙面移動方向/);
    assertMatch(guide, /淡色區＝要移動的紙面/);
    assertMatch(guide, /圓點＝需要對齊的位置/);

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

  function testGuideDiagramResponsivePresentation() {
    var preview = document.getElementById('entry-preview');
    var previewDocument = preview && preview.contentDocument;
    var previewWindow = preview && preview.contentWindow;
    var originalWidth = preview && preview.style.width;
    var originalHeight = preview && preview.style.height;
    var originalHash = previewWindow && previewWindow.location.hash;
    var temporaryStyle;

    assert(boundary.entryContract, '響應式圖解測試前尚未收到入口頁契約訊息');
    assert(previewDocument && previewWindow, '響應式圖解測試無法取得入口 iframe');
    assert(
      previewWindow.PaperFlightAtlas
        && previewWindow.PaperFlightAtlas.app
        && typeof previewWindow.PaperFlightAtlas.app.mountApp === 'function',
      '入口 iframe 缺少可掛載的 PaperFlightAtlas.app',
    );

    function mountGuide(width) {
      preview.style.width = width + 'px';
      previewWindow.location.hash = '#plane/classic-dart/step/1';
      previewWindow.PaperFlightAtlas.app.mountApp(previewDocument, previewWindow);
    }

    function getGuideNodes() {
      var app = previewDocument.getElementById('app');
      var dialog = app.querySelector('.diagram-dialog');
      var frame = app.querySelector('.diagram-frame');
      var svg = Array.prototype.slice.call(frame.children).find(function (child) {
        return child.tagName && child.tagName.toLowerCase() === 'svg';
      });

      dialog.setAttribute('open', '');

      return {
        app: app,
        canvas: app.querySelector('.diagram-dialog__canvas'),
        dialog: dialog,
        frame: frame,
        legend: app.querySelector('.diagram-legend'),
        svg: svg,
      };
    }

    function assertDialogOverflowAt419() {
      var nodes;

      mountGuide(419);
      nodes = getGuideNodes();
      assertEqual(
        previewWindow.getComputedStyle(nodes.canvas).overflowX,
        'auto',
        '419px dialog 畫布必須允許水平捲動',
      );
      assert(
        nodes.canvas.scrollWidth > nodes.canvas.clientWidth,
        '419px dialog 畫布必須有可水平捲動內容',
      );
    }

    function countGridColumns(element) {
      var columns = previewWindow.getComputedStyle(element).gridTemplateColumns.trim();

      return columns ? columns.split(/\s+/).filter(Boolean).length : 0;
    }

    try {
      preview.style.height = '2400px';

      temporaryStyle = previewDocument.createElement('style');
      temporaryStyle.textContent = '@media (max-width: 419px) { .diagram-dialog__canvas svg { width: 100% !important; max-width: 100% !important; } }';
      previewDocument.head.appendChild(temporaryStyle);

      var redObserved = false;
      try {
        assertDialogOverflowAt419();
      } catch (error) {
        redObserved = true;
        assertMatch(error.message, /419px dialog 畫布必須有可水平捲動內容/, '受控 RED 未觸發預期捲動斷言');
      }
      assert(redObserved, '撤除 dialog 32rem SVG 寬度時，行為測試必須進入 RED');

      temporaryStyle.remove();
      temporaryStyle = null;

      assertDialogOverflowAt419();

      mountGuide(420);
      var nodes = getGuideNodes();
      assertEqual(nodes.app.querySelectorAll('.diagram-legend').length, 1, '主畫面必須恰有一份圖例');
      assertEqual(nodes.app.querySelectorAll('dialog .diagram-legend').length, 0, 'dialog 不可重複圖例');
      assert(nodes.canvas, '缺少放大圖畫布');
      assertEqual(previewWindow.getComputedStyle(nodes.canvas).overflowX, 'visible', '420px dialog 畫布必須為可見溢位');
      assert(
        nodes.canvas.scrollWidth <= nodes.canvas.clientWidth,
        '420px dialog 畫布不可有水平捲動內容',
      );

      mountGuide(559);
      nodes = getGuideNodes();
      assertEqual(countGridColumns(nodes.legend), 1, '559px 圖例必須為單欄');

      mountGuide(560);
      nodes = getGuideNodes();
      assertEqual(countGridColumns(nodes.legend), 2, '560px 圖例必須為雙欄');

      mountGuide(390);
      nodes = getGuideNodes();
      var frameRect = nodes.frame.getBoundingClientRect();
      var svgRect = nodes.svg.getBoundingClientRect();
      assert(svgRect.left >= frameRect.left, '390px 主圖 SVG 左側不可超出圖解容器');
      assert(svgRect.right <= frameRect.right, '390px 主圖 SVG 右側不可超出圖解容器');
      assert(
        previewDocument.documentElement.scrollWidth <= previewDocument.documentElement.clientWidth,
        '390px 主畫面不可水平溢位',
      );
    } finally {
      if (temporaryStyle) {
        temporaryStyle.remove();
      }

      preview.style.width = originalWidth;
      preview.style.height = originalHeight;
      previewWindow.location.hash = originalHash || '#home';
      previewWindow.PaperFlightAtlas.app.mountApp(previewDocument, previewWindow);
    }
  }

  var tests = [
    createTest('入口頁與測試頁符合瀏覽器原生腳本邊界', testScriptBoundary),
    createTest('腳本載入與 PaperFlightAtlas API 邊界正確', testNamespaceBoundary),
    createTest('圖鑑有八種機型、四個難度與完整步驟', testPlaneCatalog),
    createTest('四十個步驟使用唯一且可追蹤的圖解鍵值', testUniqueDiagramKeys),
    createTest('雜湊路由能解析、備援並建立標準網址', testRouter),
    createTest('收藏、主題與儲存失效備援可運作', testStorage),
    createTest('全部四十個步驟圖與安全 SVG 可產生', testDiagrams),
    createTest('折前折後圖解具備可讀語意樣式', testDiagramStyles),
    createTest('首頁、圖鑑、教學、關於與安全文字可產生', testRenderers),
    createTest('掛載、導覽、收藏、主題與篩選互動可運作', testMountAndInteractions),
    createTest('Skip Link、焦點恢復、dialog 與取消操作可運作', testFocusSkipAndDialog),
    createTest('主要導覽與教學步驟跨 hashchange 焦點可恢復', testHashchangeFocusRestoration),
    createTest('未知路由、缺少中繼資料、儲存失效與頁面契約可運作', testFallbacksAndPageContract),
    createTest('教學圖解圖例與響應式邊界符合實際瀏覽器樣式', testGuideDiagramResponsivePresentation),
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
