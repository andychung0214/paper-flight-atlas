# Task 6 實作報告：串接應用程式互動、主題與 RWD 視覺

撰寫日期：2026-07-16
分支：`feature/paper-flight-atlas-impl`
工作目錄：`F:\Codex\Projects\paper-flight-atlas\.worktrees\paper-flight-atlas-impl`
基準 commit：`48fae89`

## 變更摘要

- 在 `src/main.js` 建立 `mountApp(documentRef = document, windowRef = window): void`，串接 `parseHash`、`renderApp`、`createPreferenceStore` 與既有機型資料。
- 以文件層級 click 委派處理 `navigate`、`step`、`favorite`、`theme`，另外補上 catalog 難度篩選的 in-memory 狀態。
- 每次重繪同步更新 `#app.innerHTML`、`document.title`、description / Open Graph / Twitter metadata、`#live-region` 與 `html[data-theme]`。
- 擴充 `renderApp`/`renderCatalog`，讓 catalog 難度篩選可反映在畫面與 metadata，並提供空狀態樣式落點。
- 重寫 `styles.css`，完成紙工坊／標本卡風格、森林綠／酒紅色／倫敦藍主題、手機／平板／桌機斷點、鍵盤 focus 與 reduced motion。
- 更新 `index.html` fallback 文案與 Product JSON-LD，另補 `sitemap.xml`、`robots.txt` 讓靜態伺服器驗證可回 200。

## RED

### 測試先行調整

在 `tests/project-smoke.test.mjs` 補上：

- `src/main.js`、`src/render.js`、`src/router.js`、`src/storage.js`、`src/diagrams.js`、`src/data/planes.js` 的匯入合約檢查
- `mountApp` 的互動 smoke 驗證
- metadata 缺件 fallback 驗證
- `index.html` 對 `./src/main.js` 的 module 引用檢查
- `sitemap.xml`、`robots.txt` 的存在檢查

### RED 指令

```bash
npm test -- --test-name-pattern="application modules|mountApp|static project shell"
```

### RED 證據

實際輸出為失敗，重點如下：

- `static project shell exposes required entry and SEO files`
  - `sitemap.xml should exist`
- `application modules expose the interactive shell contract`
  - `ReferenceError: document is not defined`
- `mountApp renders from the route, updates metadata, and delegates application actions`
  - `ReferenceError: document is not defined`
- `mountApp tolerates missing metadata elements and still renders fallback content`
  - `ReferenceError: document is not defined`

結論：RED 成立，缺口明確落在 `main.js` 尚未提供可測試的啟動模組、入口 SEO 靜態檔不存在，且互動掛載尚未完成。

## GREEN

### 實作內容

#### 1. 應用程式互動與狀態整合

- `mountApp` 會讀取 `window.location.hash`，以 `parseHash` 決定頁面狀態。
- 互動事件以 click 委派集中處理，避免重繪後遺失按鈕事件。
- 收藏與主題透過 `createPreferenceStore(window.localStorage)` 儲存。
- 若 metadata 節點不存在，更新流程會安全略過，不會造成執行失敗。

#### 2. 視覺與 RWD

- 主視覺使用紙張紋理、紙樣卡、略帶不對稱的 panel 邊角與標註型 label。
- 主題色以 CSS 變數驅動：
  - `forest`
  - `wine`
  - `london`
- 斷點配置：
  - 手機：`max-width: 719px`
  - 平板：`720px - 1099px`
  - 桌機：`min-width: 1100px`
- `@media (prefers-reduced-motion: reduce)` 已關閉平滑捲動、縮短 transition / animation。

#### 3. 入口 fallback 與結構化資料

- `index.html` 在不依賴 JavaScript 的情況下仍提供：
  - 品牌標題
  - 遊戲簡介
  - 啟用 JavaScript 提示
- Product JSON-LD 已對齊：
  - `name`
  - `description`
  - `category`
  - `isAccessibleForFree`

### GREEN 指令

```bash
npm test
```

### GREEN 證據

完整輸出結果：

```text
# tests 25
# pass 25
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

結論：Task 6 相關 smoke、既有 render / router / storage / diagrams / data 測試皆維持全綠。

## 靜態伺服器驗證

### 驗證方式

因背景 `Start-Process` 在此執行環境被策略拒絕，改以同一個 Python 行內腳本啟動 `http.server` 等效靜態伺服器，再對指定檔案發送 HTTP 請求驗證。

### 驗證指令

```bash
python - <<'PY'
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
import contextlib

