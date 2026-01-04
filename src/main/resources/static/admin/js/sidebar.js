/**
 * CoCoCord Admin - Sidebar Manager
 * Handles sidebar navigation, tab switching, and mobile toggle
 */

var AdminSidebar = window.AdminSidebar || (function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================

  const CONFIG = {
    sidebarSelector: '.admin-sidebar',
    navItemSelector: '[data-admin-nav]',
    tabSelector: '.admin-sidebar-tab',
    toggleSelector: '[data-admin-sidebar-toggle]',
    activeClass: 'is-active',
    openClass: 'is-open'
  };

  // ========================================
  // Tab Switching
  // ========================================

  function initTabs() {
    const tabs = document.querySelectorAll(CONFIG.tabSelector);
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active to clicked tab
        this.classList.add('active');
        
        // Could filter nav items here based on tab
        const tabType = this.textContent.toLowerCase().trim();
        filterNavByTab(tabType);
      });
    });
  }

  function filterNavByTab(tabType) {
    // For now, just log the tab switch
    // In a full implementation, this would show/hide favorites vs recent items
    console.log(`[Sidebar] Tab switched to: ${tabType}`);
  }

  // ========================================
  // Navigation Active State
  // ========================================

  function setActiveNav(pageId) {
    const navItems = document.querySelectorAll(CONFIG.navItemSelector);
    
    navItems.forEach(item => {
      const itemPage = item.dataset.page;
      if (itemPage === pageId) {
        item.classList.add(CONFIG.activeClass);
      } else {
        item.classList.remove(CONFIG.activeClass);
      }
    });
  }

  function getActiveNav() {
    const activeItem = document.querySelector(`${CONFIG.navItemSelector}.${CONFIG.activeClass}`);
    return activeItem?.dataset.page || null;
  }

  // ========================================
  // Mobile Toggle
  // ========================================

  function initMobileToggle() {
    const toggle = document.querySelector(CONFIG.toggleSelector);
    const sidebar = document.querySelector(CONFIG.sidebarSelector);
    
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      sidebar.classList.toggle(CONFIG.openClass);
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth >= 1024) return;
      
      if (!sidebar.contains(e.target) && 
          !toggle.contains(e.target) &&
          sidebar.classList.contains(CONFIG.openClass)) {
        sidebar.classList.remove(CONFIG.openClass);
      }
    });

    // Close sidebar when navigation occurs
    document.addEventListener('admin:pageLoaded', function() {
      if (window.innerWidth < 1024) {
        sidebar.classList.remove(CONFIG.openClass);
      }
    });
  }

  // ========================================
  // Keyboard Navigation
  // ========================================

  function initKeyboardNav() {
    const sidebar = document.querySelector(CONFIG.sidebarSelector);
    if (!sidebar) return;

    sidebar.addEventListener('keydown', function(e) {
      const navItems = Array.from(document.querySelectorAll(CONFIG.navItemSelector));
      const currentIndex = navItems.findIndex(item => item === document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % navItems.length;
          navItems[nextIndex]?.focus();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
          navItems[nextIndex]?.focus();
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          navItems[currentIndex]?.click();
          break;
      }
    });
  }

  // ========================================
  // Collapse/Expand Sections
  // ========================================

  function initCollapsible() {
    const labels = document.querySelectorAll('.admin-nav-label');
    
    labels.forEach(label => {
      // Make labels clickable to collapse/expand
      label.style.cursor = 'pointer';
      
      label.addEventListener('click', function() {
        const section = this.closest('.admin-nav-section');
        const nav = section?.querySelector('.admin-nav');
        
        if (nav) {
          nav.classList.toggle('collapsed');
          this.classList.toggle('collapsed');
        }
      });
    });
  }

  // ========================================
  // Hover Effects
  // ========================================

  function initHoverEffects() {
    const navItems = document.querySelectorAll(CONFIG.navItemSelector);
    
    navItems.forEach(item => {
      item.addEventListener('mouseenter', function() {
        if (!this.classList.contains(CONFIG.activeClass)) {
          this.style.background = 'var(--admin-hover)';
        }
      });
      
      item.addEventListener('mouseleave', function() {
        if (!this.classList.contains(CONFIG.activeClass)) {
          this.style.background = '';
        }
      });
    });
  }

  // ========================================
  // Initialization
  // ========================================

  function init() {
    initTabs();
    initMobileToggle();
    initKeyboardNav();
    // initCollapsible(); // Enable if collapsible sections needed
    // initHoverEffects(); // CSS handles this now

    // Listen for page changes to update active state
    document.addEventListener('admin:pageLoaded', function(e) {
      setActiveNav(e.detail.pageId);
    });

    console.log('[AdminSidebar] Initialized');
  }

  // ========================================
  // Public API
  // ========================================

  return {
    init,
    setActiveNav,
    getActiveNav
  };

})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AdminSidebar.init);
} else {
  AdminSidebar.init();
}
