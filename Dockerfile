# 使用 PHP 8.2 with Apache 作為基礎映像
FROM php:8.2-apache

# 安裝系統依賴、Node.js 和 Chrome
RUN apt-get update && apt-get install -y \
    # PHP 擴展依賴
    libxml2-dev \
    libonig-dev \
    # Node.js 和 npm
    curl \
    gnupg \
    # Chrome 依賴
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Google Chrome Stable（使用新的方式）
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# 启用必要的 PHP 扩展
RUN docker-php-ext-install \
    dom \
    xml \
    mbstring

# 启用 Apache 模块
RUN a2enmod rewrite headers

# 配置 PHP
RUN echo "error_reporting = E_ALL" >> /usr/local/etc/php/conf.d/custom.ini && \
    echo "display_errors = On" >> /usr/local/etc/php/conf.d/custom.ini && \
    echo "log_errors = On" >> /usr/local/etc/php/conf.d/custom.ini && \
    echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/conf.d/custom.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/custom.ini && \
    echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/custom.ini

# 創建工作目錄並安裝 Puppeteer
WORKDIR /var/www/puppeteer
RUN npm init -y && \
    npm install puppeteer && \
    # 確保 Puppeteer 可以找到 Chrome
    ln -s /usr/bin/google-chrome-stable /usr/bin/chromium-browser

# 創建臨時目錄用於存儲 cookies
RUN mkdir -p /tmp/novel_cookies && \
    chmod 777 /tmp/novel_cookies

# 復製應用程序文件到 Apache 默認目錄
COPY src/ /var/www/html/

# 設置工作目錄回到 web root
WORKDIR /var/www/html

# 設置正確的文件權限
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    chmod +x /var/www/html/fetch_with_browser.js

# 設置 Puppeteer 權限
RUN chown -R www-data:www-data /var/www/puppeteer

# 暴露 80 端口
EXPOSE 80

# 启动 Apache
CMD ["apache2-foreground"]
