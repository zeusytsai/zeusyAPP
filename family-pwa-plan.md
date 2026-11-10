# 家庭 PWA APP 開發計畫

## 概覽

開發一個給家人共用的漸進式網頁應用程式（PWA），APP 名稱為「**小土小紅家**」（以兩隻大頭狗玩偶命名），整體風格走輕鬆活潑可愛路線。部署在 GitHub Pages 上，家人只需透過網址開啟並「加入主畫面」，即可像原生 APP 一樣使用。

**技術選型：**
- 前端框架：jQuery 3.7.1（從 pomWorkspace 複製 `jquery-3.7.0.min.js` 使用）
- UI 框架：Bootstrap 5.3（從 pomWorkspace 複製 `bootstrap-5.3/bootstrap.css` 和 `bootstrap.js` 使用）
- 動畫：Canvas API（轉盤）+ jQuery 動態 DOM 操作
- 圖示：Font Awesome（從 pomWorkspace 複製 `font-awesome.css` 使用）
- 雲端資料庫：Firebase Realtime Database（投票同步）
- 部署：GitHub Pages（免費）
- 開發工具：Eclipse IDE

**從 pomWorkspace 複製的靜態資源：**

| 來源檔案 | 複製到 zeusyAPP |
|---------|---------------|
| `js/jquery-3.7.0.min.js`（3.7.0，用此版本） | `libs/js/jquery.min.js` |
| `js/bootstrap-5.3/bootstrap.js` | `libs/js/bootstrap.js` |
| `css/bootstrap-5.3/bootstrap.css` | `libs/css/bootstrap.css` |

> ⚠️ **Font Awesome**：pomWorkspace 只有 `font-awesome.css` 但缺少對應的 `fonts/` 字型資料夾，**改用 Font Awesome 5 CDN 引入**，不從 pomWorkspace 複製。

**APP 設計風格：**
- 主色調：溫暖橘色（`#FF8C42`）＋奶油白（`#FFF8F0`）
- 副色：可愛粉（`#FFB347`）、草地綠（`#7BC67E`）
- 字型：圓體感（system-ui 或 Google Fonts「Noto Sans TC」）
- 主視覺：APP 頂部用狗狗玩偶表情 emoji（🐾🐶）點綴，不需要真實圖片也能呈現可愛風格

**兩個開發階段：**
1. 第一階段：通用轉盤功能
2. 第二階段：多人即時投票功能

---

## 第一階段：通用轉盤

### Sub-Task 1 — 建立 PWA 專案基礎結構

**Intent**
在 Eclipse 工作區建立標準 PWA 專案，包含 HTML 入口頁、PWA Manifest 和 Service Worker，讓 APP 可以被加入手機桌面。同時從 pomWorkspace 複製所需的靜態函式庫到 `libs/` 資料夾。

**Expected Outcomes**
- 在瀏覽器開啟 `index.html` 後，Lighthouse 工具可通過 PWA 基本檢查
- 手機瀏覽器顯示「加入主畫面」提示
- APP 名稱顯示「小土小紅家」，有圖示、主題色
- jQuery 和 Bootstrap 5.3 已就位可使用

**Todo List**
- [ ] 在 Eclipse 建立新的 Static Web Project，命名為 `zeusyAPP`
- [ ] 從 pomWorkspace 複製靜態函式庫到 `libs/` 資料夾（jquery, bootstrap.js, bootstrap.css, font-awesome.css）
- [ ] 建立 `index.html`（入口頁，載入 manifest、Bootstrap、jQuery、Font Awesome 與主要 JS）
- [ ] 建立 `manifest.json`（APP 名稱：小土小紅家、主題色：`#FF8C42`、`"display": "standalone"`）
- [ ] 建立 `sw.js`（Service Worker，實作基本 cache 離線策略，快取 libs/ 與 css/ 與 js/ 所有檔案）
- [ ] 建立 `icons/` 資料夾，放置 192×192 與 512×512 APP 圖示（使用簡單 SVG 轉 PNG，主色橘色＋狗爪圖案）
- [ ] 在 `index.html` 中用 jQuery 的 `$(document).ready()` 初始化並註冊 Service Worker

