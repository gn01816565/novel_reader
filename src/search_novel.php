<?php
/**
 * 小說搜尋 API
 * 支援多平台搜尋、獲取書籍資訊、章節目錄
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 獲取請求參數
$platform = $_POST['platform'] ?? 'biquge';
$action = $_POST['action'] ?? 'search';

try {
    switch ($action) {
        case 'search':
            $keyword = $_POST['keyword'] ?? '';
            if (empty($keyword)) {
                throw new Exception('請輸入搜尋關鍵字');
            }
            $result = searchNovel($platform, $keyword);
            break;

        case 'getBookInfo':
            $url = $_POST['url'] ?? '';
            if (empty($url)) {
                throw new Exception('請提供書籍 URL');
            }
            $result = getBookInfo($platform, $url);
            break;

        case 'getChapterList':
            $url = $_POST['url'] ?? '';
            if (empty($url)) {
                throw new Exception('請提供書籍 URL');
            }
            $result = getChapterList($platform, $url);
            break;

        default:
            throw new Exception('未知的操作: ' . $action);
    }

    echo json_encode([
        'success' => true,
        'data' => $result,
        'platform' => $platform,
        'action' => $action
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'platform' => $platform,
        'action' => $action
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * 搜尋小說
 */
function searchNovel($platform, $keyword) {
    switch ($platform) {
        case 'biquge':
            return searchBiquge($keyword);
        default:
            throw new Exception('不支援的平台: ' . $platform);
    }
}

/**
 * 筆趣閣搜尋
 */
function searchBiquge($keyword) {
    // 使用 Puppeteer 進行搜尋
    $searchUrl = 'https://www.biquge.tw/search.php?q=' . urlencode($keyword);

    $command = sprintf(
        'node %s %s %s',
        escapeshellarg(__DIR__ . '/search_with_browser.js'),
        escapeshellarg($searchUrl),
        escapeshellarg('search')
    );

    $output = shell_exec($command . ' 2>&1');
    $result = json_decode($output, true);

    if (!$result || !isset($result['success'])) {
        throw new Exception('搜尋失敗: ' . ($output ?? '未知錯誤'));
    }

    if (!$result['success']) {
        throw new Exception($result['error'] ?? '搜尋失敗');
    }

    return $result['data'] ?? [];
}

/**
 * 獲取書籍資訊
 */
function getBookInfo($platform, $url) {
    switch ($platform) {
        case 'biquge':
            return getBookInfoBiquge($url);
        default:
            throw new Exception('不支援的平台: ' . $platform);
    }
}

/**
 * 筆趣閣 - 獲取書籍資訊
 */
function getBookInfoBiquge($url) {
    $command = sprintf(
        'node %s %s %s',
        escapeshellarg(__DIR__ . '/search_with_browser.js'),
        escapeshellarg($url),
        escapeshellarg('bookInfo')
    );

    $output = shell_exec($command . ' 2>&1');
    $result = json_decode($output, true);

    if (!$result || !$result['success']) {
        throw new Exception('獲取書籍資訊失敗');
    }

    return $result['data'] ?? [];
}

/**
 * 獲取章節目錄
 */
function getChapterList($platform, $url) {
    switch ($platform) {
        case 'biquge':
            return getChapterListBiquge($url);
        default:
            throw new Exception('不支援的平台: ' . $platform);
    }
}

/**
 * 筆趣閣 - 獲取章節目錄
 */
function getChapterListBiquge($url) {
    $command = sprintf(
        'node %s %s %s',
        escapeshellarg(__DIR__ . '/search_with_browser.js'),
        escapeshellarg($url),
        escapeshellarg('chapterList')
    );

    $output = shell_exec($command . ' 2>&1');
    $result = json_decode($output, true);

    if (!$result || !$result['success']) {
        throw new Exception('獲取章節目錄失敗');
    }

    return $result['data'] ?? [];
}
