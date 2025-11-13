<?php
/**
 * 網頁內容抓取 API
 * 用於抓取小說網頁內容並提取正文
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

// 允許跨域（如果需要）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 獲取 URL 參數
$url = isset($_POST['url']) ? trim($_POST['url']) : '';
$url = isset($_GET['url']) ? trim($_GET['url']) : $url;

if (empty($url)) {
    echo json_encode([
        'success' => false,
        'error' => '請提供網頁 URL'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 驗證 URL 格式
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode([
        'success' => false,
        'error' => 'URL 格式不正確'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // ========================================
    // 方法 1：使用 Puppeteer（真實瀏覽器）
    // ========================================
    $usePuppeteer = true; // 設為 true 啟用 Puppeteer

    if ($usePuppeteer) {
        $scriptPath = __DIR__ . '/fetch_with_browser.js';
        $command = "node " . escapeshellarg($scriptPath) . " " . escapeshellarg($url) . " 2>&1";

        $output = shell_exec($command);

        if ($output) {
            $result = json_decode($output, true);

            if ($result && isset($result['success']) && $result['success']) {
                echo json_encode([
                    'success' => true,
                    'content' => $result['content'],
                    'title' => $result['title'] ?? '',
                    'url' => $url,
                    'method' => 'puppeteer'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        // 如果 Puppeteer 失敗，繼續使用 cURL 方法
    }

    // ========================================
    // 方法 2：使用 cURL（備用方法）
    // ========================================

    // 速率限制：檢查上次請求時間（模擬人類行為）
    $lastRequestTime = isset($_SESSION['last_request_time']) ? $_SESSION['last_request_time'] : 0;
    $currentTime = time();
    $timeDiff = $currentTime - $lastRequestTime;

    // 如果距離上次請求不到 2 秒，就等待一下
    if ($timeDiff < 2) {
        sleep(2 - $timeDiff);
    }

    // 隨機延遲 (0.5-1.5 秒，模擬人類操作)
    usleep(rand(500000, 1500000));

    // 記錄本次請求時間
    $_SESSION['last_request_time'] = time();

    // 解析 URL 以獲取 domain
    $parsedUrl = parse_url($url);
    $domain = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

    // 隨機選擇 User-Agent（更真實）
    $userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    ];
    $userAgent = $userAgents[array_rand($userAgents)];

    // Cookie 管理（使用臨時檔案）
    $cookieFile = sys_get_temp_dir() . '/novel_cookies_' . md5($domain) . '.txt';

    // 步驟 1：先訪問首頁獲取 cookie（模擬真實用戶行為）
    $homeCh = curl_init();
    curl_setopt($homeCh, CURLOPT_URL, $domain . '/');
    curl_setopt($homeCh, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($homeCh, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($homeCh, CURLOPT_TIMEOUT, 15);
    curl_setopt($homeCh, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($homeCh, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($homeCh, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($homeCh, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($homeCh, CURLOPT_HTTPHEADER, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: zh-TW,zh;q=0.9,en;q=0.8',
        'Accept-Encoding: gzip, deflate',
        'Connection: keep-alive',
        'Upgrade-Insecure-Requests: 1',
    ]);

    curl_exec($homeCh);
    curl_close($homeCh);

    // 短暫延遲（模擬人類行為）
    usleep(rand(800000, 1200000)); // 0.8-1.2 秒

    // 步驟 2：使用 cURL 抓取章節內容（帶著 cookie）
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip, deflate');

    // 使用相同的 User-Agent
    curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);

    // 添加更真實的 HTTP Headers（像真實瀏覽器一樣）
    $headers = [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language: zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7',
        'Accept-Encoding: gzip, deflate',
        'Cache-Control: max-age=0',
        'Connection: keep-alive',
        'Referer: ' . $domain . '/',
        'Upgrade-Insecure-Requests: 1',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: same-origin',
        'Sec-Fetch-User: ?1',
    ];

    // 根據 User-Agent 添加對應的 sec-ch-ua headers
    if (strpos($userAgent, 'Chrome') !== false) {
        $headers[] = 'sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        $headers[] = 'sec-ch-ua-mobile: ?1';
        $headers[] = 'sec-ch-ua-platform: "Android"';
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // 使用之前獲取的 Cookie
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);

    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($html === false || $httpCode !== 200) {
        throw new Exception("無法抓取網頁內容 (HTTP $httpCode): $error");
    }

    // 轉換編碼為 UTF-8
    $encoding = mb_detect_encoding($html, ['UTF-8', 'Big5', 'GBK', 'GB2312'], true);
    if ($encoding && $encoding !== 'UTF-8') {
        $html = mb_convert_encoding($html, 'UTF-8', $encoding);
    }

    // 提取文字內容
    $content = extractContent($html, $url);

    if (empty($content)) {
        throw new Exception('無法提取網頁內容，請確認 URL 是否正確');
    }

    echo json_encode([
        'success' => true,
        'content' => $content,
        'url' => $url
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * 提取網頁主要內容
 */
