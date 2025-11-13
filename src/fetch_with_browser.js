#!/usr/bin/env node
/**
 * 使用 Puppeteer 抓取網頁內容
 * 模擬真實瀏覽器行為，繞過反爬蟲機制
 */

const puppeteer = require('puppeteer');

// 從命令行參數獲取 URL
const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error(JSON.stringify({
        success: false,
        error: '請提供網頁 URL'
    }));
    process.exit(1);
}

(async () => {
    let browser;
    try {
        // 啟動瀏覽器
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ],
            executablePath: '/usr/bin/google-chrome-stable'
        });

        const page = await browser.newPage();

        // 設置 User-Agent 模擬真實瀏覽器
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 設置視窗大小
        await page.setViewport({ width: 1920, height: 1080 });

        // 訪問目標網頁
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // 等待頁面完全載入
        await page.waitForTimeout(2000);

        // 提取內容 - 針對不同網站使用不同選擇器
        let content = '';
        let title = '';

        try {
            // 嘗試獲取標題
            title = await page.title();
        } catch (e) {
            title = '';
        }

        // 嘗試各種選擇器提取正文內容
        const selectors = [
            '#content',              // 筆趣閣
            '.content',
            '#chaptercontent',
            '.chapter-content',
            '.article-content',
            'article',
            '.text-content',
            '.novel-content',
            '#booktext',
            '.readcontent',
            '.read-content',
            '#txtContent',           // 五福小說網等
            '.txt-content',
            'main',
            '[role="main"]'
        ];

        for (const selector of selectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const text = await page.evaluate(el => {
                        // 移除腳本和樣式標籤
                        const scripts = el.querySelectorAll('script, style, .ad, .adsbygoogle');
                        scripts.forEach(s => s.remove());

                        // 獲取純文字內容
                        return el.innerText || el.textContent;
                    }, element);

                    if (text && text.trim().length > 500) {
                        content = text.trim();
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // 如果還是沒有內容，嘗試獲取 body 的文字內容
        if (!content || content.length < 500) {
            content = await page.evaluate(() => {
                // 移除不需要的元素
                const unwanted = document.querySelectorAll('script, style, nav, header, footer, .ad, .adsbygoogle, .share, .social');
                unwanted.forEach(el => el.remove());

                // 找到最大的文字區塊
                const allDivs = document.querySelectorAll('div, article, section, main');
                let maxText = '';

                allDivs.forEach(div => {
                    const text = div.innerText || div.textContent || '';
                    if (text.length > maxText.length) {
                        maxText = text;
                    }
                });

                return maxText.trim();
            });
        }

        // 清理內容
        content = cleanContent(content);

        // 返回結果
        console.log(JSON.stringify({
            success: true,
            content: content,
            title: title,
            url: targetUrl
        }));

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            url: targetUrl
        }));
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();

/**
 * 清理內容
 */
function cleanContent(text) {
    if (!text) return '';

    // 移除常見的廣告文字
    const adPatterns = [
        /筆趣閣.{0,20}www\..{0,30}/g,
        /最新章節.{0,30}/g,
        /更新最快.{0,30}/g,
        /手機版閱讀.{0,30}/g,
        /請記住本站.{0,30}/g,
        /一秒記住.{0,30}/g,
        /分享到.{0,20}/g,
        /Facebook|Line|Twitter/g,
        /廣告|Advertisement/gi,
        /點擊廣告.{0,20}/g
    ];

    adPatterns.forEach(pattern => {
        text = text.replace(pattern, '');
    });

    // 移除多餘的空白
    text = text.replace(/\s+/g, ' ').trim();

    // 移除多餘的換行
    text = text.replace(/\n\s*\n/g, '\n\n');

    return text;
}
