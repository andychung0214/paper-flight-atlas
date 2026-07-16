# Paper Flight Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個可直接在瀏覽器執行、可部署至 GitHub Pages 的紙飛機教學圖鑑「紙翼圖鑑」，收錄四個難度、八種機型與內建 SVG 摺紙示意圖。

**Architecture:** 使用單一 `index.html` 搭配原生 ES Modules 與雜湊路由。機型內容集中於純資料模組，畫面由安全的 HTML 產生函式建立，SVG 示意圖由固定的 SVG 產生器輸出，主題色與收藏偏好使用可失敗回復的 localStorage 儲存。

**Tech Stack:** HTML5、CSS3、Vanilla JavaScript、原生 ES Modules、Node.js 內建 `node:test`、localStorage、SVG。

## Global Constraints

- 技術限制：HTML、CSS、Vanilla JavaScript；不得使用 React、Angular、Vue、TypeScript、後端服務或大型遊戲引擎。
- 首版必須可在靜態網站託管環境執行，不依賴建構工具或外部 API。
- 必須收錄 4 個難度、每個難度 2 種機型，共 8 種。
- 教學頁一次聚焦一個步驟，步驟包含文字、提示與 SVG 示意圖。
- 視覺套用日式侘寂紙工坊，並保留森林綠、酒紅色、倫敦藍三種主題切換。
- 必須支援手機、平板、桌機三組 RWD 斷點、鍵盤操作、清楚焦點與減少動畫偏好。
- 中文文件、註解與 UI 文案使用繁體中文，並遵守工作區名詞翻譯規範。
- 不讀取、輸出、提交或推送憑證、token、`.env` 或私人金鑰。
- Git 分支使用 `feature/paper-flight-atlas`；Commit 描述使用繁體中文 Conventional Commits。

## File Map

- Create: `index.html` — 語意化入口、SEO Meta、Open Graph、Product JSON-LD、應用程式掛載點。
- Create: `styles.css` — 色票、紙張紋理、元件、RWD、焦點與減少動畫規則。
- Create: `package.json` — 僅提供 `npm test` 與 `npm run serve` 指令，不加入執行階段函式庫。
- Create: `src/main.js` — 應用程式啟動、雜湊變更與事件委派。
- Create: `src/router.js` — `parseHash`、`buildHomeHash`、`buildCatalogHash`、`buildPlaneHash`、`buildAboutHash`。
- Create: `src/storage.js` — `createPreferenceStore` 與 localStorage 安全回復。
- Create: `src/diagrams.js` — `renderFoldDiagram` 與 6 種摺紙 SVG 示意圖。
- Create: `src/data/planes.js` — `planes`、`getPlaneById`、`getDifficultySummary`、`getFeaturedPlane`。
- Create: `src/render.js` — `renderApp`、`renderHome`、`renderCatalog`、`renderGuide`、`renderAbout` 與安全文字處理。
- Create: `tests/planes.test.mjs` — 機型與步驟資料測試。
- Create: `tests/router.test.mjs` — 雜湊路由測試。
- Create: `tests/storage.test.mjs` — 主題與收藏偏好測試。
- Create: `tests/diagrams.test.mjs` — SVG 產生器測試。
- Create: `tests/render.test.mjs` — 畫面產生與 UI 文字測試。
- Create: `tests/project-smoke.test.mjs` — 入口、Sitemap、robots 與交付文件存在性測試。
- Create: `sitemap.xml` — GitHub Pages 可使用的網站地圖。
- Create: `robots.txt` — 允許公開索引並指向 Sitemap。
- Create: `README.md` — 介紹、特色、操作、執行、結構、測試、GitHub Pages、限制與授權。
- Create: `docs/PLAN.md` — 對外版本的需求、範圍、里程碑、工作分解、風險與驗收條件。
- Create: `docs/ART-DIRECTION.md` — 色票、字體、元件、動畫與禁止事項。
- Create: `docs/TEST-PLAN.md` — 功能、手動、行動裝置與無障礙測試清單。
- Create: `CONTRIBUTING.md` — 分支、Commit、修改流程與測試要求。
- Create: `LICENSE` — MIT 授權全文。

---

