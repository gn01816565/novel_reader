/**
 * 筆趣閣平台模組
 */
class BiqugePlatform {
    constructor() {
        this.name = '筆趣閣';
        this.id = 'biquge';
        this.domain = 'biquge.tw';
        this.searchUrl = 'https://www.biquge.tw/search.php';
        this.mobileSearchUrl = 'https://m.biquge.tw/search.php';
    }

    /**
     * 搜尋小說
     * @param {string} keyword - 搜尋關鍵字
     * @returns {Promise<Array>} 搜尋結果
     * 格式: [{title, author, bookUrl, latestChapter, updateTime}]
     */
    async search(keyword) {
        // 呼叫後端 API
        const response = await fetch('search_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `platform=biquge&action=search&keyword=${encodeURIComponent(keyword)}`
        });

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '搜尋失敗');
        }
    }

    /**
     * 獲取書籍資訊
     * @param {string} bookUrl - 書籍首頁 URL
     * @returns {Promise<Object>}
     * 格式: {title, author, description, coverUrl, status, latestChapter}
     */
    async getBookInfo(bookUrl) {
        const response = await fetch('search_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `platform=biquge&action=getBookInfo&url=${encodeURIComponent(bookUrl)}`
        });

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '獲取書籍資訊失敗');
        }
    }

    /**
     * 獲取章節目錄
     * @param {string} bookUrl - 書籍首頁 URL
     * @returns {Promise<Array>}
     * 格式: [{chapterTitle, chapterUrl, chapterNum}]
     */
    async getChapterList(bookUrl) {
        const response = await fetch('search_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `platform=biquge&action=getChapterList&url=${encodeURIComponent(bookUrl)}`
        });

        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '獲取章節目錄失敗');
        }
    }

    /**
     * 獲取章節內容（使用現有的 fetch_novel.php）
     * @param {string} chapterUrl - 章節 URL
     * @returns {Promise<string>}
     */
    async getChapterContent(chapterUrl) {
        const response = await fetch('fetch_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${encodeURIComponent(chapterUrl)}`
        });

        const result = await response.json();
        if (result.success) {
            return result.content;
        } else {
            throw new Error(result.error || '獲取章節內容失敗');
        }
    }

    /**
     * 驗證 URL 是否屬於筆趣閣
     */
    isValidUrl(url) {
        return url.includes('biquge');
    }

    /**
     * 從書籍首頁 URL 提取書籍 ID
     * 例如: https://www.biquge.tw/book/1234/ -> 1234
     */
    extractBookId(bookUrl) {
        const match = bookUrl.match(/\/book\/(\d+)/);
        return match ? match[1] : null;
    }
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiqugePlatform;
}
