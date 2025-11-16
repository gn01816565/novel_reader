// 全域變數：儲存 URL 規則
let urlPattern = null;
let currentChapterInfo = null;
let disguiseMode = true; // 偽裝模式開關（預設開啟）

// ==================== 平台管理系統 ====================

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

    async search(keyword) {
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

    isValidUrl(url) {
        return url.includes('biquge');
    }

    extractBookId(bookUrl) {
        const match = bookUrl.match(/\/book\/(\d+)/);
        return match ? match[1] : null;
    }
}

/**
 * 平台管理器
 */
class PlatformManager {
    constructor() {
        this.platforms = new Map();
        this.currentPlatform = null;
    }

    register(platform) {
        this.platforms.set(platform.id, platform);
        console.log(`平台已註冊: ${platform.name} (${platform.id})`);
    }

    getPlatform(platformId) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error(`平台不存在: ${platformId}`);
        }
        return platform;
    }

    setCurrentPlatform(platformId) {
        this.currentPlatform = this.getPlatform(platformId);
        console.log(`切換到平台: ${this.currentPlatform.name}`);
    }

    getCurrentPlatform() {
        if (!this.currentPlatform) {
            const firstPlatform = this.platforms.values().next().value;
            if (firstPlatform) {
                this.currentPlatform = firstPlatform;
            } else {
                throw new Error('沒有可用的平台');
            }
        }
        return this.currentPlatform;
    }

    getAllPlatforms() {
        return Array.from(this.platforms.values()).map(platform => ({
            id: platform.id,
            name: platform.name,
            domain: platform.domain
        }));
    }

    detectPlatform(url) {
        for (const platform of this.platforms.values()) {
            if (platform.isValidUrl(url)) {
                return platform;
            }
        }
        return null;
    }

    async search(keyword) {
        const platform = this.getCurrentPlatform();
        return await platform.search(keyword);
    }

    async getBookInfo(bookUrl) {
        const platform = this.detectPlatform(bookUrl) || this.getCurrentPlatform();
        return await platform.getBookInfo(bookUrl);
    }

    async getChapterList(bookUrl) {
        const platform = this.detectPlatform(bookUrl) || this.getCurrentPlatform();
        return await platform.getChapterList(bookUrl);
    }

    async getChapterContent(chapterUrl) {
        const platform = this.detectPlatform(chapterUrl) || this.getCurrentPlatform();
        return await platform.getChapterContent(chapterUrl);
    }
}

// 初始化平台管理器
const platformManager = new PlatformManager();
platformManager.register(new BiqugePlatform());
platformManager.setCurrentPlatform('biquge');

// URL 規則解析器
const urlPatterns = {
    // 筆趣閣手機版：https://m.biquge.tw/book/1281700/78890835.html
    biquge_mobile: {
        pattern: /^(https?:\/\/m\.biquge\.[^\/\?]+)\/book\/(\d+)\/(\d+)\.html/i,
        template: '{domain}/book/{bookId}/{chapterId}.html',
        extract: (url) => {
            // 移除可能的查詢參數
            url = url.split('?')[0].split('#')[0];
            const match = url.match(/^(https?:\/\/m\.biquge\.[^\/]+)\/book\/(\d+)\/(\d+)\.html/i);
            if (match) {
                console.log('筆趣閣手機版匹配成功:', match);
                return {
                    domain: match[1],
                    bookId: match[2],
                    chapterId: parseInt(match[3]),
                    chapterIdType: 'number'
                };
            }
            return null;
        }
    },
    // 筆趣閣PC版：https://www.biquge.tw/book/1281700/78890835.html
    biquge_pc: {
        pattern: /^(https?:\/\/www\.biquge\.[^\/\?]+)\/book\/(\d+)\/(\d+)\.html/i,
        template: '{domain}/book/{bookId}/{chapterId}.html',
        extract: (url) => {
            url = url.split('?')[0].split('#')[0];
            const match = url.match(/^(https?:\/\/www\.biquge\.[^\/]+)\/book\/(\d+)\/(\d+)\.html/i);
            if (match) {
                console.log('筆趣閣PC版匹配成功:', match);
                return {
                    domain: match[1],
                    bookId: match[2],
                    chapterId: parseInt(match[3]),
                    chapterIdType: 'number'
                };
            }
            return null;
        }
    },
    // 通用筆趣閣格式（包含各種域名變體）
    biquge_generic: {
        pattern: /^(https?:\/\/[^\/]*biquge[^\/]*)\/book\/(\d+)\/(\d+)\.html/i,
        template: '{domain}/book/{bookId}/{chapterId}.html',
        extract: (url) => {
            url = url.split('?')[0].split('#')[0];
            const match = url.match(/^(https?:\/\/[^\/]*biquge[^\/]*)\/book\/(\d+)\/(\d+)\.html/i);
            if (match) {
                console.log('通用筆趣閣格式匹配成功:', match);
                return {
                    domain: match[1],
                    bookId: match[2],
                    chapterId: parseInt(match[3]),
                    chapterIdType: 'number'
                };
            }
            return null;
        }
    },
    // 五福小說網：https://m.wfxs.tw/xs-2075761/du-152156760/2.html
    wfxs: {
        pattern: /^(https?:\/\/[^\/]*wfxs\.[^\/]+)\/xs-(\d+)\/du-(\d+)\/(\d+)\.html/i,
        template: '{domain}/xs-{bookId}/du-{volumeId}/{chapterId}.html',
        extract: (url) => {
            url = url.split('?')[0].split('#')[0];
            const match = url.match(/^(https?:\/\/[^\/]*wfxs\.[^\/]+)\/xs-(\d+)\/du-(\d+)\/(\d+)\.html/i);
            if (match) {
                console.log('五福小說網匹配成功:', match);
                return {
                    domain: match[1],
                    bookId: match[2],
                    volumeId: match[3],
                    chapterId: parseInt(match[4]),
                    chapterIdType: 'number'
                };
            }
            return null;
        }
    },
};

// 分析 URL 結構
function analyzeUrl(url) {
    for (const [name, pattern] of Object.entries(urlPatterns)) {
        const info = pattern.extract(url);
        if (info) {
            info.patternName = name;
            info.template = pattern.template;
            return info;
        }
    }
    return null;
}