**Relevant Context**
- pomWorkspace 函式庫位置：`C:\Users\zeusytsai\workspace\pomWorkspace\POM_View\src\static`
- 注意：pomWorkspace 的 jQuery 是 3.7.0，您說您有 3.7.1 版本，以您手上的版本優先
- manifest.json 需要設定 `"display": "standalone"` 才能讓加入桌面後全螢幕顯示
- GitHub Pages 要求所有資源路徑使用相對路徑（不能以 `/` 開頭）

**Status:** `[ ] pending`

---

### Sub-Task 2 — 實作通用轉盤功能

**Intent**
實作可自訂項目的轉盤，使用者可以新增、刪除轉盤選項，按下旋轉按鈕後轉盤動畫旋轉並隨機停在某一格，顯示結果。使用 jQuery 操作 DOM，搭配 Bootstrap 5 Modal 顯示結果彈窗。

**Expected Outcomes**
- 轉盤頁面顯示色彩分區的圓形轉盤，每格顯示對應文字
- 可在 Bootstrap 輸入框新增選項，最少 2 項，最多 12 項
- 可用 jQuery 動態刪除個別選項（清單即時更新，轉盤即時重繪）
- 按「旋轉」後，轉盤以漸緩動畫旋轉 3–5 圈後停止
- 停止後用 Bootstrap 5 Modal 彈窗顯示結果（含 🎉 emoji 慶祝效果）
- 選項資料儲存在 localStorage，重新開啟 APP 後保留上次設定

**Todo List**
- [ ] 在 `index.html` 中新增轉盤頁面區塊（`<section id="page-spinner">`）
- [ ] 建立 `css/spinner.css`，設計轉盤頁面排版，使用可愛橘色系配色
- [ ] 建立 `js/spinner.js`，實作以下功能：
  - 用 Canvas API 繪製轉盤（根據選項數量動態分割扇形、填色、繪製文字）
  - 旋轉動畫（`requestAnimationFrame` + `easeOutCubic` 緩動函數）
  - 隨機決定最終停止角度
  - 用 jQuery `$('#result-modal').modal('show')` 顯示 Bootstrap Modal 結果彈窗
- [ ] 用 jQuery 實作選項管理 UI：`$('#add-item-btn').on('click', ...)` 新增 / `$('.delete-item').on('click', ...)` 刪除 / 清單動態渲染
- [ ] 實作 localStorage 存取（key：`spinner_items`）
- [ ] 測試：2 項、6 項、12 項的轉盤顯示是否正常

**Relevant Context**
- Canvas 繪製轉盤：使用 `arc()` 劃出每個扇形，`fillText()` 寫入選項名稱
- 緩動動畫：角速度從快到慢，使用 `easeOutCubic` 函數
- 轉盤指針：用 CSS 三角形（`border` 技巧）固定在頂部，轉盤本身旋轉（CSS `transform: rotate()`）
- Bootstrap 5 Modal 需要 `bootstrap.js`（已在 Sub-Task 1 引入）
- Font Awesome 圖示建議：轉盤按鈕用 `fa-sync-alt`，刪除用 `fa-times`

**Status:** `[ ] pending`

---

### Sub-Task 3 — 部署到 GitHub Pages

**Intent**
將第一階段完成的 PWA 推送到 GitHub，啟用 GitHub Pages，取得公開網址讓家人可以安裝使用。

**Expected Outcomes**
- 專案程式碼推送到 GitHub repository
- GitHub Pages 啟用後，網址格式為 `https://<username>.github.io/zeusyAPP/`
- 手機瀏覽器開啟網址後，可以正常使用轉盤功能
- 手機出現「加入主畫面」提示，安裝後可從桌面開啟

**Todo List**
- [ ] 在 GitHub 建立新的 repository，命名為 `zeusyAPP`
- [ ] 在 Eclipse 專案中初始化 git（或使用命令列 `git init`）
- [ ] 設定 `.gitignore`（排除 Eclipse `.metadata`、`RemoteSystemsTempFiles`）
- [ ] commit 所有第一階段檔案並 push 到 GitHub
- [ ] 在 GitHub repository 的 Settings → Pages 中設定 source 為 `main` branch
- [ ] 等待部署完成後，用手機測試網址

