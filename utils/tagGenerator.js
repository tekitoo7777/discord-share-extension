// タグ自動生成ユーティリティ

const TagGenerator = {
  // ドメインベースのタグマッピング
  domainTags: {
    'github.com': ['#github', '#code', '#開発'],
    'youtube.com': ['#youtube', '#video', '#動画'],
    'twitter.com': ['#twitter', '#sns'],
    'x.com': ['#x', '#sns'],
    'qiita.com': ['#qiita', '#tech', '#技術記事'],
    'zenn.dev': ['#zenn', '#tech', '#技術記事'],
    'stackoverflow.com': ['#stackoverflow', '#qa', '#programming'],
    'reddit.com': ['#reddit', '#forum'],
    'medium.com': ['#medium', '#blog'],
    'dev.to': ['#dev', '#blog', '#programming'],
    'amazon.co.jp': ['#amazon', '#shopping', '#通販'],
    'amazon.com': ['#amazon', '#shopping'],
    'note.com': ['#note', '#blog'],
    'discord.com': ['#discord', '#chat'],
    'slack.com': ['#slack', '#chat', '#communication'],
    'notion.so': ['#notion', '#productivity', '#ツール'],
    'figma.com': ['#figma', '#design', '#デザイン'],
    'canva.com': ['#canva', '#design', '#デザイン'],
    'chatgpt.com': ['#chatgpt', '#ai'],
    'claude.ai': ['#claude', '#ai'],
    'google.com': ['#google', '#search'],
    'wikipedia.org': ['#wikipedia', '#wiki', '#知識']
  },

  // プログラミング言語の検出パターン
  programmingLanguages: {
    'javascript': '#javascript',
    'typescript': '#typescript',
    'python': '#python',
    'java': '#java',
    'csharp': '#csharp',
    'cpp': '#cpp',
    'ruby': '#ruby',
    'go': '#go',
    'rust': '#rust',
    'swift': '#swift',
    'kotlin': '#kotlin',
    'php': '#php',
    'react': '#react',
    'vue': '#vue',
    'angular': '#angular',
    'nodejs': '#nodejs',
    'django': '#django',
    'flask': '#flask',
    'rails': '#rails',
    'docker': '#docker',
    'kubernetes': '#kubernetes'
  },

  // URLからドメインベースのタグを生成
  generateFromDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // www.を除去
      const domain = hostname.replace('www.', '');
      
      // 完全一致を確認
      if (this.domainTags[domain]) {
        return [...this.domainTags[domain]];
      }
      
      // 部分一致を確認
      for (const [key, tags] of Object.entries(this.domainTags)) {
        if (domain.includes(key) || key.includes(domain)) {
          return [...tags];
        }
      }
      
      // デフォルトタグ
      return ['#web'];
    } catch (e) {
      console.error('URL parsing error:', e);
      return ['#web'];
    }
  },

  // タイトルからタグを生成
  generateFromTitle(title) {
    if (!title) return [];
    
    const tags = new Set();
    const lowerTitle = title.toLowerCase();
    
    // プログラミング言語を検出
    for (const [keyword, tag] of Object.entries(this.programmingLanguages)) {
      if (lowerTitle.includes(keyword)) {
        tags.add(tag);
      }
    }
    
    // 一般的なキーワードを検出
    const keywords = {
      'tutorial': '#tutorial',
      'チュートリアル': '#tutorial',
      'guide': '#guide',
      'ガイド': '#guide',
      'how to': '#howto',
      '方法': '#howto',
      'review': '#review',
      'レビュー': '#review',
      'news': '#news',
      'ニュース': '#news',
      'update': '#update',
      'アップデート': '#update',
      'release': '#release',
      'リリース': '#release',
      'tips': '#tips',
      'error': '#error',
      'エラー': '#error',
      'bug': '#bug',
      'バグ': '#bug',
      'fix': '#fix',
      '修正': '#fix',
      'api': '#api',
      'database': '#database',
      'データベース': '#database',
      'security': '#security',
      'セキュリティ': '#security',
      'ai': '#ai',
      '人工知能': '#ai',
      'machine learning': '#ml',
      '機械学習': '#ml',
      'deep learning': '#deeplearning',
      'ディープラーニング': '#deeplearning'
    };
    
    for (const [keyword, tag] of Object.entries(keywords)) {
      if (lowerTitle.includes(keyword)) {
        tags.add(tag);
      }
    }
    
    return Array.from(tags);
  },

  // メタデータからタグを生成
  generateFromMetadata(metadata) {
    const tags = new Set();
    
    // keywordsメタタグから
    if (metadata.keywords) {
      const keywords = metadata.keywords.split(',').map(k => k.trim());
      keywords.forEach(keyword => {
        if (keyword && keyword.length < 20) { // 長すぎるキーワードは除外
          tags.add(`#${keyword.replace(/\s+/g, '_').toLowerCase()}`);
        }
      });
    }
    
    // Open Graph tagsから
    if (metadata.ogType) {
      const typeMap = {
        'article': '#article',
        'blog': '#blog',
        'website': '#website',
        'video': '#video',
        'music': '#music',
        'book': '#book',
        'product': '#product'
      };
      
      if (typeMap[metadata.ogType]) {
        tags.add(typeMap[metadata.ogType]);
      }
    }
    
    // articleタグから
    if (metadata.articleTag) {
      metadata.articleTag.split(',').forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag && cleanTag.length < 20) {
          tags.add(`#${cleanTag.replace(/\s+/g, '_').toLowerCase()}`);
        }
      });
    }
    
    return Array.from(tags);
  },

  // GitHubリポジトリ特有のタグ生成
  generateGitHubTags(url, pageContent) {
    const tags = new Set(['#github', '#code']);
    
    // URLからリポジトリ情報を抽出
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      // イシューやPRの検出
      if (url.includes('/issues/')) {
        tags.add('#issue');
      } else if (url.includes('/pull/')) {
        tags.add('#pr');
        tags.add('#pullrequest');
      } else if (url.includes('/releases/')) {
        tags.add('#release');
      } else if (url.includes('/wiki/')) {
        tags.add('#wiki');
        tags.add('#documentation');
      }
    }
    
    // 言語の検出（pageContentから）
    if (pageContent && pageContent.languages) {
      pageContent.languages.forEach(lang => {
        const langTag = this.programmingLanguages[lang.toLowerCase()];
        if (langTag) {
          tags.add(langTag);
        }
      });
    }
    
    return Array.from(tags);
  },

  // YouTubeビデオ特有のタグ生成
  generateYouTubeTags(url, pageContent) {
    const tags = new Set(['#youtube', '#video', '#動画']);
    
    // URLからビデオタイプを判定
    if (url.includes('/watch?v=')) {
      tags.add('#watch');
    } else if (url.includes('/playlist')) {
      tags.add('#playlist');
    } else if (url.includes('/channel/') || url.includes('/c/') || url.includes('/@')) {
      tags.add('#channel');
    }
    
    // カテゴリーやタグがあれば追加（pageContentから）
    if (pageContent && pageContent.category) {
      const categoryMap = {
        'music': '#music',
        'gaming': '#gaming',
        'education': '#education',
        'science': '#science',
        'technology': '#technology',
        'entertainment': '#entertainment',
        'sports': '#sports',
        'news': '#news'
      };
      
      const cat = pageContent.category.toLowerCase();
      if (categoryMap[cat]) {
        tags.add(categoryMap[cat]);
      }
    }
    
    return Array.from(tags);
  },

  // すべてのタグを統合して生成
  generateTags(url, title, metadata, pageContent) {
    const allTags = new Set();
    
    // ドメインベースのタグ
    const domainTags = this.generateFromDomain(url);
    domainTags.forEach(tag => allTags.add(tag));
    
    // タイトルベースのタグ
    const titleTags = this.generateFromTitle(title);
    titleTags.forEach(tag => allTags.add(tag));
    
    // メタデータベースのタグ
    const metaTags = this.generateFromMetadata(metadata);
    metaTags.forEach(tag => allTags.add(tag));
    
    // 特定サイト用の追加タグ
    if (url.includes('github.com')) {
      const githubTags = this.generateGitHubTags(url, pageContent);
      githubTags.forEach(tag => allTags.add(tag));
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const youtubeTags = this.generateYouTubeTags(url, pageContent);
      youtubeTags.forEach(tag => allTags.add(tag));
    }
    
    // 最大10個までに制限
    return Array.from(allTags).slice(0, 10);
  },

  // よく使うタグの候補を返す
  getSuggestions(input, recentTags = [], frequentTags = []) {
    const suggestions = new Set();
    
    // デフォルトの人気タグ
    const popularTags = [
      '#bookmark', '#reference', '#important', '#todo', '#later',
      '#work', '#personal', '#study', '#research', '#idea',
      '#仕事', '#個人', '#勉強', '#調査', '#アイデア'
    ];
    
    // 最近使ったタグを優先
    recentTags.forEach(tag => suggestions.add(tag));
    
    // よく使うタグを追加
    frequentTags.forEach(tag => suggestions.add(tag));
    
    // 人気タグを追加
    popularTags.forEach(tag => suggestions.add(tag));
    
    // 入力に基づいてフィルタリング
    if (input) {
      const filtered = Array.from(suggestions).filter(tag => 
        tag.toLowerCase().includes(input.toLowerCase())
      );
      return filtered.slice(0, 5);
    }
    
    return Array.from(suggestions).slice(0, 5);
  }
};

// エクスポート（Chrome拡張機能用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TagGenerator;
}