// 根據規則生成新的 URL
function generateUrl(info, offset) {
    if (!info || info.chapterIdType !== 'number') return null;

    const newChapterId = info.chapterId + offset;
    let newUrl = info.template
        .replace('{domain}', info.domain)
        .replace('{bookId}', info.bookId)
        .replace('{chapterId}', newChapterId);

    // 如果有 volumeId（例如五福小說網）
    if (info.volumeId) {
        newUrl = newUrl.replace('{volumeId}', info.volumeId);
    }

    return newUrl;
}

// 假程式碼模板（大幅擴充以提高程式碼比例）
const fakeCodeTemplates = [
    // 函數定義
    '<span class="keyword">function</span> <span class="function">processData</span>(<span class="variable">$input</span>, <span class="variable">$options</span> = []) {',
    '    <span class="keyword">if</span> (<span class="function">empty</span>(<span class="variable">$input</span>)) {',
    '        <span class="keyword">return</span> <span class="keyword">null</span>;',
    '    }',
    '    <span class="keyword">return</span> <span class="function">array_filter</span>(<span class="variable">$input</span>, <span class="keyword">function</span>(<span class="variable">$item</span>) {',
    '        <span class="keyword">return</span> !<span class="function">empty</span>(<span class="variable">$item</span>);',
    '    });',
    '}',
    '',
    // 類別定義
    '<span class="keyword">class</span> <span class="function">DataProcessor</span> {',
    '    <span class="keyword">private</span> <span class="variable">$config</span>;',
    '    <span class="keyword">private</span> <span class="variable">$cache</span> = [];',
    '    ',
    '    <span class="keyword">public function</span> <span class="function">__construct</span>(<span class="variable">$config</span> = []) {',
    '        <span class="variable">$this</span>-><span class="variable">config</span> = <span class="function">array_merge</span>(<span class="variable">$this</span>-><span class="function">getDefaultConfig</span>(), <span class="variable">$config</span>);',
    '    }',
    '    ',
    '    <span class="keyword">protected function</span> <span class="function">getDefaultConfig</span>() {',
    '        <span class="keyword">return</span> [',
    '            <span class="string">\'timeout\'</span> => <span class="number">30</span>,',
    '            <span class="string">\'retry\'</span> => <span class="number">3</span>,',
    '            <span class="string">\'encoding\'</span> => <span class="string">\'UTF-8\'</span>',
    '        ];',
    '    }',
    '}',
    '',
    // 條件判斷
    '<span class="keyword">if</span> (<span class="function">isset</span>(<span class="variable">$data</span>[<span class="string">\'status\'</span>]) && <span class="variable">$data</span>[<span class="string">\'status\'</span>] === <span class="string">\'success\'</span>) {',
    '    <span class="variable">$result</span> = <span class="variable">$this</span>-><span class="function">processSuccess</span>(<span class="variable">$data</span>);',
    '} <span class="keyword">else</span> {',
    '    <span class="variable">$this</span>-><span class="function">logError</span>(<span class="string">\'Invalid status\'</span>);',
    '    <span class="keyword">return</span> <span class="keyword">false</span>;',
    '}',
    '',
    // Try-Catch 區塊
    '<span class="keyword">try</span> {',
    '    <span class="variable">$connection</span> = <span class="keyword">new</span> <span class="function">DatabaseConnection</span>(<span class="variable">$config</span>);',
    '    <span class="variable">$result</span> = <span class="variable">$connection</span>-><span class="function">query</span>(<span class="variable">$sql</span>);',
    '} <span class="keyword">catch</span> (<span class="function">Exception</span> <span class="variable">$e</span>) {',
    '    <span class="function">error_log</span>(<span class="variable">$e</span>-><span class="function">getMessage</span>());',
    '    <span class="keyword">throw</span> <span class="keyword">new</span> <span class="function">RuntimeException</span>(<span class="string">\'Database error\'</span>);',
    '}',
    '',
    // 迴圈
    '<span class="keyword">foreach</span> (<span class="variable">$items</span> <span class="keyword">as</span> <span class="variable">$key</span> => <span class="variable">$value</span>) {',
    '    <span class="keyword">if</span> (<span class="function">is_array</span>(<span class="variable">$value</span>)) {',
    '        <span class="variable">$items</span>[<span class="variable">$key</span>] = <span class="variable">$this</span>-><span class="function">sanitize</span>(<span class="variable">$value</span>);',
    '    }',
    '}',
    '',
    // 陣列操作
    '<span class="variable">$filtered</span> = <span class="function">array_map</span>(<span class="keyword">function</span>(<span class="variable">$item</span>) {',
    '    <span class="keyword">return</span> [',
    '        <span class="string">\'id\'</span> => <span class="variable">$item</span>[<span class="string">\'id\'</span>],',
    '        <span class="string">\'timestamp\'</span> => <span class="function">time</span>(),',
    '        <span class="string">\'processed\'</span> => <span class="keyword">true</span>',
    '    ];',
    '}, <span class="variable">$rawData</span>);',
    '',
    // Switch 語句
    '<span class="keyword">switch</span> (<span class="variable">$type</span>) {',
    '    <span class="keyword">case</span> <span class="string">\'json\'</span>:',
    '        <span class="keyword">return</span> <span class="function">json_encode</span>(<span class="variable">$data</span>);',
    '    <span class="keyword">case</span> <span class="string">\'xml\'</span>:',
    '        <span class="keyword">return</span> <span class="variable">$this</span>-><span class="function">toXml</span>(<span class="variable">$data</span>);',
    '    <span class="keyword">default</span>:',
    '        <span class="keyword">return</span> <span class="function">serialize</span>(<span class="variable">$data</span>);',
    '}',
    '',
    // 靜態方法
    '<span class="keyword">public static function</span> <span class="function">getInstance</span>() {',
    '    <span class="keyword">if</span> (<span class="keyword">self</span>::<span class="variable">$instance</span> === <span class="keyword">null</span>) {',
    '        <span class="keyword">self</span>::<span class="variable">$instance</span> = <span class="keyword">new</span> <span class="keyword">self</span>();',
    '    }',
    '    <span class="keyword">return</span> <span class="keyword">self</span>::<span class="variable">$instance</span>;',
    '}',
    '',
    // 驗證函數
    '<span class="keyword">protected function</span> <span class="function">validate</span>(<span class="variable">$input</span>) {',
    '    <span class="variable">$rules</span> = [',
    '        <span class="string">\'required\'</span> => [<span class="string">\'name\'</span>, <span class="string">\'email\'</span>],',
    '        <span class="string">\'email\'</span> => [<span class="string">\'email\'</span>]',
    '    ];',
    '    <span class="keyword">return</span> <span class="variable">$this</span>-><span class="variable">validator</span>-><span class="function">check</span>(<span class="variable">$input</span>, <span class="variable">$rules</span>);',
    '}',
    '',
    // 資料庫查詢
    '<span class="variable">$query</span> = <span class="variable">$this</span>-><span class="variable">db</span>-><span class="function">table</span>(<span class="string">\'users\'</span>)',
    '    -><span class="function">where</span>(<span class="string">\'status\'</span>, <span class="string">\'active\'</span>)',
    '    -><span class="function">orderBy</span>(<span class="string">\'created_at\'</span>, <span class="string">\'DESC\'</span>)',
    '    -><span class="function">limit</span>(<span class="number">10</span>)',
    '    -><span class="function">get</span>();',
    '',
    // API 呼叫
    '<span class="variable">$response</span> = <span class="variable">$this</span>-><span class="variable">httpClient</span>-><span class="function">post</span>(<span class="variable">$endpoint</span>, [',
    '    <span class="string">\'headers\'</span> => [<span class="string">\'Authorization\'</span> => <span class="string">\'Bearer \'</span> . <span class="variable">$token</span>],',
    '    <span class="string">\'json\'</span> => <span class="variable">$payload</span>,',
    '    <span class="string">\'timeout\'</span> => <span class="number">30</span>',
    ']);',
    '',
    // 快取處理
    '<span class="keyword">if</span> (<span class="variable">$this</span>-><span class="variable">cache</span>-><span class="function">has</span>(<span class="variable">$key</span>)) {',
    '    <span class="keyword">return</span> <span class="variable">$this</span>-><span class="variable">cache</span>-><span class="function">get</span>(<span class="variable">$key</span>);',
    '}',
    '<span class="variable">$data</span> = <span class="variable">$this</span>-><span class="function">fetchFromDatabase</span>(<span class="variable">$key</span>);',
    '<span class="variable">$this</span>-><span class="variable">cache</span>-><span class="function">put</span>(<span class="variable">$key</span>, <span class="variable">$data</span>, <span class="number">3600</span>);',
    '',
    // 日誌記錄
    '<span class="variable">$this</span>-><span class="variable">logger</span>-><span class="function">info</span>(<span class="string">\'Processing request\'</span>, [',
    '    <span class="string">\'user_id\'</span> => <span class="variable">$userId</span>,',
    '    <span class="string">\'ip\'</span> => <span class="variable">$_SERVER</span>[<span class="string">\'REMOTE_ADDR\'</span>],',
    '    <span class="string">\'timestamp\'</span> => <span class="function">date</span>(<span class="string">\'Y-m-d H:i:s\'</span>)',
    ']);',
];

