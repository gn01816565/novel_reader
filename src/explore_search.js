// 探索筆趣閣搜尋功能的測試腳本
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
        ]
    });

    const page = await browser.newPage();

    try {
        console.log('正在訪問筆趣閣首頁...');
        await page.goto('https://m.biquge.tw/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('頁面標題:', await page.title());

        // 尋找搜尋框
        const searchInput = await page.$('input[type="text"]') ||
                           await page.$('input[name*="search"]') ||
                           await page.$('input[placeholder*="搜"]') ||
                           await page.$('.search-input');

        if (searchInput) {
            console.log('找到搜尋框！');
            const inputInfo = await page.evaluate(el => ({
                name: el.name,
                id: el.id,
                placeholder: el.placeholder,
                className: el.className
            }), searchInput);
            console.log('搜尋框資訊:', JSON.stringify(inputInfo, null, 2));

            // 找搜尋按鈕
            const searchButton = await page.$('button[type="submit"]') ||
                                await page.$('input[type="submit"]') ||
                                await page.$('.search-btn');
            if (searchButton) {
                console.log('找到搜尋按鈕！');
            }

            // 測試搜尋
            console.log('\n嘗試搜尋「修真聊天群」...');
            await searchInput.type('修真聊天群');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 提交搜尋
            if (searchButton) {
                await searchButton.click();
            } else {
                await page.keyboard.press('Enter');
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            const currentUrl = page.url();
            console.log('搜尋後 URL:', currentUrl);
            console.log('頁面標題:', await page.title());

            // 檢查搜尋結果
            const results = await page.evaluate(() => {
                const items = [];
                // 常見的書籍列表選擇器
                const selectors = [
                    '.book-item',
                    '.search-item',
                    '.novel-item',
                    'li a[href*="book"]',
                    '.result-item'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        console.log('找到選擇器:', selector, '數量:', elements.length);
                        for (let i = 0; i < Math.min(3, elements.length); i++) {
                            items.push({
                                text: elements[i].textContent.trim().substring(0, 100),
                                href: elements[i].href || elements[i].querySelector('a')?.href
                            });
                        }
                        break;
                    }
                }
                return items;
            });

            console.log('\n搜尋結果（前3筆）:');
            results.forEach((item, i) => {
                console.log(`${i+1}. ${item.text}`);
                console.log(`   連結: ${item.href}\n`);
            });

        } else {
            console.log('沒有找到搜尋框，顯示頁面結構...');
            const pageStructure = await page.evaluate(() => {
                return document.body.innerHTML.substring(0, 2000);
            });
            console.log(pageStructure);
        }

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        await browser.close();
    }
})();
