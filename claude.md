# 小說閱讀器 - 技術文檔

## 📋 專案概述

這是一個基於 Docker 的網頁小說閱讀器，使用真實瀏覽器（Puppeteer + Chrome）來抓取小說內容，有效繞過反爬蟲機制。

## 🛠️ 技術棧

### 後端技術
- **PHP 8.2** - 主要後端語言
- **Apache 2.4** - Web 伺服器
- **Node.js 20.x** - Puppeteer 運行環境
- **Google Chrome Stable** - 無頭瀏覽器
- **Puppeteer** - 瀏覽器自動化工具

### 前端技術
- **HTML5 / CSS3** - 介面設計
- **Vanilla JavaScript** - 前端邏輯
- **LocalStorage** - 客戶端資料儲存

### PHP 擴展
- `dom` - HTML/XML 解析
- `xml` - XML 處理
- `mbstring` - 多位元組字串處理（中文支援）
- `curl` - HTTP 請求（備用方案）

### 容器化
- **Docker** - 容器化平台
- **Docker Compose** - 容器編排工具

## 📦 系統需求

### 最低需求
- **作業系統：** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Docker Desktop：** 最新穩定版
- **記憶體：** 最少 4GB RAM（建議 8GB+）
- **硬碟空間：** 至少 2GB 可用空間

### 推薦需求
- **記憶體：** 8GB+ RAM
- **CPU：** 4 核心以上
- **網路：** 穩定的網際網路連線

## 🚀 快速開始

### 1. 安裝 Docker

#### Windows / macOS
1. 下載並安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. 啟動 Docker Desktop
3. 確認安裝成功：
   ```bash
   docker --version
   docker-compose --version
   ```

#### Linux (Ubuntu/Debian)
```bash
# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安裝 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 將當前使用者加入 docker 群組
sudo usermod -aG docker $USER

# 重新登入以套用群組變更
```

### 2. 下載專案

```bash
# 複製整個 novel-reader 資料夾到新電腦
# 或使用 git clone（如果有 git repository）
```

### 3. 啟動服務

```bash
# 進入專案目錄
cd novel-reader

# 建置並啟動容器（首次啟動需要較長時間）
docker-compose up -d --build

# 查看容器狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 4. 存取應用

開啟瀏覽器，造訪：
```
http://localhost:9090/code-reader.html
```

## 📂 專案結構

```
novel-reader/
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile                # Docker 映像建置配置
├── .dockerignore            # Docker 建置排除檔案
├── claude.md                # 本文檔
└── src/                     # 原始碼目錄
    ├── code-reader.html     # 前端主頁面
    ├── fetch_novel.php      # PHP 後端 API
    └── fetch_with_browser.js # Puppeteer 抓取腳本
```

## 🔧 配置說明

### Docker Compose 配置 (docker-compose.yml)

```yaml
services:
  novel-reader:
    build: .
    container_name: novel-reader-app
    ports:
      - "9090:80"              # 主機:容器 埠對應
    volumes:
      - ./src:/var/www/html    # 程式碼即時同步
      - novel-cookies:/tmp/novel_cookies  # Cookie 持久化
    environment:
      - TZ=Asia/Taipei         # 時區設定
    restart: unless-stopped    # 自動重啟
```

### 自訂埠號

如果 9090 埠被占用，可以修改 `docker-compose.yml`：

```yaml
ports:
  - "8080:80"  # 改為其他埠號