// 分析 URL 並抓取內容
async function analyzeAndFetch() {
    let url = document.getElementById('currentUrl').value.trim();

    if (!url) {
        updateChapterInfo('請輸入章節 URL');
        return;
    }

    console.log('準備分析 URL:', url);

    // 自動補充不完整的五福小說網 URL
    const wfxsIncomplete = url.match(/^(https?:\/\/[^\/]*wfxs\.[^\/]+\/xs-\d+\/du-\d+)\/?$/i);
    if (wfxsIncomplete) {
        url = wfxsIncomplete[1] + '/1.html';
        console.log('自動補充五福小說網 URL 為:', url);
        document.getElementById('currentUrl').value = url;
        updateChapterInfo('已自動補充為第 1 章');
    }

    // 分析 URL 結構
    const info = analyzeUrl(url);
    if (!info) {
        updateChapterInfo('無法識別此網站的 URL 格式');
        console.error('URL 無法匹配任何已知規則');
        console.log('請檢查 URL 格式是否正確，或手動貼上內容');

        // 顯示在頁面上
        alert('無法識別此網站的 URL 格式\n\n' +
              '您輸入的 URL：' + url + '\n\n' +
              '目前支援的網站：\n' +
              '- 筆趣閣：https://m.biquge.tw/book/數字/數字.html\n' +
              '- 筆趣閣：https://www.biquge.tw/book/數字/數字.html\n' +
              '- 五福小說網：https://m.wfxs.tw/xs-數字/du-數字/數字.html\n\n' +
              '您可以：\n' +
              '1. 檢查 URL 格式是否正確\n' +
              '2. 或直接複製網頁內容貼到下方文字框\n' +
              '3. 提供 URL 給我，我可以添加支援');
        return;
    }

    console.log('URL 分析結果:', info);
    currentChapterInfo = info;

    // 更新提示
    updateChapterInfo(`已識別：${info.patternName} | 章節 ${info.chapterId}`);

    // 開始抓取
    await fetchChapter(url);
}

// 抓取指定章節
async function fetchChapter(url, isAutoNext = false) {
    const novelInput = document.getElementById('novelInput');
    const chapterInfo = document.getElementById('chapterInfo');

    // ✅ 不在這裡更新 URL，等抓取成功後再更新，避免失敗時狀態不一致

    updateChapterInfo('正在抓取...');
    novelInput.value = '正在抓取網頁內容，請稍候...';
    novelInput.disabled = true;

    try {
        const response = await fetch('fetch_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'url=' + encodeURIComponent(url)
        });

        const result = await response.json();
        console.log('抓取結果:', result);

        if (result.success && result.content && result.content.trim().length > 500) {
            novelInput.value = result.content;
            novelInput.disabled = false;

            // ✅ 重新分析 URL，確保狀態同步
            const newInfo = analyzeUrl(url);
            if (newInfo) {
                currentChapterInfo = newInfo;
                console.log('已更新章節資訊:', currentChapterInfo);
            }

            // 自動轉換
            convertToCode();

            // 自動捲動到最上方
            document.getElementById('codeArea').scrollTop = 0;
            window.scrollTo(0, 0);

            // 更新章節資訊
            if (currentChapterInfo) {
                updateChapterInfo(`章節 ${currentChapterInfo.chapterId} | ${result.content.length} 字`);
                // 儲存當前 URL
                document.getElementById('currentUrl').value = url;
                localStorage.setItem('currentChapterUrl', url);
                localStorage.setItem('currentChapterInfo', JSON.stringify(currentChapterInfo));
            }
            return true; // 成功抓取
        } else {
            // 內容為空或太短，可能是最後一頁
            if (isAutoNext) {
                console.log('內容為空或太短，可能已到最後一頁');
                return false; // 抓取失敗
            }
            novelInput.value = '';
            novelInput.disabled = false;
            updateChapterInfo('抓取失敗：內容為空或太短');
            return false;
        }
    } catch (error) {
        console.error('抓取錯誤:', error);
        if (!isAutoNext) {
            novelInput.value = '';
            novelInput.disabled = false;
            updateChapterInfo('抓取失敗：' + error.message);
        }
        return false;
    }
}

