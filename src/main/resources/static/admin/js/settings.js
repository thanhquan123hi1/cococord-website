/**
 * CoCoCord Admin - Settings Page JavaScript
 * Handles settings navigation, form interactions, and save operations
 */

const AdminSettings = (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentSection = 'general';
  let unsavedChanges = false;

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminSettings] Initializing...');
    
    // Load initial settings
    loadSettings();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show first section
    showSection('general');
    
    console.log('[AdminSettings] Initialized');
  }

  // ========================================
  // Settings Loading
  // ========================================

  function loadSettings() {
    // Load from MockData or localStorage
    const settings = MockData.settings || getDefaultSettings();
    
    // Populate form fields
    Object.entries(settings).forEach(([key, value]) => {
      const input = document.querySelector(`[name="${key}"]`);
      if (!input) return;
      
      if (input.type === 'checkbox') {
        input.checked = value;
      } else {
        input.value = value;
      }
    });
  }

  function getDefaultSettings() {
    return {
      siteName: 'CoCoCord',
      siteDescription: 'Connect, Chat, Collaborate',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerification: true,
      maxServersPerUser: 100,
      maxMembersPerServer: 500000,
      defaultUserRole: 'user',
      sessionTimeout: 60,
      enableTwoFactor: false,
      passwordMinLength: 8,
      enableRateLimiting: true,
      maxRequestsPerMinute: 100,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      emailFromName: 'CoCoCord',
      emailFromAddress: 'noreply@cococord.com'
    };
  }

  // ========================================
  // Section Navigation
  // ========================================

  function showSection(sectionId) {
    currentSection = sectionId;
    
    // Update nav active state
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === sectionId) {
        item.classList.add('active');
      }
    });
    
    // Update section visibility
    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.remove('active');
      if (section.dataset.section === sectionId) {
        section.classList.add('active');
      }
    });
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Section navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        if (section) {
          showSection(section);
        }
      });
    });
    
    // Track form changes
    document.querySelectorAll('.settings-form input, .settings-form select, .settings-form textarea').forEach(input => {
      input.addEventListener('change', () => {
        unsavedChanges = true;
        updateSaveButton();
      });
      input.addEventListener('input', () => {
        unsavedChanges = true;
        updateSaveButton();
      });
    });
    
    // Save buttons
    document.querySelectorAll('[data-action="save-settings"]').forEach(btn => {
      btn.addEventListener('click', saveSettings);
    });
    
    // Reset buttons
    document.querySelectorAll('[data-action="reset-settings"]').forEach(btn => {
      btn.addEventListener('click', resetSettings);
    });
    
    // Test email button
    const testEmailBtn = document.getElementById('testEmailBtn');
    if (testEmailBtn) {
      testEmailBtn.addEventListener('click', testEmailConfiguration);
    }
    
    // Toggle switches
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const label = e.target.closest('.form-row')?.querySelector('.form-label')?.textContent;
        const state = e.target.checked ? 'enabled' : 'disabled';
        console.log(`[AdminSettings] ${label}: ${state}`);
      });
    });
    
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function updateSaveButton() {
    const saveBtn = document.querySelector('[data-action="save-settings"]');
    if (saveBtn) {
      if (unsavedChanges) {
        saveBtn.classList.add('has-changes');
      } else {
        saveBtn.classList.remove('has-changes');
      }
    }
  }

  // ========================================
  // Save & Reset
  // ========================================

  function saveSettings() {
    const saveBtn = document.querySelector('[data-action="save-settings"]');
    
    // Show loading state
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveBtn.disabled = true;
      
      // Simulate API call
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        unsavedChanges = false;
        updateSaveButton();
        
        AdminUtils?.showToast?.('Settings saved successfully', 'success');
      }, 1000);
    }
  }

  function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }
    
    // Load defaults
    const defaults = getDefaultSettings();
    
    // Populate form fields
    Object.entries(defaults).forEach(([key, value]) => {
      const input = document.querySelector(`[name="${key}"]`);
      if (!input) return;
      
      if (input.type === 'checkbox') {
        input.checked = value;
      } else {
        input.value = value;
      }
    });
    
    unsavedChanges = true;
    updateSaveButton();
    
    AdminUtils?.showToast?.('Settings reset to defaults', 'info');
  }

  function testEmailConfiguration() {
    const btn = document.getElementById('testEmailBtn');
    
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;
      
      // Simulate test email
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        AdminUtils?.showToast?.('Test email sent successfully', 'success');
      }, 2000);
    }
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    showSection,
    saveSettings,
    resetSettings,
    hasUnsavedChanges: () => unsavedChanges
  };

})();

// Expose to window for router
window.AdminSettings = AdminSettings;
