/**
 * CoCoCord Admin - SPA-like Router
 * Handles fragment loading and URL management
 * NO page reloads - only main content changes
 */

const AdminRouter = (function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  
  const CONFIG = {
    contentSelector: '#admin-content',
    navSelector: '[data-admin-nav]',
    activeClass: 'is-active',
    loadingClass: 'is-loading',
    fragmentBasePath: '/admin/fragment/',
    defaultPage: 'dashboard'
  };

  // Page registry - maps page IDs to fragment paths and JS modules
  const PAGES = {
    'dashboard': {
      fragment: 'dashboard',
      title: 'Overview',
      breadcrumb: ['Dashboards', 'Overview']
    },
    'users': {
      fragment: 'users',
      title: 'Users',
      breadcrumb: ['Pages', 'Users']
    },
    'servers': {
      fragment: 'servers',
      title: 'Servers',
      breadcrumb: ['Pages', 'Servers']
    },
    'reports': {
      fragment: 'reports',
      title: 'Reports',
      breadcrumb: ['Pages', 'Reports']
    },
    'messages': {
      fragment: 'messages',
      title: 'Messages Moderation',
      breadcrumb: ['Pages', 'Messages']
    },
    'roles': {
      fragment: 'roles',
      title: 'Roles & Permissions',
      breadcrumb: ['Pages', 'Roles']
    },
    'stats': {
      fragment: 'stats',
      title: 'Statistics',
      breadcrumb: ['Pages', 'Stats']
    },
    'audit': {
      fragment: 'audit',
      title: 'Audit Log',
      breadcrumb: ['Pages', 'Audit']
    },
    'settings': {
      fragment: 'settings',
      title: 'Settings',
      breadcrumb: ['Pages', 'Settings']
    }
  };

  // State
  let currentPage = null;
  let isLoading = false;

  // ========================================
  // DOM Elements
  // ========================================

  function getContentContainer() {
    return document.querySelector(CONFIG.contentSelector);
  }

  function getBreadcrumbContainer() {
    return document.querySelector('.admin-crumbs');
  }

  // ========================================
  // Skeleton Loading
  // ========================================

  function showSkeleton() {
    const container = getContentContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="admin-skeleton-loading">
        <div class="skeleton-row">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
        <div class="skeleton-panel"></div>
        <div class="skeleton-table">
          <div class="skeleton-row-item"></div>
          <div class="skeleton-row-item"></div>
          <div class="skeleton-row-item"></div>
          <div class="skeleton-row-item"></div>
          <div class="skeleton-row-item"></div>
        </div>
      </div>
    `;
    container.classList.add(CONFIG.loadingClass);
  }

  function hideSkeleton() {
    const container = getContentContainer();
    if (container) {
      container.classList.remove(CONFIG.loadingClass);
    }
  }

  // ========================================
  // Fragment Loading
  // ========================================

  async function loadFragment(pageId) {
    const pageConfig = PAGES[pageId];
    if (!pageConfig) {
      console.error(`[Router] Unknown page: ${pageId}`);
      return false;
    }

    if (isLoading) {
      console.warn('[Router] Already loading, ignoring request');
      return false;
    }

    isLoading = true;
    showSkeleton();

    try {
      // Construct fragment URL
      const fragmentUrl = `${CONFIG.fragmentBasePath}${pageConfig.fragment}`;
      
      const response = await fetch(fragmentUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Inject HTML into content container
      const container = getContentContainer();
      if (container) {
        container.innerHTML = html;
        
        // Execute inline scripts if any
        executeInlineScripts(container);
        
        // Initialize page-specific JS
        initPageModule(pageId);
      }

      // Update breadcrumb
      updateBreadcrumb(pageConfig.breadcrumb);

      // Update document title
      document.title = `${pageConfig.title} - CoCoCord Admin`;

      currentPage = pageId;
      isLoading = false;
      hideSkeleton();

      // Dispatch custom event for page loaded
      document.dispatchEvent(new CustomEvent('admin:pageLoaded', {
        detail: { pageId, config: pageConfig }
      }));

      return true;

    } catch (error) {
      console.error(`[Router] Failed to load fragment: ${pageId}`, error);
      isLoading = false;
      showError(`Failed to load page: ${pageConfig.title}`);
      return false;
    }
  }

  function executeInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      script.parentNode.replaceChild(newScript, script);
    });
  }

  function initPageModule(pageId) {
    // Map page IDs to their initialization functions
    const initFunctions = {
      'dashboard': () => window.AdminDashboard?.init?.(),
      'users': () => window.AdminUsers?.init?.(),
      'servers': () => window.AdminServers?.init?.(),
      'reports': () => window.AdminReports?.init?.(),
      'messages': () => window.AdminMessages?.init?.(),
      'roles': () => window.AdminRoles?.init?.(),
      'stats': () => window.AdminStats?.init?.(),
      'audit': () => window.AdminAudit?.init?.(),
      'settings': () => window.AdminSettings?.init?.()
    };

    const initFn = initFunctions[pageId];
    if (initFn) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        try {
          initFn();
        } catch (e) {
          console.warn(`[Router] Failed to init module for ${pageId}:`, e);
        }
      });
    }
  }

  // ========================================
  // Breadcrumb Management
  // ========================================

  function updateBreadcrumb(crumbs) {
    const container = getBreadcrumbContainer();
    if (!container || !crumbs || crumbs.length === 0) return;

    let html = '';
    crumbs.forEach((crumb, index) => {
      if (index > 0) {
        html += '<span class="separator">/</span>';
      }
      if (index === crumbs.length - 1) {
        html += `<span class="current">${crumb}</span>`;
      } else {
        html += `<a href="#">${crumb}</a>`;
      }
    });

    container.innerHTML = html;
  }

  // ========================================
  // Error Handling
  // ========================================

  function showError(message) {
    const container = getContentContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="admin-error-state">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
        </div>
        <h3>Error Loading Page</h3>
        <p>${message}</p>
        <button class="admin-btn admin-btn-primary" onclick="AdminRouter.reload()">
          Try Again
        </button>
      </div>
    `;
  }

  // ========================================
  // URL / History Management
  // ========================================

  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '');
    return hash || CONFIG.defaultPage;
  }

  function updateUrl(pageId) {
    const newUrl = pageId === CONFIG.defaultPage 
      ? window.location.pathname 
      : `${window.location.pathname}#${pageId}`;
    
    history.pushState({ page: pageId }, '', newUrl);
  }

  function handlePopState(event) {
    const pageId = event.state?.page || getPageFromHash();
    navigateTo(pageId, false); // Don't update URL on popstate
  }

  // ========================================
  // Navigation
  // ========================================

  async function navigateTo(pageId, updateHistory = true) {
    // Validate page exists
    if (!PAGES[pageId]) {
      console.warn(`[Router] Page not found: ${pageId}, redirecting to default`);
      pageId = CONFIG.defaultPage;
    }

    // Don't reload if already on page
    if (pageId === currentPage && !isLoading) {
      return;
    }

    // Update sidebar active state
    updateSidebarActive(pageId);

    // Load the fragment
    const success = await loadFragment(pageId);

    // Update URL if navigation successful
    if (success && updateHistory) {
      updateUrl(pageId);
    }
  }

  function updateSidebarActive(pageId) {
    // Remove active from all nav items
    document.querySelectorAll(CONFIG.navSelector).forEach(nav => {
      nav.classList.remove(CONFIG.activeClass);
    });

    // Add active to current page nav
    const activeNav = document.querySelector(`[data-admin-nav][data-page="${pageId}"]`);
    if (activeNav) {
      activeNav.classList.add(CONFIG.activeClass);
    }
  }

  // ========================================
  // Click Handler
  // ========================================

  function handleNavClick(event) {
    const navItem = event.target.closest(CONFIG.navSelector);
    if (!navItem) return;

    event.preventDefault();
    
    const pageId = navItem.dataset.page;
    if (pageId) {
      navigateTo(pageId);
    }
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    // Attach click handler for navigation
    document.addEventListener('click', handleNavClick);

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);

    // Load initial page from URL hash or default
    const initialPage = getPageFromHash();
    
    // Initial navigation
    navigateTo(initialPage, false);

    console.log('[AdminRouter] Initialized');
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    navigateTo,
    reload: () => loadFragment(currentPage),
    getCurrentPage: () => currentPage,
    getPages: () => Object.keys(PAGES),
    
    // For external use
    showSkeleton,
    hideSkeleton,
    showError
  };

})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AdminRouter.init);
} else {
  AdminRouter.init();
}