// 上一章
async function previousChapter() {
    if (!currentChapterInfo) {
        updateChapterInfo('請先分析一個章節 URL');
        return;
    }

    const prevUrl = generateUrl(currentChapterInfo, -1);
    if (!prevUrl) {
        updateChapterInfo('無法生成上一章 URL');
        return;
    }

    console.log('上一章 URL:', prevUrl);

    // ✅ fetchChapter 會自動重新分析 URL 並更新 currentChapterInfo
    await fetchChapter(prevUrl);
}

// 下一章（智能分頁）
async function nextChapter() {
    if (!currentChapterInfo) {
        updateChapterInfo('請先分析一個章節 URL');
        return;
    }

    // 備份當前狀態（用於五福小說網的跨卷切換）
    const originalVolumeId = currentChapterInfo.volumeId;

    // 先嘗試當前章節的下一頁
    const nextPageUrl = generateUrl(currentChapterInfo, 1);
    if (!nextPageUrl) {
        updateChapterInfo('無法生成下一章 URL');
        return;
    }

    console.log('嘗試下一頁 URL:', nextPageUrl);

    const success = await fetchChapter(nextPageUrl, true);

    if (!success && originalVolumeId) {
        // 如果是五福小說網且當前頁沒有內容，嘗試下一個章節（卷）
        console.log('當前分頁已結束，嘗試下一章節...');

        // 使用原始的 volumeId 來生成下一卷 URL
        // 注意：這裡需要基於原始狀態，因為 fetchChapter 失敗時不會更新 currentChapterInfo
        const tempInfo = {
            ...currentChapterInfo,
            volumeId: parseInt(originalVolumeId) + 1,
            chapterId: 1
        };
        const nextVolumeUrl = generateUrl(tempInfo, 0);

        if (nextVolumeUrl) {
            console.log('跳轉到下一章節:', nextVolumeUrl);
            updateChapterInfo('自動跳轉到下一章節...');
            const volumeSuccess = await fetchChapter(nextVolumeUrl);

            if (!volumeSuccess) {
                updateChapterInfo('無法抓取下一章節');
            }
            // ✅ fetchChapter 成功時會自動更新 currentChapterInfo
        } else {
            updateChapterInfo('無法生成下一章節 URL');
        }
    } else if (!success) {
        // 非五福小說網或其他錯誤
        updateChapterInfo('已到最後一章或抓取失敗');
    }
    // ✅ 如果 success 為 true，fetchChapter 已經自動更新了 currentChapterInfo
}

// 更新章節資訊顯示
function updateChapterInfo(text) {
    document.getElementById('chapterInfo').textContent = text;
}

// 從 URL 抓取內容（保留舊功能）
async function fetchFromUrl() {
    const urlInput = document.getElementById('currentUrl');
    const url = urlInput.value.trim();

    if (!url) {
        alert('請輸入網頁 URL！');
        return;
    }

    console.log('準備抓取 URL:', url);

    // 顯示載入中
    const novelInput = document.getElementById('novelInput');
    novelInput.value = '正在抓取網頁內容，請稍候...';
    novelInput.disabled = true;

    try {
        const response = await fetch('fetch_novel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'url=' + encodeURIComponent(url)
        });

        const result = await response.json();
        console.log('抓取結果:', result);

        if (result.success) {
            novelInput.value = result.content;
            novelInput.disabled = false;
            alert('抓取成功！共 ' + result.content.length + ' 字，點擊「轉換」按鈕繼續');
        } else {
            novelInput.value = '';
            novelInput.disabled = false;
            alert('抓取失敗：' + result.error);
        }
    } catch (error) {
        console.error('抓取錯誤:', error);
        novelInput.value = '';
        novelInput.disabled = false;
        alert('抓取失敗：' + error.message);
    }
}

