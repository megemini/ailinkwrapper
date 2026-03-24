document.addEventListener('DOMContentLoaded', () => {
  loadProxies();
});

document.getElementById('addBtn').addEventListener('click', addProxy);
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('labelInput').value = '';
  document.getElementById('urlInput').value = '';
});

function loadProxies() {
  chrome.storage.sync.get('proxies', (result) => {
    const proxies = result.proxies || [];
    renderProxies(proxies);
  });
}

function addProxy() {
  const label = document.getElementById('labelInput').value.trim();
  const url = document.getElementById('urlInput').value.trim();

  if (!label || !url) {
    alert('Please fill in both label and URL');
    return;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    alert('Invalid URL format');
    return;
  }

  chrome.storage.sync.get('proxies', (result) => {
    const proxies = result.proxies || [];
    proxies.push({
      id: Date.now(),
      label,
      url
    });
    chrome.storage.sync.set({ proxies }, () => {
      document.getElementById('labelInput').value = '';
      document.getElementById('urlInput').value = '';
      loadProxies();
    });
  });
}

function deleteProxy(id) {
  chrome.storage.sync.get('proxies', (result) => {
    const proxies = (result.proxies || []).filter(p => p.id !== id);
    chrome.storage.sync.set({ proxies }, () => {
      loadProxies();
    });
  });
}

function renderProxies(proxies) {
  const list = document.getElementById('proxyList');
  
  if (proxies.length === 0) {
    list.innerHTML = '<div class="empty-state">No proxies configured yet</div>';
    return;
  }

  list.innerHTML = proxies.map(proxy => `
    <div class="proxy-item">
      <div class="proxy-info">
        <div class="proxy-label">${escapeHtml(proxy.label)}</div>
        <div class="proxy-url">${escapeHtml(proxy.url)}</div>
      </div>
      <button class="delete-btn" onclick="deleteProxy(${proxy.id})">Delete</button>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
