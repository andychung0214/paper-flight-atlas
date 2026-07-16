# 紙翼圖鑑交付計畫

## 需求

- 建立可部署至 GitHub Pages 的靜態紙飛機教學圖鑑。
- 提供首頁、機型圖鑑、分步教學頁與關於頁。
- 收錄 4 個難度、8 種機型、每種至少 5 個教學步驟。
- 以繁體中文提供操作文案與交付文件。
- 支援森林綠、酒紅色、倫敦藍三種主題切換。
- 支援收藏、本機快取、鍵盤操作、`aria-live` 狀態提示與減少動畫偏好。
- 交付 `sitemap.xml`、`robots.txt`、README、測試計畫、設計規範、貢獻指南與 MIT 授權。

## 範圍

### 本次範圍

- 靜態 HTML、CSS、原生 JavaScript 應用程式
- SEO 基礎設定與 Product 結構化資料
- 內建 SVG 摺紙示意圖
- 自動測試、手動測試計畫與交付文件

### 不在本次範圍

- 帳號系統
- 後端 API、資料庫、金流
- 外部圖片、外部字型服務
- 即時物理模擬、排行榜、多人模式

## 里程碑

1. 建立入口檔案與 SEO 基礎。
2. 建立 8 種機型資料與純函式查詢介面。
3. 完成路由與本機快取偏好。
4. 完成 SVG 摺紙示意圖。
5. 完成首頁、圖鑑、教學頁與關於頁畫面。
6. 串接互動、主題、RWD 與無障礙提示。
7. 補齊 SEO 檔案、交付文件與授權。
8. 完成完整驗證、人工檢查與 Git 收尾。

## 工作分解

| 項目 | 內容 | 主要輸出 |
| --- | --- | --- |
| 內容資料 | 整理 8 種機型、飛行特性、紙材與步驟 | `src/data/planes.js` |
| 導覽流程 | 雜湊路由、首頁／圖鑑／教學／關於頁切換 | `src/router.js`, `src/main.js` |
| 畫面組裝 | 侘寂風格畫面、圖鑑卡片、教學步驟 | `src/render.js`, `styles.css` |
| 示意圖 | 受控 SVG 摺線與箭頭圖 | `src/diagrams.js` |
| 偏好儲存 | 主題與收藏快取 | `src/storage.js` |
| SEO 與文件 | Sitemap、robots、README、測試與授權文件 | `sitemap.xml`, `robots.txt`, `docs/*` |
| 驗證 | 自動測試、名詞掃描、手動檢查 | `tests/*.test.mjs`, `docs/TEST-PLAN.md` |

## 風險

| 風險 | 影響 | 緩解方式 |
| --- | --- | --- |
| 雜湊路由不可被獨立索引 | 搜尋引擎只能索引入口頁 | 在 README 與測試計畫明確揭露限制，Sitemap 只列根網址 |
| 本機快取不可跨裝置同步 | 收藏與主題不會跟著帳號走 | 文件清楚說明目前僅支援本機快取 |
| 紙飛機步驟描述不夠清楚 | 使用者可能難以完成摺法 | 每步加入說明、提醒、常見失手與 SVG 示意圖 |
| 文件與實作不同步 | 交付內容不可信 | 每次改功能時同步更新 README、PLAN、ART-DIRECTION、TEST-PLAN |
| 憑證誤提交 | 安全風險 | 貢獻指南禁止提交 `.env`、token、私人金鑰與硬編碼秘密資訊 |

## 驗收條件

- `npm test` 全數通過。
- `npm test -- --test-name-pattern="delivery documents"` 通過，確認交付文件完整。
- 文件占位或未解註記掃描無結果。
- README 清楚說明遊戲介紹、特色、操作方式、安裝與執行、專案結構、測試、GitHub Pages、已知限制與授權。
- `docs/ART-DIRECTION.md`、`docs/TEST-PLAN.md`、`CONTRIBUTING.md` 與 `LICENSE` 均完整存在且內容正確。
- `sitemap.xml` 與 `robots.txt` 可直接部署至 GitHub Pages 使用。