root = Path(r'F:\Codex\Projects\paper-flight-atlas\.worktrees\paper-flight-atlas-impl')
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
server = ThreadingHTTPServer(('127.0.0.1', 4173), handler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    for path in ('/index.html', '/sitemap.xml', '/robots.txt'):
        with contextlib.closing(urlopen(f'http://127.0.0.1:4173{path}')) as response:
            print(f"{path}={response.status}")
finally:
    server.shutdown()
    thread.join(timeout=5)
    server.server_close()
PY
```

### 靜態伺服器證據

```text
/index.html=200
/sitemap.xml=200
/robots.txt=200
```

結論：brief 指定的三個靜態入口都可經由本地靜態伺服器正常取得。

## 需求對照

- [x] `mountApp(documentRef = document, windowRef = window): void`
- [x] `hashchange` 與 `click` 事件委派整合路由、步驟、收藏、主題
- [x] 以 `renderApp` 更新 `#app.innerHTML`
- [x] 更新 `document.title`、description metadata、`#live-region.textContent`
- [x] 完整侘寂紙工坊視覺與森林綠／酒紅色／倫敦藍主題
- [x] 手機／平板／桌機 RWD 斷點
- [x] 鍵盤 focus 與 reduced motion
- [x] `index.html` fallback 文案與 Product JSON-LD
- [x] `npm test` 全綠
- [x] 靜態伺服器 `/index.html`、`/sitemap.xml`、`/robots.txt` 回 200

## 風險與注意事項

- catalog 的難度篩選目前是 session 內記憶，不會寫入 `localStorage`；這符合本 task 範圍，也避免擴張既有路由合約。
- 這次為了滿足靜態伺服器檢查，新增了 `sitemap.xml` 與 `robots.txt`；雖然不在 brief 的檔案清單內，但屬於同一需求的必要支援檔。
- static-server 驗證採用 Python 行內等效伺服器完成，功能上等同 `python -m http.server 4173` 的檔案回應檢查。

---

## Reviewer follow-up（2026-07-16）

### 修正摘要

- `renderApp` 不再輸出內層 `<main class="site-main">`，改為 `<div class="site-main">`，避免與 `index.html` 既有的 `main#app` 形成巢狀 landmark。
- `renderApp` 額外回傳正規化後的 `page`，讓 `mountApp` 將 `document.documentElement.dataset.page` 寫成正規化頁面，而不是原始 route。
- 移除 Task 6 分支中的 `sitemap.xml` 與 `robots.txt`，並把 smoke / 靜態伺服器驗證縮回 Task 6 真正持有的入口與模組檔案。

### RED

#### 聚焦測試指令

```bash
npm test -- --test-name-pattern="renderApp normalizes missing plane routes to catalog state|task 6 shell does not ship task 7 crawl files yet|mountApp writes the normalized catalog page for a missing plane route"
```

#### RED 證據

實際輸出為失敗，重點如下：

- `mountApp writes the normalized catalog page for a missing plane route`
  - `actual: 'plane'`
  - `expected: 'catalog'`
- `task 6 shell does not ship task 7 crawl files yet`
  - `sitemap.xml should not exist until Task 7`
- `renderApp normalizes missing plane routes to catalog state`
  - `actual: undefined`
  - `expected: 'catalog'`

補充：同一輪 RED 中也已把「rendered output 不得再含有內層 `<main>` landmark」寫進 `renderApp` 回歸案例；當時該案例先在 `rendered.page` 斷言處失敗，對照 `src/render.js` 當下實作可確認 HTML 仍輸出 `<main class="site-main">`。

### GREEN

#### 聚焦測試指令

```bash
npm test -- --test-name-pattern="renderApp normalizes missing plane routes to catalog state|task 6 shell does not ship task 7 crawl files yet|mountApp writes the normalized catalog page for a missing plane route"
```

#### GREEN 證據

```text
# tests 27
# pass 27
# fail 0
```

### 完整驗證

#### 全量測試

```bash
npm test
```

```text
# tests 27
# pass 27
# fail 0
```

#### 靜態伺服器檢查（Task 6 範圍）

以 Python 等效啟動 `http.server` 後，確認下列路徑皆回傳 `HTTP 200`：

```text
/index.html=200
/styles.css=200
/src/main.js=200
/src/render.js=200
/src/router.js=200
/src/storage.js=200
/src/diagrams.js=200
/src/data/planes.js=200
```
