# 📚 小說閱讀器 Novel Reader

基於 Docker 的智能網頁小說閱讀器，使用真實瀏覽器（Puppeteer + Chrome）抓取小說內容，有效繞過反爬蟲機制。

## ✨ 特色功能

- 🌐 **真實瀏覽器模擬** - 使用 Google Chrome + Puppeteer，模擬真實用戶行為
- 🚀 **智能導航系統** - 自動識別章節結構，支援上一章/下一章快速切換
- 📖 **多網站支援** - 支援筆趣閣、五福小說網等多個小說網站
- 🔄 **智能分頁處理** - 自動檢測空頁面，智能跳轉到下一章節
- 💾 **自動儲存進度** - 使用 LocalStorage 記住閱讀進度
- 🐳 **Docker 容器化** - 一鍵部署，跨平台使用
- 🎨 **VS Code 風格介面** - 舒適的深色主題閱讀體驗

## 🎯 快速開始

### 前置需求

- Docker Desktop（Windows/macOS）或 Docker Engine（Linux）
- 4GB+ RAM（建議 8GB+）
- 2GB 可用硬碟空間

### 安裝步驟

1. **下載專案**
   ```bash
   cd novel-reader
   ```

2. **啟動服務**
   ```bash
   docker-compose up -d --build
   ```

3. **存取應用**

   開啟瀏覽器，造訪：
   ```
   http://localhost:9090/code-reader.html
   ```

## 📖 使用方式

### 基本操作

1. **輸入小說 URL**
   - 在「當前網址」欄位貼上章節 URL
   - 例如：`https://m.biquge.tw/book/1281700/78890835.html`

2. **開始抓取**
   - 點擊「分析並抓取」按鈕
   - 系統會自動使用 Puppeteer 抓取內容

3. **章節導航**
   - 使用「← 上一章」和「下一章 →」按鈕切換章節
   - 系統會自動捲動到頁面頂部
   - URL 會即時更新顯示當前抓取的頁面

4. **網站分類**
   - 使用下拉選單選擇網站類型
   - 🔄 自動檢測（預設）
   - 📚 筆趣閣（簡單導航）
   - 📖 五福/微風（分頁+章節）
   - 🌐 其他網站

### 支援的網站格式

#### 筆趣閣系列
```
https://m.biquge.tw/book/[書籍ID]/[章節ID].html
https://www.biquge.tw/book/[書籍ID]/[章節ID].html
```

#### 五福小說網/微風小說網
```
https://m.wfxs.tw/xs-[書籍ID]/du-[卷ID]/[頁碼].html
```

## 🛠️ 技術架構

### 後端技術
- **PHP 8.2** - 主要後端語言
- **Apache 2.4** - Web 伺服器
- **Node.js 20.x** - Puppeteer 運行環境
- **Google Chrome Stable** - 無頭瀏覽器
- **Puppeteer** - 瀏覽器自動化工具

### 前端技術
- **HTML5 / CSS3** - 介面設計（VS Code 風格）
- **Vanilla JavaScript** - 前端邏輯
- **LocalStorage** - 客戶端資料儲存

### 容器化
- **Docker** - 容器化平台
- **Docker Compose** - 容器編排工具

## 📋 專案結構

```
novel-reader/
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile                # Docker 映像建置配置
├── .dockerignore            # Docker 建置排除檔案
├── README.md                # 本文檔
├── claude.md                # 詳細技術文檔
└── src/                     # 原始碼目錄
    ├── code-reader.html     # 前端主頁面
    ├── fetch_novel.php      # PHP 後端 API
    └── fetch_with_browser.js # Puppeteer 抓取腳本
```

## 🔧 常用指令

### Docker 管理

```bash
# 啟動服務
docker-compose up -d

# 停止服務
docker-compose down

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 重新建置（修改 Dockerfile 後）
docker-compose up -d --build

# 查看容器狀態
docker-compose ps

# 進入容器 Shell
docker exec -it novel-reader-app bash
```

### 除錯指令

```bash
# 查看 PHP 錯誤日誌
docker exec novel-reader-app tail -f /var/log/php_errors.log

# 查看 Apache 錯誤日誌
docker exec novel-reader-app tail -f /var/log/apache2/error.log

# 測試 Chrome 是否正常
docker exec novel-reader-app google-chrome-stable --version

# 測試 Puppeteer 腳本
docker exec novel-reader-app node /var/www/html/fetch_with_browser.js "https://example.com"
```

## 🔍 故障排除

### 埠號被占用

如果 9090 埠被占用，修改 `docker-compose.yml`：

```yaml
ports:
  - "8080:80"  # 改為其他埠號
```

### 抓取失敗

1. 查看容器日誌：
   ```bash
   docker-compose logs --tail=50 novel-reader
   ```

2. 確認 Chrome 是否正常：
   ```bash
   docker exec novel-reader-app google-chrome-stable --version
   ```

3. 檢查網站 URL 格式是否正確

### 內容不完整

- 系統會自動過濾少於 500 字的空頁面
- 如果章節確實很短，可能會被誤判
- 可以手動複製內容貼到文字框

## 📊 智能功能說明

### 自動空頁面偵測
- 系統會檢查內容長度（> 500 字）
- 少於 500 字視為空頁面或廣告頁
- 自動跳到下一章繼續抓取

### 智能 URL 補全
- 五福小說網不完整 URL 會自動補充 `/1.html`
- 例如：`https://m.wfxs.tw/xs-123/du-456/` → `https://m.wfxs.tw/xs-123/du-456/1.html`

### 自動頁面捲動
- 切換章節後自動捲動到頂部
- 提供流暢的閱讀體驗

### URL 即時顯示
- 導航時即時更新 URL 輸入框
- 顯示正在抓取的頁面網址

## ⚠️ 使用注意事項

1. **僅供個人學習使用**
   - 請遵守網站的 robots.txt 和使用條款
   - 不要用於商業用途或大量爬取

2. **資料保護**
   - LocalStorage 儲存在本地瀏覽器
   - Cookie 儲存在 Docker Volume 中
   - 不會上傳任何資料到外部伺服器

3. **網路安全**
   - 容器僅開放必要的埠（80）
   - 建議在信任的網路環境中使用

## 📚 詳細文檔

更多詳細的技術文檔、效能優化、進階配置，請參考 [claude.md](claude.md)。

## 🐛 問題回報

如遇到問題，請提供以下資訊：
1. 錯誤訊息或截圖
2. Docker 版本（`docker --version`）
3. 作業系統版本
4. 容器日誌（`docker-compose logs`）

## 📄 授權

本專案僅供個人學習和研究使用。

---

**最後更新：** 2025-11-13
**版本：** 2.0
**Docker 映像：** PHP 8.2-Apache, Chrome 142.0, Node.js 20.x, Puppeteer Latest