// 轉換小說內容為程式碼格式
function convertToCode() {
    console.log('轉換函數被調用');
    const input = document.getElementById('novelInput').value;
    console.log('輸入內容長度:', input.length);

    if (!input.trim()) {
        alert('請先輸入小說內容或從 URL 抓取！');
        console.log('輸入為空');
        return;
    }

    console.log('開始轉換...');

    // 根據偽裝模式選擇渲染方式
    if (!disguiseMode) {
        renderPlainText(input);
        return;
    }

    // 分割段落
    const paragraphs = input.split(/\n+/).filter(p => p.trim());
    const codeLines = [];
    let lineNumber = 1;

    // 添加檔案標頭
    codeLines.push('<span class="comment">/**</span>');
    codeLines.push('<span class="comment"> * Text Content Processing Module</span>');
    codeLines.push('<span class="comment"> * Generated: ' + new Date().toLocaleString('zh-TW') + '</span>');
    codeLines.push('<span class="comment"> */</span>');
    codeLines.push('');

    // 隨機插入假程式碼（大幅增加行數以達到 70% 程式碼比例）
    const insertFakeCode = (minLines = 5, maxLines = 12) => {
        const numLines = Math.floor(Math.random() * (maxLines - minLines + 1)) + minLines;
        for (let i = 0; i < numLines; i++) {
            const template = fakeCodeTemplates[Math.floor(Math.random() * fakeCodeTemplates.length)];
            codeLines.push(template);
        }
        codeLines.push('');
    };

    // 開頭先插入大量假程式碼
    insertFakeCode(8, 15);

    // 處理每個段落
    paragraphs.forEach((para, index) => {
        // 將段落分成句子
        const sentences = para.match(/[^。！？.!?]+[。！？.!?]*/g) || [para];

        sentences.forEach((sentence, sentIndex) => {
            // 每 1-2 句就插入大量假程式碼（提高比例到 70%）
            if (sentIndex > 0 && sentIndex % 2 === 0) {
                insertFakeCode(6, 10);
            }

            // 小說內容只佔少數（30%）
            // 隨機決定這句是否要顯示（讓小說內容更稀疏）
            const showSentence = Math.random() < 0.35;  // 只有 35% 的句子會顯示

            if (showSentence) {
                const formatType = Math.random();

                if (formatType < 0.5) {
                    // 單行註解格式（改為行內註解更不明顯）
                    codeLines.push(`<span class="variable">$status</span> = <span class="function">check</span>(); <span class="comment">// ${escapeHtml(sentence)}</span>`);
                } else {
                    // 字串變數格式（拆成更短的片段）
                    const varName = ['$log', '$msg', '$note', '$desc', '$meta'][Math.floor(Math.random() * 5)];
                    codeLines.push(`<span class="variable">${varName}</span> = <span class="string">"${escapeHtml(sentence)}"</span>;`);
                }
            }
        });

        // 每個段落後插入大量假程式碼
        insertFakeCode(7, 12);
    });

    // 結尾加入大量假程式碼
    insertFakeCode(10, 15);

    // 渲染到頁面
    renderCode(codeLines);

    // 儲存到 localStorage
    localStorage.setItem('novelContent', input);
    console.log('轉換完成！總共', codeLines.length, '行');

    // 自動隱藏輸入框
    setTimeout(() => {
        if (!document.getElementById('controlPanel').classList.contains('hidden')) {
            toggleInput();
        }
    }, 500);
}

// 儲存書籤
function saveBookmark() {
    const url = document.getElementById('currentUrl').value.trim();
    if (url) {
        localStorage.setItem('bookmarkUrl', url);
        console.log('書籤已儲存:', url);
    }
}

// 渲染程式碼和行號
function renderCode(codeLines) {
    console.log('開始渲染程式碼...');
    const codeArea = document.getElementById('codeArea');
    const lineNumbers = document.getElementById('lineNumbers');

    // 恢復行號顯示（可能在閱讀模式時被隱藏）
    lineNumbers.style.display = 'block';

    // 清除閱讀模式的內聯樣式
    codeArea.style = '';

    // 生成程式碼內容
    codeArea.innerHTML = codeLines
        .map(line => `<div class="code-line">${line || '&nbsp;'}</div>`)
        .join('');

    // 生成行號
    lineNumbers.innerHTML = codeLines
        .map((_, index) => index + 1)
        .join('<br>');
}

// HTML 跳脫
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 切換偽裝模式
function toggleDisguiseMode() {
    disguiseMode = !disguiseMode;

    // 更新按鈕文字
    const btn = document.getElementById('disguiseBtn');
    btn.textContent = disguiseMode ? '🎭 偽裝' : '📖 閱讀';
    btn.title = disguiseMode ? '切換到閱讀模式' : '切換到偽裝模式';

    // 儲存設定
    localStorage.setItem('disguiseMode', disguiseMode);

    // 重新渲染當前內容
    const input = document.getElementById('novelInput').value;
    if (input.trim()) {
        convertToCode();
    }

    console.log('偽裝模式:', disguiseMode ? '開啟' : '關閉');
}

// 非偽裝模式：渲染純文字閱讀格式
function renderPlainText(input) {
    console.log('使用閱讀模式渲染...');
    const codeArea = document.getElementById('codeArea');
    const lineNumbers = document.getElementById('lineNumbers');

    // 分割段落
    const paragraphs = input.split(/\n+/).filter(p => p.trim());

    // 生成閱讀友好的 HTML
    const readableHtml = paragraphs.map(para => {
        return `<div class="reading-paragraph">${escapeHtml(para)}</div>`;
    }).join('');

    // 設定閱讀模式樣式
    codeArea.innerHTML = `
        <style>
            .reading-paragraph {
                line-height: 2;
                margin-bottom: 1.5em;
                font-size: 16px;
                color: #d4d4d4;
                text-indent: 2em;
                letter-spacing: 0.05em;
            }
            #codeArea {
                padding: 30px 50px;
                max-width: 800px;
                margin: 0 auto;
            }
        </style>
        ${readableHtml}
    `;

    // 隱藏行號（閱讀模式不需要）
    lineNumbers.style.display = 'none';

    // 儲存內容
    localStorage.setItem('novelContent', input);
    console.log('閱讀模式渲染完成！');

    // 自動隱藏輸入框
    setTimeout(() => {
        if (!document.getElementById('controlPanel').classList.contains('hidden')) {
            toggleInput();
        }
    }, 500);
}

// 切換輸入面板顯示
function toggleInput() {
    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('hidden');

    // 調整編輯器高度
    const editor = document.querySelector('.editor-container');
    if (panel.classList.contains('hidden')) {
        editor.style.height = 'calc(100vh - 35px)';
    } else {
        editor.style.height = 'calc(100vh - 35px - 61px)';
    }
}

// 頁面載入時恢復上次的內容
window.addEventListener('DOMContentLoaded', () => {
    // 恢復主題設定
    loadSavedTheme();

    // 恢復偽裝模式設定
    const savedDisguiseMode = localStorage.getItem('disguiseMode');
    if (savedDisguiseMode !== null) {
        disguiseMode = savedDisguiseMode === 'true';
    }

    // 更新按鈕顯示
    const btn = document.getElementById('disguiseBtn');
    btn.textContent = disguiseMode ? '🎭 偽裝' : '📖 閱讀';
    btn.title = disguiseMode ? '切換到閱讀模式' : '切換到偽裝模式';

    // 恢復上次的章節資訊
    const savedUrl = localStorage.getItem('currentChapterUrl');
    const savedInfo = localStorage.getItem('currentChapterInfo');

    if (savedUrl && savedInfo) {
        document.getElementById('currentUrl').value = savedUrl;
        currentChapterInfo = JSON.parse(savedInfo);
        updateChapterInfo(`上次：章節 ${currentChapterInfo.chapterId}`);
    }

    // 恢復上次的小說內容
    const saved = localStorage.getItem('novelContent');
    if (saved) {
        document.getElementById('novelInput').value = saved;
        convertToCode();
    }
});

