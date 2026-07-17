# 紙翼圖鑑瀏覽器原生執行實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 Node.js、Python、npm、ES Modules 與本機伺服器依賴，讓紙翼圖鑑與測試都能直接由瀏覽器開啟 HTML 執行。

**Architecture:** 保留資料、SVG、路由、儲存、畫面與啟動程式的檔案分層，將每個 JavaScript 檔案改為傳統 `<script>` 並註冊到 `window.PaperFlightAtlas` 命名空間。入口頁與瀏覽器測試頁以相同的明確腳本順序載入；測試由獨立的瀏覽器測試頁顯示結果。

**Tech Stack:** HTML5、CSS3、Vanilla JavaScript、SVG、localStorage、原生 `<dialog>`；不使用 Node.js、Python、npm、套件、建構工具、後端或 ES Modules。

## Global Constraints

- 執行與測試只能要求現代桌機或行動瀏覽器。
- 不得保留 `package.json`、Node.js 測試、Python 靜態伺服器或 `type="module"` 入口。
- 所有應用程式全域 API 必須掛在 `window.PaperFlightAtlas` 下，不建立未命名的應用程式全域變數。
- 保留 8 種機型、4 個難度、每種至少 5 步、主題、收藏、篩選、路由、Skip Link、SVG 放大與儲存失效備援。
- 中文文件、測試頁與 UI 使用繁體中文，遵守工作區名詞翻譯規範。
- 不讀取、輸出或提交憑證、token、`.env`、私人金鑰或敏感檔案。
- Commit 描述使用 Conventional Commits 與繁體中文。

## Task 1：改用傳統腳本與全域命名空間

**Files:** `index.html`、`src/data/planes.js`、`src/diagrams.js`、`src/router.js`、`src/storage.js`、`src/render.js`、`src/main.js`。

- [ ] 先在瀏覽器測試邊界加入命名空間、載入順序與禁止 ES Module 語法的檢查，確認目前版本會呈現紅燈。
- [ ] 將各檔案包在 IIFE 中，透過 `window.PaperFlightAtlas` 註冊 API；不得使用 `import` 或 `export`。
- [ ] 暴露下列穩定 API：
  - `data.planes`
  - `diagrams.renderFoldDiagram`
  - `router.resolveHash`、`parseHash`、`buildHomeHash`、`buildCatalogHash`、`buildPlaneHash`、`buildAboutHash`
  - `storage.createPreferenceStore`
  - `render.escapeHtml`、`render.renderHome`、`render.renderCatalog`、`render.renderGuide`、`render.renderAbout`、`render.renderApp`
  - `app.mountApp`
- [ ] 將 `index.html` 改為依序載入六個一般腳本，並讓 `main.js` 只在有 `[data-app-root]` 的入口頁自動啟動。
- [ ] 以瀏覽器檢查入口頁無模組載入錯誤，並驗證首頁、圖鑑、關於與教學路由。
- [ ] Commit：`refactor: 改用瀏覽器原生腳本載入`。

## Task 2：建立不依賴 Node.js 的瀏覽器測試頁

**Files:** 新增 `tests/browser-test.html`、`tests/browser-test.js`；刪除 `tests/diagrams.test.mjs`、`tests/main.test.mjs`、`tests/planes.test.mjs`、`tests/project-smoke.test.mjs`、`tests/render.test.mjs`、`tests/router.test.mjs`、`tests/storage.test.mjs`。

- [ ] 建立 `window.PaperFlightAtlasBrowserTests.run()` 與 `#test-summary`、`#test-results` 顯示區，不使用外部套件或 `fetch`。
- [ ] 測試頁以與入口頁相同的順序載入應用程式腳本，但不放 `[data-app-root]`，避免測試頁自動渲染遊戲。
- [ ] 使用瀏覽器原生 JavaScript 的輕量 `assert`、`test`、Fake DOM 與 Fake Storage 遷移既有覆蓋範圍：
  - 8 種機型、4 個難度、每種至少 5 個步驟。
  - 路由、未知路由、儲存失效備援。
  - SVG 安全處理、未知機型備援、全部步驟圖。
  - 首頁、圖鑑、教學、關於頁、MIT 授權文案。
  - Skip Link、收藏、篩選、主題、焦點恢復、原生 dialog 與取消操作。
  - 入口 HTML 結構、SEO 連結、禁止語彙與腳本依賴邊界。
