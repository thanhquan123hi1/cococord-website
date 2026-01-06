/**
 * CoCoCord Admin - Server Action Modals
 * Handles Lock, Suspend, Delete server actions with custom popups
 */

var ServerActionModals = window.ServerActionModals || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================
  
  let currentServer = null;
  let activeModal = null;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    lock: (id) => `/api/admin/servers/${id}/lock`,
    unlock: (id) => `/api/admin/servers/${id}/unlock`,
    suspend: (id) => `/api/admin/servers/${id}/suspend`,
    unsuspend: (id) => `/api/admin/servers/${id}/unsuspend`,
    deleteServer: (id) => `/api/admin/servers/${id}`
  };

  // ========================================
  // Initialize
  // ========================================

  function init() {
    console.log('[ServerActionModals] Initialized');
  }

  // ========================================
  // LOCK SERVER MODAL
  // ========================================

  function showLockModal(server) {
    if (!server) return;
    currentServer = server;
    
    const isLocked = server.isLocked || server.locked || false;
    
    // If already locked, show unlock confirmation
    if (isLocked) {
      showUnlockConfirmation(server);
      return;
    }
    
    const html = `
      <div class="sam-modal-backdrop" id="sam-lock-modal">
        <div class="sam-modal">
          <div class="sam-modal-header warning">
            <div class="sam-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3 class="sam-modal-title">Lock Server</h3>
            <p class="sam-modal-subtitle">Restrict access to this server</p>
          </div>
          
          <div class="sam-modal-body">
            <div class="sam-server-info">
              <div class="sam-server-avatar" style="background: ${getServerColor(server.id)}">
                ${server.iconUrl 
                  ? `<img src="${escapeHtml(server.iconUrl)}" alt="">`
                  : `<span>${getInitials(server.name)}</span>`
                }
              </div>
              <div class="sam-server-details">
                <h4 class="sam-server-name">${escapeHtml(server.name)}</h4>
                <p class="sam-server-meta">${formatNumber(server.memberCount || 0)} members</p>
              </div>
            </div>
            
            <div class="sam-form-group">
              <label class="sam-label">Lock Duration</label>
              <div class="sam-duration-options">
                <label class="sam-radio-option">
                  <input type="radio" name="lock-duration" value="permanent" checked>
                  <span class="sam-radio-label">Permanent</span>
                </label>
                <label class="sam-radio-option">
                  <input type="radio" name="lock-duration" value="custom">
                  <span class="sam-radio-label">Custom Duration</span>
                </label>
              </div>
              <div class="sam-custom-duration" id="lock-custom-duration" style="display: none;">
                <input type="number" id="lock-duration-value" min="1" value="1" class="sam-input sam-input-number">
                <select id="lock-duration-unit" class="sam-select">
                  <option value="hours">Hours</option>
                  <option value="days" selected>Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
            
            <div class="sam-form-group">
              <label class="sam-label required">Reason for Locking</label>
              <textarea 
                id="lock-reason" 
                class="sam-textarea" 
                rows="3" 
                placeholder="Enter the reason for locking this server..."
                required
              ></textarea>
              <p class="sam-hint">This will be visible to the server owner.</p>
            </div>
          </div>
          
          <div class="sam-modal-footer">
            <button type="button" class="sam-btn sam-btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="sam-btn sam-btn-warning" data-action="confirm" id="btn-confirm-lock" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Confirm Lock
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    activeModal = document.getElementById('sam-lock-modal');
    
    // Event listeners
    setupLockModalEvents();
    
    // Focus on textarea
    setTimeout(() => {
      document.getElementById('lock-reason')?.focus();
    }, 100);
  }

  function setupLockModalEvents() {
    const modal = activeModal;
    if (!modal) return;
    
    const reasonInput = modal.querySelector('#lock-reason');
    const confirmBtn = modal.querySelector('#btn-confirm-lock');
    const durationRadios = modal.querySelectorAll('input[name="lock-duration"]');
    const customDuration = modal.querySelector('#lock-custom-duration');
    
    // Toggle custom duration
    durationRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        customDuration.style.display = radio.value === 'custom' ? 'flex' : 'none';
        validateLockForm();
      });
    });
    
    // Validate on input
    reasonInput?.addEventListener('input', validateLockForm);
    modal.querySelector('#lock-duration-value')?.addEventListener('input', validateLockForm);
    
    // Cancel button
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
    
    // Confirm button
    confirmBtn?.addEventListener('click', handleLockConfirm);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Escape key
    document.addEventListener('keydown', handleEscapeKey);
  }

  function validateLockForm() {
    const modal = activeModal;
    if (!modal) return;
    
    const reason = modal.querySelector('#lock-reason')?.value?.trim();
    const confirmBtn = modal.querySelector('#btn-confirm-lock');
    const durationType = modal.querySelector('input[name="lock-duration"]:checked')?.value;
    const durationValue = modal.querySelector('#lock-duration-value')?.value;
    
    let isValid = reason && reason.length > 0;
    
    if (durationType === 'custom') {
      isValid = isValid && durationValue && parseInt(durationValue) > 0;
    }
    
    if (confirmBtn) {
      confirmBtn.disabled = !isValid;
    }
  }

  async function handleLockConfirm() {
    if (!currentServer) return;
    
    const modal = activeModal;
    const reason = modal.querySelector('#lock-reason')?.value?.trim();
    const durationType = modal.querySelector('input[name="lock-duration"]:checked')?.value;
    const durationValue = modal.querySelector('#lock-duration-value')?.value;
    const durationUnit = modal.querySelector('#lock-duration-unit')?.value;
    
    const confirmBtn = modal.querySelector('#btn-confirm-lock');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="sam-spinner"></span> Locking...';
    
    try {
      const payload = { reason };
      
      if (durationType === 'custom') {
        payload.duration = parseInt(durationValue);
        payload.durationUnit = durationUnit;
      }
      
      await AdminUtils.api.post(API.lock(currentServer.id), payload);
      AdminUtils?.showToast?.('Server locked successfully', 'success');
      closeModal();
      
      // Refresh data
      if (window.AdminServers?.fetchServers) {
        AdminServers.fetchServers();
      }
    } catch (error) {
      console.error('[ServerActionModals] Failed to lock server:', error);
      AdminUtils?.showToast?.('Failed to lock server', 'danger');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Confirm Lock
      `;
    }
  }

  function showUnlockConfirmation(server) {
    const html = `
      <div class="sam-modal-backdrop" id="sam-unlock-modal">
        <div class="sam-modal sam-modal-sm">
          <div class="sam-modal-header success">
            <div class="sam-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 018-4"/>
              </svg>
            </div>
            <h3 class="sam-modal-title">Unlock Server</h3>
            <p class="sam-modal-subtitle">Restore access to ${escapeHtml(server.name)}</p>
          </div>
          
          <div class="sam-modal-body">
            <p class="sam-info-text">This will restore full access to the server for all members.</p>
          </div>
          
          <div class="sam-modal-footer">
            <button type="button" class="sam-btn sam-btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="sam-btn sam-btn-success" data-action="confirm" id="btn-confirm-unlock">
              Unlock Server
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    activeModal = document.getElementById('sam-unlock-modal');
    
    activeModal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
    activeModal.querySelector('[data-action="confirm"]')?.addEventListener('click', async () => {
      try {
        await AdminUtils.api.post(API.unlock(server.id));
        AdminUtils?.showToast?.('Server unlocked successfully', 'success');
        closeModal();
        if (window.AdminServers?.fetchServers) AdminServers.fetchServers();
      } catch (error) {
        AdminUtils?.showToast?.('Failed to unlock server', 'danger');
      }
    });
    activeModal.addEventListener('click', (e) => { if (e.target === activeModal) closeModal(); });
    document.addEventListener('keydown', handleEscapeKey);
  }

  // ========================================
  // SUSPEND SERVER MODAL
  // ========================================

  function showSuspendModal(server) {
    if (!server) return;
    currentServer = server;
    
    const isSuspended = server.isSuspended || server.suspended || false;
    
    if (isSuspended) {
      showUnsuspendConfirmation(server);
      return;
    }
    
    const html = `
      <div class="sam-modal-backdrop" id="sam-suspend-modal">
        <div class="sam-modal">
          <div class="sam-modal-header danger">
            <div class="sam-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="10" y1="15" x2="10" y2="9"/>
                <line x1="14" y1="15" x2="14" y2="9"/>
              </svg>
            </div>
            <h3 class="sam-modal-title">Suspend Server</h3>
            <p class="sam-modal-subtitle">Temporarily disable server access</p>
          </div>
          
          <div class="sam-modal-body">
            <div class="sam-server-info">
              <div class="sam-server-avatar" style="background: ${getServerColor(server.id)}">
                ${server.iconUrl 
                  ? `<img src="${escapeHtml(server.iconUrl)}" alt="">`
                  : `<span>${getInitials(server.name)}</span>`
                }
              </div>
              <div class="sam-server-details">
                <h4 class="sam-server-name">${escapeHtml(server.name)}</h4>
                <p class="sam-server-meta">${formatNumber(server.memberCount || 0)} members</p>
              </div>
            </div>
            
            <div class="sam-warning-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Suspending a server will completely disable it. All members will be disconnected.</span>
            </div>
            
            <div class="sam-form-group">
              <label class="sam-label">Suspension Duration</label>
              <div class="sam-duration-grid">
                <label class="sam-radio-card">
                  <input type="radio" name="suspend-duration" value="24h">
                  <span class="sam-radio-card-content">
                    <span class="sam-radio-card-value">24</span>
                    <span class="sam-radio-card-unit">Hours</span>
                  </span>
                </label>
                <label class="sam-radio-card">
                  <input type="radio" name="suspend-duration" value="7d" checked>
                  <span class="sam-radio-card-content">
                    <span class="sam-radio-card-value">7</span>
                    <span class="sam-radio-card-unit">Days</span>
                  </span>
                </label>
                <label class="sam-radio-card">
                  <input type="radio" name="suspend-duration" value="custom">
                  <span class="sam-radio-card-content">
                    <span class="sam-radio-card-value">⚙</span>
                    <span class="sam-radio-card-unit">Custom</span>
                  </span>
                </label>
                <label class="sam-radio-card">
                  <input type="radio" name="suspend-duration" value="permanent">
                  <span class="sam-radio-card-content">
                    <span class="sam-radio-card-value">∞</span>
                    <span class="sam-radio-card-unit">Permanent</span>
                  </span>
                </label>
              </div>
              <div class="sam-custom-duration" id="suspend-custom-duration" style="display: none;">
                <input type="number" id="suspend-duration-value" min="1" value="1" class="sam-input sam-input-number">
                <select id="suspend-duration-unit" class="sam-select">
                  <option value="hours">Hours</option>
                  <option value="days" selected>Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
            
            <div class="sam-form-group">
              <label class="sam-label required">Reason for Suspension</label>
              <textarea 
                id="suspend-reason" 
                class="sam-textarea" 
                rows="3" 
                placeholder="Describe the violation or reason for suspension..."
                required
              ></textarea>
              <p class="sam-hint">This will be logged and visible to other admins.</p>
            </div>
          </div>
          
          <div class="sam-modal-footer">
            <button type="button" class="sam-btn sam-btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="sam-btn sam-btn-danger" data-action="confirm" id="btn-confirm-suspend" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="10" y1="15" x2="10" y2="9"/>
                <line x1="14" y1="15" x2="14" y2="9"/>
              </svg>
              Confirm Suspend
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    activeModal = document.getElementById('sam-suspend-modal');
    
    setupSuspendModalEvents();
    
    setTimeout(() => {
      document.getElementById('suspend-reason')?.focus();
    }, 100);
  }

  function setupSuspendModalEvents() {
    const modal = activeModal;
    if (!modal) return;
    
    const reasonInput = modal.querySelector('#suspend-reason');
    const confirmBtn = modal.querySelector('#btn-confirm-suspend');
    const durationRadios = modal.querySelectorAll('input[name="suspend-duration"]');
    const customDuration = modal.querySelector('#suspend-custom-duration');
    
    durationRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        customDuration.style.display = radio.value === 'custom' ? 'flex' : 'none';
        validateSuspendForm();
      });
    });
    
    reasonInput?.addEventListener('input', validateSuspendForm);
    modal.querySelector('#suspend-duration-value')?.addEventListener('input', validateSuspendForm);
    
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
    confirmBtn?.addEventListener('click', handleSuspendConfirm);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', handleEscapeKey);
  }

  function validateSuspendForm() {
    const modal = activeModal;
    if (!modal) return;
    
    const reason = modal.querySelector('#suspend-reason')?.value?.trim();
    const confirmBtn = modal.querySelector('#btn-confirm-suspend');
    const durationType = modal.querySelector('input[name="suspend-duration"]:checked')?.value;
    const durationValue = modal.querySelector('#suspend-duration-value')?.value;
    
    let isValid = reason && reason.length > 0;
    
    if (durationType === 'custom') {
      isValid = isValid && durationValue && parseInt(durationValue) > 0;
    }
    
    if (confirmBtn) {
      confirmBtn.disabled = !isValid;
    }
  }

  async function handleSuspendConfirm() {
    if (!currentServer) return;
    
    const modal = activeModal;
    const reason = modal.querySelector('#suspend-reason')?.value?.trim();
    const durationType = modal.querySelector('input[name="suspend-duration"]:checked')?.value;
    const durationValue = modal.querySelector('#suspend-duration-value')?.value;
    const durationUnit = modal.querySelector('#suspend-duration-unit')?.value;
    
    const confirmBtn = modal.querySelector('#btn-confirm-suspend');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="sam-spinner"></span> Suspending...';
    
    try {
      const payload = { reason };
      
      if (durationType === '24h') {
        payload.duration = 24;
        payload.durationUnit = 'hours';
      } else if (durationType === '7d') {
        payload.duration = 7;
        payload.durationUnit = 'days';
      } else if (durationType === 'custom') {
        payload.duration = parseInt(durationValue);
        payload.durationUnit = durationUnit;
      }
      // permanent = no duration
      
      await AdminUtils.api.post(API.suspend(currentServer.id), payload);
      AdminUtils?.showToast?.('Server suspended successfully', 'success');
      closeModal();
      
      if (window.AdminServers?.fetchServers) {
        AdminServers.fetchServers();
      }
    } catch (error) {
      console.error('[ServerActionModals] Failed to suspend server:', error);
      AdminUtils?.showToast?.('Failed to suspend server', 'danger');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="10" y1="15" x2="10" y2="9"/>
          <line x1="14" y1="15" x2="14" y2="9"/>
        </svg>
        Confirm Suspend
      `;
    }
  }

  function showUnsuspendConfirmation(server) {
    const html = `
      <div class="sam-modal-backdrop" id="sam-unsuspend-modal">
        <div class="sam-modal sam-modal-sm">
          <div class="sam-modal-header success">
            <div class="sam-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
            </div>
            <h3 class="sam-modal-title">Resume Server</h3>
            <p class="sam-modal-subtitle">Reactivate ${escapeHtml(server.name)}</p>
          </div>
          
          <div class="sam-modal-body">
            <p class="sam-info-text">This will restore the server to active status. All features will be re-enabled.</p>
          </div>
          
          <div class="sam-modal-footer">
            <button type="button" class="sam-btn sam-btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="sam-btn sam-btn-success" data-action="confirm" id="btn-confirm-unsuspend">
              Resume Server
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    activeModal = document.getElementById('sam-unsuspend-modal');
    
    activeModal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
    activeModal.querySelector('[data-action="confirm"]')?.addEventListener('click', async () => {
      try {
        await AdminUtils.api.post(API.unsuspend(server.id));
        AdminUtils?.showToast?.('Server resumed successfully', 'success');
        closeModal();
        if (window.AdminServers?.fetchServers) AdminServers.fetchServers();
      } catch (error) {
        AdminUtils?.showToast?.('Failed to resume server', 'danger');
      }
    });
    activeModal.addEventListener('click', (e) => { if (e.target === activeModal) closeModal(); });
    document.addEventListener('keydown', handleEscapeKey);
  }

  // ========================================
  // DELETE SERVER MODAL
  // ========================================

  function showDeleteModal(server) {
    if (!server) return;
    currentServer = server;
    
    const html = `
      <div class="sam-modal-backdrop" id="sam-delete-modal">
        <div class="sam-modal sam-modal-danger">
          <div class="sam-modal-header danger">
            <div class="sam-modal-icon danger-pulse">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 class="sam-modal-title">Delete Server Permanently</h3>
            <p class="sam-modal-subtitle">${escapeHtml(server.name)}</p>
          </div>
          
          <div class="sam-modal-body">
            <div class="sam-danger-alert">
              <div class="sam-danger-alert-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div class="sam-danger-alert-content">
                <h4>This action cannot be undone!</h4>
                <p>Once deleted, the server and all its data will be permanently removed.</p>
              </div>
            </div>
            
            <div class="sam-consequences">
              <h5 class="sam-consequences-title">What will be deleted:</h5>
              <ul class="sam-consequences-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Server permanently deleted
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  All channels, roles, and settings
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  All messages and media files
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  All ${formatNumber(server.memberCount || 0)} members will be disconnected
                </li>
              </ul>
            </div>
            
            <div class="sam-confirm-checkbox">
              <label class="sam-checkbox-label">
                <input type="checkbox" id="delete-confirm-checkbox">
                <span class="sam-checkbox-custom"></span>
                <span class="sam-checkbox-text">I understand this action cannot be undone</span>
              </label>
            </div>
          </div>
          
          <div class="sam-modal-footer">
            <button type="button" class="sam-btn sam-btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="sam-btn sam-btn-danger sam-btn-delete" data-action="confirm" id="btn-confirm-delete" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    activeModal = document.getElementById('sam-delete-modal');
    
    setupDeleteModalEvents();
  }

  function setupDeleteModalEvents() {
    const modal = activeModal;
    if (!modal) return;
    
    const checkbox = modal.querySelector('#delete-confirm-checkbox');
    const confirmBtn = modal.querySelector('#btn-confirm-delete');
    
    checkbox?.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
    });
    
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
    confirmBtn?.addEventListener('click', handleDeleteConfirm);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', handleEscapeKey);
  }

  async function handleDeleteConfirm() {
    if (!currentServer) return;
    
    const modal = activeModal;
    const confirmBtn = modal.querySelector('#btn-confirm-delete');
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="sam-spinner"></span> Deleting...';
    
    try {
      await AdminUtils.api.delete(API.deleteServer(currentServer.id));
      AdminUtils?.showToast?.('Server deleted successfully', 'success');
      closeModal();
      
      // Close detail modal if open
      if (window.ServerDetailModal) {
        ServerDetailModal.close();
      }
      
      if (window.AdminServers?.fetchServers) {
        AdminServers.fetchServers();
      }
    } catch (error) {
      console.error('[ServerActionModals] Failed to delete server:', error);
      AdminUtils?.showToast?.('Failed to delete server', 'danger');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete Permanently
      `;
    }
  }

  // ========================================
  // Common Functions
  // ========================================

  function closeModal() {
    if (activeModal) {
      activeModal.classList.add('closing');
      setTimeout(() => {
        activeModal?.remove();
        activeModal = null;
      }, 200);
    }
    document.removeEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = '';
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  // ========================================
  // Utility Functions
  // ========================================

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  function getServerColor(id) {
    const colors = [
      'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
    ];
    return colors[(id || 0) % colors.length];
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    showLockModal,
    showSuspendModal,
    showDeleteModal,
    closeModal
  };

})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ServerActionModals.init);
} else {
  ServerActionModals.init();
}