**Relevant Context**
- GitHub Pages 對靜態網頁免費，支援 HTTPS（PWA Service Worker 需要 HTTPS）
- Service Worker 只在 HTTPS 或 localhost 下才能運作
- 推送後 GitHub Pages 需要約 1–3 分鐘才會更新

**Status:** `[ ] pending`

---

## 第二階段：多人即時投票

### Sub-Task 4 — 設定 Firebase 專案（第二階段開始）

**Intent**
在 Firebase 建立專案並開啟 Realtime Database，取得設定金鑰，將 Firebase SDK 整合進 PWA，讓前端可以讀寫雲端資料。

**Expected Outcomes**
- Firebase 專案建立完成
- Realtime Database 規則設定為公開讀寫（家人無需登入）
- Firebase 設定物件（`firebaseConfig`）已加入 APP 程式碼
- 可在瀏覽器 console 確認 Firebase 連線成功

**Todo List**
- [ ] 前往 https://console.firebase.google.com，用 Google 帳號建立新專案
- [ ] 在專案中啟用「Realtime Database」（選擇免費的 Spark 方案）
- [ ] 設定 Database Rules 為公開讀寫：
  ```json
  { "rules": { ".read": true, ".write": true } }
  ```
- [ ] 在 Firebase 專案設定取得 `firebaseConfig` 物件
- [ ] 建立 `js/firebase-config.js`，存放設定物件
- [ ] 在 `index.html` 引入 Firebase SDK（CDN 方式）

**Relevant Context**
- Firebase Realtime Database 免費方案（Spark）：1 GB 儲存、10 GB/月 傳輸、100 個同時連線
- 家庭使用量遠低於免費上限，不需擔心費用
- 公開讀寫規則適合家庭內部使用；若日後想限制，可改為需要 Firebase Authentication

**Status:** `[ ] pending`

---

### Sub-Task 5 — 實作投票功能

**Intent**
實作完整的投票流程：任何人可以建立一個投票（標題 + 選項），其他家人即時看到並投票，投票結果即時更新，發起人可以關閉投票。使用 jQuery 操作 DOM，Firebase SDK 負責即時資料同步。

**Expected Outcomes**
- 投票頁面列出目前所有「進行中」的投票
- 任何人可以建立新投票（Bootstrap Modal 表單：標題 + 動態新增 2–6 個選項）
- 其他家人開啟 APP 後，即時看到新投票（不需重新整理，Firebase `onValue` 觸發）
- 點選選項即完成投票，每人每次投票只能投一票（localStorage 記錄 `voted_{voteId}`）
- 投票結果以 Bootstrap Progress Bar 長條圖即時顯示票數與百分比
- 發起人（同一裝置，localStorage 記錄 `created_{voteId}`）可以關閉投票，關閉後移入「已結束」區域

**Todo List**
- [ ] 設計 Firebase Realtime Database 資料結構（見下方說明）
- [ ] 在 `index.html` 中新增投票頁面區塊（`<section id="page-vote">`）
- [ ] 建立 `css/vote.css`，設計投票清單、投票卡片（Bootstrap Card）、Progress Bar 樣式
- [ ] 建立 `js/vote.js`，使用 jQuery 實作：
  - 建立投票表單（Bootstrap Modal + jQuery 動態新增選項欄位）
  - 寫入投票資料到 Firebase（`firebase.database().ref('votes').push(...)`）
  - 監聽 Firebase 即時更新（`onValue(ref, callback)`），用 jQuery `$('#vote-list').html(...)` 渲染清單
  - 投票動作（`firebase.database().ref(...).transaction(...)` 更新票數）
  - 關閉投票（更新 Firebase `status` 為 `closed`）
- [ ] 測試：兩支手機同時開啟，一台新增投票，另一台即時看到

