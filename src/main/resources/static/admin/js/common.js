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
    },

    // WebSocket for admin realtime updates
    websocket: {
      stompClient: null,
      subscriptions: {},
      
      connect: function(onConnect) {
        if (this.stompClient && this.stompClient.connected) {
          if (onConnect) onConnect();
          return;
        }
        
        const socket = new SockJS('/ws');
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null; // Disable debug logs
        
        this.stompClient.connect({}, () => {
          console.log('[Admin WebSocket] Connected');
          if (onConnect) onConnect();
        }, (error) => {
          console.error('[Admin WebSocket] Connection error:', error);
          // Try to reconnect after 5 seconds
          setTimeout(() => this.connect(onConnect), 5000);
        });
      },
      
      subscribe: function(topic, callback) {
        if (!this.stompClient || !this.stompClient.connected) {
          this.connect(() => this.subscribe(topic, callback));
          return;
        }
        
        if (this.subscriptions[topic]) {
          this.subscriptions[topic].unsubscribe();
        }
        
        this.subscriptions[topic] = this.stompClient.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            callback(data);
          } catch (e) {
            console.error('[Admin WebSocket] Parse error:', e);
          }
        });
        
        console.log('[Admin WebSocket] Subscribed to', topic);
      },
      
      unsubscribe: function(topic) {
        if (this.subscriptions[topic]) {
          this.subscriptions[topic].unsubscribe();
          delete this.subscriptions[topic];
        }
      },
      
      disconnect: function() {
        if (this.stompClient) {
          Object.values(this.subscriptions).forEach(sub => sub.unsubscribe());
          this.subscriptions = {};
          this.stompClient.disconnect();
          this.stompClient = null;
        }
      }
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
    initAdminProfile();

    console.log('[Admin] UI initialized');
  });

  // ========================================
  // Admin Profile Dropdown
  // ========================================

  function initAdminProfile() {
    const profileTrigger = document.getElementById('adminProfileTrigger');
    const profileDropdown = document.getElementById('adminProfileDropdown');
    
    if (!profileTrigger || !profileDropdown) return;

    // Toggle dropdown
    profileTrigger.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = profileDropdown.style.display === 'block';
      
      if (isOpen) {
        profileDropdown.style.display = 'none';
        profileTrigger.classList.remove('active');
      } else {
        profileDropdown.style.display = 'block';
        profileTrigger.classList.add('active');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.style.display = 'none';
        profileTrigger.classList.remove('active');
      }
    });

    // Handle dropdown actions
    const dropdownItems = profileDropdown.querySelectorAll('[data-action]');
    dropdownItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const action = this.dataset.action;
        
        profileDropdown.style.display = 'none';
        profileTrigger.classList.remove('active');
        
        switch(action) {
          case 'profile':
            handleProfileClick();
            break;
          case 'change-password':
            handleChangePasswordClick();
            break;
          case 'logout':
            handleLogoutClick();
            break;
        }
      });
    });

    // Load admin info
    loadAdminProfile();
    
    // Setup account modal close handlers
    setupAccountModalHandlers();
  }

  function setupAccountModalHandlers() {
    const modal = document.getElementById('adminAccountModal');
    const overlay = document.getElementById('adminAccountModalOverlay');
    const closeBtn = document.getElementById('btnCloseAccountModal');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAdminAccountModal);
    }
    
    if (overlay) {
      overlay.addEventListener('click', closeAdminAccountModal);
    }
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        closeAdminAccountModal();
      }
    });
  }

  function loadAdminProfile() {
    // Use accessToken as per auth.js convention
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      console.warn('[Admin] No token found, using default profile');
      updateAdminProfileUI({
        displayName: 'Admin',
        username: 'admin',
        profilePicture: null
      });
      return;
    }

    console.log('[Admin] Token found, fetching profile...');

    // Fetch from API to get fresh data
    fetch('/api/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user info: ' + response.status);
      }
      return response.json();
    })
    .then(user => {
      console.log('[Admin] User profile loaded successfully');
      updateAdminProfileUI(user);
      // Cache for modal use
      window.currentAdminUser = user;
    })
    .catch(error => {
      console.error('[Admin] Error loading profile:', error);
      // Try localStorage as fallback
      const userStr = localStorage.getItem('cococord_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          updateAdminProfileUI(user);
          window.currentAdminUser = user;
          return;
        } catch (e) {}
      }
      // Use default values
      const defaultUser = {
        displayName: 'Admin',
        username: 'admin',
        profilePicture: null
      };
      updateAdminProfileUI(defaultUser);
      window.currentAdminUser = defaultUser;
    });
  }

  function updateAdminProfileUI(user) {
    const nameEl = document.getElementById('adminProfileName');
    const avatarEl = document.getElementById('adminProfileAvatar');
    
    if (nameEl) {
      nameEl.textContent = user.displayName || user.username || 'Admin';
    }
    
    if (avatarEl) {
      // Use avatarUrl field from API response
      const avatarUrl = user.avatarUrl || user.profilePicture;
      
      if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${user.displayName || 'Admin'}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        // Show initial letter
        const initial = (user.displayName || user.username || 'A').charAt(0).toUpperCase();
        avatarEl.innerHTML = `<span>${initial}</span>`;
        avatarEl.style.fontSize = '16px';
        avatarEl.style.fontWeight = '600';
      }
    }
  }

  function handleProfileClick() {
    openAdminAccountModal();
  }

  function openAdminAccountModal() {
    const modal = document.getElementById('adminAccountModal');
    const modalBody = document.getElementById('adminAccountModalBody');
    
    if (!modal || !modalBody) return;
    
    // Show modal with loading state
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalBody.innerHTML = `
      <div class="admin-account-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Đang tải thông tin...</p>
      </div>
    `;
    
    // Fetch fresh admin data
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      showAdminAccountError('Không tìm thấy phiên đăng nhập');
      return;
    }
    
    console.log('[Admin] Fetching account details...');
    
    fetch('/api/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch admin info');
      return response.json();
    })
    .then(user => {
      renderAdminAccountDetails(user);
    })
    .catch(error => {
      console.error('[Admin] Error loading account details:', error);
      // Try to use cached data
      if (window.currentAdminUser) {
        renderAdminAccountDetails(window.currentAdminUser);
      } else {
        showAdminAccountError('Không thể tải thông tin tài khoản');
      }
    });
  }

  function renderAdminAccountDetails(user) {
    const modalBody = document.getElementById('adminAccountModalBody');
    if (!modalBody) return;
    
    const displayName = user.displayName || user.username || 'Admin';
    const username = user.username || 'admin';
    const email = user.email || 'Chưa cập nhật';
    const createdAt = user.createdAt ? formatDateTime(user.createdAt) : 'Không rõ';
    const lastLogin = user.lastLogin ? formatDateTime(user.lastLogin) : 'Không rõ';
    
    // Avatar HTML - use avatarUrl field from API
    const avatarUrl = user.avatarUrl || user.profilePicture;
    let avatarHTML;
    
    if (avatarUrl) {
      avatarHTML = `<img src="${avatarUrl}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      const initial = displayName.charAt(0).toUpperCase();
      avatarHTML = initial;
    }
    
    modalBody.innerHTML = `
      <!-- Profile Header -->
      <div class="admin-account-profile">
        <div class="admin-account-profile-avatar">
          ${avatarHTML}
        </div>
        <div class="admin-account-profile-info">
          <div class="admin-account-profile-name">${escapeHtml(displayName)}</div>
          <div class="admin-account-profile-role">
            <i class="fas fa-shield-alt"></i>
            Quản trị viên
          </div>
        </div>
      </div>
      
      <!-- Account Details -->
      <div class="admin-account-info-grid">
        <div class="admin-account-info-item">
          <div class="admin-account-info-label">Tên đăng nhập</div>
          <div class="admin-account-info-value">
            <i class="fas fa-user"></i>
            ${escapeHtml(username)}
          </div>
        </div>
        
        <div class="admin-account-info-item">
          <div class="admin-account-info-label">Email</div>
          <div class="admin-account-info-value">
            <i class="fas fa-envelope"></i>
            ${escapeHtml(email)}
          </div>
        </div>
        
        <div class="admin-account-info-item">
          <div class="admin-account-info-label">Ngày tạo tài khoản</div>
          <div class="admin-account-info-value">
            <i class="fas fa-calendar-plus"></i>
            ${createdAt}
          </div>
        </div>
        
        <div class="admin-account-info-item">
          <div class="admin-account-info-label">Lần đăng nhập gần nhất</div>
          <div class="admin-account-info-value">
            <i class="fas fa-clock"></i>
            ${lastLogin}
          </div>
        </div>
      </div>
    `;
  }

  function showAdminAccountError(message) {
    const modalBody = document.getElementById('adminAccountModalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
      <div class="admin-account-loading">
        <i class="fas fa-exclamation-circle" style="color: var(--admin-danger);"></i>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function closeAdminAccountModal() {
    const modal = document.getElementById('adminAccountModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return 'Không rõ';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Không rõ';
    }
  }

  function handleChangePasswordClick() {
    // Show toast for now - can implement modal later
    if (window.AdminUtils && window.AdminUtils.showToast) {
      AdminUtils.showToast('Tính năng đang phát triển', 'info');
    } else {
      alert('Tính năng Đổi mật khẩu đang được phát triển');
    }
  }

  function handleLogoutClick() {
    // Use existing logout functionality
    logout();
  }

})();
