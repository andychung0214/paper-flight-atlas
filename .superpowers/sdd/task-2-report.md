# Task 2 報告：整合圖解圖例與響應式呈現

## 狀態

完成，待建立提交。尺寸診斷證實 390 CSS 像素下 SVG 完整縮放於主圖容器內；先前截圖的裁切判讀來自 Windows DPI 下實體像素與 CSS 像素的差異，並非頁面水平溢位。

## 實作

- `src/render.js`
  - 在主 `.diagram-frame` 的 SVG 後、放大按鈕前，加入一份具 `aria-label="圖解符號說明"` 的 `.diagram-legend`。
  - 圖例固定包含：虛線、新折線；箭頭、紙面移動方向；淡色區、要移動的紙面；圓點、需要對齊的位置。
  - dialog 內沒有重複圖例。
- `styles.css`
  - 以 `--paper-bright`、`--font-body`、`--font-utility` 對應既有主題變數，並改為任務簡報指定的 `.diagram-before`、`.diagram-after`、`.diagram-moving`、`.diagram-crease`、`.diagram-direction`、`.diagram-alignment`、`.diagram-hint`、`.diagram-panel-label` 語意層樣式。
  - 補齊實際產生器仍使用的 `.diagram-process` 和 `#fold-arrow path`，使中間流程箭頭維持可見。
  - 圖例於預設與 560px 以下為單欄，560px 以上為緊湊雙欄；主 SVG 為 `width: 100%`、`max-width: 100%`、`min-width: 0`、`height: auto`。
  - 420px 以下 dialog 畫布允許水平捲動，並保持垂直不溢位；dialog SVG 以 32rem 最小寬度保留標示空間。
  - 保留 `.guide-layout` 與主要面板的可縮小約束；最終以尺寸診斷驗證 SVG 沒有超出主圖容器。
- `tests/browser-test.js`
  - 加入任務簡報指定的四項圖例文字與 `.diagram-legend` 產生斷言。
  - 更新 Task 1 的樣式契約為 Task 2 語意樣式，並加入圖例欄數、SVG 尺寸、窄螢幕 dialog 捲動與 Grid 可縮小契約。

## RED / GREEN 紀錄

所有瀏覽器測試使用以下 Task 1 Edge 指令；此環境的 `--dump-dom` 不會回傳 DOM，因此以同一 Edge 指令的 `--screenshot` 檢視測試頁摘要：

```powershell
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$testUrl='file:///F:/Codex/Projects/paper-flight-atlas/.worktrees/clear-fold-diagrams/tests/browser-test.html'
$profile=Join-Path $env:TEMP 'paper-flight-atlas-task-2-edge'
& $edge --headless=new --disable-gpu --allow-file-access-from-files --user-data-dir=$profile --window-size=1365,900 --virtual-time-budget=5000 --screenshot=$screenshot $testUrl
```

1. 圖例 RED：測試頁顯示 `通過 12 / 13 項測試。`；唯一失敗為「首頁、圖鑑、教學、關於與安全文字可產生 — 文字不符合預期」，原因是尚未產生 `.diagram-legend`。
2. 圖例 GREEN：測試頁顯示 `全部 13 項測試通過。`。
3. 語意樣式與響應式 RED：測試頁顯示 `通過 12 / 13 項測試。`；唯一失敗為「折前折後圖解具備可讀語意樣式」。
4. 語意樣式與響應式 GREEN：測試頁顯示 `全部 13 項測試通過。`。
5. 主圖寬度防護 RED：加入 `max-width: 100%` 契約後，Edge `--dump-dom` 顯示 `通過 12 / 13 項測試。`；唯一失敗為「折前折後圖解具備可讀語意樣式 — 文字不符合預期」。
6. 主圖寬度防護 GREEN：將主 SVG 的 `max-width` 改為 `100%` 後，Edge `--dump-dom` 顯示 `全部 13 項測試通過。`。

## 桌機與手機驗證

- 指定網址 `index.html#plane/classic-dart/1` 實際回到首頁；目前 router 的可分享教學網址是 `index.html#plane/classic-dart/step/1`，因此後續畫面檢查使用後者，未修改 router。
- 1365×900：可見教學頁雙欄、兩個 SVG 面板、提示與兩欄圖例；補充的 1365×1400 截圖確認放大按鈕位於圖例後且沒有重疊或元件內裁切。
- 390×844：頁首與教學頁可正常單欄縱向捲動；1365×900 與 390×844 均以 Edge 的 `--force-device-scale-factor=1` 重跑截圖。
- 390 CSS 像素尺寸診斷：暫時 HTML 以 iframe 載入指定教學頁，並由 Edge `Start-Process`、`RedirectStandardOutput`、`--dump-dom` 取得實際數值。診斷檔已刪除且不會提交。

  | 項目 | 調整前 | 調整後 |
  |---|---:|---:|
  | `documentElement.clientWidth / scrollWidth` | 375 / 375 | 375 / 375 |
  | `.diagram-frame` 寬度 | 324px | 324px |
  | `.diagram-frame svg` 寬度 | 290px | 290px |
  | SVG `max-width` | 704px | 100% |

  SVG 右界為 332.5px，主圖容器右界為 349.5px，保留 17px 內距；雙格 SVG 沒有水平溢位或裁切。先前 390 實體像素截圖的畫面縮放不等於 390 CSS 像素，造成「折後」面板超出畫面的錯誤判讀。

## 全套測試

最後一次 Edge `Start-Process` + `RedirectStandardOutput` + `--dump-dom` 測試頁輸出顯示：`全部 13 項測試通過。`

Edge 同時輸出 Chromium task manager 與同步處理序的外部警告（`fallback_task_provider`、`ERR_ABORTED`），不影響測試頁 13/13 結果。

`git diff --check` 已通過，沒有差異格式錯誤。

## 檔案

- 已修改：`src/render.js`
- 已修改：`styles.css`
- 已修改：`tests/browser-test.js`
- 已新增：`.superpowers/sdd/task-2-report.md`
- 已保留且未加入：`.superpowers/sdd/task-1-report.md` 的既有髒差異。

## 提交

待建立，預定訊息為 `feat: 加入圖解圖例與響應式版面`。

## 自我審查

- 圖例只在主圖呈現一次，且每個樣本標記皆為 `aria-hidden`。
- 沒有新增動畫、外部圖片或函式庫。
- 僅修改授權的三個程式檔與指定報告檔。
- 自動測試覆蓋圖例內容、語意樣式、圖例欄數、dialog 窄螢幕捲動與主 SVG `max-width: 100%` 契約。
- 以實際 CSS 尺寸診斷取代單憑 DPI 縮放截圖的判讀，確認 SVG 寬度小於主圖容器寬度。

## 疑慮

- 任務簡報的 `#plane/classic-dart/1` 不符合目前 router 契約，會回到首頁；驗證使用既有的 `#plane/classic-dart/step/1`。
- Chromium 的 task manager 與同步處理序可能輸出外部警告，但 Edge 結束碼為 0，且測試頁為 13/13。
