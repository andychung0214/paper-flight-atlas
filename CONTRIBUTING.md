# 貢獻指南

感謝你想為 Paper Flight Atlas／紙翼圖鑑貢獻。請在提交前先確認以下規則，讓程式碼、文件與交付品質保持一致。

## 分支命名

- 新功能：`feature/xxx`
- 錯誤修正：`fix/xxx`
- 維護工作：`chore/xxx`

請使用具語意的英文名稱，例如 `feature/update-readme`、`fix/catalog-filter-state`。

## Commit 規範

- 使用 Conventional Commits。
- Commit 描述必須使用繁體中文。
- 常用類型包含 `feat:`、`fix:`、`docs:`、`test:`、`chore:`。

範例：

```text
docs: 補齊紙翼圖鑑交付文件
feat: 新增紙翼圖鑑收藏狀態提示
fix: 修正未知機型路由回到圖鑑
```

## 測試要求

- 任何功能或文件變更都要先執行 `npm test`。
- 變更交付文件、授權、SEO 檔案時，至少再執行：

```bash
npm run test:delivery
```

- 若修改 README、`docs/` 或 `CONTRIBUTING.md`，請再執行文件未完成標記掃描，並確認掃描指令本身不在掃描範圍內：

預期結果為無命中。

## 文件同步

- 變更功能時，請同步檢查 `README.md`、`docs/PLAN.md`、`docs/ART-DIRECTION.md`、`docs/TEST-PLAN.md` 是否需要更新。
- 若改動操作流程、機型資料、已知限制或部署方式，README 必須同步修正。
- 若改動視覺規則、色彩或元件樣式，`docs/ART-DIRECTION.md` 必須同步修正。
- 若改動測試方式或驗收條件，`docs/TEST-PLAN.md` 與 `docs/PLAN.md` 必須同步修正。

## 不可提交的內容

- 不要提交憑證、token、`.env` 檔案、私人金鑰或任何敏感資訊。
- 不要把秘密資訊直接寫死在程式碼、文件或測試中。
- 不要加入未使用的函式庫、建構工具或外部追蹤腳本。

## 交付前檢查

1. `git status --short --branch` 應只包含本次變更。
2. `npm test` 必須通過。
3. 相關文件已同步更新。
4. Commit 訊息符合繁體中文 Conventional Commits。
