# 歷史設計文件：紙翼圖鑑

> 本文件是 2026-07-16 的早期設計紀錄，已由 [2026-07-17 瀏覽器原生執行設計](2026-07-17-browser-only-runtime-design.md) 取代。請以目前的 `README.md`、`docs/PLAN.md`、`docs/ART-DIRECTION.md` 與 `docs/TEST-PLAN.md` 為現行規格。

早期版本曾以模組化載入與本機開發工具描述實作流程；目前專案已改為直接開啟 HTML 的傳統腳本架構，應用程式 API 統一放在 `window.PaperFlightAtlas`，測試改由 `tests/browser-test.html` 執行。

保留此檔案只為了追蹤設計決策的演進，不作為安裝、執行、測試或部署說明。
