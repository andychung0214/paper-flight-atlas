# 紙翼圖鑑瀏覽器原生執行設計

## 目標

將紙翼圖鑑改為不依賴 Node.js、Python、套件管理器、建構工具或本機伺服器的純瀏覽器專案。使用者可以直接開啟 `index.html` 執行遊戲，也可以直接開啟 `tests/browser-test.html` 執行瀏覽器測試。

## 已確認範圍

- 執行環境只需要現代桌機或行動瀏覽器。
- 正式遊戲入口為 `index.html`，不得依賴 `file://` 下可能被阻擋的 ES Modules。
- 測試改由瀏覽器原生 JavaScript 測試頁執行，不再使用 Node.js `node:test`。
- 開發文件不得要求安裝 Node.js、Python、npm 或啟動靜態伺服器。
- GitHub Pages 仍可直接提供相同的靜態檔案。
- 現有 8 種機型、教學步驟、路由、主題、收藏、SVG 放大、無障礙與 SEO 行為必須保留。

## 架構

保留目前按責任分層的 JavaScript 檔案，但將原生 ES Modules 改為傳統 `<script>`。每個檔案只在 `window.PaperFlightAtlas` 下註冊一個明確的命名空間，避免污染全域名稱：

```text
index.html
  ├─ src/data/planes.js  → PaperFlightAtlas.data
  ├─ src/diagrams.js     → PaperFlightAtlas.diagrams
  ├─ src/router.js       → PaperFlightAtlas.router
  ├─ src/storage.js      → PaperFlightAtlas.storage
  ├─ src/render.js       → PaperFlightAtlas.render
  ├─ src/main.js         → PaperFlightAtlas.app
  └─ styles.css
```

`main.js` 依序讀取前述命名空間，註冊事件委派並在頁面具有 `data-app-root` 時自動掛載。所有檔案以一般 `<script src="...">` 載入，讓直接開啟 `index.html` 與 GitHub Pages 都能使用同一套入口。

## 測試架構

新增 `tests/browser-test.html` 作為無依賴測試入口，依相同的腳本載入順序載入應用程式，並以 `tests/browser-test.js` 執行測試。測試頁提供：

- 測試總數、通過數、失敗數與每項結果。
- `PASS`／`FAIL` 狀態與可讀的失敗訊息。
- 資料完整性、路由、儲存備援、SVG 安全性、畫面產生、互動流程與無障礙契約測試。
- 測試頁本身可直接用瀏覽器開啟，不需要測試套件、伺服器或命令列工具。

測試使用輕量的 `assert`、`test` 與測試環境建立函式，避免引入任何外部函式庫。應用程式程式碼不依賴測試頁才能執行。

## 移除與替換

- 移除 `package.json`，不再提供 npm 指令。
- 移除 Node.js 專用的 `tests/*.test.mjs`。
- 將 README、貢獻指南、測試計畫與交付計畫中的 Node.js、Python、npm、`node:test`、`python -m http.server` 說明改為瀏覽器操作。
- 將入口 HTML 的 `type="module"` 改為一般腳本，並補齊明確載入順序。
- 保留 `.js` 檔案的責任邊界與可讀性，不建立需要建構流程的 bundle。

## 相容性與限制

- 需要支援 `classList`、`dataset`、`dialog`、`localStorage`、`replaceAll` 與現代 CSS 的瀏覽器；目前目標為近年桌機與行動瀏覽器。
- 若瀏覽器停用 `localStorage`，主題與收藏仍使用工作階段記憶體備援。
- 直接以 `file://` 開啟時，SEO 絕對網址仍使用部署前範例；正式上線前依 README 替換。
- 瀏覽器測試頁是開發輔助工具，不會被遊戲入口載入，也不包含後端或外部服務。

## 驗收條件

- 雙擊 `index.html` 後可以看到首頁，瀏覽器主控台沒有 ES Module 載入錯誤。
- `index.html` 與所有應用程式 JavaScript 不含 `import`、`export`、`node:` 或 npm 執行需求。
- 直接開啟 `tests/browser-test.html` 後，所有瀏覽器測試顯示通過。
- 8 種機型、4 個難度、每種至少 5 步、收藏、三主題、篩選、未知路由、Skip Link、SVG 放大與儲存失效備援均有測試覆蓋。
- README 與測試計畫只要求瀏覽器操作；部署到 GitHub Pages 不需要建構步驟。
- 工作樹乾淨，提交訊息符合 Conventional Commits 與繁體中文規範，且不包含憑證或私人金鑰。
