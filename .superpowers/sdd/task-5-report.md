# Task 5 實作報告：建立畫面產生器與教學檢視器

日期：2026-07-16  
分支：`feature/paper-flight-atlas-impl`

## 本次完成項目

- 建立 [`src/render.js`](/F:/Codex/Projects/paper-flight-atlas/.worktrees/paper-flight-atlas-impl/src/render.js)
- 建立 [`tests/render.test.mjs`](/F:/Codex/Projects/paper-flight-atlas/.worktrees/paper-flight-atlas-impl/tests/render.test.mjs)
- 實作 `renderApp`、`renderHome`、`renderCatalog`、`renderGuide`、`renderAbout`、`escapeHtml`
- 套用日式侘寂紙工坊方向的畫面文案與結構
- 所有資料文字先經過 HTML 轉義，SVG 只透過受控 `renderFoldDiagram()` 輸出

## TDD RED

### 1. 先寫 render 測試

新增測試覆蓋：

- `escapeHtml` 轉義危險字元
- `renderHome` 首頁品牌與推薦內容
- `renderCatalog` 八張卡片與難度篩選
- `renderGuide` 步驟標題、`aria-live`、受控 SVG、上下步驟按鈕
- `renderAbout` 紙材安全提示
- `renderApp` 中繼資料與不安全資料轉義

### 2. 執行紅燈測試

執行：

```bash
npm test -- --test-name-pattern="renderHome|renderCatalog|renderGuide|renderAbout|escape|renderApp"
```

結果：FAIL（符合預期，因為 `src/render.js` 尚未建立）

關鍵輸出：

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'F:\Codex\Projects\paper-flight-atlas\.worktrees\paper-flight-atlas-impl\src\render.js'
```

## TDD GREEN

### 3. 實作最小安全 render 邏輯

實作重點：

- `escapeHtml()` 轉義 `& < > " '`
- `renderApp()` 依 `route.page` 切換首頁、圖鑑、教學、關於頁
- `renderCatalog()` 產出紙樣卡片、收藏按鈕、查看教學按鈕、難度篩選按鈕
- `renderGuide()` 顯示步驟狀態、受控 SVG、摺紙提醒、常見失手、上下步驟
- `renderAbout()` 顯示紙材安全提示與內容說明
- 所有按鈕都提供 `data-action`，並保留 `data-hash`
- 不把機型資料或步驟文字直接當成 HTML 插入

### 4. 執行聚焦綠燈測試

為了真正只跑 render 測試，額外直接執行 Node 內建測試指令：

```bash
node --test --test-name-pattern="renderHome|renderCatalog|renderGuide|renderAbout|escape|renderApp" tests/render.test.mjs
```

結果：PASS

關鍵輸出：

```text
1..6
# tests 6
# pass 6
# fail 0
```

## 完整驗證

### 5. 執行完整測試

執行：

```bash
npm test
```

結果：PASS

關鍵輸出：

```text
1..19
# tests 19
# pass 19
# fail 0
```

### 6. Git 與格式檢查

執行：

```bash
git diff --check
```

結果：無輸出，未發現尾端空白或 patch 格式問題。

## 自我審查

- `renderApp` 有處理不存在的機型路由，會退回圖鑑內容並顯示可理解提示。
- 教學頁步驟索引有 clamp，不會超出步驟範圍。
- 收藏與主題按鈕都保留 `data-action` / `data-hash`，供 Task 6 後續事件繫結使用。
- SVG 不接受外部 HTML，僅依既有 `renderFoldDiagram()` 的受控輸出插入。
- 針對 `<script>`、`<b>`、`<`、`&` 等字元已有測試驗證不會原樣作為 HTML 執行。

## 已知注意事項

- 圖鑑難度篩選按鈕目前只完成 render 結構，實際互動仍待 Task 6 事件繫結。
- `renderApp().title` 與 `description` 是提供後續以文字方式寫入文件標題與 Meta 的值，因此未做 HTML 插入用途的轉義。

---

## Reviewer findings 修正追加（2026-07-16）

### 本次變更

- 補上 `tests/render.test.mjs` 的 reviewer regression 測試：
  - `renderCatalog` 的 section label 必須為繁體中文
  - `renderAbout` 與 app footer 的 section label 必須為繁體中文
  - `renderApp` 在未知機型 id 時，必須先把有效 route 正規化為 `catalog`
- 最小修改 `src/render.js`：
  - 將 `Paper specimen cards`、`Workshop notes`、`Archive`、`Quiet fold notes` 改為繁體中文
  - 在 `renderApp()` 中把未知機型 route 先轉成有效的 catalog route，再推導 `data-page`、theme `data-hash`、header 狀態與內容
  - 保留既有「找不到指定機型」提示訊息

## Reviewer TDD RED

### 1. 先新增失敗測試

新增測試名稱：

- `renderCatalog uses Traditional Chinese section labels`
- `renderAbout and app footer use Traditional Chinese section labels`
- `renderApp normalizes missing plane routes to catalog state`

### 2. 執行聚焦紅燈測試

執行：

```bash
node --test --test-name-pattern="Traditional Chinese|normalizes missing plane routes|renderAbout and app footer" tests/render.test.mjs
```

結果：FAIL（符合預期）

關鍵失敗證據：

```text
not ok 4 - renderCatalog uses Traditional Chinese section labels
The input did not match the regular expression /紙樣標本卡/
<p class="annotation-label">Paper specimen cards</p>
```

```text
not ok - renderApp normalizes missing plane routes to catalog state
<div class="app-shell" data-theme="forest" data-page="plane">
data-hash="#plane/missing-plane/step/2"
```

## Reviewer TDD GREEN

### 3. 實作最小修正

- `renderCatalog()`：改為 `紙樣標本卡`
- `renderAbout()`：改為 `工坊筆記`、`典藏說明`
- `renderApp()` footer：改為 `靜折手記`
- `renderApp()`：新增 `effectiveRoute`，未知機型時先回退成 `{ page: 'catalog' }`

### 4. 執行聚焦綠燈測試

執行：

```bash
node --test --test-name-pattern="Traditional Chinese|normalizes missing plane routes|renderAbout and app footer" tests/render.test.mjs
```

結果：PASS

關鍵輸出：

```text
1..9
# pass 3
# fail 0
```

## 追加驗證

### 5. 執行完整 render 測試

執行：

```bash
node --test tests/render.test.mjs
```

結果：PASS

關鍵輸出：

```text
1..9
# pass 9
# fail 0
```

### 6. 執行完整 npm test

執行：

```bash
npm test
```

結果：PASS

關鍵輸出：

```text
1..22
# pass 22
# fail 0
```