### Task 1: 建立靜態入口、測試指令與 SEO 基礎

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles.css`
- Test: `tests/project-smoke.test.mjs`

**Interfaces:**
- `index.html` 提供 `<main id="app">`、`<div id="live-region" aria-live="polite">` 與 `data-app-root`。
- `package.json` 提供 `npm test`：`node --test tests`；提供 `npm run serve`：`python -m http.server 4173`。

- [ ] **Step 1: 建立交付檔案存在性測試**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('static project shell exposes required entry and SEO files', () => {
  for (const file of ['index.html', 'styles.css', 'package.json']) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`);
  }
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /<main[^>]+id="app"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /application\/ld\+json/);
});
```

- [ ] **Step 2: 執行測試確認紅燈**

Run: `npm test -- --test-name-pattern="static project shell"`

Expected: FAIL because the entry files and `package.json` do not exist yet.

- [ ] **Step 3: 建立最小入口與執行設定**

`package.json` 必須使用以下內容：

```json
{
  "name": "paper-flight-atlas",
  "version": "1.0.0",
  "private": true,
  "description": "紙翼圖鑑：紙飛機教學圖鑑網頁遊戲",
  "type": "module",
  "scripts": {
    "test": "node --test tests",
    "serve": "python -m http.server 4173"
  }
}
```

`index.html` 必須包含 lang、viewport、description、canonical、Open Graph、Twitter Card、Product JSON-LD、Skip link、`#app`、`#live-region` 與 `src="./src/main.js" type="module"`。

`styles.css` 先建立 `:root` 的紙張、墨色與三個主題變數，並提供 `body`、`.skip-link`、`.sr-only`、`button:focus-visible` 的基本樣式。

- [ ] **Step 4: 執行測試確認綠燈**

Run: `npm test -- --test-name-pattern="static project shell"`

Expected: PASS with 1 test and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html styles.css tests/project-smoke.test.mjs
git commit -m "feat: 建立紙翼圖鑑靜態入口"
```

### Task 2: 建立機型內容資料與純函式查詢介面

**Files:**
- Create: `src/data/planes.js`
- Create: `tests/planes.test.mjs`

**Interfaces:**
- `planes`: 唯讀陣列，包含 8 個機型物件。
- `getPlaneById(id): Plane | undefined`
- `getDifficultySummary(): Array<{ id: string, label: string, count: number }>`
- `getFeaturedPlane(): Plane`
- `Plane` 欄位：`id`、`name`、`difficulty`、`difficultyLabel`、`summary`、`flightTraits`、`materials`、`paperSize`、`time`、`steps`。
- `Step` 欄位：`title`、`instruction`、`tip`、`commonMistake`、`diagram`。

- [ ] **Step 1: 建立會失敗的資料契約測試**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { planes, getDifficultySummary, getPlaneById } from '../src/data/planes.js';

test('catalog contains eight planes across four difficulties', () => {
  assert.equal(planes.length, 8);
  assert.deepEqual(getDifficultySummary().map(item => item.count), [2, 2, 2, 2]);
  assert.equal(new Set(planes.map(plane => plane.id)).size, 8);
});

test('every plane has detailed folding steps', () => {
  for (const plane of planes) {
    assert.ok(plane.summary.length > 20);
    assert.ok(plane.materials.length >= 2);
    assert.ok(plane.steps.length >= 5);
    for (const step of plane.steps) {
      for (const key of ['title', 'instruction', 'tip', 'commonMistake', 'diagram']) {
        assert.equal(typeof step[key], 'string');
        assert.ok(step[key].length > 0);
      }
    }
  }
});

test('lookup returns a plane and undefined for unknown id', () => {
  assert.equal(getPlaneById('sky-arrow').name, 'Sky Arrow');
  assert.equal(getPlaneById('unknown-plane'), undefined);
});
```

- [ ] **Step 2: 執行紅燈測試**

Run: `npm test -- --test-name-pattern="catalog contains|every plane|lookup returns"`

Expected: FAIL because `src/data/planes.js` is missing.

- [ ] **Step 3: 建立八種機型資料**

建立四個難度與八個 `Plane` 物件：`classic-dart`、`beginner-glider`、`sky-arrow`、`longtail`、`swift-spear`、`loop-wing`、`origami-falcon`、`wabi-sabi-crane`。每個物件提供至少 5 個完整步驟；每個步驟必須對應 `crease-center`、`fold-nose`、`shape-wing`、`reinforce-body`、`finish-tip`、`master-lock` 其中一個 SVG 識別碼。匯出上述四個函式，並以 `Object.freeze` 凍結陣列與難度摘要。

- [ ] **Step 4: 執行綠燈測試**

