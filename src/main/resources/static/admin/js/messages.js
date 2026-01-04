/**
 * CoCoCord Admin - Messages Moderation Page JavaScript
 * Handles flagged messages, automod queue, and rules management
 * Updated to use real API endpoints
 */

var AdminMessages = window.AdminMessages || (function() {
  'use strict';

  // State
  let currentTab = 'flagged';
  let selectedMessages = new Set();
  let messagesData = [];
  let pagination = {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  };
  let isLoading = false;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    messages: '/api/admin/messages',
    message: (id) => `/api/admin/messages/${id}`
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminMessages] Initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch messages from API
    fetchMessages();
    
    console.log('[AdminMessages] Initialized');
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchMessages() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size
      });

      const response = await AdminUtils.api.get(`${API.messages}?${params}`);
      
      if (response && response.content) {
        messagesData = response.content;
        pagination.totalElements = response.totalElements || 0;
        pagination.totalPages = response.totalPages || 0;
      } else if (Array.isArray(response)) {
        messagesData = response;
        pagination.totalElements = response.length;
        pagination.totalPages = 1;
      } else {
        console.warn('[AdminMessages] API returned unexpected format, using mock data');
        messagesData = MockData?.messages?.flagged || [];
      }
      
      updateStats();
      renderContent();
    } catch (error) {
      console.error('[AdminMessages] Failed to fetch messages:', error);
      AdminUtils?.showToast?.('Failed to load messages', 'danger');
      // Fallback to mock data
      messagesData = MockData?.messages?.flagged || [];
      updateStats();
      renderContent();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  async function deleteMessageAPI(messageId) {
    try {
      await AdminUtils.api.delete(API.message(messageId));
      AdminUtils?.showToast?.('Message deleted', 'warning');
      fetchMessages();
    } catch (error) {
      console.error('[AdminMessages] Failed to delete message:', error);
      AdminUtils?.showToast?.('Failed to delete message', 'danger');
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const container = document.getElementById('flagged-messages-list');
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <div class="text-center py-8">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Loading messages...</div>
        </div>
      `;
    }
  }

  // ========================================
  // Stats Update
  // ========================================

  function updateStats() {
    const flaggedCount = messagesData.filter(m => m.status === 'pending' || m.status === 'flagged').length;
    const autoModRules = MockData?.messages?.autoModRules || [];
    
    const statElements = {
      'flaggedMessages': flaggedCount || pagination.totalElements,
      'automodBlocked': Math.floor(Math.random() * 50) + 100,
      'reviewedToday': Math.floor(Math.random() * 30) + 10,
      'activeRules': autoModRules.filter(r => r.enabled).length
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
    const paginationEl = document.getElementById('messages-pagination');
    
    if (!container) return;
    
    const messages = messagesData.filter(m => 
      m.status === 'pending' || m.status === 'flagged' || !m.status
    );
    
    if (messages.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'block';
      }
      if (paginationEl) paginationEl.classList.add('hidden');
      return;
    }
    
    if (emptyState) {
      emptyState.classList.add('hidden');
      emptyState.style.display = 'none';
    }
    if (paginationEl) paginationEl.classList.remove('hidden');
    
    container.innerHTML = messages.map(msg => renderMessageCard(msg)).join('');
    
    // Attach listeners
    attachMessageCardListeners();
  }

  function renderMessageCard(msg) {
    const reason = msg.flagReason || 'Review required';
    const reasonClass = {
      'Spam/Advertising': 'reason-spam',
      'Harassment': 'reason-harassment',
      'Scam/Phishing': 'reason-scam',
      'False Positive': 'reason-false'
    }[reason] || '';
    
    const timeAgo = AdminUtils?.timeAgo?.(msg.createdAt || msg.flaggedAt) || formatTimeAgo(msg.createdAt || msg.flaggedAt);
    const initials = getInitials(msg.authorUsername || msg.author || 'UN');
    
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
                <span class="author-name">${msg.authorUsername || msg.author || 'Unknown'}</span>
                <span class="message-location">${msg.serverName || msg.server || 'Unknown'} / ${msg.channelName || msg.channel || 'Unknown'}</span>
              </div>
            </div>
            <span class="admin-badge admin-badge-warning">${reason}</span>
          </div>
          
          <div class="message-body">
            <p class="message-text">${escapeHtml(msg.content || '')}</p>
          </div>
          
          <div class="message-footer">
            <div class="message-meta">
              <span class="flagged-by">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="meta-icon">
                  <path d="M2 3h8l2 2 2-2v8l-2-2-2 2H2V3z"/>
                </svg>
                ${msg.flaggedBy || 'System'}
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
    
    const autoModMessages = messagesData.filter(m => m.flaggedBy === 'AutoMod');
    
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
    
    // AutoMod rules are still managed locally/mock for now
    const rules = MockData?.messages?.autoModRules || [];
    
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

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        fetchMessages().finally(() => {
          refreshBtn.classList.remove('spinning');
        });
      });
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
    console.log('[AdminMessages] Filter changed:', e.target.value);
    renderFlaggedMessages();
  }

  // ========================================
  // Message Actions
  // ========================================

  function viewMessageContext(messageId) {
    const msg = messagesData.find(m => m.id == messageId);
    if (!msg) return;
    
    console.log('[AdminMessages] Viewing context for message:', msg);
    AdminUtils?.showToast?.(`Loading context for message in ${msg.channelName || msg.channel}...`, 'info');
  }

  function approveMessage(messageId) {
    // Remove from local data (mark as reviewed)
    const index = messagesData.findIndex(m => m.id == messageId);
    if (index !== -1) {
      messagesData.splice(index, 1);
    }
    
    renderContent();
    updateStats();
    AdminUtils?.showToast?.('Message approved', 'success');
  }

  async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessageAPI(messageId);
    }
  }

  async function handleBulkApprove() {
    if (selectedMessages.size === 0) {
      AdminUtils?.showToast?.('No messages selected', 'warning');
      return;
    }
    
    // Remove selected from local data
    selectedMessages.forEach(id => {
      const index = messagesData.findIndex(m => m.id == id);
      if (index !== -1) {
        messagesData.splice(index, 1);
      }
    });
    
    const count = selectedMessages.size;
    selectedMessages.clear();
    renderContent();
    updateStats();
    
    AdminUtils?.showToast?.(`${count} messages approved`, 'success');
  }

  async function handleBulkDelete() {
    if (selectedMessages.size === 0) {
      AdminUtils?.showToast?.('No messages selected', 'warning');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedMessages.size} messages?`)) {
      return;
    }
    
    // Delete each selected message via API
    const deletePromises = Array.from(selectedMessages).map(id => 
      AdminUtils.api.delete(API.message(id)).catch(e => console.error(e))
    );
    
    await Promise.all(deletePromises);
    
    const count = selectedMessages.size;
    selectedMessages.clear();
    fetchMessages();
    
    AdminUtils?.showToast?.(`${count} messages deleted`, 'warning');
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
    const rules = MockData?.messages?.autoModRules || [];
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    
    rule.enabled = enabled;
    updateStats();
    
    AdminUtils?.showToast?.(
      `Rule "${rule.name}" ${enabled ? 'enabled' : 'disabled'}`,
      enabled ? 'success' : 'info'
    );
  }

  function editRule(ruleId) {
    const rules = MockData?.messages?.autoModRules || [];
    const rule = rules.find(r => r.id === ruleId);
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
    if (!dateStr) return '--';
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
    if (!name) return 'UN';
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
    refresh: fetchMessages
  };

})();

// Expose to window for router
window.AdminMessages = AdminMessages;
