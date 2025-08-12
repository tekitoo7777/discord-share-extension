// バックグラウンドスクリプト（Service Worker）

// 拡張機能がインストールされた時の処理
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Discord Share Extension installed');
  
  try {
    // サイドパネルを有効にする
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    
    // コンテキストメニューを作成
    chrome.contextMenus.create({
      id: 'shareToDiscord',
      title: 'Discordに共有',
      contexts: ['page', 'selection', 'link', 'image']
    });
    
    // 初回インストール時の処理
    const result = await chrome.storage.sync.get(['webhookUrl']);
    if (!result.webhookUrl) {
      chrome.runtime.openOptionsPage();
    }
  } catch (error) {
    console.error('Installation error:', error);
  }
});

// アクションボタンクリック時の処理
chrome.action.onClicked.addListener((tab) => {
  // サイドパネルを開く
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// コンテキストメニューがクリックされた時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'shareToDiscord') {
    // サイドパネルを開く
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// コンテキストメニューからの共有処理
async function handleContextMenuShare(info, tab) {
  try {
    const { webhookUrl } = await chrome.storage.sync.get('webhookUrl');
    
    if (!webhookUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }

    let content = '';
    let embedData = {
      title: tab.title,
      url: tab.url,
      color: 5865242, // Discord Blue
      footer: {
        text: 'Discord Share Extension - Context Menu'
      },
      timestamp: new Date().toISOString()
    };

    // コンテキストに応じた処理
    if (info.selectionText) {
      content = `選択テキスト: ${info.selectionText}`;
      embedData.description = info.selectionText.substring(0, 500);
    }
    
    if (info.linkUrl) {
      embedData.fields = [{
        name: 'リンク',
        value: info.linkUrl,
        inline: false
      }];
    }
    
    if (info.srcUrl) {
      embedData.image = {
        url: info.srcUrl
      };
    }

    // Discordに送信
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content || null,
        embeds: [embedData]
      })
    });

    if (!response.ok) {
      throw new Error(`送信エラー: ${response.status}`);
    }
  } catch (error) {
    console.error('Share error:', error);
  }
}

// メッセージリスナー（他の部分からの通信用）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkWebhook') {
    checkWebhookUrl(request.url).then(result => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'getHistory') {
    chrome.storage.local.get(['history'], (result) => {
      sendResponse(result.history || []);
    });
    return true;
  }
  
  if (request.action === 'clearHistory') {
    chrome.storage.local.remove(['history'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getTagStats') {
    chrome.storage.local.get(['tagFrequency'], (result) => {
      const frequency = result.tagFrequency || {};
      const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
      sendResponse(sorted);
    });
    return true;
  }
});

// Webhook URLの検証
async function checkWebhookUrl(url) {
  if (!url) {
    return { valid: false, message: 'URLが入力されていません' };
  }
  
  const webhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
  if (!webhookPattern.test(url)) {
    return { valid: false, message: '有効なDiscord Webhook URLではありません' };
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: '✅ Discord Share Extension - 接続テスト成功！',
        embeds: [{
          title: '設定完了',
          description: 'Webhook URLが正しく設定されました。',
          color: 3066993,
          footer: {
            text: 'Discord Share Extension'
          },
          timestamp: new Date().toISOString()
        }]
      })
    });
    
    if (response.ok) {
      return { valid: true, message: '接続テスト成功！' };
    } else if (response.status === 404) {
      return { valid: false, message: 'Webhook URLが見つかりません' };
    } else if (response.status === 401) {
      return { valid: false, message: 'Webhook URLが無効です' };
    } else {
      return { valid: false, message: `エラー: ${response.status}` };
    }
  } catch (error) {
    return { valid: false, message: `接続エラー: ${error.message}` };
  }
}