Run: `npm test -- --test-name-pattern="catalog contains|every plane|lookup returns"`

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/data/planes.js tests/planes.test.mjs
git commit -m "feat: 建立八種紙飛機教學資料"
```

### Task 3: 建立雜湊路由與偏好儲存

**Files:**
- Create: `src/router.js`
- Create: `src/storage.js`
- Create: `tests/router.test.mjs`
- Create: `tests/storage.test.mjs`

**Interfaces:**
- `parseHash(hash): { page: 'home' | 'catalog' | 'plane' | 'about', id?: string, step?: number }`
- `buildHomeHash(): '#home'`
- `buildCatalogHash(): '#catalog'`
- `buildPlaneHash(id, step = 0): string`
- `buildAboutHash(): '#about'`
- `createPreferenceStore(storage): { getTheme, setTheme, getFavorites, isFavorite, toggleFavorite }`
- 主題值限定為 `forest`、`wine`、`london`；不合法值回復 `forest`。

- [ ] **Step 1: 建立路由與儲存紅燈測試**

測試必須驗證 `#plane/sky-arrow/step/3` 解析為 `{ page: 'plane', id: 'sky-arrow', step: 3 }`、未知路由回復首頁、收藏切換可重複執行，以及會拋出例外的儲存物件不會讓函式失敗。

- [ ] **Step 2: 執行指定測試確認失敗**

Run: `npm test -- --test-name-pattern="hash|theme|favorite|storage"`

Expected: FAIL because `src/router.js` and `src/storage.js` are missing.

- [ ] **Step 3: 實作純函式路由與防禦式儲存**

路由只接受小寫英數字、連字號與正整數步驟；步驟小於 0 或非數字時使用 0。儲存函式以 `try/catch` 包住 `getItem`、`setItem` 與 `removeItem`，失敗時回傳預設主題或空收藏集合。

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test -- --test-name-pattern="hash|theme|favorite|storage"`

Expected: PASS with all matching tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/router.js src/storage.js tests/router.test.mjs tests/storage.test.mjs
git commit -m "feat: 加入路由與偏好儲存"
```

### Task 4: 建立可測試的 SVG 摺紙示意圖產生器

**Files:**
- Create: `src/diagrams.js`
- Create: `tests/diagrams.test.mjs`

**Interfaces:**
- `renderFoldDiagram(diagramId, label): string`
- 支援 `crease-center`、`fold-nose`、`shape-wing`、`reinforce-body`、`finish-tip`、`master-lock`。
- 未知識別碼使用 `crease-center` 的安全預設圖。

- [ ] **Step 1: 建立 SVG 輸出紅燈測試**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderFoldDiagram } from '../src/diagrams.js';

test('renders accessible SVG for each supported diagram', () => {
  for (const id of ['crease-center', 'fold-nose', 'shape-wing', 'reinforce-body', 'finish-tip', 'master-lock']) {
    const svg = renderFoldDiagram(id, '將紙張向中心線對摺');
    assert.match(svg, /^<svg/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-label="將紙張向中心線對摺"/);
    assert.match(svg, /viewBox=/);
    assert.doesNotMatch(svg, /<script/i);
  }
});

test('unknown diagram falls back to a safe SVG', () => {
  assert.match(renderFoldDiagram('invalid', '預設示意圖'), /aria-label="預設示意圖"/);
});
```

- [ ] **Step 2: 執行紅燈測試**

Run: `npm test -- --test-name-pattern="accessible SVG|unknown diagram"`

Expected: FAIL because `src/diagrams.js` is missing.

- [ ] **Step 3: 實作固定 SVG 圖形**

以固定座標產生紙張多邊形、摺線、方向箭頭與陰影，不引入任何外部圖片。`label` 先經過 SVG 文字屬性轉義，圖形內容只從受控的 `diagramId` 對照表取得。

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test -- --test-name-pattern="accessible SVG|unknown diagram"`

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/diagrams.js tests/diagrams.test.mjs
git commit -m "feat: 建立摺紙 SVG 示意圖"
```

### Task 5: 建立畫面產生器與教學檢視器

**Files:**
- Create: `src/render.js`
- Create: `tests/render.test.mjs`

**Interfaces:**
- `renderApp({ route, planes, theme, favorites }): { title: string, description: string, html: string }`
- `renderHome({ planes, favorites }): string`
- `renderCatalog({ planes, favorites, activeDifficulty }): string`
- `renderGuide({ plane, stepIndex, favorites }): string`
- `renderAbout(): string`
- `escapeHtml(value): string`

- [ ] **Step 1: 建立畫面產生器紅燈測試**

測試 `renderHome` 包含「紙翼圖鑑」、`renderCatalog` 包含 8 張機型卡片、`renderGuide` 包含當前步驟標題與 `aria-live` 狀態、`renderAbout` 包含紙材安全提示，並確認機型資料中的 `<`、`&` 不會原樣作為 HTML 執行。

- [ ] **Step 2: 執行紅燈測試**

Run: `npm test -- --test-name-pattern="renderHome|renderCatalog|renderGuide|renderAbout|escape"`

Expected: FAIL because `src/render.js` is missing.

- [ ] **Step 3: 實作安全畫面產生器**

所有資料字串先經 `escapeHtml`，按鈕使用 `data-action` 與 `data-hash` 屬性。圖鑑卡片提供難度、飛行特性、紙材、收藏按鈕與「查看教學」。教學頁提供返回圖鑑、當前步驟／總步驟、SVG、摺法文字、摺紙提醒、常見錯誤、上一則與下一則。只有受控的 SVG 字串可插入 `innerHTML`。

- [ ] **Step 4: 執行測試確認通過**

Run: `npm test -- --test-name-pattern="renderHome|renderCatalog|renderGuide|renderAbout|escape"`

Expected: PASS with all matching tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/render.js tests/render.test.mjs
git commit -m "feat: 建立圖鑑與分步教學畫面"
```

