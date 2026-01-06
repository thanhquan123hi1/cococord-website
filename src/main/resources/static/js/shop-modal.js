/**
 * Shop Modal
 * Browse and purchase items from the CoCo Shop
 */

(function () {
  "use strict";

  const ShopModal = {
    items: [],
    inventory: [],
    categories: [
      { id: "AVATAR_BORDER", name: "Viền Avatar", icon: "👤" },
      { id: "MESSAGE_EFFECT", name: "Hiệu ứng tin nhắn", icon: "✨" },
      { id: "CHAT_BUBBLE", name: "Bong bóng chat", icon: "💬" },
      { id: "NAME_COLOR", name: "Màu tên", icon: "🎨" },
      { id: "USER_FRAME", name: "Khung hồ sơ", icon: "🖼️" },
      { id: "USER_PANEL_THEME", name: "Theme panel", icon: "🎭" },
      { id: "PROFILE_BADGE", name: "Huy hiệu", icon: "🏆" },
    ],
    activeCategory: "AVATAR_BORDER",
    isOpen: false,
    viewMode: "shop", // 'shop' or 'inventory'

    icons: {
      close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
      cart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.49 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
      check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
      equip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    },

    init: async function () {
      // Pre-load data
    },

    open: async function (category = null) {
      if (this.isOpen) return;

      if (category) {
        this.activeCategory = category;
      }

      await this.loadItems();
      await this.loadInventory();

      this.isOpen = true;
      this.render();
    },

    close: function () {
      const modal = document.getElementById("shopModal");
      if (modal) modal.remove();
      this.isOpen = false;
    },

    loadItems: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/shop/items", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          this.items = await response.json();
        }
      } catch (error) {
        console.error("ShopModal: Failed to load items", error);
      }
    },

    loadInventory: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/shop/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          this.inventory = await response.json();
        }
      } catch (error) {
        console.error("ShopModal: Failed to load inventory", error);
      }
    },

    render: function () {
      const existing = document.getElementById("shopModal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "shopModal";
      modal.className = "shop-modal-overlay";

      const currentItems =
        this.viewMode === "shop"
          ? this.items.filter((i) => i.category === this.activeCategory)
          : this.inventory.filter((i) => i.category === this.activeCategory);

      modal.innerHTML = `
        <div class="shop-modal">
          <button class="shop-modal-close" id="shopModalClose">${
            this.icons.close
          }</button>
          
          <div class="shop-sidebar">
            <div class="shop-sidebar-header">
              <h2>Cửa hàng</h2>
            </div>
            
            <div class="shop-view-toggle">
              <button class="view-btn ${
                this.viewMode === "shop" ? "active" : ""
              }" data-view="shop">
                ${this.icons.cart} Cửa hàng
              </button>
              <button class="view-btn ${
                this.viewMode === "inventory" ? "active" : ""
              }" data-view="inventory">
                ${this.icons.check} Kho đồ
              </button>
            </div>
            
            <div class="shop-categories">
              ${this.categories
                .map(
                  (cat) => `
                <button class="category-btn ${
                  cat.id === this.activeCategory ? "active" : ""
                }" data-category="${cat.id}">
                  <span class="category-icon">${cat.icon}</span>
                  <span class="category-name">${cat.name}</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
          
          <div class="shop-content">
            <div class="shop-content-header">
              <h3>${
                this.categories.find((c) => c.id === this.activeCategory)
                  ?.name || "Cửa hàng"
              }</h3>
              <span class="item-count">${currentItems.length} vật phẩm</span>
            </div>
            
            <div class="shop-items-grid">
              ${
                currentItems.length > 0
                  ? currentItems
                      .map((item) => this.renderItemCard(item))
                      .join("")
                  : `
                <div class="empty-state">
                  <p>${
                    this.viewMode === "shop"
                      ? "Chưa có vật phẩm nào"
                      : "Bạn chưa có vật phẩm nào trong danh mục này"
                  }</p>
                </div>
              `
              }
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.attachModalEvents();
    },

    renderItemCard: function (item) {
      const rarityColors = {
        COMMON: "#b5bac1",
        UNCOMMON: "#57f287",
        RARE: "#5865f2",
        EPIC: "#9b59b6",
        LEGENDARY: "#faa61a",
        MYTHIC: "#e91e63",
      };

      const rarityLabels = {
        COMMON: "Thường",
        UNCOMMON: "Không thường",
        RARE: "Hiếm",
        EPIC: "Sử thi",
        LEGENDARY: "Huyền thoại",
        MYTHIC: "Thần thoại",
      };

      return `
        <div class="shop-item-card ${item.owned ? "owned" : ""} ${
        item.equipped ? "equipped" : ""
      }" 
             data-item-id="${item.id}"
             style="--rarity-color: ${
               rarityColors[item.rarity] || rarityColors.COMMON
             }">
          <div class="item-preview" style="${item.cssStyles || ""}">
            ${
              item.previewUrl
                ? `<img src="${item.previewUrl}" alt="${item.name}" />`
                : `<div class="preview-placeholder">👤</div>`
            }
          </div>
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-rarity" style="color: ${
              rarityColors[item.rarity]
            }">${rarityLabels[item.rarity]}</div>
            ${
              item.description
                ? `<div class="item-desc">${item.description}</div>`
                : ""
            }
          </div>
          <div class="item-footer">
            ${
              item.owned
                ? `
              <button class="item-btn equip-btn ${
                item.equipped ? "equipped" : ""
              }" data-action="${item.equipped ? "unequip" : "equip"}">
                ${item.equipped ? "Đang dùng" : "Trang bị"}
              </button>
            `
                : `
              <div class="item-price">
                ${
                  item.discountedPrice
                    ? `
                  <span class="original-price">${item.price}</span>
                  <span class="discounted-price">${item.discountedPrice}</span>
                `
                    : `
                  <span class="price">${item.price}</span>
                `
                }
                <span class="currency">Credits</span>
              </div>
              <button class="item-btn buy-btn" data-action="buy">Mua</button>
            `
            }
          </div>
          ${item.isLimited ? `<div class="limited-badge">Limited</div>` : ""}
          ${
            item.owned
              ? `<div class="owned-badge">${this.icons.check}</div>`
              : ""
          }
        </div>
      `;
    },

    attachModalEvents: function () {
      const modal = document.getElementById("shopModal");
      if (!modal) return;

      // Close
      modal
        .querySelector("#shopModalClose")
        ?.addEventListener("click", () => this.close());
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.close();
      });

      // View toggle
      modal.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.viewMode = btn.dataset.view;
          this.render();
        });
      });

      // Category selection
      modal.querySelectorAll(".category-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.activeCategory = btn.dataset.category;
          this.render();
        });
      });

      // Item actions
      modal.querySelectorAll(".item-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const card = btn.closest(".shop-item-card");
          const itemId = parseInt(card.dataset.itemId);
          const action = btn.dataset.action;

          if (action === "buy") {
            this.purchaseItem(itemId);
          } else if (action === "equip") {
            this.equipItem(itemId);
          } else if (action === "unequip") {
            this.unequipItem(itemId);
          }
        });
      });

      // ESC to close
      document.addEventListener("keydown", this.handleEsc);
    },

    handleEsc: function (e) {
      if (e.key === "Escape") {
        ShopModal.close();
        document.removeEventListener("keydown", ShopModal.handleEsc);
      }
    },

    purchaseItem: async function (itemId) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/shop/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId }),
        });

        if (response.ok) {
          const item = await response.json();
          if (window.Toast) {
            window.Toast.success("Mua thành công!", `Bạn đã mua ${item.name}`);
          }
          if (window.CocoCredits) {
            window.CocoCredits.refresh();
          }
          await this.loadItems();
          await this.loadInventory();
          this.render();
        } else {
          const error = await response.json();
          if (window.Toast) {
            window.Toast.error(
              "Mua thất bại",
              error.message || "Không đủ CoCo Credits"
            );
          }
        }
      } catch (error) {
        console.error("ShopModal: Purchase failed", error);
      }
    },

    equipItem: async function (itemId) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`/api/shop/items/${itemId}/equip`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          if (window.Toast) {
            window.Toast.success("Đã trang bị vật phẩm");
          }
          await this.loadInventory();
          await this.loadItems();
          this.render();
        }
      } catch (error) {
        console.error("ShopModal: Equip failed", error);
      }
    },

    unequipItem: async function (itemId) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`/api/shop/items/${itemId}/unequip`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          if (window.Toast) {
            window.Toast.success("Đã gỡ vật phẩm");
          }
          await this.loadInventory();
          await this.loadItems();
          this.render();
        }
      } catch (error) {
        console.error("ShopModal: Unequip failed", error);
      }
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    ShopModal.init();
  });

  window.ShopModal = ShopModal;
})();
