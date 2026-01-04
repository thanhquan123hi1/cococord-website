/**
 * CoCoCord Admin - Common JavaScript
 * Theme toggle, sidebar interactions, API utilities, and shared functions
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cococord_admin_theme';

  // ========================================
  // Theme Management
  // ========================================

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Storage not available
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Update icons visibility - handle all theme toggle buttons in case of multiple
    const themeToggles = document.querySelectorAll('[data-admin-theme-toggle]');
    
    themeToggles.forEach(toggle => {
      const sunIcon = toggle.querySelector('.icon-sun');
      const moonIcon = toggle.querySelector('.icon-moon');
      
      if (sunIcon && moonIcon) {
        if (theme === 'dark') {
          sunIcon.classList.add('hidden');
          moonIcon.classList.remove('hidden');
        } else {
          sunIcon.classList.remove('hidden');
          moonIcon.classList.add('hidden');
        }
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  }

  // ========================================
  // Sidebar Management
  // ========================================

  function initSidebar() {
    // Tab switching
    const tabs = document.querySelectorAll('.admin-sidebar-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('[data-admin-sidebar-toggle]');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('is-open');
      });
    }
  }

  // ========================================
  // Search Functionality
  // ========================================

  function initSearch() {
    const searchInput = document.querySelector('.admin-search input');
    
    if (searchInput) {
      // Focus on "/" key press
      document.addEventListener('keydown', function(e) {
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        
        // Close search on Escape
        if (e.key === 'Escape' && document.activeElement === searchInput) {
          searchInput.blur();
          searchInput.value = '';
        }
      });
    }
  }

  // ========================================
  // Logout
  // ========================================

  function initLogout() {
    const logoutButtons = document.querySelectorAll('[data-admin-logout]');
    if (!logoutButtons.length) return;

    logoutButtons.forEach(btn => {
      btn.addEventListener('click', async function () {
        // Prefer the shared auth.js logout() if present
        if (typeof window.logout === 'function') {
          window.logout();
          return;
        }

        // Fallback: best-effort revoke refresh token, then clear client state
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
          }
        } catch (_) {
          // ignore
        }

        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } finally {
          window.location.href = '/login';
        }
      });
    });
  }

  // ========================================
  // API Client
  // ========================================

  async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken') || getTokenFromCookie();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    
    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(endpoint, config);
      
      if (response.status === 401) {
        // Token expired, try refresh
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry with new token
          config.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(endpoint, config);
          return handleResponse(retryResponse);
        } else {
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }
      
      return handleResponse(response);
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }

  async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }
    
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  function getTokenFromCookie() {
    const match = document.cookie.match(/accessToken=([^;]+)/);
    return match ? match[1] : null;
  }

  async function tryRefreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        return true;
      }
    } catch (_) {}
    
    return false;
  }

  // ========================================
  // Utility Functions
  // ========================================

  window.AdminUtils = {
    formatNumber: function(num) {
      if (num == null) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    formatCompactNumber: function(num) {
      if (num == null) return '0';
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    },

    formatPercentage: function(value, decimals = 1) {
      if (value == null) return '+0%';
      return (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
    },

    formatDate: function(dateStr, options = {}) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      const { year, ...restOptions } = options;
      return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: year ? 'numeric' : undefined,
        ...restOptions
      });
    },

    formatDateTime: function(dateStr) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    timeAgo: function(dateStr) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
      if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
      return this.formatDate(dateStr, { year: true });
    },

    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    showToast: function(message, type = 'info', duration = 3000) {
      // Create toast container if not exists
      let container = document.querySelector('.admin-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'admin-toast-container';
        document.body.appendChild(container);
      }
      
      const toast = document.createElement('div');
      toast.className = `admin-toast admin-toast-${type}`;
      
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      };
      
      toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
      `;
      
      container.appendChild(toast);
      
      // Animate in
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
      
      // Remove after duration
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    showConfirm: function(message, onConfirm) {
      if (confirm(message)) {
        onConfirm();
      }
    },

    getInitials: function(name) {
      if (!name) return '??';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    },

    // API methods
    api: {
      get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
      post: (endpoint, data) => apiRequest(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      put: (endpoint, data) => apiRequest(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
    }
  };

  // ========================================
  // Initialization
  // ========================================

  document.addEventListener('DOMContentLoaded', function() {
    // Apply stored theme
    const storedTheme = getStoredTheme();
    if (storedTheme === 'dark' || storedTheme === 'light') {
      applyTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Theme toggle button - attach to all theme toggles in case of multiple
    const themeToggles = document.querySelectorAll('[data-admin-theme-toggle]');
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', toggleTheme);
    });

    // Initialize components
    initSidebar();
    initSearch();
    initLogout();

    console.log('[Admin] UI initialized');
  });

})();
