#!/usr/bin/env node
/**
 * 使用 Puppeteer 進行搜尋、獲取書籍資訊和章節目錄
 * 用法: node search_with_browser.js <URL> <action>
 * action: search | bookInfo | chapterList
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const url = process.argv[2];
const action = process.argv[3] || 'search';

if (!url) {
    console.log(JSON.stringify({
        success: false,
        error: '請提供 URL'
    }));
    process.exit(1);
}

const cookieFile = '/tmp/novel_cookies/biquge_cookies.json';

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        executablePath: '/usr/bin/google-chrome-stable'
    });

    try {
        const page = await browser.newPage();

        // 設定 User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 設定額外的 headers
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        // 隱藏 webdriver 屬性
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        // 載入 Cookie
        if (fs.existsSync(cookieFile)) {
            const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
            await page.setCookie(...cookies);
        }

        // 訪問頁面
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // 等待 Cloudflare 驗證完成（需要較長時間）
        await new Promise(resolve => setTimeout(resolve, 8000));

        // 等待頁面完全加載
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
        } catch (e) {
            // 忽略超時錯誤
        }

        // Debug: 輸出頁面標題和部分 HTML
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));

        let result;
        let debugInfo = null;
        switch (action) {
            case 'search':
                result = await extractSearchResults(page);
                // Debug info
                debugInfo = {
                    title: title,
                    bodyPreview: bodyText,
                    url: page.url()
                };
                break;
            case 'bookInfo':
                result = await extractBookInfo(page);
                break;
            case 'chapterList':
                result = await extractChapterList(page);
                break;
            default:
                throw new Error('未知的操作: ' + action);
        }

        // 儲存 Cookie
        const cookies = await page.cookies();
        fs.mkdirSync('/tmp/novel_cookies', { recursive: true });
        fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));

        const output = {
            success: true,
            data: result,
            method: 'puppeteer',
            action: action
        };
        if (debugInfo) {
            output.debug = debugInfo;
        }
        console.log(JSON.stringify(output));

    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            action: action
        }));
    } finally {
        await browser.close();
    }
})();

/**
 * 提取搜尋結果
 */
async function extractSearchResults(page) {
    return await page.evaluate(() => {
        const results = [];

        // 嘗試多種選擇器（筆趣閣可能的結構）
        const selectors = [
            '.result-item',
            '.search-item',
            '.book-item',
            '.result-game-item',
            '#sitembox .bookbox',
            '.result-list .item'
        ];

        let items = [];
        for (const selector of selectors) {
            items = document.querySelectorAll(selector);
            if (items.length > 0) break;
        }

        // 如果沒有找到，嘗試找所有包含 book 連結的項目
        if (items.length === 0) {
            const links = document.querySelectorAll('a[href*="/book/"]');
            links.forEach(link => {
                const parent = link.closest('li, div, tr');
                if (parent && !results.some(r => r.bookUrl === link.href)) {
                    results.push({
                        title: link.textContent.trim(),
                        author: '',
                        bookUrl: link.href,
                        latestChapter: '',
                        updateTime: ''
                    });
                }
            });
        } else {
            items.forEach(item => {
                const titleLink = item.querySelector('a[href*="/book/"]');
                if (!titleLink) return;

                const title = titleLink.textContent.trim();
                const bookUrl = titleLink.href;

                // 嘗試提取作者
                const authorEl = item.querySelector('.author, .writer, [class*="author"]');
                const author = authorEl ? authorEl.textContent.trim().replace(/作者[：:]\s*/, '') : '';

                // 嘗試提取最新章節
                const latestEl = item.querySelector('.latest, [class*="latest"], .update');
                const latestChapter = latestEl ? latestEl.textContent.trim() : '';

                // 嘗試提取更新時間
                const timeEl = item.querySelector('.time, [class*="time"], .date');
                const updateTime = timeEl ? timeEl.textContent.trim() : '';

                results.push({
                    title,
                    author,
                    bookUrl,
                    latestChapter,
                    updateTime
                });
            });
        }

        return results;
    });
}

/**
 * 提取書籍資訊
 */
async function extractBookInfo(page) {
    return await page.evaluate(() => {
        const info = {};

        // 書名
        const titleEl = document.querySelector('h1, .book-title, .bookname');
        info.title = titleEl ? titleEl.textContent.trim() : '';

        // 作者
        const authorEl = document.querySelector('.author, .writer, [itemprop="author"]');
        info.author = authorEl ? authorEl.textContent.trim().replace(/作者[：:]\s*/, '') : '';

        // 簡介
        const descEl = document.querySelector('.intro, .desc, #intro, [itemprop="description"]');
        info.description = descEl ? descEl.textContent.trim() : '';

        // 封面
        const coverEl = document.querySelector('.cover img, .book-img img');
        info.coverUrl = coverEl ? coverEl.src : '';

        // 狀態
        const statusEl = document.querySelector('.status, .state');
        info.status = statusEl ? statusEl.textContent.trim() : '';

        // 最新章節
        const latestEl = document.querySelector('.latest, #newlist a');
        info.latestChapter = latestEl ? latestEl.textContent.trim() : '';

        return info;
    });
}

/**
 * 提取章節目錄
 */
async function extractChapterList(page) {
    return await page.evaluate(() => {
        const chapters = [];

        // 嘗試多種選擇器
        const selectors = [
            '#list a',
            '.chapter-list a',
            '.listmain a',
            '#chapterlist a',
            '.book-list a'
        ];

        let links = [];
        for (const selector of selectors) {
            links = document.querySelectorAll(selector);
            if (links.length > 0) break;
        }

        links.forEach((link, index) => {
            const title = link.textContent.trim();
            const url = link.href;

            // 過濾掉非章節連結
            if (title && url && !title.includes('最新') && !title.includes('目錄')) {
                chapters.push({
                    chapterNum: index + 1,
                    chapterTitle: title,
                    chapterUrl: url
                });
            }
        });

        return chapters;
    });
}
