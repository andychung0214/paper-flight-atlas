# 貢獻指南

感謝你協助改善紙翼圖鑑。這是一個可直接由瀏覽器開啟的 HTML、CSS、Vanilla JavaScript 專案，變更應維持靜態網站可執行、無外部套件與無後端服務的特性。

## 開始前

- 使用 Git 建立功能分支，例如 `feature/plane-guide`、`fix/focus-state` 或 `chore/docs`。
- 先閱讀 [docs/PLAN.md](docs/PLAN.md) 與 [docs/ART-DIRECTION.md](docs/ART-DIRECTION.md)。
- 不要提交憑證、token、`.env`、私人金鑰或含有個人資料的檔案。

## 開發方式

1. 直接以瀏覽器開啟 `index.html`。
2. 修改 HTML、CSS 或 JavaScript 後重新整理頁面。
3. 直接開啟 `tests/browser-test.html`，確認測試摘要為全部通過。
4. 依 [docs/TEST-PLAN.md](docs/TEST-PLAN.md) 做桌機、行動裝置、鍵盤與減少動畫檢查。

## 程式碼習慣

- 使用語意化 HTML、原生 CSS 與 Vanilla JavaScript；不要加入框架、建構工具或大型函式庫。
- 應用程式 API 統一掛在 `window.PaperFlightAtlas` 下，新增模組時維持入口的腳本載入順序。
- UI 文案使用繁體中文，並遵守專案的名詞翻譯規範。
- 新增資料時更新對應測試，確保機型、難度、步驟與 SVG 都有可驗證結果。
- 對使用者操作加入鍵盤焦點、可辨識的按鈕狀態與必要的 live region 訊息。

## Commit 規範

使用 Conventional Commits，描述使用繁體中文：

```text
feat: 新增紙飛機教學機型
fix: 修正教學步驟焦點恢復
docs: 更新 GitHub Pages 說明
test: 補充瀏覽器測試案例
```

## Pull Request 檢查

- 說明變更目的與使用者可見的行為。
- 附上 `tests/browser-test.html` 的測試結果。
- 若有視覺變更，附上桌機與行動寬度的截圖或說明。
- 確認 `git diff --check` 沒有空白錯誤。
- 確認變更不會暴露秘密資料，也不會引入需要額外執行環境的流程。