**Firebase 資料結構：**
```
/votes
  /{voteId}
    title: "這週末去哪裡？"
    status: "open" | "closed"
    createdAt: timestamp
    options:
      /0: { text: "墾丁", count: 2 }
      /1: { text: "九份", count: 1 }
```

**Relevant Context**
- Firebase `onValue()` 可監聽即時資料變化，不需輪詢
- 防重複投票：在 localStorage 儲存 `voted_{voteId}` = true
- 關閉投票的權限判斷：在 localStorage 儲存 `created_{voteId}` = true（建立者裝置才顯示關閉按鈕）

**Status:** `[ ] pending`

---

### Sub-Task 6 — 最終整合與 UI 優化

**Intent**
整合兩個功能頁面（轉盤、投票），加入底部導覽列切換，優化整體視覺風格，確保手機操作體驗流暢，更新 GitHub Pages。

**Expected Outcomes**
- APP 有底部導覽列，可切換「轉盤」和「投票」兩個頁面
- 整體視覺風格統一（色彩、字型、按鈕樣式）
- 手機操作順暢，觸控範圍足夠大
- 更新 GitHub Pages 後，家人打開原本的網址即可使用新功能

**Todo List**
- [ ] 建立統一的 `css/main.css`（底部導覽列、共用按鈕、色彩變數）
- [ ] 實作單頁切換邏輯（隱藏/顯示不同頁面區塊）
- [ ] 確認所有頁面在手機螢幕（375px 寬）顯示正常
- [ ] 更新 `manifest.json` 的圖示和名稱（如需調整）
- [ ] 更新 `sw.js` 快取清單，加入第二階段新增的檔案
- [ ] git commit + push 到 GitHub，驗證 GitHub Pages 更新成功
- [ ] 產生 QR Code 分享給家人

**Relevant Context**
- 底部導覽列高度建議 60px，圖示用 emoji 或 SVG
- CSS 變數（`--primary-color` 等）統一管理主題色
- Service Worker 版本號需要更新，否則舊快取不會刷新

**Status:** `[ ] pending`

---

## 檔案結構

```
zeusyAPP/
├── index.html                  # 入口頁，包含所有頁面區塊（SPA 切換）
├── manifest.json               # PWA Manifest（APP 名稱：小土小紅家）
├── sw.js                       # Service Worker（離線快取）
├── libs/                       # 從 pomWorkspace 複製的第三方函式庫
│   ├── js/
│   │   ├── jquery.min.js       # jQuery 3.7.1
│   │   └── bootstrap.js        # Bootstrap 5.3
│   └── css/
│       ├── bootstrap.css       # Bootstrap 5.3
│       └── font-awesome.css    # Font Awesome 圖示
├── css/
│   ├── main.css                # 共用樣式、底部導覽列、可愛橘色主題
│   ├── spinner.css             # 轉盤頁樣式
│   └── vote.css                # 投票頁樣式
├── js/
│   ├── app.js                  # 頁面切換、SW 註冊（jQuery ready）
│   ├── spinner.js              # 轉盤邏輯（jQuery + Canvas）
│   ├── vote.js                 # 投票邏輯（jQuery + Firebase）
│   └── firebase-config.js      # Firebase 設定（第二階段加入）
└── icons/
    ├── icon-192.png            # APP 圖示（橘色底＋狗爪）
    └── icon-512.png
```

---

## 注意事項

1. **Font Awesome 版本**：pomWorkspace 的 `font-awesome.css` 引用了字型檔（`fonts/` 資料夾），複製時需一併確認字型檔是否存在。若缺少字型，改用 CDN 版或直接用 emoji 替代。
2. **jQuery 版本**：pomWorkspace 有 3.7.0，您說手上有 3.7.1，直接使用您自己的 3.7.1 版本。
3. **Firebase 安全性**：公開讀寫規則適合家庭內部使用，但網址若被外人知道，理論上任何人都能投票。若需要限制，後續可加入 Firebase Authentication。
4. **離線功能**：轉盤在無網路時可正常使用（已快取）；投票功能需要網路連線才能同步。
5. **瀏覽器相容性**：PWA 在 iOS Safari 15+ 和所有現代 Android 瀏覽器均支援。
