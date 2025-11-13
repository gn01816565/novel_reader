// 全域變數：儲存 URL 規則
let urlPattern = null;
let currentChapterInfo = null;

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

// 假程式碼模板
const fakeCodeTemplates = [
    '<span class="keyword">function</span> <span class="function">processText</span>(<span class="variable">$content</span>) {',
    '    <span class="keyword">return</span> <span class="function">trim</span>(<span class="variable">$content</span>);',
    '}',
    '',
    '<span class="keyword">class</span> <span class="function">TextHandler</span> {',
    '    <span class="keyword">private</span> <span class="variable">$data</span>;',
    '    ',
    '    <span class="keyword">public function</span> <span class="function">__construct</span>() {',
    '        <span class="variable">$this</span>-><span class="variable">data</span> = [];',
    '    }',
    '}',
    '',
    '<span class="keyword">if</span> (<span class="variable">$result</span> !== <span class="keyword">null</span>) {',
    '    <span class="comment">// Process valid data</span>',
    '}',
    '',
    '<span class="variable">$config</span> = [',
    '    <span class="string">\'encoding\'</span> => <span class="string">\'UTF-8\'</span>,',
    '    <span class="string">\'mode\'</span> => <span class="string">\'strict\'</span>',
    '];',
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

    // 立即更新 URL 輸入框，顯示正在抓取的頁面
    document.getElementById('currentUrl').value = url;

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
    currentChapterInfo.chapterId--;
    await fetchChapter(prevUrl);
}

// 下一章（智能分頁）
async function nextChapter() {
    if (!currentChapterInfo) {
        updateChapterInfo('請先分析一個章節 URL');
        return;
    }

    // 先嘗試當前章節的下一頁
    const nextPageUrl = generateUrl(currentChapterInfo, 1);
    if (!nextPageUrl) {
        updateChapterInfo('無法生成下一章 URL');
        return;
    }

    console.log('嘗試下一頁 URL:', nextPageUrl);
    currentChapterInfo.chapterId++;

    const success = await fetchChapter(nextPageUrl, true);

    if (!success && currentChapterInfo.volumeId) {
        // 如果是五福小說網且當前頁沒有內容，嘗試下一個章節
        console.log('當前分頁已結束，嘗試下一章節...');
        currentChapterInfo.volumeId++;
        currentChapterInfo.chapterId = 1;

        const nextVolumeUrl = generateUrl(currentChapterInfo, 0);
        if (nextVolumeUrl) {
            console.log('跳轉到下一章節:', nextVolumeUrl);
            updateChapterInfo('自動跳轉到下一章節...');
            await fetchChapter(nextVolumeUrl);
        } else {
            updateChapterInfo('無法生成下一章節 URL');
            // 恢復原始狀態
            currentChapterInfo.volumeId--;
            currentChapterInfo.chapterId--;
        }
    } else if (!success) {
        // 非五福小說網或其他錯誤
        currentChapterInfo.chapterId--;
        updateChapterInfo('已到最後一章或抓取失敗');
    }
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

    // 隨機插入假程式碼
    const insertFakeCode = () => {
        const numLines = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numLines; i++) {
            const template = fakeCodeTemplates[Math.floor(Math.random() * fakeCodeTemplates.length)];
            codeLines.push(template);
        }
        codeLines.push('');
    };

    // 處理每個段落
    paragraphs.forEach((para, index) => {
        // 每隔幾段插入假程式碼
        if (index > 0 && index % 3 === 0) {
            insertFakeCode();
        }

        // 將段落分成句子
        const sentences = para.match(/[^。！？.!?]+[。！？.!?]*/g) || [para];

        sentences.forEach((sentence, sentIndex) => {
            const formatType = Math.random();

            if (formatType < 0.4) {
                // 單行註解格式
                codeLines.push(`<span class="comment">// ${escapeHtml(sentence)}</span>`);
            } else if (formatType < 0.7) {
                // 字串變數格式
                const varName = ['$text', '$content', '$message', '$data', '$info'][Math.floor(Math.random() * 5)];
                codeLines.push(`<span class="variable">${varName}</span> = <span class="string">"${escapeHtml(sentence)}"</span>;`);
            } else {
                // 多行註解格式
                codeLines.push(`<span class="comment">/* ${escapeHtml(sentence)} */</span>`);
            }
        });

        codeLines.push('');
    });

    // 結尾加入假程式碼
    insertFakeCode();

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

// 快捷鍵：Ctrl + H 切換輸入框
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        toggleInput();
    }
});