// ==================== 鍵盤快捷鍵 ====================

/**
 * 鍵盤快捷鍵支援
 *
 * 快捷鍵列表：
 * - ← / P：上一章
 * - → / N：下一章
 * - Space：往下捲動（PageDown）
 * - Shift + Space：往上捲動（PageUp）
 * - Home：回到頁面頂部
 * - End：跳到頁面底部
 * - Ctrl + H：切換輸入框
 * - Ctrl + D：切換偽裝模式
 * - Ctrl + B：加入書籤
 */
document.addEventListener('keydown', (e) => {
    // 如果焦點在輸入框或文字區域，不觸發快捷鍵（除了 Ctrl 組合鍵）
    const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                          document.activeElement.tagName === 'TEXTAREA';

    // Ctrl 組合鍵
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 'h':
                e.preventDefault();
                toggleInput();
                break;
            case 'd':
                e.preventDefault();
                toggleDisguiseMode();
                break;
            case 'b':
                e.preventDefault();
                addBookmark();
                break;
        }
        return;
    }

    // 如果在輸入框，其他快捷鍵不生效
    if (isInputFocused) return;

    // 方向鍵和字母鍵
    switch (e.key) {
        case 'ArrowLeft':
        case 'p':
        case 'P':
            e.preventDefault();
            previousChapter();
            break;

        case 'ArrowRight':
        case 'n':
        case 'N':
            e.preventDefault();
            nextChapter();
            break;

        case ' ':  // 空白鍵
            e.preventDefault();
            const codeArea = document.getElementById('codeArea');
            if (e.shiftKey) {
                // Shift + Space：往上捲動
                codeArea.scrollTop -= window.innerHeight * 0.8;
            } else {
                // Space：往下捲動
                codeArea.scrollTop += window.innerHeight * 0.8;
            }
            break;

        case 'Home':
            e.preventDefault();
            document.getElementById('codeArea').scrollTop = 0;
            window.scrollTo(0, 0);
            break;

        case 'End':
            e.preventDefault();
            const area = document.getElementById('codeArea');
            area.scrollTop = area.scrollHeight;
            break;
    }
});

// ==================== 自動續讀模式 ====================

let autoReadEnabled = false;
let autoReadCheckInterval = null;

/**
 * 切換自動續讀模式
 */
function toggleAutoRead() {
    autoReadEnabled = !autoReadEnabled;
    const autoReadBtn = document.getElementById('autoReadBtn');

    if (autoReadEnabled) {
        // 啟動自動續讀
        autoReadBtn.textContent = '⏸ 暫停';
        autoReadBtn.style.backgroundColor = '#16825d';
        startAutoReadCheck();
        console.log('自動續讀已啟動');
    } else {
        // 停止自動續讀
        autoReadBtn.textContent = '▶ 自動';
        autoReadBtn.style.backgroundColor = '';
        stopAutoReadCheck();
        console.log('自動續讀已停止');
    }

    // 儲存設定
    localStorage.setItem('autoReadEnabled', autoReadEnabled);
}

/**
 * 開始檢查是否需要自動載入下一章
 */
function startAutoReadCheck() {
    if (autoReadCheckInterval) {
        clearInterval(autoReadCheckInterval);
    }

    // 每 2 秒檢查一次是否接近底部
    autoReadCheckInterval = setInterval(() => {
        if (!autoReadEnabled) return;

        const codeArea = document.getElementById('codeArea');
        const scrollTop = codeArea.scrollTop;
        const scrollHeight = codeArea.scrollHeight;
        const clientHeight = codeArea.clientHeight;

        // 如果捲動到底部 90% 以上，自動載入下一章
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.9) {
            console.log('接近底部，準備自動載入下一章...');
            stopAutoReadCheck(); // 暫時停止檢查，避免重複觸發

            // 延遲 3 秒後載入下一章
            setTimeout(async () => {
                if (autoReadEnabled && currentChapterInfo) {
                    updateChapterInfo('自動續讀：載入下一章...');
                    await nextChapter();

                    // 載入完成後，等待 1 秒再重新開始檢查
                    setTimeout(() => {
                        if (autoReadEnabled) {
                            startAutoReadCheck();
                        }
                    }, 1000);
                }
            }, 3000);
        }
    }, 2000);
}

/**
 * 停止自動續讀檢查
 */
function stopAutoReadCheck() {
    if (autoReadCheckInterval) {
        clearInterval(autoReadCheckInterval);
        autoReadCheckInterval = null;
    }
}

// ==================== 主題切換 ====================

/**
 * 主題列表
 */
const themes = [
    { id: 'vscode', name: 'VS Code', icon: '💻' },
    { id: 'night', name: '純黑夜間', icon: '🌙' },
    { id: 'sepia', name: '護眼棕', icon: '📜' },
    { id: 'green', name: '護眼綠', icon: '🌿' }
];

let currentThemeIndex = 0;

/**
 * 切換到下一個主題
 */
function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const theme = themes[currentThemeIndex];

    // 更新 body 的 data-theme 屬性
    if (theme.id === 'vscode') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme.id);
    }

    // 更新按鈕文字
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.textContent = `${theme.icon} ${theme.name}`;
    }

    // 儲存主題設定
    localStorage.setItem('selectedTheme', theme.id);

    console.log('已切換到主題:', theme.name);
}

/**
 * 載入已儲存的主題
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        // 找到對應的主題索引
        const index = themes.findIndex(t => t.id === savedTheme);
        if (index !== -1) {
            currentThemeIndex = index;
            const theme = themes[currentThemeIndex];

            if (theme.id !== 'vscode') {
                document.body.setAttribute('data-theme', theme.id);
            }

            // 更新按鈕文字
            const themeBtn = document.getElementById('themeBtn');
            if (themeBtn) {
                themeBtn.textContent = `${theme.icon} ${theme.name}`;
            }
        }
    }
}

// ==================== 閱讀進度條 ====================

/**
 * 更新閱讀進度條
 */
