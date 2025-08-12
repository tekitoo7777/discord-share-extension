// サイドパネル用のDiscord共有スクリプト

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sidepanel loaded');
  
  // DOM要素の取得
  const elements = {
    pageTitle: document.getElementById('pageTitle'),
    pageUrl: document.getElementById('pageUrl'),
    tagContainer: document.getElementById('tagContainer'),
    tagInput: document.getElementById('tagInput'),
    tagSuggestions: document.getElementById('tagSuggestions'),
    memo: document.getElementById('memo'),
    shareButton: document.getElementById('shareButton'),
    settingsButton: document.getElementById('settingsButton'),
    statusMessage: document.getElementById('statusMessage')
  };

  // 要素の存在確認
  console.log('DOM Elements check:', {
    pageTitle: !!elements.pageTitle,
    tagContainer: !!elements.tagContainer,
    tagInput: !!elements.tagInput,
    memo: !!elements.memo
  });

  // グローバル変数
  let currentTab = null;
  let currentTags = [];

  // 現在のタブ情報を取得
  async function updateCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      console.log('Tab info:', tab);
      
      // ページ情報を表示
      if (elements.pageTitle) elements.pageTitle.textContent = tab.title;
      if (elements.pageUrl) elements.pageUrl.textContent = tab.url;
      
      // タグをリセットして再生成
      resetTags();
      generateBasicTags(tab.url);
      
    } catch (error) {
      console.error('Tab query error:', error);
      // フォールバック
      currentTab = {
        title: 'Unknown Page',
        url: window.location.href || 'Unknown URL'
      };
    }
  }

  // 初回ロード時にタブ情報を取得
  await updateCurrentTab();

  // タブが変更された時に情報を更新
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateCurrentTab();
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      await updateCurrentTab();
    }
  });

  // タグをリセットする関数
  function resetTags() {
    currentTags = [];
    elements.tagContainer.innerHTML = '';
    console.log('Tags reset');
  }

  // 基本的なタグ生成
  function generateBasicTags(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      console.log('Hostname:', hostname);
      
      if (hostname.includes('github.com')) {
        addTag('#github');
        addTag('#code');
      } else if (hostname.includes('youtube.com')) {
        addTag('#youtube');
        addTag('#video');
      } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        addTag('#twitter');
        addTag('#sns');
      } else if (hostname.includes('qiita.com')) {
        addTag('#qiita');
        addTag('#tech');
      } else if (hostname.includes('zenn.dev')) {
        addTag('#zenn');
        addTag('#tech');
      } else if (hostname.includes('stackoverflow.com')) {
        addTag('#stackoverflow');
        addTag('#programming');
      } else {
        addTag('#web');
      }
    } catch (error) {
      console.error('Tag generation error:', error);
      addTag('#web');
    }
  }

  // タグを追加する関数
  function addTag(tagText) {
    if (!tagText || currentTags.includes(tagText)) return;
    
    console.log('Adding tag:', tagText);
    currentTags.push(tagText);
    
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
      ${tagText}
      <button class="tag-remove">×</button>
    `;
    
    elements.tagContainer.appendChild(tagElement);
    
    // 削除ボタンのイベントリスナー
    tagElement.querySelector('.tag-remove').addEventListener('click', () => {
      removeTag(tagText);
    });
  }

  // タグを削除する関数
  function removeTag(tagText) {
    currentTags = currentTags.filter(tag => tag !== tagText);
    
    // DOM から削除
    const tagElements = elements.tagContainer.querySelectorAll('.tag');
    tagElements.forEach(el => {
      if (el.textContent.includes(tagText)) {
        el.remove();
      }
    });
  }

  // タグ入力のイベントリスナー
  elements.tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagText = elements.tagInput.value.trim();
      if (tagText) {
        const formattedTag = tagText.startsWith('#') ? tagText : `#${tagText}`;
        addTag(formattedTag);
        elements.tagInput.value = '';
      }
    }
  });

  // タグサジェスト機能
  elements.tagInput.addEventListener('input', (e) => {
    const input = e.target.value.toLowerCase();
    if (input.length > 0) {
      showSuggestions(input);
    } else {
      elements.tagSuggestions.classList.remove('active');
    }
  });

  // サジェスト表示
  function showSuggestions(input) {
    const suggestions = [
      '#bookmark', '#important', '#todo', '#later', '#work',
      '#personal', '#study', '#research', '#reference', '#idea',
      '#tutorial', '#guide', '#documentation', '#blog', '#news'
    ];
    
    const filtered = suggestions.filter(tag => 
      tag.toLowerCase().includes(input) && !currentTags.includes(tag)
    );
    
    if (filtered.length > 0) {
      elements.tagSuggestions.innerHTML = filtered.map(tag => 
        `<div class="tag-suggestion">${tag}</div>`
      ).join('');
      elements.tagSuggestions.classList.add('active');
      
      // サジェストのクリックイベント
      elements.tagSuggestions.querySelectorAll('.tag-suggestion').forEach(el => {
        el.addEventListener('click', () => {
          addTag(el.textContent);
          elements.tagInput.value = '';
          elements.tagSuggestions.classList.remove('active');
        });
      });
    } else {
      elements.tagSuggestions.classList.remove('active');
    }
  }

  // 共有ボタンのクリック
  elements.shareButton.addEventListener('click', async () => {
    console.log('Share button clicked');
    
    if (!currentTab) {
      showStatus('error', 'ページ情報を取得できませんでした。');
      return;
    }
    
    try {
      const { webhookUrl } = await chrome.storage.sync.get('webhookUrl');
      
      if (!webhookUrl) {
        showStatus('error', 'Webhook URLが設定されていません。設定画面で設定してください。');
        return;
      }
      
      // ボタンを無効化
      elements.shareButton.disabled = true;
      elements.shareButton.textContent = '送信中...';
      
      // メッセージデータを作成
      const embedFields = [];
      
      // タグフィールドを追加
      if (currentTags.length > 0) {
        embedFields.push({
          name: '🏷️ タグ',
          value: currentTags.join(' '),
          inline: false
        });
      }
      
      // メモフィールドを追加
      const memoText = elements.memo.value.trim();
      if (memoText) {
        embedFields.push({
          name: '📝 メモ',
          value: memoText,
          inline: false
        });
      }
      
      const messageData = {
        embeds: [{
          title: currentTab.title,
          url: currentTab.url,
          color: 5865242,
          fields: embedFields,
          footer: {
            text: 'Discord Share Extension'
          },
          timestamp: new Date().toISOString()
        }]
      };
      
      console.log('Sending message:', messageData);
      
      // Discordに送信
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        // 送信履歴を保存
        await saveHistory({
          url: currentTab.url,
          title: currentTab.title,
          tags: currentTags,
          memo: memoText,
          timestamp: new Date().toISOString()
        });
        
        // 成功メッセージ
        showStatus('success', 'Discordに送信しました！');
        
        // フィールドをクリア
        elements.memo.value = '';
        
      } else {
        throw new Error(`送信エラー: ${response.status}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      showStatus('error', 'エラーが発生しました: ' + error.message);
    } finally {
      // ボタンを有効化
      elements.shareButton.disabled = false;
      elements.shareButton.innerHTML = `
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
        Discordに送信
      `;
    }
  });

  // 設定ボタンのイベントリスナー
  elements.settingsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // ステータスメッセージ表示
  function showStatus(type, message) {
    if (elements.statusMessage) {
      elements.statusMessage.className = `status-message ${type}`;
      elements.statusMessage.textContent = message;
      
      // 成功メッセージは3秒後に自動で隠す
      if (type === 'success') {
        setTimeout(() => {
          elements.statusMessage.classList.remove('success');
          elements.statusMessage.style.display = 'none';
        }, 3000);
      }
    }
    console.log(`Status (${type}):`, message);
  }

  // 送信履歴を保存
  async function saveHistory(data) {
    const { history = [] } = await chrome.storage.local.get('history');
    history.unshift(data);
    if (history.length > 100) {
      history.length = 100;
    }
    await chrome.storage.local.set({ history });
    
    // タグの使用頻度を更新
    await updateTagFrequency(data.tags);
  }

  // タグ使用頻度の更新
  async function updateTagFrequency(tags) {
    const { tagFrequency = {} } = await chrome.storage.local.get('tagFrequency');
    tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
    await chrome.storage.local.set({ tagFrequency });
  }

  // クリックアウトでサジェストを閉じる
  document.addEventListener('click', (e) => {
    if (!elements.tagInput.contains(e.target) && !elements.tagSuggestions.contains(e.target)) {
      elements.tagSuggestions.classList.remove('active');
    }
  });
});