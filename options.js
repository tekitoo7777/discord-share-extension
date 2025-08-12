// 設定ページのスクリプト

document.addEventListener('DOMContentLoaded', () => {
  // タブ切り替え機能
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // タブボタンのアクティブ状態を更新
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // タブコンテンツの表示を更新
      tabContents.forEach(content => {
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // Webhook設定タブの処理
  initWebhookTab();
  
  // タグ管理タブの処理
  initTagsTab();
  
  // 送信履歴タブの処理
  initHistoryTab();
});

// Webhook設定タブの初期化
function initWebhookTab() {
  const webhookUrlInput = document.getElementById('webhookUrl');
  const saveButton = document.getElementById('saveWebhook');
  const testButton = document.getElementById('testWebhook');
  const statusDiv = document.getElementById('webhookStatus');
  
  // 保存されているWebhook URLを読み込み
  chrome.storage.sync.get(['webhookUrl'], (result) => {
    if (result.webhookUrl) {
      webhookUrlInput.value = result.webhookUrl;
    }
  });
  
  // 保存ボタンのクリックイベント
  saveButton.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    
    if (!url) {
      showStatus(statusDiv, 'error', 'URLを入力してください');
      return;
    }
    
    // Discord Webhook URLの形式をチェック
    const webhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!webhookPattern.test(url)) {
      showStatus(statusDiv, 'error', '有効なDiscord Webhook URLを入力してください');
      return;
    }
    
    // 保存
    chrome.storage.sync.set({ webhookUrl: url }, () => {
      showStatus(statusDiv, 'success', 'Webhook URLを保存しました');
    });
  });
  
  // テストボタンのクリックイベント
  testButton.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    
    if (!url) {
      showStatus(statusDiv, 'error', 'URLを入力してください');
      return;
    }
    
    testButton.disabled = true;
    showStatus(statusDiv, 'info', '接続テスト中...');
    
    // バックグラウンドスクリプトにテストを依頼
    chrome.runtime.sendMessage({ action: 'checkWebhook', url }, (response) => {
      if (response.valid) {
        showStatus(statusDiv, 'success', response.message);
      } else {
        showStatus(statusDiv, 'error', response.message);
      }
      testButton.disabled = false;
    });
  });
}

// タグ管理タブの初期化
function initTagsTab() {
  const newTagInput = document.getElementById('newTag');
  const addTagButton = document.getElementById('addTag');
  const savedTagsDiv = document.getElementById('savedTags');
  const tagStatsDiv = document.getElementById('tagStats');
  
  // 保存されているタグを読み込み
  loadSavedTags();
  
  // タグ統計を読み込み
  loadTagStats();
  
  // タグ追加ボタンのクリックイベント
  addTagButton.addEventListener('click', () => {
    const tagText = newTagInput.value.trim();
    if (tagText) {
      const formattedTag = tagText.startsWith('#') ? tagText : `#${tagText}`;
      addSavedTag(formattedTag);
      newTagInput.value = '';
    }
  });
  
  // Enterキーでタグ追加
  newTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTagButton.click();
    }
  });
  
  // 保存されているタグを読み込む
  function loadSavedTags() {
    chrome.storage.sync.get(['savedTags'], (result) => {
      const tags = result.savedTags || [];
      savedTagsDiv.innerHTML = '';
      
      if (tags.length === 0) {
        savedTagsDiv.innerHTML = '<div class="empty-state">よく使うタグがありません</div>';
      } else {
        tags.forEach(tag => {
          createTagElement(tag);
        });
      }
    });
  }
  
  // タグ要素を作成
  function createTagElement(tag) {
    const tagElement = document.createElement('span');
    tagElement.className = 'saved-tag';
    tagElement.innerHTML = `
      ${tag}
      <button data-tag="${tag}">×</button>
    `;
    
    tagElement.querySelector('button').addEventListener('click', () => {
      removeSavedTag(tag);
    });
    
    savedTagsDiv.appendChild(tagElement);
  }
  
  // タグを追加
  function addSavedTag(tag) {
    chrome.storage.sync.get(['savedTags'], (result) => {
      const tags = result.savedTags || [];
      if (!tags.includes(tag)) {
        tags.push(tag);
        chrome.storage.sync.set({ savedTags: tags }, () => {
          loadSavedTags();
        });
      }
    });
  }
  
  // タグを削除
  function removeSavedTag(tag) {
    chrome.storage.sync.get(['savedTags'], (result) => {
      const tags = result.savedTags || [];
      const filtered = tags.filter(t => t !== tag);
      chrome.storage.sync.set({ savedTags: filtered }, () => {
        loadSavedTags();
      });
    });
  }
  
  // タグ統計を読み込む
  function loadTagStats() {
    chrome.runtime.sendMessage({ action: 'getTagStats' }, (stats) => {
      if (stats && stats.length > 0) {
        tagStatsDiv.innerHTML = stats.map(([tag, count]) => `
          <div class="tag-stat-item">
            <span class="tag-stat-name">${tag}</span>
            <span class="tag-stat-count">${count}回</span>
          </div>
        `).join('');
      } else {
        tagStatsDiv.innerHTML = '<div class="empty-state">まだ統計データがありません</div>';
      }
    });
  }
}

// 送信履歴タブの初期化
function initHistoryTab() {
  const historyListDiv = document.getElementById('historyList');
  const clearButton = document.getElementById('clearHistory');
  
  // 履歴を読み込み
  loadHistory();
  
  // 履歴クリアボタンのクリックイベント
  clearButton.addEventListener('click', () => {
    if (confirm('送信履歴を全て削除しますか？')) {
      chrome.runtime.sendMessage({ action: 'clearHistory' }, () => {
        loadHistory();
      });
    }
  });
  
  // 履歴を読み込む
  function loadHistory() {
    chrome.runtime.sendMessage({ action: 'getHistory' }, (history) => {
      if (history && history.length > 0) {
        historyListDiv.innerHTML = history.map(item => {
          const date = new Date(item.timestamp);
          const dateStr = date.toLocaleString('ja-JP');
          
          return `
            <div class="history-item">
              <a href="${item.url}" target="_blank" class="history-title">${item.title}</a>
              <div class="history-url">${item.url}</div>
              ${item.tags && item.tags.length > 0 ? `
                <div class="history-tags">
                  ${item.tags.map(tag => `<span class="history-tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
              ${item.memo ? `<div class="history-memo">${item.memo}</div>` : ''}
              <div class="history-date">${dateStr}</div>
            </div>
          `;
        }).join('');
      } else {
        historyListDiv.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
            </svg>
            <p>送信履歴がありません</p>
          </div>
        `;
      }
    });
  }
}

// ステータスメッセージを表示
function showStatus(element, type, message) {
  element.className = `status-message ${type}`;
  element.textContent = message;
  
  // 3秒後に自動的に非表示
  setTimeout(() => {
    element.className = 'status-message';
  }, 3000);
}