function extractContent($html, $url) {
    // 移除 script 和 style 標籤
    $html = preg_replace('/<script[^>]*?>.*?<\/script>/is', '', $html);
    $html = preg_replace('/<style[^>]*?>.*?<\/style>/is', '', $html);

    // 嘗試使用 DOMDocument 解析
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);

    $content = '';

    // 針對筆趣閣等小說網站的特定選取器
    $selectors = [
        'div#content',           // 筆趣閣
        'div.content',
        'div#chaptercontent',
        'div.chapter-content',
        'div.article-content',
        'article',
        'div.text-content',
        'div.novel-content',
        'div#booktext',
        'div.readcontent',
    ];

    // 嘗試各種選取器
    foreach ($selectors as $selector) {
        $xpath = new DOMXPath($dom);

        // 轉換 CSS 選取器為 XPath
        $xpathQuery = convertCssToXpath($selector);
        $nodes = $xpath->query($xpathQuery);

        if ($nodes->length > 0) {
            $node = $nodes->item(0);
            $content = getNodeText($node);

            if (!empty(trim($content)) && mb_strlen($content) > 500) {
                break;
            }
        }
    }

    // 如果還是沒有內容，嘗試抓取最大的文字區塊
    if (empty($content) || mb_strlen($content) < 500) {
        $content = extractLargestTextBlock($dom);
    }

    // 清理內容
    $content = cleanContent($content);

    return $content;
}

/**
 * 轉換 CSS 選取器為 XPath
 */
function convertCssToXpath($selector) {
    // 簡單的 CSS to XPath 轉換
    $selector = str_replace('div#', '//div[@id="', $selector);
    $selector = str_replace('div.', '//div[@class="', $selector);

    if (strpos($selector, '[@id="') !== false) {
        $selector .= '"]';
    } else if (strpos($selector, '[@class="') !== false) {
        $selector .= '"]';
    } else if (strpos($selector, 'article') !== false) {
        $selector = '//article';
    }

    return $selector;
}

/**
 * 獲取節點的純文字內容
 */
function getNodeText($node) {
    $text = '';

    if ($node->nodeType === XML_TEXT_NODE) {
        return $node->nodeValue;
    }

    foreach ($node->childNodes as $child) {
        if ($child->nodeType === XML_TEXT_NODE) {
            $text .= $child->nodeValue . "\n";
        } else if ($child->nodeType === XML_ELEMENT_NODE) {
            // 如果是 br 或 p 標籤，加入換行
            if (in_array($child->nodeName, ['br', 'p', 'div'])) {
                $text .= getNodeText($child) . "\n";
            } else {
                $text .= getNodeText($child);
            }
        }
    }

    return $text;
}

/**
 * 提取最大的文字區塊
 */
function extractLargestTextBlock($dom) {
    $xpath = new DOMXPath($dom);
    $divs = $xpath->query('//div | //article | //section | //main');

    $maxLength = 0;
    $bestContent = '';

    foreach ($divs as $div) {
        $text = getNodeText($div);
        $length = mb_strlen(trim($text));

        if ($length > $maxLength && $length > 500) {
            $maxLength = $length;
            $bestContent = $text;
        }
    }

    return $bestContent;
}

/**
 * 清理內容
 */
function cleanContent($content) {
    // 移除多餘的空白和換行
    $content = preg_replace('/\s+/u', ' ', $content);
    $content = preg_replace('/\n\s*\n/u', "\n\n", $content);

    // 移除常見的廣告文字
    $patterns = [
        '/筆趣閣.{0,10}www\..{0,20}/u',
        '/最新章節.{0,20}/u',
        '/更新最快.{0,20}/u',
        '/手機版閱讀.{0,20}/u',
        '/請記住本站.{0,20}/u',
        '/一秒記住.{0,20}/u',
    ];

    foreach ($patterns as $pattern) {
        $content = preg_replace($pattern, '', $content);
    }

    $content = trim($content);

    return $content;
}
