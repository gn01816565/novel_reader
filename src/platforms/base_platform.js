/**
 * 小說平台基礎類別
 * 所有平台模組都繼承這個類別
 */
class BasePlatform {
    constructor() {
        this.name = 'Base Platform';
        this.domain = '';
    }

    /**
     * 搜尋小說
     * @param {string} keyword - 搜尋關鍵字
     * @returns {Promise<Array>} 搜尋結果列表
     */
    async search(keyword) {
        throw new Error('search() must be implemented');
    }

    /**
     * 獲取書籍資訊
     * @param {string} bookUrl - 書籍 URL
     * @returns {Promise<Object>} 書籍資訊（書名、作者、簡介等）
     */
    async getBookInfo(bookUrl) {
        throw new Error('getBookInfo() must be implemented');
    }

    /**
     * 獲取章節目錄
     * @param {string} bookUrl - 書籍 URL
     * @returns {Promise<Array>} 章節列表
     */
    async getChapterList(bookUrl) {
        throw new Error('getChapterList() must be implemented');
    }

    /**
     * 獲取章節內容
     * @param {string} chapterUrl - 章節 URL
     * @returns {Promise<string>} 章節內容
     */
    async getChapterContent(chapterUrl) {
        throw new Error('getChapterContent() must be implemented');
    }

    /**
     * 驗證 URL 是否屬於此平台
     * @param {string} url - URL
     * @returns {boolean}
     */
    isValidUrl(url) {
        return url.includes(this.domain);
    }
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BasePlatform;
}