```

## 💡 使用方式

### 基本操作

1. **輸入小說 URL**
   - 在「當前網址」欄位輸入章節 URL
   - 點擊「分析 URL」

2. **自動抓取**
   - 點擊「抓取內容」開始抓取
   - 系統會自動使用 Puppeteer（真實瀏覽器）抓取

3. **章節導航**
   - 點擊「上一章」/「下一章」自動切換
   - 支援鍵盤快捷鍵（如有設定）

4. **查看結果**
   - 按 F12 開啟開發者工具
   - 在「Console」查看抓取日誌
   - 確認是否顯示 `method: 'puppeteer'`

### 支援的網站

目前支援的小說網站格式：
- 筆趣閣 (biquge.tw)
- 五福小說網 (wfxs.tw)
- 其他類似結構的網站

## 🔍 故障排除

### 容器無法啟動

**問題：** 埠號被占用
```bash
# 解決方案：
# 1. 修改 docker-compose.yml 中的埠號
# 2. 或停止占用該埠的程式
netstat -ano | findstr :9090  # Windows
lsof -i :9090                  # macOS/Linux
```

**問題：** Docker 未運行
```bash
# Windows/macOS: 啟動 Docker Desktop
# Linux:
sudo systemctl start docker
```

### 抓取失敗

**問題：** 顯示「抓取失敗」錯誤

**解決方案：**
1. 查看容器日誌：
   ```bash
   docker-compose logs --tail=50 novel-reader
   ```

2. 檢查 Chrome 是否正常運行：
   ```bash
   docker exec novel-reader-app google-chrome-stable --version
   ```

3. 檢查 Node.js 和 Puppeteer：
   ```bash
   docker exec novel-reader-app node -v
   docker exec novel-reader-app npm list puppeteer
   ```

### 內容不完整

**問題：** 抓取的內容不完整或格式錯誤

**可能原因：**
- 網站結構改變
- 反爬蟲機制更新
- JavaScript 未完全執行

**解決方案：**
1. 檢查控制台是否有 JavaScript 錯誤
2. 查看 `fetch_with_browser.js` 中的選擇器是否需要更新
3. 增加等待時間（修改 `waitForTimeout`）

### 容器佔用過多資源

**解決方案：**
```bash
# 限制容器資源使用（在 docker-compose.yml 中添加）
services:
  novel-reader:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

## 🛡️ 安全注意事項

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

## 📝 常用指令

### Docker Compose 指令

```bash
# 啟動服務
docker-compose up -d

# 停止服務
docker-compose down

# 重新建置映像
docker-compose build --no-cache

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 查看容器狀態
docker-compose ps

# 進入容器 Shell
docker exec -it novel-reader-app bash
```

### 清理指令

```bash
# 停止並移除所有容器、網路、映像
docker-compose down --rmi all --volumes

# 清理未使用的 Docker 資源
docker system prune -a --volumes
```

## 🔄 更新與維護

### 更新應用程式碼

```bash
# 如果修改了 src/ 目錄下的檔案，容器會自動同步
# 重新載入網頁即可看到變更

# 如果修改了 Dockerfile 或 docker-compose.yml
docker-compose down
docker-compose up -d --build
```

### 更新依賴

```bash
# 更新 Puppeteer 版本
docker exec novel-reader-app npm update puppeteer

# 重啟容器以套用變更
docker-compose restart
```

## 🐛 除錯技巧

### 查看 PHP 錯誤

```bash
# 查看 PHP 錯誤日誌
docker exec novel-reader-app tail -f /var/log/php_errors.log
```

### 查看 Apache 錯誤

```bash
# 查看 Apache 錯誤日誌
docker exec novel-reader-app tail -f /var/log/apache2/error.log
```

### 測試 Puppeteer 腳本

```bash
# 手動執行 Puppeteer 腳本測試
docker exec novel-reader-app node /var/www/html/fetch_with_browser.js "https://example.com"
```

## 📊 效能優化

### Chrome 記憶體優化

在 `fetch_with_browser.js` 中調整 Chrome 參數：

```javascript
args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--single-process',           // 單一程序模式（省記憶體）
    '--disable-extensions',       // 停用擴充功能
    '--disable-background-timer-throttling',
]
```

### 增加抓取速度

```javascript
// 減少等待時間
await page.waitForTimeout(1000);  // 從 2000 改為 1000

// 停用圖片載入
await page.setRequestInterception(true);
page.on('request', (req) => {
    if (req.resourceType() === 'image') {
        req.abort();
    } else {
        req.continue();
    }
});
```

## 📞 技術支援

### 問題回報

如遇到問題，請提供以下資訊：
1. 錯誤訊息
2. Docker 版本
3. 作業系統版本
4. 容器日誌（`docker-compose logs`）

### 相關連結

- [Docker 官方文檔](https://docs.docker.com/)
- [Puppeteer 官方文檔](https://pptr.dev/)
- [PHP 官方文檔](https://www.php.net/docs.php)

## 📄 授權

本專案僅供個人學習和研究使用。

## 🔄 版本控制

### Git 倉庫
- **GitHub：** https://github.com/gn01816565/novel_reader
- **分支：** main

### Git 操作記錄

**2025-11-13**
- 初始化 Git 倉庫
- 設定遠端倉庫連結
- 首次提交並推送到 GitHub

---

**最後更新：** 2025-11-13
**Docker 映像版本：** PHP 8.2-Apache, Chrome 142.0.7444.162, Node.js 20.x