- [ ] 直接開啟 `tests/browser-test.html`，確認摘要為全數通過且失敗項目會顯示錯誤。
- [ ] Commit：`test: 建立瀏覽器原生測試頁`。

## Task 3：移除 Node.js、Python 與 npm 文件/檔案依賴

**Files:** 刪除 `package.json`；更新 `README.md`、`CONTRIBUTING.md`、`docs/PLAN.md`、`docs/TEST-PLAN.md`、既有 `docs/superpowers/specs/` 與 `docs/superpowers/plans/` 相關文件。

- [ ] 先掃描目前說明與測試目錄中的 `node`、`npm`、`python`、`http.server`、`node:test`、`type="module"`，逐項辨識是否為現行指令或已過時內容。
- [ ] README 改寫為瀏覽器需求、直接開啟 `index.html`、直接開啟 `tests/browser-test.html`、靜態專案結構、GitHub Pages 無建構部署、已知限制與授權。
- [ ] CONTRIBUTING 與測試計畫改用瀏覽器測試頁與手動檢查，不要求安裝執行環境或套件。
- [ ] 主計畫與歷史 superpowers 文件標明本次架構取代關係，避免文件仍提供 Node.js/Python 作為目前執行方式。
- [ ] 刪除 `package.json` 與所有 Node.js 測試檔，確認 `.gitignore` 不會忽略必要的 HTML/CSS/JS 測試資產。
- [ ] Commit：`docs: 移除 Node 與 Python 執行依賴`。

## Task 4：整體驗證、Git 檢查與推送

**Files:** 全專案唯讀驗證，必要時修正前述檔案。

- [ ] 直接開啟入口頁與瀏覽器測試頁，記錄畫面測試結果；若瀏覽器工具不可用，改以靜態邊界檢查並明確標示未完成的實機驗證。
- [ ] 檢查入口腳本順序、所有本機引用路徑、`src/tests` 無 `import`/`export`/Node.js 執行器字樣、`package.json` 不存在。
- [ ] 檢查 8 種機型、4 個難度、40 個步驟圖、SEO 檔案與授權檔案均存在，並掃描不得出現憑證、token、`.env` 或私人金鑰。
- [ ] 執行 `git diff --check`、`git status --short --branch`、瀏覽器測試頁的全數測試。
- [ ] 在 `git push` 前先顯示 remote、branch 與即將推送的 commit，確認工作樹乾淨且分支已提交。
- [ ] 執行 `git push -u origin feature/paper-flight-atlas`，再以 `git status --short --branch` 確認已與遠端同步。

## Validation Commands

以下命令只用於檢查 Git 與檔案內容，不是專案執行依賴：

```powershell
git diff --check
rg -n -i 'import|export|node:test|type="module"|http\.server|npm run|python -m' index.html src tests README.md CONTRIBUTING.md docs
Test-Path package.json
git status --short --branch
```

Expected results：第一個命令無輸出且結束碼為 0；第二個命令無現行執行指令命中；`Test-Path package.json` 為 `False`；推送後分支顯示與 `origin/feature/paper-flight-atlas` 同步。

## Self-review Checklist

- [ ] 所有需求都有對應任務與驗收證據。
- [ ] 每個任務都列出檔案範圍、先紅後綠的測試步驟與 commit 邊界。
- [ ] API 名稱、腳本順序與自動啟動條件在任務間一致。
- [ ] 無待補決策、未解決事項或需要另行詢問的必要選項。
