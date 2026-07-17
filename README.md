# Paper Flight Atlas｜紙翼圖鑑

Paper Flight Atlas（中文名：紙翼圖鑑）是一款桌機瀏覽器優先、支援行動觸控的紙飛機教學圖鑑網頁遊戲。玩家可以依難度翻閱八種機型，選擇紙材，閱讀逐步折法與 SVG 示意圖，收藏喜歡的機型，並切換紙工坊主題。

## 遊戲介紹

紙翼圖鑑把紙飛機教學做成安靜的紙樣標本卡：從基礎、進階、困難到大師，每種機型都有飛行特性、建議紙材、完成時間、五個以上步驟、提醒與常見失手。這是一個可直接部署到靜態網站的純前端專案。

## 特色

- 八種機型、四個難度，每種機型至少五個步驟。
- 六種受控 SVG 摺紙示意圖，支援安全文字轉義與放大 dialog。
- 雜湊網址導覽：首頁、圖鑑、關於與逐步教學都可以直接分享。
- 收藏、主題與難度篩選使用瀏覽器儲存；儲存不可用時仍保留記憶體中的操作能力。
- Skip Link、live region、鍵盤焦點恢復、按鈕狀態與行動觸控操作。
- 紙張、墨線、印刷標籤與侘寂留白的視覺系統，降低制式化介面感。

## 視覺風格選擇

本專案可採用以下方向：

1. 日式極簡／侘寂紙工坊：留白、紙纖維、墨線與低飽和色，適合摺紙教學。
2. 復古航空圖鑑：米白圖紙、深藍墨線、機械標籤與檔案編號。
3. 童趣紙玩具：明亮色塊、圓角插圖與較活潑的互動回饋。
4. 工業設計藍圖：網格、尺寸標註、冷色背景與精準線稿。

本版直接套用第 1 種「日式極簡／侘寂紙工坊」：森林綠為預設主題，另有酒紅色與倫敦藍；字體採系統無襯線字體搭配紙張感的字距與標籤。

## 操作方式

- 桌機：使用滑鼠或鍵盤按鈕翻閱首頁、機型圖鑑與教學步驟。
- 行動裝置：以觸控點選導覽、收藏、篩選、主題與上一則／下一則。
- 鍵盤：使用 Tab 移動焦點；Skip Link 可直接跳到主要內容；教學示意圖可開啟放大 dialog。
- 網址：可使用 `#home`、`#catalog`、`#about` 與 `#plane/<機型>/step/<步驟>` 開啟指定頁面。

## 安裝與執行

不需要安裝套件、建立處理序或啟動本機伺服器。

1. 下載或複製本專案。
2. 直接以現代瀏覽器開啟根目錄的 `index.html`。
3. 若要執行測試，直接開啟 `tests/browser-test.html`，等待畫面顯示全部測試通過。

建議使用最新版本的 Edge、Chrome、Firefox 或 Safari。若瀏覽器限制本機檔案的跨檔案檢視，入口頁仍可正常執行；測試頁會透過原生 iframe 與訊息橋接檢查入口契約。

## 專案結構

```text
paper-flight-atlas/
├─ index.html                 # 遊戲入口與 SEO 標記
├─ styles.css                 # 紙工坊視覺與 RWD
├─ src/
│  ├─ data/planes.js          # 八種機型與步驟資料
│  ├─ diagrams.js             # 受控 SVG 示意圖
│  ├─ router.js               # 雜湊路由
│  ├─ storage.js              # 主題與收藏儲存
│  ├─ render.js               # HTML 片段產生
│  └─ main.js                 # 事件與入口掛載
├─ tests/browser-test.html    # 直接開啟的瀏覽器測試頁
├─ tests/browser-test.js      # 原生測試與 Fake DOM
├─ docs/                      # 產品、視覺與測試文件
├─ sitemap.xml
├─ robots.txt
├─ LICENSE
└─ CONTRIBUTING.md
```

## 測試方式

直接開啟 `tests/browser-test.html`。測試頁會顯示測試摘要與每項結果，目前涵蓋：資料完整性、路由、儲存失效、四十個步驟 SVG、安全轉義、四個主要畫面、入口 HTML/SEO 契約、收藏、篩選、主題、焦點、Skip Link、dialog 與取消操作。

若要做手動檢查，請依 [docs/TEST-PLAN.md](docs/TEST-PLAN.md) 檢查桌機、行動裝置與無障礙情境。

## 部署到 GitHub Pages

1. 將儲存庫推送到 GitHub。
2. 開啟儲存庫的 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**。
4. 選擇要部署的 branch 與根目錄 `/ (root)`，儲存設定。
5. 等待 GitHub Pages 發布後，從頁面提供的網址開啟 `index.html`。

本專案不需要建構步驟；GitHub Pages 直接提供 HTML、CSS、JavaScript、SVG、`sitemap.xml` 與 `robots.txt`。

## 已知限制

- 內容為靜態內建資料，尚未提供帳號、雲端同步、排行榜或多人功能。
- 收藏與主題只保存在目前瀏覽器的儲存空間；清除網站資料會重設偏好。
- 入口使用相對資產路徑，部署到子目錄時需要確認 GitHub Pages 的網址與 canonical 設定。
- 示意圖是教學線稿，不等同於真實空氣動力模擬；實際飛行仍受紙張、折痕與投擲環境影響。

## 授權

本專案依 [MIT License](LICENSE) 授權。
