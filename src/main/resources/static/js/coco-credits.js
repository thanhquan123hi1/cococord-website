/**
 * CoCo Credits System
 * Displays credits balance in header on app-home page
 * Integrates with Nitro, Shop, and Quests views
 */

(function () {
  "use strict";

  const CocoCredits = {
    balance: 0,
    initialized: false,
    boundClickHandler: null,

    init: async function () {
      // Only initialize on app-home page (check for cococordHome element)
      const appHome = document.getElementById("cococordHome");
      if (!appHome) {
        return;
      }

      // Always re-attach event listeners when init is called
      // This handles SPA navigation where elements may be re-rendered
      this.attachEventListeners();

      if (!this.initialized) {
        await this.loadBalance();
        this.initialized = true;
        console.log("CocoCredits initialized with balance:", this.balance);
      }

      this.updateHeaderDisplay();
    },

    // Force re-initialization (called when navigating back to app-home)
    reinit: async function () {
      const appHome = document.getElementById("cococordHome");
      if (!appHome) {
        return;
      }

      this.attachEventListeners();
      await this.loadBalance();
      this.updateHeaderDisplay();
    },

    loadBalance: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/credits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.balance = data.balance || 0;
        }
      } catch (error) {
        console.error("CocoCredits: Failed to load balance", error);
      }
    },

    formatCredits: function (amount) {
      if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + "M";
      } else if (amount >= 1000) {
        return (amount / 1000).toFixed(1) + "K";
      }
      return Math.floor(amount).toLocaleString();
    },

    updateHeaderDisplay: function () {
      const amountEl = document.getElementById("headerCreditsAmount");
      if (amountEl) {
        amountEl.textContent = this.formatCredits(this.balance);
      }
    },

    attachEventListeners: function () {
      // Header credits badge click - use bound handler to allow removal
      const headerBadge = document.getElementById("cocoCreditsHeader");
      if (headerBadge) {
        // Remove old listener if exists
        if (this.boundClickHandler) {
          headerBadge.removeEventListener("click", this.boundClickHandler);
        }
        // Create and store bound handler
        this.boundClickHandler = () => this.openCreditsDropdown();
        headerBadge.addEventListener("click", this.boundClickHandler);
      }

      // Only attach document-level listeners once
      if (!this._documentListenersAttached) {
        // Listen for credit updates from other modules
        document.addEventListener("cocoCredits:updated", (e) => {
          this.balance = e.detail.balance;
          this.updateHeaderDisplay();
          this.animateUpdate();
        });

        // Listen for purchases
        document.addEventListener("cocoCredits:spent", (e) => {
          this.balance -= e.detail.amount;
          this.updateHeaderDisplay();
          this.animateUpdate();
        });

        // Listen for earnings
        document.addEventListener("cocoCredits:earned", (e) => {
          this.balance += e.detail.amount;
          this.updateHeaderDisplay();
          this.animateUpdate();

          // Show toast notification
          if (window.Toast) {
            window.Toast.success(
              `+${e.detail.amount} CoCo Credits`,
              e.detail.description || "Bạn vừa nhận được credits!"
            );
          }
        });

        this._documentListenersAttached = true;
      }
    },

    animateUpdate: function () {
      const amountEl = document.getElementById("headerCreditsAmount");
      if (amountEl) {
        amountEl.classList.add("updating");
        setTimeout(() => amountEl.classList.remove("updating"), 300);
      }
    },

    openCreditsDropdown: function () {
      // Remove existing dropdown
      const existing = document.getElementById("cocoCreditsDropdown");
      if (existing) {
        existing.remove();
        return;
      }

      const headerBadge = document.getElementById("cocoCreditsHeader");
      if (!headerBadge) return;

      const rect = headerBadge.getBoundingClientRect();

      const dropdown = document.createElement("div");
      dropdown.id = "cocoCreditsDropdown";
      dropdown.className = "coco-credits-dropdown";
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <div class="balance-display">
            <i class="bi bi-coin"></i>
            <div class="balance-info">
              <span class="balance-label">Số dư CoCo Credits</span>
              <span class="balance-value">${this.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-items">
          <button class="dropdown-item" data-action="nitro">
            <i class="bi bi-lightning-charge-fill"></i>
            <span>Xem Nitro</span>
          </button>
          <button class="dropdown-item" data-action="shop">
            <i class="bi bi-bag-fill"></i>
            <span>Mở Cửa hàng</span>
          </button>
          <button class="dropdown-item" data-action="quests">
            <i class="bi bi-compass-fill"></i>
            <span>Xem Nhiệm vụ</span>
          </button>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-footer">
          <button class="dropdown-item small" data-action="history">
            <i class="bi bi-clock-history"></i>
            <span>Lịch sử giao dịch</span>
          </button>
        </div>
      `;

      // Position dropdown below the badge
      dropdown.style.position = "fixed";
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;

      document.body.appendChild(dropdown);

      // Attach event listeners to dropdown items
      dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
        item.addEventListener("click", () => {
          const action = item.dataset.action;
          this.handleDropdownAction(action);
          dropdown.remove();
        });
      });

      // Close on outside click
      const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && !headerBadge.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener("click", closeHandler);
        }
      };
      setTimeout(() => document.addEventListener("click", closeHandler), 0);
    },

    handleDropdownAction: function (action) {
      switch (action) {
        case "nitro":
          this.switchToView("nitro");
          break;
        case "shop":
          this.switchToView("shop");
          break;
        case "quests":
          this.switchToView("quests");
          break;
        case "history":
          this.openTransactionHistory();
          break;
      }
    },

    switchToView: function (viewName) {
      // Find and click the nav item for this view
      const navItem = document.querySelector(
        `.sidebar-nav .nav-item[data-view="${viewName}"]`
      );
      if (navItem) {
        navItem.click();
      }
    },

    openTransactionHistory: function () {
      // TODO: Open transaction history modal
      console.log("Opening transaction history...");
      if (window.Toast) {
        window.Toast.info("Lịch sử giao dịch", "Tính năng đang phát triển");
      }
    },

    // Public API
    getBalance: function () {
      return this.balance;
    },

    refresh: async function () {
      await this.loadBalance();
      this.updateHeaderDisplay();
    },

    // Spend credits (called by shop)
    spend: function (amount, description) {
      if (this.balance < amount) {
        return false;
      }
      document.dispatchEvent(
        new CustomEvent("cocoCredits:spent", {
          detail: { amount, description },
        })
      );
      return true;
    },

    // Earn credits (called by missions)
    earn: function (amount, description) {
      document.dispatchEvent(
        new CustomEvent("cocoCredits:earned", {
          detail: { amount, description },
        })
      );
    },
  };

  // Add dropdown CSS dynamically
  const style = document.createElement("style");
  style.textContent = `
    .coco-credits-dropdown {
      background: #1e1f22;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      min-width: 220px;
      z-index: 1000;
      overflow: hidden;
    }

    .coco-credits-dropdown .dropdown-header {
      padding: 12px;
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
    }

    .coco-credits-dropdown .balance-display {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .coco-credits-dropdown .balance-display i {
      font-size: 24px;
      color: #ffc107;
    }

    .coco-credits-dropdown .balance-info {
      display: flex;
      flex-direction: column;
    }

    .coco-credits-dropdown .balance-label {
      font-size: 11px;
      color: #b5bac1;
      text-transform: uppercase;
    }

    .coco-credits-dropdown .balance-value {
      font-size: 18px;
      font-weight: 700;
      color: #ffd54f;
    }

    .coco-credits-dropdown .dropdown-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
    }

    .coco-credits-dropdown .dropdown-items,
    .coco-credits-dropdown .dropdown-footer {
      padding: 6px;
    }

    .coco-credits-dropdown .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: transparent;
      color: #dcddde;
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .coco-credits-dropdown .dropdown-item:hover {
      background: rgba(88, 101, 242, 0.3);
      color: #fff;
    }

    .coco-credits-dropdown .dropdown-item i {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .coco-credits-dropdown .dropdown-item.small {
      padding: 8px 12px;
      font-size: 13px;
      color: #b5bac1;
    }

    .coco-credits-dropdown .dropdown-item.small:hover {
      color: #fff;
    }
  `;
  document.head.appendChild(style);

  // Initialize on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    CocoCredits.init();
  });

  // Re-initialize on PJAX navigation (if used)
  document.addEventListener("pjax:complete", () => {
    CocoCredits.reinit();
  });

  // Re-initialize when navigating back to app-home (custom event)
  document.addEventListener("appHome:loaded", () => {
    CocoCredits.reinit();
  });

  // Hook into forceInitAppHome if it exists
  const originalForceInit = window.forceInitAppHome;
  window.forceInitAppHome = function () {
    if (typeof originalForceInit === "function") {
      originalForceInit();
    }
    // Re-init CocoCredits after app-home init
    setTimeout(() => CocoCredits.reinit(), 0);
  };

  // Expose globally
  window.CocoCredits = CocoCredits;
})();
