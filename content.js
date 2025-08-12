// コンテンツスクリプト - ページ情報を収集

// ポップアップからのメッセージを受け取る
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getPageInfo') {
      const pageInfo = collectPageInfo();
      sendResponse(pageInfo);
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({
      error: error.message,
      metadata: {},
      pageContent: {}
    });
  }
  return true; // 非同期レスポンスのため
});

// ページ情報を収集する関数
function collectPageInfo() {
  const info = {
    metadata: {},
    pageContent: {}
  };

  try {

  // メタタグ情報を収集
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(meta => {
    // keywords
    if (meta.name === 'keywords') {
      info.metadata.keywords = meta.content;
    }
    // description
    if (meta.name === 'description') {
      info.metadata.description = meta.content;
    }
    // article:tag
    if (meta.property === 'article:tag') {
      if (!info.metadata.articleTag) {
        info.metadata.articleTag = meta.content;
      } else {
        info.metadata.articleTag += ',' + meta.content;
      }
    }
    // og:type
    if (meta.property === 'og:type') {
      info.metadata.ogType = meta.content;
    }
    // og:site_name
    if (meta.property === 'og:site_name') {
      info.metadata.siteName = meta.content;
    }
  });

  // GitHub特有の情報を収集
  if (window.location.hostname === 'github.com') {
    info.pageContent.isGitHub = true;
    
    // リポジトリの言語を取得
    const languageElements = document.querySelectorAll('[data-ga-click*="language"]');
    const languages = [];
    languageElements.forEach(el => {
      const langText = el.textContent.trim();
      if (langText) {
        languages.push(langText);
      }
    });
    if (languages.length > 0) {
      info.pageContent.languages = languages;
    }

    // トピックスを取得
    const topicElements = document.querySelectorAll('.topic-tag');
    const topics = [];
    topicElements.forEach(el => {
      const topic = el.textContent.trim();
      if (topic) {
        topics.push(topic);
      }
    });
    if (topics.length > 0) {
      info.pageContent.topics = topics;
    }

    // リポジトリのスター数を取得
    const starElement = document.querySelector('[aria-label*="star"]');
    if (starElement) {
      const starText = starElement.textContent.trim();
      if (starText) {
        info.pageContent.stars = starText;
      }
    }
  }

  // YouTube特有の情報を収集
  if (window.location.hostname === 'www.youtube.com' || window.location.hostname === 'youtube.com') {
    info.pageContent.isYouTube = true;
    
    // チャンネル名を取得
    const channelElement = document.querySelector('ytd-channel-name a') || 
                           document.querySelector('[itemprop="author"] link[itemprop="name"]');
    if (channelElement) {
      info.pageContent.channelName = channelElement.getAttribute('content') || channelElement.textContent.trim();
    }

    // カテゴリーを取得（利用可能な場合）
    const categoryElement = document.querySelector('meta[itemprop="genre"]');
    if (categoryElement) {
      info.pageContent.category = categoryElement.getAttribute('content');
    }

    // ビデオのタグを取得
    const videoTags = [];
    const tagElements = document.querySelectorAll('meta[property="og:video:tag"]');
    tagElements.forEach(el => {
      const tag = el.getAttribute('content');
      if (tag) {
        videoTags.push(tag);
      }
    });
    if (videoTags.length > 0) {
      info.pageContent.videoTags = videoTags;
    }
  }

  // Twitter/X特有の情報を収集
  if (window.location.hostname === 'twitter.com' || window.location.hostname === 'x.com') {
    info.pageContent.isTwitter = true;
    
    // ツイートのハッシュタグを取得
    const hashtags = [];
    const hashtagElements = document.querySelectorAll('a[href*="/hashtag/"]');
    hashtagElements.forEach(el => {
      const tag = el.textContent.trim();
      if (tag && tag.startsWith('#')) {
        hashtags.push(tag);
      }
    });
    if (hashtags.length > 0) {
      info.pageContent.hashtags = hashtags;
    }
  }

  // Qiita特有の情報を収集
  if (window.location.hostname === 'qiita.com') {
    info.pageContent.isQiita = true;
    
    // 記事のタグを取得
    const tags = [];
    const tagElements = document.querySelectorAll('.it-Tags_item a');
    tagElements.forEach(el => {
      const tag = el.textContent.trim();
      if (tag) {
        tags.push(tag);
      }
    });
    if (tags.length > 0) {
      info.pageContent.articleTags = tags;
    }
  }

  // Zenn特有の情報を収集
  if (window.location.hostname === 'zenn.dev') {
    info.pageContent.isZenn = true;
    
    // 記事のトピックを取得
    const topics = [];
    const topicElements = document.querySelectorAll('[class*="TopicList"] a');
    topicElements.forEach(el => {
      const topic = el.textContent.trim();
      if (topic) {
        topics.push(topic);
      }
    });
    if (topics.length > 0) {
      info.pageContent.topics = topics;
    }
  }

  // ページの主要な見出しを収集（SEO分析用）
  const h1Elements = document.querySelectorAll('h1');
  const headings = [];
  h1Elements.forEach(h1 => {
    const heading = h1.textContent.trim();
    if (heading && heading.length < 100) {
      headings.push(heading);
    }
  });
  if (headings.length > 0) {
    info.pageContent.headings = headings.slice(0, 3); // 最初の3つまで
  }

  // JSON-LD構造化データを収集
  const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdElements.forEach(element => {
    try {
      const data = JSON.parse(element.textContent);
      if (data['@type']) {
        info.metadata.schemaType = data['@type'];
      }
      if (data.keywords) {
        if (typeof data.keywords === 'string') {
          info.metadata.schemaKeywords = data.keywords;
        } else if (Array.isArray(data.keywords)) {
          info.metadata.schemaKeywords = data.keywords.join(',');
        }
      }
    } catch (e) {
      // JSON パースエラーは無視
    }
  });

  return info;
  } catch (error) {
    console.error('Error collecting page info:', error);
    return {
      metadata: {},
      pageContent: {},
      error: error.message
    };
  }
}