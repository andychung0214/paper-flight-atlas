# Paper Flight Atlas／紙翼圖鑑

Paper Flight Atlas（紙翼圖鑑）是一款可直接在瀏覽器執行的紙飛機教學圖鑑網頁遊戲。玩家會在帶有日式侘寂氣質的紙工坊介面中，翻閱八種機型的標本卡、依難度挑選練習路線、逐步閱讀摺法，並用收藏與主題切換整理自己的紙翼練習節奏。

## 遊戲介紹

紙翼圖鑑首版專注於單機、靜態、可離線閱讀的教學體驗，不含帳號、排行榜或後端服務。整個網站使用 HTML、CSS 與原生 ES Modules 建立，以雜湊路由切換首頁、圖鑑、教學頁與關於頁。

收錄機型共 8 種，分為 4 個難度：

- 基礎：Classic Dart、Beginner Glider
- 進階：Sky Arrow、Longtail
- 困難：Swift Spear、Loop Wing
- 大師：Origami Falcon、Wabi-Sabi Crane

## 特色

- 8 種機型與 4 個難度，適合從入門到高階逐步練習。
- 每架機型都提供飛行特性、建議紙材、完成時間與 5 個分步教學。
- 內建受控 SVG 摺紙示意圖，不依賴外部圖片或外部 API。
- 森林綠、酒紅色、倫敦藍三種主題可切換，並會記住偏好。
- 收藏功能可記住喜歡的機型，重新載入後仍可保留狀態。
- 支援鍵盤操作、`aria-live` 狀態提示、Skip Link 與減少動畫偏好。
- 可直接部署到 GitHub Pages，不需要建構流程。

## 操作方式

### 桌機操作

- 以滑鼠點擊「首頁」「機型圖鑑」「關於」切換頁面。
- 在圖鑑頁使用難度按鈕套用或清除篩選。
- 進入教學頁後，以「上一則」「下一則」切換步驟。
- 點擊「加入收藏」或「收藏中」切換機型收藏狀態。
- 點擊主題按鈕切換森林綠、酒紅色、倫敦藍。

### 觸控操作

- 在手機或平板上以點按方式操作所有導覽、收藏、步驟與主題按鈕。
- 教學頁在窄螢幕下會把主要按鈕排成單欄，方便單手點按。
- 重新整理頁面後，主題與收藏狀態會從本機快取回復。

## 安裝與執行

### 需求

- Node.js 18 以上
- Python 3（僅用於本機靜態伺服器）

### 安裝

本專案沒有額外執行階段套件；複製儲存庫後即可直接執行測試與靜態伺服器。

```bash
git clone <your-repo-url>
cd paper-flight-atlas
```

### 本機執行

```bash
npm run serve
```

預設會在 `http://localhost:4173` 啟動靜態伺服器。

## 專案結構

```text
paper-flight-atlas/
├─ index.html
├─ styles.css
├─ package.json
├─ sitemap.xml
├─ robots.txt
├─ src/
│  ├─ main.js
│  ├─ router.js
│  ├─ storage.js
│  ├─ render.js
│  ├─ diagrams.js
│  └─ data/
│     └─ planes.js
├─ tests/
│  ├─ project-smoke.test.mjs
│  ├─ planes.test.mjs
│  ├─ router.test.mjs
│  ├─ storage.test.mjs
│  ├─ render.test.mjs
│  └─ diagrams.test.mjs
└─ docs/
   ├─ PLAN.md
   ├─ ART-DIRECTION.md
   ├─ TEST-PLAN.md
   └─ superpowers/
```

## 測試

執行全部自動測試：

```bash
npm test
```

主要測試涵蓋：

- 機型資料完整性
- 雜湊路由與收藏／主題快取
- SVG 摺紙示意圖輸出安全性
- 畫面產生與繁體中文文案
- 入口檔案、SEO 檔案與交付文件存在性

更完整的手動、行動裝置與無障礙檢查清單請見 [docs/TEST-PLAN.md](./docs/TEST-PLAN.md)。

## GitHub Pages

本專案可在替換部署網址後，以儲存庫根目錄部署到 GitHub Pages，沒有額外建構步驟。

建議流程：

1. 將專案推送到 GitHub 儲存庫。
2. 在 GitHub Pages 設定中選擇從預設分支的根目錄部署。
3. 依實際部署網址更新 `index.html` 內的 canonical／Open Graph URL，以及 `sitemap.xml`、`robots.txt` 中的網站位址。
4. 部署完成後檢查首頁、`sitemap.xml` 與 `robots.txt` 是否都能回應 HTTP 200。

## 已知限制

- `sitemap.xml` 與 `robots.txt` 目前使用 `your-github-username.github.io` 作為可替換範例；正式上線前必須換成實際 GitHub Pages 網址。
- 使用雜湊路由，因此搜尋引擎只會索引單一入口頁，不會把 `#home`、`#catalog` 或各教學步驟視為獨立 URL。
- 目前沒有後端服務，收藏與主題只會儲存在使用者本機快取。
- SVG 示意圖為受控教學圖，不是實際摺紙照片或逐幀動畫。
- 首版沒有帳號、雲端同步、排行榜、即時物理模擬或多人功能。

## 授權

本專案採用 MIT 授權，詳見 [LICENSE](./LICENSE)。
