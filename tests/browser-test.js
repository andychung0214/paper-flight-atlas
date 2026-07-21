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
    var expectedTargets = ['right-long-edge', 'center-line', 'center-line', 'right-body-edge', 'matching-wing-angle'];
    var requiredDiagramMarkers = [
      'data-diagram-key=',
      'class="diagram-before"',
      'class="diagram-after"',
      'class="diagram-moving"',
      'class="diagram-crease"',
      'class="diagram-result-crease"',
      'class="diagram-direction"',
      'class="diagram-alignment"',
      '<title>',
      '<desc>',
    ];

    function parsePoint(svg, attributeName) {
      var match = new RegExp('data-' + attributeName + '="(-?[0-9.]+),(-?[0-9.]+)"').exec(svg);
      assert(match, '缺少幾何契約 data-' + attributeName);
      return { x: Number(match[1]), y: Number(match[2]), pathText: match[1] + ' ' + match[2] };
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    namespace.data.planes.forEach(function (plane) {
      var previousAfterState = null;
      var previousAfterShape = null;
      var previousAfterPath = null;

      plane.steps.forEach(function (step, stepIndex) {
        var svg = diagramApi.renderFoldDiagram(step.diagram, plane.name + ' ' + step.title);
        var beforeState = /data-before-state="([^"]+)"/.exec(svg);
        var afterState = /data-after-state="([^"]+)"/.exec(svg);
        var beforeShape = /data-before-shape="([^"]+)"/.exec(svg);
        var afterShape = /data-after-shape="([^"]+)"/.exec(svg);
        var beforePath = /<path class="diagram-before"[^>]*d="([^"]+)"/.exec(svg);
        var afterPath = /<path class="diagram-after"[^>]*d="([^"]+)"/.exec(svg);
        var creasePath = /<path class="diagram-crease"[^>]*d="([^"]+)"/.exec(svg);
        var sourcePoint = parsePoint(svg, 'source-point');
        var targetPoint = parsePoint(svg, 'target-point');
        var creaseStart = parsePoint(svg, 'crease-start');
        var creaseEnd = parsePoint(svg, 'crease-end');

        requiredDiagramMarkers.forEach(function (marker) {
          assert(svg.includes(marker), step.diagram + ' 缺少 ' + marker);
        });
        assert(svg.includes('data-diagram-key="' + step.diagram + '"'), step.diagram + ' 應保留可追蹤鍵值');
        assert(svg.includes('data-target="' + expectedTargets[stepIndex] + '"'), step.diagram + ' 缺少正確對齊目標');
        assert(beforeState && afterState, step.diagram + ' 必須公開折前與折後狀態');
        assert(beforeShape && afterShape, step.diagram + ' 必須公開可驗證的折前與折後輪廓');
        assert(beforePath && afterPath, step.diagram + ' 必須輸出實際折前與折後 path');
        assert(creasePath, step.diagram + ' 必須輸出實際折線 path');
        assert(creasePath[1].includes(creaseStart.pathText), step.diagram + ' 實際折線必須包含契約起點');
        assert(creasePath[1].includes(creaseEnd.pathText), step.diagram + ' 實際折線必須包含契約終點');
        assert(
          svg.includes('data-target="' + expectedTargets[stepIndex] + '" cx="' + String(targetPoint.x) + '" cy="' + String(targetPoint.y) + '"'),
          step.diagram + ' 的實際對齊點必須等於反射目標點',
        );
        assert(
          Math.abs(distance(creaseStart, sourcePoint) - distance(creaseStart, targetPoint)) < 0.25,
          step.diagram + ' 折線起點不是來源點與目標點的等距點',
        );
        assert(
          Math.abs(distance(creaseEnd, sourcePoint) - distance(creaseEnd, targetPoint)) < 0.25,
          step.diagram + ' 折線終點不是來源點與目標點的等距點',
        );
        assertEqual(beforeState[1], plane.id + '-state-' + stepIndex, step.diagram + ' 折前狀態編號不正確');
        assertEqual(afterState[1], plane.id + '-state-' + (stepIndex + 1), step.diagram + ' 折後狀態編號不正確');

        if (previousAfterState) {
          assertEqual(beforeState[1], previousAfterState, step.diagram + ' 必須延續上一個步驟的折後狀態');
          assertEqual(beforeShape[1], previousAfterShape, step.diagram + ' 的折前輪廓必須等於上一個步驟的折後輪廓');
          assertEqual(beforePath[1], previousAfterPath, step.diagram + ' 的實際折前 path 必須等於上一個步驟的實際折後 path');
        }
        previousAfterState = afterState[1];
        previousAfterShape = afterShape[1];
        previousAfterPath = afterPath[1];

        if (stepIndex === 0) {
          assertMatch(svg, /data-target="right-long-edge"/);
          assertMatch(svg, /class="diagram-alignment"[^>]*cx="270"/);
          assertMatch(step.instruction, /左長邊貼齊右長邊/, step.diagram + ' 必須說明左右長邊對齊');
          assertMatch(step.instruction, /展開/, step.diagram + ' 必須說明壓痕後展開');
        } else if (stepIndex === 2) {
          assertMatch(step.instruction, /斜邊/, step.diagram + ' 必須說明斜邊動作');
          assertMatch(step.instruction, /(貼齊|緊貼)中心線/, step.diagram + ' 必須說明斜邊對齊中心線');
        } else if (stepIndex === 3) {
          assertMatch(step.instruction, /左半機身往右合起/, step.diagram + ' 必須說明機身對摺方向');
          assertMatch(step.instruction, /左右外輪廓完全重合/, step.diagram + ' 必須說明機身對齊目標');
        } else if (stepIndex === 4) {
          assertMatch(step.instruction, /機翼|寬翼|長翼|箭翼|窄翼|羽翼/, step.diagram + ' 必須說明機翼動作');
          assertMatch(step.instruction, /翻面/, step.diagram + ' 必須說明翻面');
          assertMatch(step.instruction, /相同角度重複/, step.diagram + ' 必須說明另一側對稱重複');
        }
      });

      var mainSvg = diagramApi.renderFoldDiagram(plane.steps[0].diagram, plane.name, 'main');
      var dialogSvg = diagramApi.renderFoldDiagram(plane.steps[0].diagram, plane.name, 'dialog');
      var mainMarker = /<marker id="([^"]+)"/.exec(mainSvg);
      var dialogMarker = /<marker id="([^"]+)"/.exec(dialogSvg);
      assert(mainMarker && dialogMarker, plane.id + ' 缺少方向箭頭 marker');
      assert(mainMarker[1] !== dialogMarker[1], plane.id + ' 主圖與放大圖不得重複 SVG marker id');
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
    var fixture = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fixture.setAttribute('aria-hidden', 'true');
    fixture.style.cssText = 'position:absolute;left:-10000px;width:720px;height:320px';
    fixture.innerHTML = [
      '<defs><marker id="fold-arrow-style-test"><path id="style-arrowhead" d="M0 0L10 5L0 10Z"></path></marker></defs>',
      '<path id="style-before" class="diagram-before" d="M0 0H10V10Z"></path>',
      '<path id="style-moving" class="diagram-moving" d="M0 0H10V10Z"></path>',
      '<path id="style-crease" class="diagram-crease" d="M0 0H10"></path>',
      '<path id="style-result" class="diagram-result-crease" d="M0 0H10"></path>',
      '<path id="style-existing" class="diagram-existing-crease" d="M0 0H10"></path>',
      '<path id="style-direction" class="diagram-direction" d="M0 0H10"></path>',
      '<path id="style-process" class="diagram-process" d="M0 0H10"></path>',
      '<circle id="style-point" class="diagram-alignment" cx="5" cy="5" r="2"></circle>',
      '<text id="style-fallback-text" class="diagram-fallback-text">準備中</text>',
      '<rect id="style-fallback" class="diagram-fallback"></rect>',
    ].join('');
    document.body.appendChild(fixture);

    function style(id) {
      return global.getComputedStyle(document.getElementById(id));
    }

    try {
      assertEqual(style('style-before').strokeWidth, '3px');
      assertNotMatch(style('style-before').fill, /none|rgba\(0, 0, 0, 0\)/);
      assertEqual(style('style-moving').fill, 'rgb(230, 184, 95)');
      assertEqual(Number(style('style-moving').fillOpacity), 0.42);
      assertEqual(style('style-moving').strokeWidth, '2px');
      assertEqual(style('style-crease').fill, 'none');
      assertMatch(style('style-crease').strokeDasharray, /8(px)?[, ]+7(px)?/);
      assertEqual(style('style-result').strokeWidth, '2px');
      assertEqual(style('style-existing').strokeWidth, '1.5px');
      assertEqual(style('style-direction').strokeWidth, '5px');
      assertEqual(style('style-process').strokeWidth, '5px');
      assertNotMatch(style('style-arrowhead').fill, /none|rgba\(0, 0, 0, 0\)/);
      assertNotMatch(style('style-point').fill, /none|rgba\(0, 0, 0, 0\)/);
      assertEqual(style('style-fallback-text').fontSize, '24px');
      assertEqual(style('style-fallback-text').fontWeight, '700');
      assertNotMatch(style('style-fallback').fill, /none|rgba\(0, 0, 0, 0\)/);
    } finally {
      fixture.remove();
    }
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
    assertEqual(countMatches(guide, /class="diagram-caption"/g), 2);
    assertMatch(guide, /左圖：折前/);
    assertMatch(guide, /右圖：折後/);
    assertMatch(guide, /對齊提示：/);

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

  async function testGuideDiagramResponsivePresentation() {
    var preview = document.getElementById('entry-preview');
    var originalWidth = preview && preview.style.width;
    var originalHeight = preview && preview.style.height;
    var requestSequence = 0;

    assert(boundary.entryContract, '響應式圖解測試前尚未收到入口頁契約訊息');
    assert(preview && preview.contentWindow, '響應式圖解測試缺少入口 iframe');

    function requestContract(width) {
      return new Promise(function (resolve, reject) {
        var requestId = 'responsive-' + width + '-' + (requestSequence += 1);
        var timeoutId;

        function receive(event) {
          var payload = event && event.data;

          if (!payload || payload.type !== 'paper-flight-atlas-responsive-result' || payload.requestId !== requestId) {
            return;
          }

          global.clearTimeout(timeoutId);
          global.removeEventListener('message', receive);
          if (payload.error) {
            reject(new Error(payload.error));
            return;
          }
          resolve(payload.contract);
        }

        global.addEventListener('message', receive);
        preview.style.width = width + 'px';
        preview.style.height = '2400px';
        timeoutId = global.setTimeout(function () {
          global.removeEventListener('message', receive);
          reject(new Error(width + 'px 響應式契約逾時'));
        }, 3000);

        global.setTimeout(function () {
          preview.contentWindow.postMessage({
            type: 'paper-flight-atlas-responsive-request',
            requestId: requestId,
          }, '*');
        }, 50);
      });
    }

    try {
      var at419 = await requestContract(419);
      assertEqual(at419.viewportWidth, 419, '419px iframe 實際寬度不正確');
      assertEqual(at419.canvasOverflowX, 'auto', '419px dialog 畫布必須允許水平捲動');
      assert(at419.canvasScrollWidth > at419.canvasClientWidth, '419px dialog 畫布必須有可水平捲動內容');

      var at420 = await requestContract(420);
      assertEqual(at420.viewportWidth, 420, '420px iframe 實際寬度不正確');
      assertEqual(at420.canvasOverflowX, 'visible', '420px dialog 畫布必須為可見溢位');
      assert(at420.canvasScrollWidth <= at420.canvasClientWidth, '420px dialog 畫布不可有水平捲動內容');
      assertEqual(at420.markerCount, at420.uniqueMarkerCount, '主圖與放大圖的 SVG marker id 必須唯一');

      var at559 = await requestContract(559);
      assertEqual(at559.legendColumns, 1, '559px 圖例必須為單欄');

      var at560 = await requestContract(560);
      assertEqual(at560.legendColumns, 2, '560px 圖例必須為雙欄');

      var at390 = await requestContract(390);
      assert(at390.mainSvgInsideFrame, '390px 主圖 SVG 不可超出圖解容器');
      assert(at390.noHorizontalOverflow, '390px 主畫面不可水平溢位');
      assertEqual(at390.captionFontSize, '16px', '390px HTML 圖解說明必須維持 16px 可讀字級');
    } finally {
      preview.style.width = originalWidth;
      preview.style.height = originalHeight;
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

  async function run() {
    var summaryNode = document.getElementById('test-summary');
    var resultsNode = document.getElementById('test-results');
    var passed = 0;

    resultsNode.innerHTML = '';
    for (var testCase of tests) {
      try {
        await testCase.run();
        passed += 1;
        addResult(resultsNode, 'pass', testCase.name, '');
      } catch (error) {
        addResult(resultsNode, 'fail', testCase.name, error && error.message ? error.message : '未知錯誤');
      }
    }

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