function updateReadingProgress() {
    const codeArea = document.getElementById('codeArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!codeArea || !progressFill || !progressText) return;

    const scrollTop = codeArea.scrollTop;
    const scrollHeight = codeArea.scrollHeight - codeArea.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // 更新進度條高度
    progressFill.style.height = `${progress}%`;

    // 更新百分比文字
    progressText.textContent = `${Math.round(progress)}%`;
}

// 監聽捲動事件
document.getElementById('codeArea').addEventListener('scroll', updateReadingProgress);

// 內容變化時也更新進度
const progressObserver = new MutationObserver(updateReadingProgress);
progressObserver.observe(document.getElementById('codeArea'), {
    childList: true,
    subtree: true
});

// ==================== 搜尋功能 ====================

/**
 * 搜尋小說
 */
async function searchNovel() {
    const keyword = document.getElementById('searchKeyword').value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (!keyword) {
        alert('請輸入小說名稱');
        return;
    }

    // 檢查是否有正在閱讀的章節（搜尋前提醒）
    const currentUrl = document.getElementById('currentUrl').value.trim();
    if (currentUrl) {
        const confirmMsg = '⚠️ 搜尋新書會覆蓋目前的閱讀進度\n\n' +
                          '目前章節：' + (currentChapterInfo?.chapterId ? `章節 ${currentChapterInfo.chapterId}` : currentUrl) + '\n\n' +
                          '選擇操作：\n' +
                          '• 確定 = 繼續搜尋\n' +
                          '• 取消 = 先加入書籤';

        const shouldContinue = confirm(confirmMsg);

        if (!shouldContinue) {
            // 使用者選擇先加入書籤
            addBookmark();
            return;
        }
    }

    // 顯示載入中
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<div style="color: #858585; padding: 8px;">正在搜尋...</div>';

    try {
        const platform = platformManager.getCurrentPlatform();
        const results = await platform.search(keyword);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="color: #858585; padding: 8px;">沒有找到相關結果</div>';
            return;
        }

        // 顯示搜尋結果
        let html = '<div style="color: #858585; margin-bottom: 8px;">搜尋結果（點擊查看章節）:</div>';
        results.forEach((book, index) => {
            html += `
                <div style="padding: 6px; margin-bottom: 4px; background-color: #3c3c3c; border-radius: 2px; cursor: pointer; hover: background-color: #4c4c4c;"
                     onclick="showChapterList('${escapeHtml(book.bookUrl)}', '${escapeHtml(book.title)}')">
                    <div style="color: #d4d4d4; font-weight: bold;">${escapeHtml(book.title)}</div>
                    ${book.author ? `<div style="color: #858585; font-size: 10px;">作者: ${escapeHtml(book.author)}</div>` : ''}
                    ${book.latestChapter ? `<div style="color: #858585; font-size: 10px;">最新: ${escapeHtml(book.latestChapter)}</div>` : ''}
                </div>
            `;
        });
        resultsContainer.innerHTML = html;

    } catch (error) {
        console.error('搜尋錯誤:', error);
        resultsContainer.innerHTML = `<div style="color: #f48771; padding: 8px;">搜尋失敗: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 顯示章節目錄
 */
async function showChapterList(bookUrl, bookTitle) {
    const container = document.getElementById('chapterListContainer');

    // 顯示載入中
    container.style.display = 'block';
    container.innerHTML = '<div style="color: #858585; padding: 8px;">正在載入章節目錄...</div>';

    try {
        const chapters = await platformManager.getChapterList(bookUrl);

        if (chapters.length === 0) {
            container.innerHTML = '<div style="color: #858585; padding: 8px;">沒有找到章節</div>';
            return;
        }

        // 顯示章節目錄（只顯示前100章，避免太多）
        const displayChapters = chapters.slice(0, 100);
        let html = `<div style="color: #858585; margin-bottom: 8px;">《${escapeHtml(bookTitle)}》章節目錄 (共${chapters.length}章，顯示前100章):</div>`;

        displayChapters.forEach(chapter => {
            html += `
                <div style="padding: 4px 6px; margin-bottom: 2px; background-color: #3c3c3c; border-radius: 2px; cursor: pointer;"
                     onclick="loadChapterFromSearch('${escapeHtml(chapter.chapterUrl)}')">
                    <span style="color: #d4d4d4;">${escapeHtml(chapter.chapterTitle)}</span>
                </div>
            `;
        });

        if (chapters.length > 100) {
            html += '<div style="color: #858585; padding: 8px; font-size: 10px;">更多章節請使用「上/下一章」按鈕導航</div>';
        }

        container.innerHTML = html;

        // 儲存完整章節列表到全域變數（用於之後的導航）
        window.fullChapterList = chapters;

    } catch (error) {
        console.error('獲取章節目錄錯誤:', error);
        container.innerHTML = `<div style="color: #f48771; padding: 8px;">載入失敗: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 從搜尋結果載入章節
 */
async function loadChapterFromSearch(chapterUrl) {
    // 填入 URL 並分析
    document.getElementById('currentUrl').value = chapterUrl;

    // 分析 URL 結構
    const info = analyzeUrl(chapterUrl);
    if (info) {
        currentChapterInfo = info;
        updateChapterInfo(`已識別：${info.patternName} | 章節 ${info.chapterId}`);
    }

    // 抓取章節內容
    await fetchChapter(chapterUrl);

    // 隱藏搜尋結果和章節列表
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('chapterListContainer').style.display = 'none';

    // 加入閱讀歷史
    addToHistory(chapterUrl);
}

// ==================== 書籤功能 ====================

/**
 * 加入書籤
 */
function addBookmark() {
    const url = document.getElementById('currentUrl').value.trim();
    if (!url) {
        alert('目前沒有正在閱讀的章節');
        return;
    }

    // 提示輸入書籤名稱
    const bookTitle = prompt('請輸入書籤名稱（書名）:', '');
    if (!bookTitle) return;

    const chapterTitle = prompt('請輸入章節名稱:', `章節 ${currentChapterInfo?.chapterId || '未知'}`);
    if (!chapterTitle) return;

    const bookmark = {
        id: Date.now(),
        bookTitle: bookTitle,
        chapterTitle: chapterTitle,
        url: url,
        addedAt: new Date().toISOString(),
        chapterInfo: currentChapterInfo
    };

    // 儲存書籤
    const bookmarks = getBookmarks();
    bookmarks.unshift(bookmark); // 加到最前面
    localStorage.setItem('novelBookmarks', JSON.stringify(bookmarks));

    alert('✅ 已加入書籤！');

    // 如果書籤面板開啟，刷新顯示
    const panel = document.getElementById('bookmarkPanel');
    if (panel.style.display !== 'none') {
        showBookmarks();
    }
}

/**
 * 獲取所有書籤
 */
function getBookmarks() {
    const data = localStorage.getItem('novelBookmarks');
    return data ? JSON.parse(data) : [];
}

/**
 * 切換書籤面板
 */
function toggleBookmarks() {
    const panel = document.getElementById('bookmarkPanel');
    const historyPanel = document.getElementById('historyPanel');

    // 關閉歷史面板
    historyPanel.style.display = 'none';

    if (panel.style.display === 'none') {
        showBookmarks();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

/**
 * 顯示書籤列表
 */
function showBookmarks() {
    const panel = document.getElementById('bookmarkPanel');
    const bookmarks = getBookmarks();

    if (bookmarks.length === 0) {
        panel.innerHTML = '<div style="color: #858585; padding: 8px;">📑 還沒有書籤，點擊 ⭐ 加入書籤</div>';
        return;
    }

    let html = '<div style="color: #858585; margin-bottom: 8px; font-weight: bold;">📑 我的書籤 (共 ' + bookmarks.length + ' 個)</div>';

    bookmarks.forEach(bookmark => {
        const date = new Date(bookmark.addedAt).toLocaleDateString('zh-TW');
        html += `
            <div style="display: flex; align-items: center; padding: 6px; margin-bottom: 4px; background-color: #3c3c3c; border-radius: 2px;">
                <div style="flex: 1; cursor: pointer;" onclick="loadBookmark('${bookmark.id}')">
                    <div style="color: #d4d4d4; font-weight: bold;">📚 ${escapeHtml(bookmark.bookTitle)}</div>
                    <div style="color: #858585; font-size: 10px;">└ ${escapeHtml(bookmark.chapterTitle)} (${date})</div>
                </div>
                <button onclick="deleteBookmark(${bookmark.id})" style="background-color: #f48771; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">刪除</button>
            </div>
        `;
    });

    panel.innerHTML = html;
}

/**
 * 載入書籤
 */
async function loadBookmark(bookmarkId) {
    const bookmarks = getBookmarks();
    const bookmark = bookmarks.find(b => b.id === bookmarkId);

    if (!bookmark) {
        alert('書籤不存在');
        return;
    }

    // 填入 URL
    document.getElementById('currentUrl').value = bookmark.url;

    // 恢復章節資訊
    if (bookmark.chapterInfo) {
        currentChapterInfo = bookmark.chapterInfo;
        updateChapterInfo(`${bookmark.bookTitle} - ${bookmark.chapterTitle}`);
    }

    // 抓取章節內容
    await fetchChapter(bookmark.url);

    // 關閉書籤面板
    document.getElementById('bookmarkPanel').style.display = 'none';
}

/**
 * 刪除書籤
 */
function deleteBookmark(bookmarkId) {
    if (!confirm('確定要刪除這個書籤嗎？')) return;

    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== bookmarkId);
    localStorage.setItem('novelBookmarks', JSON.stringify(filtered));

    showBookmarks();
}

// ==================== 閱讀歷史功能 ====================

/**
 * 加入閱讀歷史
 */
function addToHistory(url) {
    if (!url) return;

    const history = getHistory();

    // 避免重複
    const existingIndex = history.findIndex(h => h.url === url);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }

    const item = {
        url: url,
        title: currentChapterInfo?.chapterId ? `章節 ${currentChapterInfo.chapterId}` : '未知章節',
        readAt: new Date().toISOString(),
        chapterInfo: currentChapterInfo
    };

    history.unshift(item);

    // 只保留最近 50 條
    if (history.length > 50) {
        history.splice(50);
    }

    localStorage.setItem('novelHistory', JSON.stringify(history));
}

/**
 * 獲取閱讀歷史
 */
function getHistory() {
    const data = localStorage.getItem('novelHistory');
    return data ? JSON.parse(data) : [];
}

/**
 * 切換歷史面板
 */
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    const bookmarkPanel = document.getElementById('bookmarkPanel');

    // 關閉書籤面板
    bookmarkPanel.style.display = 'none';

    if (panel.style.display === 'none') {
        showHistory();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

/**
 * 顯示閱讀歷史
 */
function showHistory() {
    const panel = document.getElementById('historyPanel');
    const history = getHistory();

    if (history.length === 0) {
        panel.innerHTML = '<div style="color: #858585; padding: 8px;">📜 還沒有閱讀歷史</div>';
        return;
    }

    let html = '<div style="color: #858585; margin-bottom: 8px; font-weight: bold;">📜 閱讀歷史 (最近 ' + history.length + ' 章)</div>';

    history.forEach((item, index) => {
        const date = new Date(item.readAt);
        const timeStr = date.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        html += `
            <div style="padding: 4px 6px; margin-bottom: 2px; background-color: #3c3c3c; border-radius: 2px; cursor: pointer;"
                 onclick="loadFromHistory(${index})">
                <span style="color: #d4d4d4;">${escapeHtml(item.title)}</span>
                <span style="color: #858585; font-size: 10px; margin-left: 8px;">${timeStr}</span>
            </div>
        `;
    });

    panel.innerHTML = html;
}

/**
 * 從歷史記錄載入
 */
async function loadFromHistory(index) {
    const history = getHistory();
    const item = history[index];

    if (!item) return;

    // 填入 URL
    document.getElementById('currentUrl').value = item.url;

    // 恢復章節資訊
    if (item.chapterInfo) {
        currentChapterInfo = item.chapterInfo;
    }

    // 抓取章節內容
    await fetchChapter(item.url);

    // 關閉歷史面板
    document.getElementById('historyPanel').style.display = 'none';
}
