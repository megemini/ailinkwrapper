document.addEventListener('DOMContentLoaded', () => {
  loadProxies();
  loadDomainRules();
  initTabs();
});

// Tab switching
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Proxy mode events
document.getElementById('addBtn').addEventListener('click', addProxy);
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('labelInput').value = '';
  document.getElementById('urlInput').value = '';
});

// Domain replace mode events
document.getElementById('addDomainBtn').addEventListener('click', addDomainRule);
document.getElementById('cancelDomainBtn').addEventListener('click', () => {
  document.getElementById('domainLabelInput').value = '';
  document.getElementById('domainSourceInput').value = '';
  document.getElementById('domainTargetInput').value = '';
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

// Domain replacement functions
function loadDomainRules() {
  chrome.storage.sync.get('domainRules', (result) => {
    const rules = result.domainRules || [];
    renderDomainRules(rules);
  });
}

function addDomainRule() {
  const label = document.getElementById('domainLabelInput').value.trim();
  const source = document.getElementById('domainSourceInput').value.trim();
  const target = document.getElementById('domainTargetInput').value.trim();

  if (!label || !source || !target) {
    alert('Please fill in all fields');
    return;
  }

  // Basic domain validation (simple check)
  if (!isValidDomain(source) || !isValidDomain(target)) {
    alert('Invalid domain format');
    return;
  }

  chrome.storage.sync.get('domainRules', (result) => {
    const rules = result.domainRules || [];
    rules.push({
      id: Date.now(),
      label,
      source,
      target
    });
    chrome.storage.sync.set({ domainRules: rules }, () => {
      document.getElementById('domainLabelInput').value = '';
      document.getElementById('domainSourceInput').value = '';
      document.getElementById('domainTargetInput').value = '';
      loadDomainRules();
    });
  });
}

function deleteDomainRule(id) {
  chrome.storage.sync.get('domainRules', (result) => {
    const rules = (result.domainRules || []).filter(r => r.id !== id);
    chrome.storage.sync.set({ domainRules: rules }, () => {
      loadDomainRules();
    });
  });
}

function renderDomainRules(rules) {
  const list = document.getElementById('domainList');
  
  if (rules.length === 0) {
    list.innerHTML = '<div class="empty-state">No domain replacements configured yet</div>';
    return;
  }

  list.innerHTML = rules.map(rule => `
    <div class="domain-item">
      <div class="domain-item-content">
        <div>
          <div class="domain-label">${escapeHtml(rule.label)}</div>
          <div class="domain-rule">${escapeHtml(rule.source)} → ${escapeHtml(rule.target)}</div>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteDomainRule(${rule.id})">Delete</button>
    </div>
  `).join('');
}

function isValidDomain(domain) {
  // Simple domain validation: no spaces, no protocols, contains at least a dot
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.?$/;
  return domainRegex.test(domain);
}
