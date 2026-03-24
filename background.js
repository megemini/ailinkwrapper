// Initialize context menus when extension loads or storage changes
let isInitializing = false;

chrome.runtime.onInstalled.addListener(initializeContextMenus);
chrome.storage.onChanged.addListener(initializeContextMenus);

function initializeContextMenus() {
  if (isInitializing) return;
  isInitializing = true;

  // Remove all existing context menus
  chrome.contextMenus.removeAll(() => {
    // Load proxies and create new menus
    chrome.storage.sync.get('proxies', (result) => {
      const proxies = result.proxies || [];
      
      // Create parent menu item if there are proxies
      if (proxies.length > 0) {
        chrome.contextMenus.create({
          id: 'proxy-opener-parent',
          title: 'Open Link Via',
          contexts: ['link']
        });

        // Create child menu items for each proxy
        proxies.forEach(proxy => {
          chrome.contextMenus.create({
            id: `proxy-${proxy.id}`,
            parentId: 'proxy-opener-parent',
            title: proxy.label,
            contexts: ['link']
          });
        });
      }
      
      isInitializing = false;
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId && info.menuItemId.startsWith('proxy-')) {
    const proxyId = parseInt(info.menuItemId.replace('proxy-', ''));
    const linkUrl = info.linkUrl;

    chrome.storage.sync.get('proxies', (result) => {
      const proxies = result.proxies || [];
      const proxy = proxies.find(p => p.id === proxyId);

      if (proxy && linkUrl) {
        // Combine proxy URL and link URL
        const finalUrl = proxy.url + linkUrl;
        
        // Open in new tab
        chrome.tabs.create({ url: finalUrl });
      }
    });
  }
});

// Initialize on first run
initializeContextMenus();
