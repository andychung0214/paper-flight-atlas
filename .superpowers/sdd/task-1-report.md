# Task 1 報告：建立靜態入口、測試指令與 SEO 基礎

> **歷史報告（非最終狀態）**
>
> 本頁保留 Task 1 當時的實作與測試記錄；其中 `document.documentElement.dataset.appRoot` 與 `og:locale` 均為舊階段敘述，不代表最終交付狀態。最終結果請以目前程式碼與測試為準。

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

## 2026-07-16 修正記錄：Open Graph 圖像改為本機靜態資產

### 問題

原本的 `index.html` 將 `og:image` 指向不存在的外部圖片路徑，會造成靜態專案無法自給自足，也無法通過針對性 smoke 檢查。

### 修正內容

- 新增 `og-image.svg` 於儲存庫根目錄。
- 將 `index.html` 的 `og:image` 改為 `./og-image.svg`。
- 擴充 `tests/project-smoke.test.mjs`，同時驗證：
  - `og-image.svg` 檔案存在
  - `index.html` 的 Open Graph 圖像 metadata 指向 `./og-image.svg`

### 測試過程

#### RED

先執行聚焦測試：

```bash
npm test -- --test-name-pattern="static project shell exposes required entry and SEO files"
```

結果：失敗，錯誤指出 `og-image.svg should exist`。

#### GREEN

補上本機 SVG 與 metadata 後重新執行相同測試：

```bash
npm test -- --test-name-pattern="static project shell exposes required entry and SEO files"
```

結果：通過，1 個測試、0 個失敗。

接著執行完整測試：

```bash
npm test
```

結果：通過，1 個測試、0 個失敗。

### 結果

Open Graph 圖像已改為可由靜態專案直接提供的本機資產，且 smoke 檢查已覆蓋資產存在性與 metadata 指向。

## 2026-07-16 修正記錄：移除脆弱的 Open Graph 圖像中繼資料

### 問題

reviewer 指出 `og:image` 使用本機相對 SVG，對真實社群爬蟲不夠穩定，而且缺少 `og:image:alt`。由於這是靜態第一版，最安全的處理方式是直接移除可選的圖像中繼資料，避免分享卡片指向不可靠或不存在的資產。

### 修正內容

- 從 `index.html` 移除 `og:image`。
- 保留必須的文字型 Open Graph 標記：
  - `og:title`
  - `og:description`
  - `og:type`
  - `og:url`
  - `og:locale`
- 保留 Twitter summary card 中繼資料。
- 刪除未使用的 `og-image.svg`。
- 更新 `tests/project-smoke.test.mjs`：
  - 取消對 `og-image.svg` 存在性的要求
  - 明確驗證 `og:image`、`og:image:alt`、`twitter:image` 都不存在

### 測試過程

#### RED

先加入聚焦斷言，執行：

```bash
npm test -- --test-name-pattern="static project shell"
```

結果：失敗，原因是 `index.html` 仍包含 `property="og:image"`。

摘要：

```text
assert.ok(!html.includes('property="og:image"'))
```

#### GREEN

移除 `index.html` 的 `og:image`、刪除 `og-image.svg`，並同步更新 smoke test 後重新執行：

```bash
npm test -- --test-name-pattern="static project shell"
```

結果：通過，1 個測試、0 個失敗。

接著執行完整測試：

```bash
npm test
```

結果：通過，1 個測試、0 個失敗。

### 結果

現已不再輸出任何 `og:image` 相關中繼資料，分享卡片只保留文字型 Open Graph 與 Twitter summary card 設定，避免指向脆弱或缺失的圖像資產。
