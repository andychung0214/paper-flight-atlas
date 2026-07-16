# Task 1 報告：建立靜態入口、測試指令與 SEO 基礎

## 結論

已完成 Task 1。已建立靜態入口、測試指令與基礎 SEO 標記，並通過聚焦測試與完整測試套件。

## 交付內容

- `package.json`
  - `npm test` → `node --test tests`
  - `npm run serve` → `python -m http.server 4173`
- `index.html`
  - `lang="zh-Hant"`
  - `viewport`
  - `description`
  - `canonical`
  - Open Graph
  - Twitter Card
  - Product JSON-LD
  - skip link
  - `<main id="app" data-app-root>`
  - `<div id="live-region" aria-live="polite">`
  - `src="./src/main.js" type="module"`
- `styles.css`
  - `:root` 紙張、墨色與三個主題變數
  - `body`
  - `.skip-link`
  - `.sr-only`
  - `button:focus-visible`
- `src/main.js`
  - 最小入口，標記 `document.documentElement.dataset.appRoot = 'true'`
- `tests/project-smoke.test.mjs`
  - 驗證靜態入口與 SEO 基礎存在

## TDD 記錄

### RED

先建立測試檔 `tests/project-smoke.test.mjs`，內容檢查：

- `index.html` 是否存在
- `styles.css` 是否存在
- `package.json` 是否存在
- `index.html` 是否包含：
  - `<main id="app"`
  - `property="og:title"`
  - `application/ld+json`

執行：

```bash
npm test -- --test-name-pattern="static project shell"
```

預期與實際結果一致：失敗，原因是 `package.json` 尚未建立，`npm` 回傳 `ENOENT`。

摘要：

```text
npm ERR! enoent Could not read package.json: Error: ENOENT: no such file or directory
```

### GREEN

補上最小必要檔案後重新執行：

```bash
npm test -- --test-name-pattern="static project shell"
```

結果：通過，1 個測試、0 個失敗。

接著執行完整測試：

```bash
npm test
```

結果：通過，1 個測試、0 個失敗。

## 自我檢查

- 測試命名清楚，且先失敗再實作。
- `package.json` 指令符合 brief。
- `index.html` 已涵蓋要求的 SEO 與入口結構。
- 未新增依賴、框架、憑證或任何秘密檔案。

## 備註

- `canonical`、Open Graph、Product JSON-LD 先使用本機佔位網址，符合靜態入口階段需求。
- `src/main.js` 僅做最小初始化，避免增加不必要行為。