### Task 6: 串接應用程式互動、主題與 RWD 視覺

**Files:**
- Modify: `src/main.js`
- Modify: `styles.css`
- Modify: `index.html`

**Interfaces:**
- `mountApp(documentRef = document, windowRef = window): void`
- `main.js` 綁定 `hashchange` 與 `click` 事件，將所有使用者操作轉換為路由、步驟、收藏或主題狀態。

- [ ] **Step 1: 先補一個可執行的互動 smoke 測試**

在 `tests/project-smoke.test.mjs` 補上對 `src/main.js`、`src/render.js`、`src/router.js`、`src/storage.js`、`src/diagrams.js` 與 `src/data/planes.js` 的存在性檢查，以及 `index.html` 對 `src/main.js` 的 module 引用檢查。

- [ ] **Step 2: 執行 smoke 測試確認紅燈**

Run: `npm test -- --test-name-pattern="application modules"`

Expected: FAIL until all application modules exist.

- [ ] **Step 3: 實作啟動與事件委派**

`mountApp` 在每次路由更新時取得 `parseHash(window.location.hash)`、找出機型、呼叫 `renderApp`、更新 `#app.innerHTML`、`document.title`、description Meta 與 `#live-region.textContent`。點擊 `data-action="navigate"` 設定雜湊網址；`data-action="step"` 產生帶步驟的機型網址；`data-action="favorite"` 切換收藏後重新渲染；`data-action="theme"` 設定 `data-theme` 與 localStorage。

- [ ] **Step 4: 套用完整侘寂視覺與 RWD**

在 `styles.css` 加入紙張紋理、`.site-header`、`.paper-panel`、`.plane-card`、`.catalog-grid`、`.guide-layout`、`.diagram-frame`、`.stepper`、`.theme-switcher`、`.tag`、`.button`、`.button--ghost`、`.empty-state` 與 `.site-footer`。使用手機小於 720px、平板 720–1099px、桌機 1100px 以上的媒體規則；加入 `@media (prefers-reduced-motion: reduce)`。

- [ ] **Step 5: 更新入口的結構化資料與 fallback 文案**

讓 `index.html` 提供不依賴 JavaScript 時仍可讀的品牌標題、遊戲簡介與啟用 JavaScript 提示；Product JSON-LD 的 `name`、`description`、`category` 與 `isAccessibleForFree` 必須與紙翼圖鑑一致。

- [ ] **Step 6: 執行完整自動測試與靜態伺服器檢查**

Run: `npm test`

Expected: all tests PASS with 0 failures.

Run: `python -m http.server 4173`

Expected: server starts on `http://localhost:4173`; a browser request to `/index.html`, `/sitemap.xml`, and `/robots.txt` returns HTTP 200.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css src/main.js tests/project-smoke.test.mjs
git commit -m "feat: 完成紙翼圖鑑互動介面"
```

### Task 7: 建立 SEO 檔案、交付文件與授權

**Files:**
- Create: `sitemap.xml`
- Create: `robots.txt`
- Create: `README.md`
- Create: `docs/PLAN.md`
- Create: `docs/ART-DIRECTION.md`
- Create: `docs/TEST-PLAN.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`

**Interfaces:**
- `sitemap.xml` 提供根網址、`#home` 不列為獨立 URL，並以 GitHub Pages 網址格式作為可替換的範例網域。
- `robots.txt` 使用 `User-agent: *`、`Allow: /` 與 `Sitemap:`。

