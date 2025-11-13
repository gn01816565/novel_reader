/**
 * 平台管理器
 * 統一管理所有小說平台模組
 */
class PlatformManager {
    constructor() {
        this.platforms = new Map();
        this.currentPlatform = null;
    }

    /**
     * 註冊平台
     * @param {Object} platform - 平台實例
     */
    register(platform) {
        this.platforms.set(platform.id, platform);
        console.log(`平台已註冊: ${platform.name} (${platform.id})`);
    }

    /**
     * 獲取平台
     * @param {string} platformId - 平台 ID
     * @returns {Object} 平台實例
     */
    getPlatform(platformId) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error(`平台不存在: ${platformId}`);
        }
        return platform;
    }

    /**
     * 設定當前平台
     * @param {string} platformId - 平台 ID
     */
    setCurrentPlatform(platformId) {
        this.currentPlatform = this.getPlatform(platformId);
        console.log(`切換到平台: ${this.currentPlatform.name}`);
    }

    /**
     * 獲取當前平台
     * @returns {Object} 當前平台實例
     */
    getCurrentPlatform() {
        if (!this.currentPlatform) {
            // 預設使用第一個註冊的平台
            const firstPlatform = this.platforms.values().next().value;
            if (firstPlatform) {
                this.currentPlatform = firstPlatform;
            } else {
                throw new Error('沒有可用的平台');
            }
        }
        return this.currentPlatform;
    }

    /**
     * 獲取所有平台列表
     * @returns {Array} 平台列表
     */
    getAllPlatforms() {
        return Array.from(this.platforms.values()).map(platform => ({
            id: platform.id,
            name: platform.name,
            domain: platform.domain
        }));
    }

    /**
     * 根據 URL 自動識別平台
     * @param {string} url - URL
     * @returns {Object|null} 平台實例
     */
    detectPlatform(url) {
        for (const platform of this.platforms.values()) {
            if (platform.isValidUrl(url)) {
                return platform;
            }
        }
        return null;
    }

    /**
     * 搜尋小說（使用當前平台）
     */
    async search(keyword) {
        const platform = this.getCurrentPlatform();
        return await platform.search(keyword);
    }

    /**
     * 獲取書籍資訊（自動識別平台）
     */
    async getBookInfo(bookUrl) {
        const platform = this.detectPlatform(bookUrl) || this.getCurrentPlatform();
        return await platform.getBookInfo(bookUrl);
    }

    /**
     * 獲取章節目錄（自動識別平台）
     */
    async getChapterList(bookUrl) {
        const platform = this.detectPlatform(bookUrl) || this.getCurrentPlatform();
        return await platform.getChapterList(bookUrl);
    }

    /**
     * 獲取章節內容（自動識別平台）
     */
    async getChapterContent(chapterUrl) {
        const platform = this.detectPlatform(chapterUrl) || this.getCurrentPlatform();
        return await platform.getChapterContent(chapterUrl);
    }
}

// 創建全域平台管理器實例
const platformManager = new PlatformManager();

// 註冊筆趣閣平台（如果在瀏覽器環境）
if (typeof BiqugePlatform !== 'undefined') {
    platformManager.register(new BiqugePlatform());
    platformManager.setCurrentPlatform('biquge');
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformManager;
}
