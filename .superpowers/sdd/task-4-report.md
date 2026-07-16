# Task 4 報告：建立可測試的 SVG 摺紙示意圖產生器

## 需求對照

- 已建立 `renderFoldDiagram(diagramId, label): string`
- 已支援 `crease-center`、`fold-nose`、`shape-wing`、`reinforce-body`、`finish-tip`、`master-lock`
- 未知識別碼會安全回退到 `crease-center`
- `label` 已做 SVG 屬性字串轉義
- 產出的 SVG 不依賴外部圖片或其他資源

## RED 證據

先加入測試檔：

- `tests/diagrams.test.mjs`

執行焦點測試：

```bash
npm test -- --test-name-pattern="accessible SVG|unknown diagram"
```

預期失敗原因已確認為缺少模組：

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\\src\\diagrams.js'
```

這表示測試確實先於實作存在，且失敗原因符合 TDD 預期。

## GREEN 證據

新增實作檔：

- `src/diagrams.js`

完整測試指令：

```bash
npm test
```

結果：

- 12 項測試
- 12 項通過
- 0 項失敗

## 自我檢查

- SVG 起始標記、`role="img"`、`viewBox`、`aria-label` 都有輸出
- 未知 `diagramId` 會回退到預設圖樣
- `label` 中的 `&`、`<`、`>`、`"`、`'` 已轉義，避免屬性注入
- 測試套件未出現其他回歸

## 變更檔案

- `src/diagrams.js`
- `tests/diagrams.test.mjs`

