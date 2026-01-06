/**
 * Nitro Modal
 * Subscribe to CoCo Nitro tiers
 */

(function () {
  "use strict";

  const NitroModal = {
    tiers: [],
    currentSubscription: null,
    selectedTier: null,
    subscriptionType: "MONTHLY",
    isOpen: false,

    icons: {
      check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
      close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
      nitro: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.98966977,9.35789159 C2.98966977,9.77582472 2.63442946,10.1240466 2.20807287,10.1240466 L1.78171628,10.1240466 C1.35535969,10.1240466 0.999929883,9.77582472 0.999929883,9.35789159 L0.999929883,6.62332333 C0.999929883,6.20539019 1.35535969,5.85716827 1.78171628,5.85716827 L2.20807287,5.85716827 C2.63442946,5.85716827 2.98966977,6.20539019 2.98966977,6.62332333 L2.98966977,9.35789159 Z M23.0000701,9.35789159 L23.0000701,6.62332333 C23.0000701,6.20539019 22.6446403,5.85716827 22.2182837,5.85716827 L21.7919271,5.85716827 C21.3655705,5.85716827 21.0101407,6.20539019 21.0101407,6.62332333 L21.0101407,9.35789159 C21.0101407,9.77582472 21.3655705,10.1240466 21.7919271,10.1240466 L22.2182837,10.1240466 C22.6446403,10.1240466 23.0000701,9.77582472 23.0000701,9.35789159 Z M12.0000701,3 C17.523,3 21.9998,5.37145846 21.9998,8.25 L21.9998,9.75 C21.9998,12.6285415 17.523,15 12.0000701,15 C6.47707008,15 1.99997008,12.6285415 1.99997008,9.75 L1.99997008,8.25 C1.99997008,5.37145846 6.47707008,3 12.0000701,3 Z"/></svg>`,
    },

    init: async function () {
      await this.loadTiers();
      await this.loadCurrentSubscription();
    },

    loadTiers: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/nitro/tiers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          this.tiers = await response.json();
        }
      } catch (error) {
        console.error("NitroModal: Failed to load tiers", error);
      }
    },

    loadCurrentSubscription: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/nitro/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok && response.status !== 204) {
          this.currentSubscription = await response.json();
        }
      } catch (error) {
        console.error("NitroModal: Failed to load subscription", error);
      }
    },

    open: async function () {
      if (this.isOpen) return;

      await this.loadTiers();
      await this.loadCurrentSubscription();

      this.isOpen = true;
      this.render();
    },

    close: function () {
      const modal = document.getElementById("nitroModal");
      if (modal) {
        modal.remove();
      }
      this.isOpen = false;
      this.selectedTier = null;
    },

    render: function () {
      // Remove existing modal
      const existing = document.getElementById("nitroModal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "nitroModal";
      modal.className = "nitro-modal-overlay";
      modal.innerHTML = `
        <div class="nitro-modal">
          <button class="nitro-modal-close" id="nitroModalClose">${
            this.icons.close
          }</button>
          
          <div class="nitro-modal-header">
            <div class="nitro-logo">${this.icons.nitro}</div>
            <h2>CoCo Nitro</h2>
            <p>Nâng cấp trải nghiệm CoCoCord của bạn</p>
          </div>

          ${this.currentSubscription ? this.renderCurrentSubscription() : ""}

          <div class="nitro-billing-toggle">
            <button class="billing-option ${
              this.subscriptionType === "MONTHLY" ? "active" : ""
            }" data-type="MONTHLY">
              Hàng tháng
            </button>
            <button class="billing-option ${
              this.subscriptionType === "YEARLY" ? "active" : ""
            }" data-type="YEARLY">
              Hàng năm <span class="save-badge">Tiết kiệm 17%</span>
            </button>
          </div>

          <div class="nitro-tiers-grid">
            ${this.tiers.map((tier) => this.renderTierCard(tier)).join("")}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.attachModalEvents();
    },

    renderCurrentSubscription: function () {
      const sub = this.currentSubscription;
      return `
        <div class="current-subscription-banner">
          <div class="sub-info">
            <span class="sub-tier-name">${sub.tier.name}</span>
            <span class="sub-expiry">Hết hạn: ${new Date(
              sub.endDate
            ).toLocaleDateString("vi-VN")}</span>
          </div>
          <span class="sub-status ${sub.isActive ? "active" : "inactive"}">
            ${sub.isActive ? "Đang hoạt động" : "Đã hết hạn"}
          </span>
        </div>
      `;
    },

    renderTierCard: function (tier) {
      const price =
        this.subscriptionType === "MONTHLY"
          ? tier.monthlyPrice
          : tier.yearlyPrice;
      const perMonth =
        this.subscriptionType === "YEARLY"
          ? (tier.yearlyPrice / 12).toFixed(2)
          : tier.monthlyPrice;
      const isCurrentTier = this.currentSubscription?.tier?.id === tier.id;
      const features = tier.features || [];

      return `
        <div class="nitro-tier-card ${isCurrentTier ? "current" : ""} ${
        this.selectedTier?.id === tier.id ? "selected" : ""
      }" 
             data-tier-id="${tier.id}">
          <div class="tier-header tier-${tier.code.toLowerCase()}">
            <h3>${tier.name}</h3>
            <p class="tier-desc">${tier.description || ""}</p>
          </div>
          <div class="tier-price">
            <span class="price-amount">${price}</span>
            <span class="price-currency">CoCo Credits</span>
            <span class="price-period">/${
              this.subscriptionType === "MONTHLY" ? "tháng" : "năm"
            }</span>
            ${
              this.subscriptionType === "YEARLY"
                ? `<span class="price-monthly">(~${perMonth}/tháng)</span>`
                : ""
            }
          </div>
          <div class="tier-features">
            ${features
              .map(
                (f) =>
                  `<div class="feature-item">${this.icons.check} ${f}</div>`
              )
              .join("")}
          </div>
          <button class="tier-subscribe-btn ${
            isCurrentTier ? "current" : ""
          }" ${isCurrentTier ? "disabled" : ""}>
            ${isCurrentTier ? "Gói hiện tại" : "Đăng ký"}
          </button>
        </div>
      `;
    },

    attachModalEvents: function () {
      const modal = document.getElementById("nitroModal");
      if (!modal) return;

      // Close button
      modal
        .querySelector("#nitroModalClose")
        ?.addEventListener("click", () => this.close());

      // Close on overlay click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.close();
      });

      // Billing toggle
      modal.querySelectorAll(".billing-option").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.subscriptionType = btn.dataset.type;
          this.render();
        });
      });

      // Tier selection
      modal.querySelectorAll(".nitro-tier-card").forEach((card) => {
        card.addEventListener("click", () => {
          const tierId = parseInt(card.dataset.tierId);
          this.selectedTier = this.tiers.find((t) => t.id === tierId);
          this.render();
        });
      });

      // Subscribe buttons
      modal
        .querySelectorAll(".tier-subscribe-btn:not(.current)")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const card = btn.closest(".nitro-tier-card");
            const tierId = parseInt(card.dataset.tierId);
            this.subscribe(tierId);
          });
        });

      // ESC to close
      document.addEventListener("keydown", this.handleEsc);
    },

    handleEsc: function (e) {
      if (e.key === "Escape") {
        NitroModal.close();
        document.removeEventListener("keydown", NitroModal.handleEsc);
      }
    },

    subscribe: async function (tierId) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/nitro/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tierId: tierId,
            subscriptionType: this.subscriptionType,
            autoRenew: false,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          this.currentSubscription = result;

          if (window.Toast) {
            window.Toast.success(
              "Đăng ký Nitro thành công!",
              `Bạn đã đăng ký ${result.tier.name}`
            );
          }

          // Refresh credits display
          if (window.CocoCredits) {
            window.CocoCredits.refresh();
          }

          this.render();
        } else {
          const error = await response.json();
          if (window.Toast) {
            window.Toast.error(
              "Đăng ký thất bại",
              error.message || "Không đủ CoCo Credits"
            );
          }
        }
      } catch (error) {
        console.error("NitroModal: Subscribe failed", error);
        if (window.Toast) {
          window.Toast.error("Lỗi", "Không thể đăng ký Nitro");
        }
      }
    },
  };

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    NitroModal.init();
  });

  window.NitroModal = NitroModal;
})();
