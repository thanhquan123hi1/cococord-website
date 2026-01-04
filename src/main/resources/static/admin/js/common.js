/**
 * CoCoCord Admin - Common JavaScript
 * Theme toggle, sidebar interactions, and utilities
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
    
    // Update icons visibility
    const sunIcon = document.querySelector('[data-admin-theme-toggle] .icon-sun');
    const moonIcon = document.querySelector('[data-admin-theme-toggle] .icon-moon');
    
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      }
    }
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
  // Utility Functions
  // ========================================

  // Format numbers with commas
  window.AdminUtils = {
    formatNumber: function(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    formatCompactNumber: function(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    },

    formatPercentage: function(value, decimals = 1) {
      return (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
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

    // Theme toggle button
    const themeToggle = document.querySelector('[data-admin-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize components
    initSidebar();
    initSearch();

    console.log('[Admin] UI initialized');
  });

})();
