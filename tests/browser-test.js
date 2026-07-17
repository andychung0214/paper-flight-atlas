(function () {
  function createTest(name, run) {
    return { name: name, run: run };
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function getById(id) {
    return document.getElementById(id);
  }

  function addResult(listNode, status, name, detail) {
    var item = document.createElement("li");
    item.className = status;
    item.textContent = status === "pass" ? "PASS：".concat(name) : "FAIL：".concat(name, " — ", detail);
    listNode.appendChild(item);
  }

  function getNamespace() {
    return window.PaperFlightAtlas;
  }

  function hasFunction(target, key) {
    return !!target && typeof target[key] === "function";
  }

  function run() {
    var boundary = window.__paperFlightAtlasBrowserBoundary || { errors: [], expectedScriptOrder: [] };
    var summaryNode = getById("test-summary");
    var resultsNode = getById("test-results");
    var scripts = Array.prototype.slice.call(document.querySelectorAll("script[data-app-script]"));
    var tests = [
      createTest("依固定順序載入六個傳統腳本", function () {
        var actual = scripts.map(function (script) {
          return script.getAttribute("src");
        });

        assert(actual.length === boundary.expectedScriptOrder.length, "腳本數量不正確");

        for (var index = 0; index < actual.length; index += 1) {
          assert(
            actual[index] === boundary.expectedScriptOrder[index],
            "腳本順序不符：第 ".concat(index + 1, " 支為 ").concat(actual[index])
          );
        }
      }),
      createTest("腳本不得使用 ES Module 類型", function () {
        scripts.forEach(function (script, index) {
          var type = (script.getAttribute("type") || "").toLowerCase();
          assert(type === "", "第 ".concat(index + 1, " 支腳本不可使用 type=module"));
        });
      }),
      createTest("傳統腳本載入時不應出現錯誤", function () {
        assert(boundary.errors.length === 0, boundary.errors.join(" | "));
      }),
      createTest("建立 window.PaperFlightAtlas 命名空間", function () {
        assert(!!getNamespace(), "找不到全域命名空間");
      }),
      createTest("暴露 Task 1 穩定 API", function () {
        var namespace = getNamespace();

        assert(namespace && namespace.data && Array.isArray(namespace.data.planes), "缺少 data.planes");
        assert(namespace && namespace.diagrams && hasFunction(namespace.diagrams, "renderFoldDiagram"), "缺少 diagrams.renderFoldDiagram");
        assert(namespace && namespace.router && hasFunction(namespace.router, "resolveHash"), "缺少 router.resolveHash");
        assert(namespace && namespace.router && hasFunction(namespace.router, "parseHash"), "缺少 router.parseHash");
        assert(namespace && namespace.router && hasFunction(namespace.router, "buildHomeHash"), "缺少 router.buildHomeHash");
        assert(namespace && namespace.router && hasFunction(namespace.router, "buildCatalogHash"), "缺少 router.buildCatalogHash");
        assert(namespace && namespace.router && hasFunction(namespace.router, "buildPlaneHash"), "缺少 router.buildPlaneHash");
        assert(namespace && namespace.router && hasFunction(namespace.router, "buildAboutHash"), "缺少 router.buildAboutHash");
        assert(namespace && namespace.storage && hasFunction(namespace.storage, "createPreferenceStore"), "缺少 storage.createPreferenceStore");
        assert(namespace && namespace.render && hasFunction(namespace.render, "escapeHtml"), "缺少 render.escapeHtml");
        assert(namespace && namespace.render && hasFunction(namespace.render, "renderHome"), "缺少 render.renderHome");
        assert(namespace && namespace.render && hasFunction(namespace.render, "renderCatalog"), "缺少 render.renderCatalog");
        assert(namespace && namespace.render && hasFunction(namespace.render, "renderGuide"), "缺少 render.renderGuide");
        assert(namespace && namespace.render && hasFunction(namespace.render, "renderAbout"), "缺少 render.renderAbout");
        assert(namespace && namespace.render && hasFunction(namespace.render, "renderApp"), "缺少 render.renderApp");
        assert(namespace && namespace.app && hasFunction(namespace.app, "mountApp"), "缺少 app.mountApp");
      })
    ];
    var passed = 0;

    resultsNode.innerHTML = "";

    tests.forEach(function (testCase) {
      try {
        testCase.run();
        passed += 1;
        addResult(resultsNode, "pass", testCase.name);
      } catch (error) {
        addResult(resultsNode, "fail", testCase.name, error && error.message ? error.message : "未知錯誤");
      }
    });

    summaryNode.textContent = passed === tests.length
      ? "全部 ".concat(tests.length, " 項測試通過。")
      : "通過 ".concat(passed, " / ").concat(tests.length, " 項測試。");

    return {
      total: tests.length,
      passed: passed,
      failed: tests.length - passed
    };
  }

  window.PaperFlightAtlasBrowserTests = {
    run: run
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}());