- [ ] **Step 1: 建立文件結構檢查**

在 `tests/project-smoke.test.mjs` 驗證所有交付文件存在，並以 `readFileSync` 檢查 README 包含「遊戲介紹」「操作方式」「GitHub Pages」「已知限制」「授權」；`docs/TEST-PLAN.md` 包含「行動裝置」與「無障礙」。

- [ ] **Step 2: 執行紅燈測試**

Run: `npm test -- --test-name-pattern="delivery documents"`

Expected: FAIL because the documentation files are missing.

- [ ] **Step 3: 撰寫完整交付文件**

`README.md` 必須明確說明 Paper Flight Atlas／紙翼圖鑑的介紹、8 種機型、特色、桌機與觸控操作、安裝與執行、專案結構、`npm test`、GitHub Pages 部署、已知限制與 MIT 授權。

`docs/PLAN.md` 必須包含需求、範圍、里程碑、工作分解、風險、驗收條件。

`docs/ART-DIRECTION.md` 必須包含色票、字體策略、元件規格、動畫原則、禁止事項與三個主題色的使用規則。

`docs/TEST-PLAN.md` 必須列出功能、手動、行動裝置與無障礙測試清單，每項提供前置條件、操作與預期結果。

`CONTRIBUTING.md` 必須說明分支命名、繁體中文 Conventional Commits、測試要求、文件同步與不提交憑證規則。

`LICENSE` 使用 MIT 授權全文，年份使用 2026，著作權人使用 `Paper Flight Atlas contributors`。

- [ ] **Step 4: 執行文件測試與名詞掃描**

Run: `npm test -- --test-name-pattern="delivery documents"`

Expected: PASS with 1 matching test and 0 failures.

Run: `rg -n "待補|未解" README.md docs CONTRIBUTING.md`

Expected: no matching lines; separately compare Chinese output with the workspace terminology table.

- [ ] **Step 5: Commit**

```bash
git add sitemap.xml robots.txt README.md docs/PLAN.md docs/ART-DIRECTION.md docs/TEST-PLAN.md CONTRIBUTING.md LICENSE tests/project-smoke.test.mjs
git commit -m "docs: 補齊紙翼圖鑑交付文件"
```

### Task 8: 完整驗證、人工檢查與 Git 收尾

**Files:**
- Modify: any files required by failed verification only.
- Test: all `tests/*.test.mjs` and static server endpoints.

- [ ] **Step 1: 執行完整測試**

Run: `npm test`

Expected: exit code 0; all tests pass; 0 failures.

- [ ] **Step 2: 執行靜態檔案與路由檢查**

Run: `python -m http.server 4173`

Check HTTP 200 for `/index.html`, `/styles.css`, `/src/main.js`, `/sitemap.xml`, `/robots.txt` and every static module path. Check that `index.html` includes exactly one `#app` and one module entry script.

- [ ] **Step 3: 執行人工檢查清單**

Check at 390px, 768px and 1440px widths:首頁、圖鑑、篩選、主題切換、收藏、8 個教學頁、步驟上一則／下一則、未知路由回復、鍵盤焦點、減少動畫與重新載入後狀態。記錄任何修正並重新執行 `npm test`。

- [ ] **Step 4: 檢查 Git 工作樹與提交內容**

Run: `git status --short --branch`

Expected: working tree clean on `feature/paper-flight-atlas`.

Run: `git log --oneline --decorate -8`

Expected: all project commits use Conventional Commits with繁體中文描述，且沒有 `.env`、token 或私人金鑰檔案。

- [ ] **Step 5: 顯示推送資訊並執行推送**

Run: `git remote -v`; `git branch --show-current`; `git log -1 --format=%H`; `git status --short`。

Before pushing, report the remote, branch, and commit hash to the user. If a remote exists, run `git push -u <remote> feature/paper-flight-atlas`; if no remote exists, stop after the clean local commit and ask the user for the remote URL rather than guessing.

## Plan Self-Review

- Spec coverage: product scope, eight planes, SVG diagrams, hash routing, themes, RWD, accessibility, tests, documentation, GitHub Pages and credential safety are covered by Tasks 1–8.
- Placeholder scan: this plan contains no unresolved placeholder markers or undefined follow-up step.
- Interface consistency: `planes` feeds `renderApp`; `parseHash` produces the route consumed by `mountApp`; `renderFoldDiagram` consumes each step's `diagram`; `createPreferenceStore` supplies `theme` and `favorites` to render functions.
- Scope: all tasks belong to one static website game and each task has a test or verification checkpoint.
