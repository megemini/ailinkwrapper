// Initialize context menus when extension loads or storage changes
let isInitializing = false;

chrome.runtime.onInstalled.addListener(initializeContextMenus);
chrome.storage.onChanged.addListener(initializeContextMenus);

function initializeContextMenus() {
  if (isInitializing) return;
  isInitializing = true;

  // Remove all existing context menus
  chrome.contextMenus.removeAll(() => {
    // Load proxies and domain rules
    chrome.storage.sync.get(['proxies', 'domainRules'], (result) => {
      const proxies = result.proxies || [];
      const domainRules = result.domainRules || [];
      const hasItems = proxies.length > 0 || domainRules.length > 0;
      
      if (!hasItems) {
        isInitializing = false;
        return;
      }

      // Create single parent menu
      chrome.contextMenus.create({
        id: 'link-opener-parent',
        title: 'Open Link',
        contexts: ['link'],
        enabled: true
      });

      // Create child menu items for each proxy with "via" prefix
      proxies.forEach(proxy => {
        chrome.contextMenus.create({
          id: `proxy-${proxy.id}`,
          parentId: 'link-opener-parent',
          title: `via ${proxy.label}`,
          contexts: ['link']
        });
      });

      // Add separator if both proxies and domain rules exist
      if (proxies.length > 0 && domainRules.length > 0) {
        chrome.contextMenus.create({
          id: 'separator',
          parentId: 'link-opener-parent',
          type: 'separator',
          contexts: ['link']
        });
      }

      // Create child menu items for each domain rule with "with" prefix
      domainRules.forEach(rule => {
        chrome.contextMenus.create({
          id: `domain-${rule.id}`,
          parentId: 'link-opener-parent',
          title: `with ${rule.label}`,
          contexts: ['link']
        });
      });
      
      isInitializing = false;
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuItemId = info.menuItemId;
  const linkUrl = info.linkUrl;

  if (menuItemId && menuItemId.startsWith('proxy-')) {
    // Handle proxy URL
    const proxyId = parseInt(menuItemId.replace('proxy-', ''));

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
  } else if (menuItemId && menuItemId.startsWith('domain-')) {
    // Handle domain replacement
    const ruleId = parseInt(menuItemId.replace('domain-', ''));

    chrome.storage.sync.get('domainRules', (result) => {
      const rules = result.domainRules || [];
      const rule = rules.find(r => r.id === ruleId);

      if (rule && linkUrl) {
        // Replace domain in URL
        const finalUrl = replaceDomain(linkUrl, rule.source, rule.target);
        
        // Open in new tab
        chrome.tabs.create({ url: finalUrl });
      }
    });
  }
});

// Helper function to replace domain in URL
function replaceDomain(url, sourceDomain, targetDomain) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check if hostname matches or ends with source domain
    if (hostname === sourceDomain || hostname.endsWith('.' + sourceDomain)) {
      // Replace the domain
      if (hostname === sourceDomain) {
        urlObj.hostname = targetDomain;
      } else {
        // For subdomains, keep the subdomain and replace the main domain
        const subdomain = hostname.substring(0, hostname.length - sourceDomain.length - 1);
        urlObj.hostname = subdomain + '.' + targetDomain;
      }
      return urlObj.toString();
    }
    
    // If domain doesn't match, return original URL
    return url;
  } catch (e) {
    // If URL parsing fails, return original URL
    return url;
  }
}

// Omnibox support
chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description: 'Type proxy/rule name and URL: <match>name url</match>'
  });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const input = text.trim();
  
  chrome.storage.sync.get(['proxies', 'domainRules'], (result) => {
    const proxies = result.proxies || [];
    const domainRules = result.domainRules || [];
    const suggestions = [];
    
    // Parse input: first word is name filter, rest is URL
    const spaceIndex = input.indexOf(' ');
    const nameFilter = spaceIndex > -1 ? input.substring(0, spaceIndex).toLowerCase() : input.toLowerCase();
    const urlPart = spaceIndex > -1 ? input.substring(spaceIndex + 1).trim() : '';

    proxies.forEach(proxy => {
      if (proxy.label.toLowerCase().includes(nameFilter)) {
        const desc = urlPart
          ? `via <match>${escapeXml(proxy.label)}</match>: ${escapeXml(proxy.url + urlPart)}`
          : `via <match>${escapeXml(proxy.label)}</match> — type a URL after the name`;
        suggestions.push({
          content: `${proxy.label} ${urlPart}`,
          description: desc
        });
      }
    });

    domainRules.forEach(rule => {
      if (rule.label.toLowerCase().includes(nameFilter)) {
        const desc = urlPart
          ? `with <match>${escapeXml(rule.label)}</match>: ${escapeXml(rule.source)} → ${escapeXml(rule.target)}`
          : `with <match>${escapeXml(rule.label)}</match> — type a URL after the name`;
        suggestions.push({
          content: `${rule.label} ${urlPart}`,
          description: desc
        });
      }
    });

    suggest(suggestions);
  });
});

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  const input = text.trim();
  const spaceIndex = input.indexOf(' ');
  
  if (spaceIndex === -1) return;
  
  const name = input.substring(0, spaceIndex).trim();
  const url = input.substring(spaceIndex + 1).trim();
  
  if (!url) return;

  chrome.storage.sync.get(['proxies', 'domainRules'], (result) => {
    const proxies = result.proxies || [];
    const domainRules = result.domainRules || [];
    let finalUrl = null;

    // Match proxy by label (case-insensitive)
    const proxy = proxies.find(p => p.label.toLowerCase() === name.toLowerCase());
    if (proxy) {
      finalUrl = proxy.url + url;
    }

    // Match domain rule by label (case-insensitive)
    if (!finalUrl) {
      const rule = domainRules.find(r => r.label.toLowerCase() === name.toLowerCase());
      if (rule) {
        finalUrl = replaceDomain(url, rule.source, rule.target);
      }
    }

    if (finalUrl) {
      if (disposition === 'currentTab') {
        chrome.tabs.update({ url: finalUrl });
      } else {
        chrome.tabs.create({ url: finalUrl });
      }
    }
  });
});

// Initialize on first run
initializeContextMenus();
