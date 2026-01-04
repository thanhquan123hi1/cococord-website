/**
 * CoCoCord Admin - Messages Moderation Page JavaScript
 * Handles flagged messages, automod queue, and rules management
 */

const AdminMessages = (function() {
  'use strict';

  // State
  let currentTab = 'flagged';
  let selectedMessages = new Set();

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminMessages] Initializing...');
    
    // Update stats
    updateStats();
    
    // Render initial content based on active tab
    renderContent();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[AdminMessages] Initialized');
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const stats = MockData.messages.stats;
    
    const statElements = {
      'flaggedMessages': stats.flagged,
      'automodBlocked': Math.floor(Math.random() * 50) + 100, // Simulated
      'reviewedToday': Math.floor(Math.random() * 30) + 10, // Simulated
      'activeRules': MockData.messages.autoModRules.filter(r => r.enabled).length
    };
    
    Object.entries(statElements).forEach(([key, value]) => {
      const elements = document.querySelectorAll(`[data-stat="${key}"]`);
      elements.forEach(el => {
        el.textContent = typeof value === 'number' 
          ? AdminUtils?.formatNumber?.(value) || value.toLocaleString()
          : value;
      });
    });
  }

  // ========================================
  // Content Rendering
  // ========================================

  function renderContent() {
    switch (currentTab) {
      case 'flagged':
        renderFlaggedMessages();
        break;
      case 'automod':
        renderAutoModQueue();
        break;
      case 'rules':
        renderAutoModRules();
        break;
    }
  }

  function renderFlaggedMessages() {
    const container = document.getElementById('flagged-messages-list');
    const emptyState = document.getElementById('messages-empty');
    const pagination = document.getElementById('messages-pagination');
    
    if (!container) return;
    
    const messages = MockData.messages.flagged.filter(m => m.status === 'pending');
    
    if (messages.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      pagination?.classList.add('hidden');
      return;
    }
    
    emptyState?.classList.add('hidden');
    pagination?.classList.remove('hidden');
    
    container.innerHTML = messages.map(msg => renderMessageCard(msg)).join('');
    
    // Attach listeners
    attachMessageCardListeners();
  }

  function renderMessageCard(msg) {
    const reasonClass = {
      'Spam/Advertising': 'reason-spam',
      'Harassment': 'reason-harassment',
      'Scam/Phishing': 'reason-scam',
      'False Positive': 'reason-false'
    }[msg.flagReason] || '';
    
    const timeAgo = AdminUtils?.timeAgo?.(msg.flaggedAt) || formatTimeAgo(msg.flaggedAt);
    const initials = getInitials(msg.author);
    
    return `
      <div class="admin-message-card ${reasonClass}" data-message-id="${msg.id}">
        <div class="message-checkbox">
          <input type="checkbox" class="admin-checkbox message-select" data-id="${msg.id}">
        </div>
        
        <div class="message-content">
          <div class="message-header">
            <div class="message-author">
              <div class="message-avatar">${initials}</div>
              <div class="message-author-info">
                <span class="author-name">${msg.author}</span>
                <span class="message-location">${msg.server} / ${msg.channel}</span>
              </div>
            </div>
            <span class="admin-badge admin-badge-warning">${msg.flagReason}</span>
          </div>
          
          <div class="message-body">
            <p class="message-text">${escapeHtml(msg.content)}</p>
          </div>
          
          <div class="message-footer">
            <div class="message-meta">
              <span class="flagged-by">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="meta-icon">
                  <path d="M2 3h8l2 2 2-2v8l-2-2-2 2H2V3z"/>
                </svg>
                ${msg.flaggedBy}
              </span>
              <span class="flagged-time">${timeAgo}</span>
            </div>
            
            <div class="message-actions">
              <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="view-context" data-id="${msg.id}">
                View Context
              </button>
              <button class="admin-btn admin-btn-sm admin-btn-success" data-action="approve-message" data-id="${msg.id}">
                Approve
              </button>
              <button class="admin-btn admin-btn-sm admin-btn-danger" data-action="delete-message" data-id="${msg.id}">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAutoModQueue() {
    const container = document.getElementById('automod-queue-list');
    if (!container) return;
    
    const autoModMessages = MockData.messages.flagged.filter(m => m.flaggedBy === 'AutoMod');
    
    if (autoModMessages.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <div class="empty-icon">🤖</div>
          <h3>AutoMod queue is empty</h3>
          <p>No messages pending review from AutoMod</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = autoModMessages.map(msg => renderMessageCard(msg)).join('');
    attachMessageCardListeners();
  }

  function renderAutoModRules() {
    const container = document.getElementById('automod-rules-list');
    if (!container) return;
    
    const rules = MockData.messages.autoModRules;
    
    container.innerHTML = rules.map(rule => `
      <div class="admin-rule-card" data-rule-id="${rule.id}">
        <div class="rule-info">
          <div class="rule-header">
            <span class="rule-name">${rule.name}</span>
            <span class="rule-triggers">${rule.triggers} triggers</span>
          </div>
        </div>
        
        <div class="rule-actions">
          <button class="admin-btn admin-btn-sm admin-btn-ghost" data-action="edit-rule" data-id="${rule.id}">
            Edit
          </button>
          <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle-rule" data-id="${rule.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `).join('');
    
    // Attach toggle listeners
    container.querySelectorAll('[data-action="toggle-rule"]').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const ruleId = parseInt(e.target.dataset.id);
        toggleRule(ruleId, e.target.checked);
      });
    });
    
    container.querySelectorAll('[data-action="edit-rule"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ruleId = parseInt(e.target.dataset.id);
        editRule(ruleId);
      });
    });
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.page-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
    
    // Filter
    const reasonFilter = document.getElementById('message-reason-filter');
    if (reasonFilter) {
      reasonFilter.addEventListener('change', handleFilterChange);
    }
    
    // Bulk actions
    const bulkApprove = document.querySelector('[data-action="bulk-approve"]');
    const bulkDelete = document.querySelector('[data-action="bulk-delete"]');
    
    if (bulkApprove) {
      bulkApprove.addEventListener('click', handleBulkApprove);
    }
    
    if (bulkDelete) {
      bulkDelete.addEventListener('click', handleBulkDelete);
    }
    
    // Configure AutoMod button
    const configureBtn = document.querySelector('[data-action="configure-automod"]');
    if (configureBtn) {
      configureBtn.addEventListener('click', openAutoModConfig);
    }
    
    // Add rule button
    const addRuleBtn = document.querySelector('[data-action="add-rule"]');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', openAddRuleModal);
    }
  }

  function attachMessageCardListeners() {
    // Checkbox selection
    document.querySelectorAll('.message-select').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          selectedMessages.add(id);
        } else {
          selectedMessages.delete(id);
        }
        updateBulkActionState();
      });
    });
    
    // View context
    document.querySelectorAll('[data-action="view-context"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        viewMessageContext(id);
      });
    });
    
    // Approve
    document.querySelectorAll('[data-action="approve-message"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        approveMessage(id);
      });
    });
    
    // Delete
    document.querySelectorAll('[data-action="delete-message"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        deleteMessage(id);
      });
    });
  }

  function handleTabClick(e) {
    const tab = e.currentTarget;
    const tabId = tab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.dataset.tabContent !== tabId);
      content.classList.toggle('active', content.dataset.tabContent === tabId);
    });
    
    currentTab = tabId;
    renderContent();
  }

  function handleFilterChange(e) {
    // Implement filtering logic
    console.log('[AdminMessages] Filter changed:', e.target.value);
    renderFlaggedMessages();
  }

  // ========================================
  // Message Actions
  // ========================================

  function viewMessageContext(messageId) {
    const msg = MockData.messages.flagged.find(m => m.id === parseInt(messageId));
    if (!msg) return;
    
    console.log('[AdminMessages] Viewing context for message:', msg);
    AdminUtils?.showToast?.(`Loading context for message in ${msg.channel}...`, 'info');
  }

  function approveMessage(messageId) {
    const msg = MockData.messages.flagged.find(m => m.id === parseInt(messageId));
    if (!msg) return;
    
    msg.status = 'reviewed';
    MockData.messages.stats.flagged--;
    MockData.messages.stats.reviewed++;
    
    updateStats();
    renderContent();
    
    AdminUtils?.showToast?.('Message approved', 'success');
  }

  function deleteMessage(messageId) {
    const index = MockData.messages.flagged.findIndex(m => m.id === parseInt(messageId));
    if (index === -1) return;
    
    MockData.messages.flagged.splice(index, 1);
    MockData.messages.stats.flagged--;
    MockData.messages.stats.deleted++;
    
    updateStats();
    renderContent();
    
    AdminUtils?.showToast?.('Message deleted', 'warning');
  }

  function handleBulkApprove() {
    if (selectedMessages.size === 0) {
      AdminUtils?.showToast?.('No messages selected', 'warning');
      return;
    }
    
    selectedMessages.forEach(id => {
      const msg = MockData.messages.flagged.find(m => m.id === parseInt(id));
      if (msg) {
        msg.status = 'reviewed';
        MockData.messages.stats.flagged--;
        MockData.messages.stats.reviewed++;
      }
    });
    
    selectedMessages.clear();
    updateStats();
    renderContent();
    
    AdminUtils?.showToast?.('Selected messages approved', 'success');
  }

  function handleBulkDelete() {
    if (selectedMessages.size === 0) {
      AdminUtils?.showToast?.('No messages selected', 'warning');
      return;
    }
    
    selectedMessages.forEach(id => {
      const index = MockData.messages.flagged.findIndex(m => m.id === parseInt(id));
      if (index !== -1) {
        MockData.messages.flagged.splice(index, 1);
        MockData.messages.stats.flagged--;
        MockData.messages.stats.deleted++;
      }
    });
    
    selectedMessages.clear();
    updateStats();
    renderContent();
    
    AdminUtils?.showToast?.('Selected messages deleted', 'warning');
  }

  function updateBulkActionState() {
    const count = selectedMessages.size;
    const bulkApprove = document.querySelector('[data-action="bulk-approve"]');
    const bulkDelete = document.querySelector('[data-action="bulk-delete"]');
    
    if (bulkApprove) {
      bulkApprove.disabled = count === 0;
    }
    if (bulkDelete) {
      bulkDelete.disabled = count === 0;
    }
  }

  // ========================================
  // AutoMod Rules
  // ========================================

  function toggleRule(ruleId, enabled) {
    const rule = MockData.messages.autoModRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    rule.enabled = enabled;
    updateStats();
    
    AdminUtils?.showToast?.(
      `Rule "${rule.name}" ${enabled ? 'enabled' : 'disabled'}`,
      enabled ? 'success' : 'info'
    );
  }

  function editRule(ruleId) {
    const rule = MockData.messages.autoModRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    console.log('[AdminMessages] Editing rule:', rule);
    AdminUtils?.showToast?.(`Editing rule: ${rule.name}`, 'info');
  }

  function openAutoModConfig() {
    console.log('[AdminMessages] Opening AutoMod configuration');
    AdminUtils?.showToast?.('AutoMod configuration (coming soon)', 'info');
  }

  function openAddRuleModal() {
    console.log('[AdminMessages] Opening add rule modal');
    AdminUtils?.showToast?.('Add rule modal (coming soon)', 'info');
  }

  // ========================================
  // Utility Functions
  // ========================================

  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('vi-VN');
  }

  function getInitials(name) {
    return name.substring(0, 2).toUpperCase();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    refresh: renderContent
  };

})();

// Expose to window for router
window.AdminMessages = AdminMessages;
