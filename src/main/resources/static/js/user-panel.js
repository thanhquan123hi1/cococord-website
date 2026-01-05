/**
 * User Panel Component
 * Bottom-left panel showing current user's avatar, status, and actions
 * Features a Discord-style User Popout (Mini Profile) when clicking avatar/name
 */

(function () {
  "use strict";

  const UserPanel = {
    // ============================================
    // State
    // ============================================
    currentUser: null,
    isPopoutVisible: false,
    isStatusDropdownVisible: false,
    initialized: false,
    isMuted: false,
    isDeafened: false,
    presenceUnsub: null,
    statusHoverTimeout: null,
    customStatusClearTimer: null,

    // ============================================
    // SVG Icons
    // ============================================
    icons: {
      micOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2z"/>
                <path d="M19 10.5a.5.5 0 0 0-1 0 6 6 0 0 1-12 0 .5.5 0 0 0-1 0 7 7 0 0 0 6.5 6.98V20H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1H12.5v-2.52A7 7 0 0 0 19 10.5z"/>
            </svg>`,
      micOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2z"/>
                <path d="M19 10.5a.5.5 0 0 0-1 0 6 6 0 0 1-12 0 .5.5 0 0 0-1 0 7 7 0 0 0 6.5 6.98V20H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1H12.5v-2.52A7 7 0 0 0 19 10.5z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
      headphoneOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12v8c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10z"/>
            </svg>`,
      headphoneOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12v8c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
      settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>`,
    },

    // ============================================
    // Initialization
    // ============================================
    init: async function () {
      if (this.initialized) return;

      const container = document.getElementById("userPanel");
      if (!container) {
        console.warn("UserPanel: #userPanel container not found");
        return;
      }

      // Load saved audio states from localStorage
      this.isMuted = localStorage.getItem("userPanel_muted") === "true";
      this.isDeafened = localStorage.getItem("userPanel_deafened") === "true";

      try {
        await this.loadCurrentUser();
        if (this.currentUser) {
          this.render();
          this.attachEventListeners();
          this.initPresenceSync();
          this.startPresenceHeartbeat();
          this.initCustomStatusClearTimer();
          this.initialized = true;
        }
      } catch (error) {
        console.error("UserPanel: Failed to initialize", error);
      }
    },

    initPresenceSync: function () {
      const store = window.CoCoCordPresence;
      const myId = this.currentUser?.id;
      if (!store || !myId) return;

      // Ensure only one subscription for this component
      try {
        this.presenceUnsub?.();
      } catch (_) {
        /* ignore */
      }
      this.presenceUnsub = null;

      // 1) Connect websocket so backend marks us ONLINE.
      if (typeof store.ensureConnected === "function") {
        store
          .ensureConnected()
          .then(() => {
            // 2) Hydrate snapshot and apply status to UCP.
            if (typeof store.hydrateSnapshot === "function") {
              return store.hydrateSnapshot([myId]);
            }
          })
          .then(() => {
            if (typeof store.getStatus === "function") {
              const s = store.getStatus(myId);
              if (s) this.update({ status: s });
            }
          })
          .catch(() => {
            /* ignore */
          });
      }

      // 3) Realtime updates for our own status (idle/dnd/offline etc.)
      if (typeof store.subscribe === "function") {
        this.presenceUnsub = store.subscribe((evt) => {
          if (!evt?.userId) return;
          if (String(evt.userId) !== String(myId)) return;
          if (evt.status) this.update({ status: evt.status });
        });
      }
    },

    // ============================================
    // Data Loading
    // ============================================
    loadCurrentUser: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;

        const response = await fetch("/api/users/me/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          this.currentUser = await response.json();
          
          // Default status logic: if null or OFFLINE (and not explicitly INVISIBLE), set to ONLINE
          if (!this.currentUser.status || this.currentUser.status === 'OFFLINE') {
            // Only auto-set to ONLINE, not if user chose INVISIBLE
            const savedStatus = localStorage.getItem('userPanel_preferredStatus');
            if (savedStatus !== 'INVISIBLE') {
              this.currentUser.status = 'ONLINE';
              // Silently update backend
              this.updateUserStatus('ONLINE', true);
            }
          }
          
          return this.currentUser;
        }
      } catch (error) {
        console.error("UserPanel: Failed to load user profile:", error);
      }
      return null;
    },

    // ============================================
    // Audio Controls
    // ============================================
    toggleMute: function () {
      this.isMuted = !this.isMuted;
      localStorage.setItem("userPanel_muted", this.isMuted);

      // Notify other components (chat.js voice)
      if (window.CoCoCordChat?.toggleMute) {
        window.CoCoCordChat.toggleMute();
      }

      // Update UI
      this.updateAudioButtons();

      // Dispatch event for other listeners
      document.dispatchEvent(
        new CustomEvent("userPanel:muteToggle", {
          detail: { isMuted: this.isMuted },
        })
      );
    },

    toggleDeafen: function () {
      this.isDeafened = !this.isDeafened;
      localStorage.setItem("userPanel_deafened", this.isDeafened);

      // If deafening, also mute
      if (this.isDeafened && !this.isMuted) {
        this.isMuted = true;
        localStorage.setItem("userPanel_muted", this.isMuted);
      }

      // Notify other components (chat.js voice)
      if (window.CoCoCordChat?.toggleDeafen) {
        window.CoCoCordChat.toggleDeafen();
      }

      // Update UI
      this.updateAudioButtons();

      // Dispatch event for other listeners
      document.dispatchEvent(
        new CustomEvent("userPanel:deafenToggle", {
          detail: { isDeafened: this.isDeafened, isMuted: this.isMuted },
        })
      );
    },

    updateAudioButtons: function () {
      const micBtn = document.getElementById("userPanelMicBtn");
      const deafenBtn = document.getElementById("userPanelDeafenBtn");

      if (micBtn) {
        micBtn.classList.toggle("active", this.isMuted);
        micBtn.innerHTML = this.isMuted ? this.icons.micOff : this.icons.micOn;
        micBtn.title = this.isMuted ? "Bật tiếng" : "Tắt tiếng";
      }

      if (deafenBtn) {
        deafenBtn.classList.toggle("active", this.isDeafened);
        deafenBtn.innerHTML = this.isDeafened
          ? this.icons.headphoneOff
          : this.icons.headphoneOn;
        deafenBtn.title = this.isDeafened ? "Bật âm thanh" : "Tắt âm thanh";
      }
    },

    // ============================================
    // Main Panel Rendering
    // ============================================
    render: function () {
      if (!this.currentUser) return;

      const container = document.getElementById("userPanel");
      if (!container) return;

      const { displayName, username, status, customStatus } =
        this.getUserDisplayData();
      
      const hasCustomStatus = this.currentUser.customStatus && this.currentUser.customStatus.trim();
      const expiryInfo = this.getCustomStatusExpiryInfo();

      container.innerHTML = `
                <div class="user-panel-content">
                    <!-- Left: Avatar + Info (Status Trigger) -->
                    <div class="user-panel-left" id="userPanelTrigger">
                        <div class="user-avatar-wrapper">
                            ${this.renderAvatar(32)}
                            <span class="status-indicator status-${status.toLowerCase()}"></span>
                        </div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(displayName)}</div>
                            ${hasCustomStatus ? `
                              <div class="user-custom-status">
                                <span class="custom-status-content">
                                  ${this.currentUser.customStatusEmoji ? `<span class="custom-status-emoji">${this.currentUser.customStatusEmoji}</span>` : ''}
                                  <span class="custom-status-text">${this.escapeHtml(this.currentUser.customStatus)}</span>
                                </span>
                                ${expiryInfo.hasExpiry ? `
                                  <span class="custom-status-expiry" title="Hết hạn ${expiryInfo.expiryText}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                                    </svg>
                                  </span>
                                ` : ''}
                              </div>
                            ` : `
                              <div class="user-status-text">${this.getStatusLabel(status)}</div>
                            `}
                        </div>
                        ${hasCustomStatus ? `
                          <button class="clear-status-btn" id="clearCustomStatusBtn" title="Xóa trạng thái">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                            </svg>
                          </button>
                        ` : ''}
                    </div>
                    
                    <!-- Right: Control Buttons -->
                    <div class="panel-buttons">
                        <button class="panel-btn ${
                          this.isMuted ? "active" : ""
                        }" id="userPanelMicBtn" title="${
        this.isMuted ? "Bật tiếng" : "Tắt tiếng"
      }">
                            ${
                              this.isMuted
                                ? this.icons.micOff
                                : this.icons.micOn
                            }
                        </button>
                        <button class="panel-btn ${
                          this.isDeafened ? "active" : ""
                        }" id="userPanelDeafenBtn" title="${
        this.isDeafened ? "Bật âm thanh" : "Tắt âm thanh"
      }">
                            ${
                              this.isDeafened
                                ? this.icons.headphoneOff
                                : this.icons.headphoneOn
                            }
                        </button>
                        <button class="panel-btn" id="userPanelSettingsBtn" title="Cài đặt người dùng">
                            ${this.icons.settings}
                        </button>
                    </div>
                    
                    <!-- Status Dropdown (Hidden by default) -->
                    ${this.renderStatusDropdown(status)}
                </div>
            `;

      // Re-attach event listeners after render
      this.attachEventListeners();
    },

    renderStatusDropdown: function (currentStatus) {
      const statuses = [
        { 
          id: 'ONLINE', 
          label: 'Trực tuyến', 
          description: 'Mọi người có thể thấy bạn đang hoạt động',
          iconClass: 'online',
          icon: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#23a55a"/></svg>`
        },
        { 
          id: 'IDLE', 
          label: 'Vắng mặt', 
          description: 'Bạn có thể bỏ lỡ tin nhắn',
          iconClass: 'idle',
          icon: `<svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0a5 5 0 1 0 0 10 3.5 3.5 0 0 1 0-10z" fill="#f0b232"/></svg>`
        },
        { 
          id: 'DO_NOT_DISTURB', 
          label: 'Không làm phiền', 
          description: 'Bạn sẽ không nhận được thông báo',
          iconClass: 'dnd',
          icon: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#f23f43"/><rect x="2" y="4" width="6" height="2" rx="1" fill="#111214"/></svg>`
        },
        { 
          id: 'INVISIBLE', 
          label: 'Ẩn', 
          description: 'Bạn sẽ không hiển thị với người khác',
          iconClass: 'invisible',
          icon: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="#80848e" stroke-width="2"/></svg>`
        }
      ];

      const user = this.currentUser || {};
      const hasCustomStatus = user.customStatus && user.customStatus.trim();

      return `
        <div class="status-picker-menu" id="statusDropdown">
          <div class="status-picker-header">
            <span class="status-picker-title">Cài đặt trạng thái</span>
          </div>
          
          <div class="status-picker-list">
            ${statuses.map(s => `
              <button class="status-picker-item ${currentStatus === s.id ? 'active' : ''}" data-status="${s.id}">
                <div class="status-picker-icon">${s.icon}</div>
                <div class="status-picker-info">
                  <span class="status-picker-label">${s.label}</span>
                </div>
                ${currentStatus === s.id ? '<svg class="status-picker-check" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8.99991 16.17L4.82991 12L3.40991 13.41L8.99991 19L20.9999 7L19.5899 5.59L8.99991 16.17Z"/></svg>' : ''}
              </button>
            `).join('')}
          </div>
          
          <div class="status-picker-separator"></div>
          
          <button class="status-picker-custom" id="statusDropdownCustom">
            <div class="status-picker-custom-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span>Đặt trạng thái tùy chỉnh</span>
          </button>
          
          ${hasCustomStatus ? `
            <button class="status-picker-clear" id="statusDropdownClear">
              <div class="status-picker-clear-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                </svg>
              </div>
              <span>Xóa trạng thái tùy chỉnh</span>
            </button>
          ` : ''}
        </div>
      `;
    },

    renderAvatar: function (size = 32) {
      const displayName =
        this.currentUser?.displayName || this.currentUser?.username || "U";
      const avatarUrl = this.currentUser?.avatarUrl;

      if (avatarUrl) {
        return `<img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(
          displayName
        )}" class="user-avatar" style="width:${size}px;height:${size}px;">`;
      }
      return `<div class="user-avatar-placeholder" style="width:${size}px;height:${size}px;font-size:${
        size * 0.5
      }px;">${displayName.charAt(0).toUpperCase()}</div>`;
    },

    getUserDisplayData: function () {
      const user = this.currentUser || {};
      const store = window.CoCoCordPresence;
      const storeStatus =
        store && typeof store.getStatus === "function" && user.id != null
          ? store.getStatus(user.id)
          : null;
      return {
        displayName: user.displayName || user.username || "User",
        username: user.username || "user",
        status: storeStatus || user.status || "OFFLINE",
        customStatus: user.customStatus
          ? user.customStatusEmoji
            ? `${user.customStatusEmoji} ${user.customStatus}`
            : user.customStatus
          : "",
        discriminator: String((user.id || 0) % 10000).padStart(4, "0"),
        bannerColor: user.bannerColor || "#5865f2",
      };
    },

    getStatusLabel: function (status) {
      const labels = {
        ONLINE: "Trực tuyến",
        IDLE: "Vắng mặt",
        DO_NOT_DISTURB: "Không làm phiền",
        OFFLINE: "Ngoại tuyến",
        INVISIBLE: "Ẩn",
      };
      return labels[status] || "Ngoại tuyến";
    },

    getCustomStatusExpiryInfo: function () {
      const user = this.currentUser;
      if (!user || !user.customStatusExpiresAt) {
        return { hasExpiry: false, expiryText: '' };
      }

      const expiresAt = new Date(user.customStatusExpiresAt);
      const now = new Date();
      
      if (expiresAt <= now) {
        return { hasExpiry: false, expiryText: '' };
      }

      const diffMs = expiresAt - now;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      let expiryText;
      if (diffMins < 60) {
        expiryText = `trong ${diffMins} phút`;
      } else if (diffHours < 24) {
        const remainingMins = diffMins % 60;
        expiryText = remainingMins > 0 
          ? `trong ${diffHours} giờ ${remainingMins} phút`
          : `trong ${diffHours} giờ`;
      } else {
        const days = Math.floor(diffHours / 24);
        expiryText = `trong ${days} ngày`;
      }

      return { hasExpiry: true, expiryText };
    },

    // ============================================
    // Custom Status Auto-Clear Timer
    // ============================================
    initCustomStatusClearTimer: function () {
      // Clear any existing timer
      if (this.customStatusClearTimer) {
        clearTimeout(this.customStatusClearTimer);
        this.customStatusClearTimer = null;
      }

      const user = this.currentUser;
      if (!user || !user.customStatusExpiresAt) return;

      const expiresAt = new Date(user.customStatusExpiresAt);
      const now = new Date();
      const timeUntilExpiry = expiresAt - now;

      // If already expired, clear immediately
      if (timeUntilExpiry <= 0) {
        this.autoCloseCustomStatus();
        return;
      }

      // Schedule auto-clear
      console.log(`UserPanel: Custom status will expire in ${Math.floor(timeUntilExpiry / 1000)}s`);
      this.customStatusClearTimer = setTimeout(() => {
        this.autoCloseCustomStatus();
      }, timeUntilExpiry);
    },

    autoCloseCustomStatus: function () {
      console.log('UserPanel: Auto-clearing expired custom status');
      
      // Clear from local state and UI
      if (this.currentUser) {
        this.currentUser.customStatus = null;
        this.currentUser.customStatusEmoji = null;
        this.currentUser.customStatusExpiresAt = null;
        this.render();
      }

      // Clear timer reference
      this.customStatusClearTimer = null;
    },

    // ============================================
    // Event Listeners
    // ============================================
    attachEventListeners: function () {
      const panelLeft = document.getElementById("userPanelTrigger");
      const statusDropdown = document.getElementById("statusDropdown");
      const userPanelContent = document.querySelector(".user-panel-content");

      // Avatar/Info trigger - show status dropdown on hover, click for popout
      if (panelLeft) {
        // Click to open full popout
        panelLeft.onclick = (e) => {
          e.stopPropagation();
          this.hideStatusDropdown();
          this.togglePopout();
        };

        // Hover to show status dropdown
        panelLeft.onmouseenter = () => {
          if (this.isPopoutVisible) return;
          clearTimeout(this.statusLeaveTimeout);
          this.statusHoverTimeout = setTimeout(() => {
            this.showStatusDropdown();
          }, 200);
        };

        panelLeft.onmouseleave = (e) => {
          clearTimeout(this.statusHoverTimeout);
          // Check if mouse moved to dropdown
          const relatedTarget = e.relatedTarget;
          if (statusDropdown && statusDropdown.contains(relatedTarget)) {
            return;
          }
          // Add small delay before hiding for smoother UX
          this.statusLeaveTimeout = setTimeout(() => {
            this.hideStatusDropdown();
          }, 300);
        };
      }

      // Status dropdown hover persistence
      if (statusDropdown) {
        statusDropdown.onmouseenter = () => {
          clearTimeout(this.statusHoverTimeout);
          clearTimeout(this.statusLeaveTimeout);
        };

        statusDropdown.onmouseleave = (e) => {
          const relatedTarget = e.relatedTarget;
          if (panelLeft && panelLeft.contains(relatedTarget)) {
            return;
          }
          // Add delay before hiding to allow mouse to move back
          this.statusLeaveTimeout = setTimeout(() => {
            this.hideStatusDropdown();
          }, 300);
        };

        // Status item clicks (updated selector for new class name)
        statusDropdown.querySelectorAll('.status-picker-item').forEach(item => {
          item.onclick = (e) => {
            e.stopPropagation();
            const newStatus = item.dataset.status;
            this.updateUserStatus(newStatus);
            this.hideStatusDropdown();
          };
        });

        // Custom status button
        const customBtn = document.getElementById('statusDropdownCustom');
        if (customBtn) {
          customBtn.onclick = (e) => {
            e.stopPropagation();
            this.hideStatusDropdown();
            this.openStatusPicker();
          };
        }

        // Clear custom status button in dropdown
        const clearBtn = document.getElementById('statusDropdownClear');
        if (clearBtn) {
          clearBtn.onclick = (e) => {
            e.stopPropagation();
            this.clearCustomStatus();
            this.hideStatusDropdown();
          };
        }
      }

      // Clear custom status button (quick action)
      const clearStatusBtn = document.getElementById('clearCustomStatusBtn');
      if (clearStatusBtn) {
        clearStatusBtn.onclick = (e) => {
          e.stopPropagation();
          this.clearCustomStatus();
        };
      }

      // Mic button
      const micBtn = document.getElementById("userPanelMicBtn");
      if (micBtn) {
        micBtn.onclick = (e) => {
          e.stopPropagation();
          this.toggleMute();
        };
      }

      // Deafen button
      const deafenBtn = document.getElementById("userPanelDeafenBtn");
      if (deafenBtn) {
        deafenBtn.onclick = (e) => {
          e.stopPropagation();
          this.toggleDeafen();
        };
      }

      // Settings button
      const settingsBtn = document.getElementById("userPanelSettingsBtn");
      if (settingsBtn) {
        settingsBtn.onclick = (e) => {
          e.stopPropagation();
          if (window.SettingsModal?.open) {
            window.SettingsModal.open("my-account", this.currentUser);
          } else {
            window.location.href = "/settings";
          }
        };
      }

      // Global click to close popout
      if (!this._documentListenerAttached) {
        document.addEventListener("click", (e) => {
          if (this.isPopoutVisible) {
            const popout = document.getElementById("userPopout");
            if (popout && !popout.contains(e.target)) {
              this.hidePopout();
            }
          }
          // Also close status dropdown on outside click
          if (this.isStatusDropdownVisible) {
            const dropdown = document.getElementById("statusDropdown");
            const trigger = document.getElementById("userPanelTrigger");
            if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
              this.hideStatusDropdown();
            }
          }
        });
        this._documentListenerAttached = true;
      }
    },

    // ============================================
    // Status Dropdown Logic
    // ============================================
    showStatusDropdown: function () {
      const dropdown = document.getElementById("statusDropdown");
      const trigger = document.getElementById("userPanelTrigger");
      if (dropdown) {
        dropdown.classList.add("visible");
        this.isStatusDropdownVisible = true;
        if (trigger) {
          trigger.classList.add("status-menu-open");
        }
      }
    },

    hideStatusDropdown: function () {
      const dropdown = document.getElementById("statusDropdown");
      const trigger = document.getElementById("userPanelTrigger");
      if (dropdown) {
        dropdown.classList.remove("visible");
        this.isStatusDropdownVisible = false;
        if (trigger) {
          trigger.classList.remove("status-menu-open");
        }
      }
    },

    updateUserStatus: async function (status, silent = false) {
      try {
        // Save preference for INVISIBLE
        if (status === 'INVISIBLE') {
          localStorage.setItem('userPanel_preferredStatus', 'INVISIBLE');
        } else if (status === 'ONLINE') {
          localStorage.removeItem('userPanel_preferredStatus');
        }

        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/users/me/status", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: status })
        });

        if (response.ok) {
          this.currentUser.status = status;
          if (!silent) {
            this.render();
          }
          
          // Notify presence system
          if (window.CoCoCordPresence?.updateStatus) {
            window.CoCoCordPresence.updateStatus(status);
          }
        }
      } catch (error) {
        console.error("UserPanel: Failed to update status", error);
      }
    },

    // ============================================
    // Popout Logic
    // ============================================
    togglePopout: function () {
      if (this.isPopoutVisible) {
        this.hidePopout();
      } else {
        this.showPopout();
      }
    },

    showPopout: function () {
      // Remove any existing popout
      const existing = document.getElementById("userPopout");
      if (existing) existing.remove();

      if (!this.currentUser) return;

      // Create popout element
      const popout = document.createElement("div");
      popout.id = "userPopout";
      popout.className = "user-popout";
      popout.innerHTML = this.renderPopout();

      // Position above user panel
      const userPanel = document.getElementById("userPanel");
      if (userPanel) {
        const rect = userPanel.getBoundingClientRect();
        popout.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        popout.style.left = `${rect.left}px`;
      }

      document.body.appendChild(popout);

      this.isPopoutVisible = true;

      // Prevent clicks inside popout from closing it
      popout.addEventListener("click", (e) => e.stopPropagation());

      // Attach popout menu listeners
      this.attachPopoutListeners();
    },

    hidePopout: function () {
      const popout = document.getElementById("userPopout");
      if (popout) {
        popout.classList.add("closing");
        setTimeout(() => popout.remove(), 150);
      }
      this.isPopoutVisible = false;
    },

    // ============================================
    // Popout Rendering - Discord Mini Profile Style
    // ============================================
    renderPopout: function () {
      const user = this.currentUser;
      if (!user) return "";

      const {
        displayName,
        username,
        status,
        customStatus,
        discriminator,
        bannerColor,
      } = this.getUserDisplayData();
      const avatarUrl = user.avatarUrl;
      const bannerUrl = user.bannerUrl;

      // Banner style
      const bannerStyle = bannerUrl
        ? `background: url('${this.escapeHtml(
            bannerUrl
          )}') center/cover no-repeat;`
        : `background: ${bannerColor};`;

      // Avatar HTML with cutout effect
      const avatarHtml = avatarUrl
        ? `<img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(
            displayName
          )}" class="popout-avatar">`
        : `<div class="popout-avatar popout-avatar-placeholder">${displayName
            .charAt(0)
            .toUpperCase()}</div>`;

      // Badges (if any)
      const badgesHtml = user.badges?.length
        ? `<div class="popout-badges">${user.badges
            .map(
              (b) =>
                `<span class="popout-badge" title="${this.escapeHtml(
                  b.name || b
                )}">${b.icon || "🏅"}</span>`
            )
            .join("")}</div>`
        : "";

      // Custom status (emoji + text)
      const hasCustomStatus = user.customStatus || user.customStatusEmoji;
      const customStatusHtml = hasCustomStatus
        ? `
                <div class="popout-custom-status-box">
                    ${
                      user.customStatusEmoji
                        ? `<span class="popout-emoji">${user.customStatusEmoji}</span>`
                        : ""
                    }
                    <span class="popout-custom-text">${this.escapeHtml(
                      user.customStatus || ""
                    )}</span>
                </div>
            `
        : `
                <div class="popout-custom-status-box popout-custom-status-placeholder" id="popoutSetStatusBtn">
                    <span class="popout-emoji">😊</span>
                    <span class="popout-custom-text">Cơ chế trực tuyến nào thấy được nhất?</span>
                </div>
            `;

      return `
                <!-- Banner -->
                <div class="popout-banner" style="${bannerStyle}"></div>
                
                <!-- Avatar with cutout border -->
                <div class="popout-avatar-section">
                    <div class="popout-avatar-wrapper">
                        ${avatarHtml}
                        <div class="popout-status-badge status-${status.toLowerCase()}"></div>
                    </div>
                </div>

                <!-- Body Content -->
                <div class="popout-body">
                    <!-- Identity -->
                    <div class="popout-identity">
                        <div class="popout-display-name">
                            <span class="popout-name">${this.escapeHtml(
                              displayName
                            )}</span>
                            ${badgesHtml}
                        </div>
                        <div class="popout-username">${this.escapeHtml(
                          username
                        )}#${discriminator}</div>
                    </div>

                    <!-- Custom Status -->
                    ${customStatusHtml}

                    <!-- Separator -->
                    <div class="popout-separator"></div>

                    <!-- Menu Actions -->
                    <div class="popout-menu">
                        <button class="popout-menu-item" data-action="edit-profile">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            <span>Sửa hồ sơ</span>
                        </button>
                        
                        <button class="popout-menu-item" data-action="set-status">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                            </svg>
                            <span>Đặt trạng thái</span>
                        </button>

                        <div class="popout-menu-separator"></div>

                        <button class="popout-menu-item" data-action="switch-account">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24.74.85 1.17 1.95 1.17 3.09s-.43 2.24-1.17 3.09c.42.14.86.58 1.33.58zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <span>Đổi tài khoản</span>
                        </button>

                        <div class="popout-menu-separator"></div>

                        <button class="popout-menu-item popout-menu-danger" data-action="logout">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                            </svg>
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            `;
    },

    attachPopoutListeners: function () {
      const popout = document.getElementById("userPopout");
      if (!popout) return;

      // Menu item actions
      popout.querySelectorAll(".popout-menu-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handlePopoutAction(item.dataset.action);
        });
      });

      // Custom status placeholder click
      const setStatusBtn = popout.querySelector("#popoutSetStatusBtn");
      if (setStatusBtn) {
        setStatusBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.hidePopout();
          this.openStatusPicker();
        });
      }
    },

    openStatusPicker: function () {
      this.showCustomStatusModal();
    },

    // ============================================
    // Custom Status Modal
    // ============================================
    showCustomStatusModal: function () {
      // Remove existing modal if any
      const existing = document.getElementById('customStatusModal');
      if (existing) existing.remove();

      const user = this.currentUser || {};
      const currentEmoji = user.customStatusEmoji || '';
      const currentText = user.customStatus || '';
      const currentStatus = user.status || 'ONLINE';

      const statuses = [
        { id: 'ONLINE', label: 'Trực tuyến', color: '#23a55a' },
        { id: 'IDLE', label: 'Vắng mặt', color: '#f0b232' },
        { id: 'DO_NOT_DISTURB', label: 'Không làm phiền', color: '#f23f43' },
        { id: 'INVISIBLE', label: 'Ẩn', color: '#80848e' }
      ];

      const modalHtml = `
        <div class="custom-status-modal-overlay" id="customStatusModal">
          <div class="custom-status-modal">
            <div class="custom-status-modal-header">
              <h2>Đặt trạng thái tùy chỉnh</h2>
              <button class="custom-status-modal-close" id="customStatusClose">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                </svg>
              </button>
            </div>
            
            <div class="custom-status-modal-body">
              <div class="custom-status-input-group">
                <button class="custom-status-emoji-btn" id="customStatusEmojiBtn" title="Chọn emoji">
                  <span id="customStatusEmojiPreview">${currentEmoji || '😊'}</span>
                </button>
                <input type="text" 
                       class="custom-status-input" 
                       id="customStatusText" 
                       placeholder="Bạn đang làm gì?" 
                       maxlength="128"
                       value="${this.escapeHtml(currentText)}">
              </div>
              
              <div class="custom-status-duration-group">
                <label class="custom-status-label">Xóa sau</label>
                <select class="custom-status-select" id="customStatusDuration">
                  <option value="-1">Không xóa</option>
                  <option value="30">30 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="240">4 giờ (Hôm nay)</option>
                  <option value="1440">24 giờ</option>
                </select>
              </div>
              
              <div class="custom-status-divider"></div>
              
              <div class="custom-status-status-group">
                <label class="custom-status-label">Trạng thái</label>
                <div class="custom-status-status-options" id="customStatusStatusOptions">
                  ${statuses.map(s => `
                    <button class="custom-status-status-btn ${currentStatus === s.id ? 'active' : ''}" 
                            data-status="${s.id}" 
                            title="${s.label}">
                      <span class="custom-status-status-dot" style="background: ${s.color}; ${s.id === 'INVISIBLE' ? 'background: transparent; border: 2px solid ' + s.color + '; box-sizing: border-box;' : ''}"></span>
                      <span class="custom-status-status-label">${s.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <div class="custom-status-modal-footer">
              <button class="custom-status-btn custom-status-btn-cancel" id="customStatusCancel">Hủy</button>
              <button class="custom-status-btn custom-status-btn-clear" id="customStatusClear">Xóa trạng thái</button>
              <button class="custom-status-btn custom-status-btn-save" id="customStatusSave">Lưu</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.attachCustomStatusModalListeners();

      // Focus input
      setTimeout(() => {
        document.getElementById('customStatusText')?.focus();
      }, 100);
    },

    attachCustomStatusModalListeners: function () {
      const modal = document.getElementById('customStatusModal');
      if (!modal) return;

      // Close button
      const closeBtn = document.getElementById('customStatusClose');
      if (closeBtn) {
        closeBtn.onclick = () => this.hideCustomStatusModal();
      }

      // Cancel button
      const cancelBtn = document.getElementById('customStatusCancel');
      if (cancelBtn) {
        cancelBtn.onclick = () => this.hideCustomStatusModal();
      }

      // Clear status button
      const clearBtn = document.getElementById('customStatusClear');
      if (clearBtn) {
        clearBtn.onclick = () => this.clearCustomStatus();
      }

      // Save button
      const saveBtn = document.getElementById('customStatusSave');
      if (saveBtn) {
        saveBtn.onclick = () => this.saveCustomStatus();
      }

      // Emoji button (simple emoji picker)
      const emojiBtn = document.getElementById('customStatusEmojiBtn');
      if (emojiBtn) {
        emojiBtn.onclick = () => this.showEmojiPicker();
      }

      // Status selection buttons in modal
      const statusOptions = document.getElementById('customStatusStatusOptions');
      if (statusOptions) {
        statusOptions.querySelectorAll('.custom-status-status-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            // Remove active from all
            statusOptions.querySelectorAll('.custom-status-status-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
          };
        });
      }

      // Click outside to close
      modal.onclick = (e) => {
        if (e.target === modal) {
          this.hideCustomStatusModal();
        }
      };

      // ESC key to close
      modal.onkeydown = (e) => {
        if (e.key === 'Escape') {
          this.hideCustomStatusModal();
        }
      };
    },

    hideCustomStatusModal: function () {
      const modal = document.getElementById('customStatusModal');
      if (modal) {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 150);
      }
    },

    showEmojiPicker: function () {
      const commonEmojis = ['😊', '😎', '🎮', '💻', '🎵', '📚', '🍕', '☕', '🏠', '💤', '🎉', '❤️', '🔥', '✨', '🌙', '🌟'];
      
      // Remove existing picker
      const existingPicker = document.querySelector('.emoji-quick-picker');
      if (existingPicker) {
        existingPicker.remove();
        return;
      }

      const emojiBtn = document.getElementById('customStatusEmojiBtn');
      if (!emojiBtn) return;

      const picker = document.createElement('div');
      picker.className = 'emoji-quick-picker';
      picker.innerHTML = commonEmojis.map(e => 
        `<button class="emoji-quick-item" data-emoji="${e}">${e}</button>`
      ).join('');

      emojiBtn.parentElement.appendChild(picker);

      // Emoji selection
      picker.querySelectorAll('.emoji-quick-item').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const emoji = btn.dataset.emoji;
          document.getElementById('customStatusEmojiPreview').textContent = emoji;
          picker.remove();
        };
      });

      // Click outside to close
      setTimeout(() => {
        document.addEventListener('click', function closePicker(e) {
          if (!picker.contains(e.target) && e.target !== emojiBtn) {
            picker.remove();
            document.removeEventListener('click', closePicker);
          }
        });
      }, 10);
    },

    clearCustomStatus: async function () {
      try {
        const token = localStorage.getItem('accessToken');
        const currentStatus = this.currentUser?.status || 'ONLINE';
        
        const response = await fetch('/api/users/me/status', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: currentStatus,
            customStatus: '',
            customStatusEmoji: '',
            customStatusDuration: null
          })
        });

        if (response.ok) {
          // Clear timer
          if (this.customStatusClearTimer) {
            clearTimeout(this.customStatusClearTimer);
            this.customStatusClearTimer = null;
          }
          
          // Update local state
          this.currentUser.customStatus = null;
          this.currentUser.customStatusEmoji = null;
          this.currentUser.customStatusExpiresAt = null;
          
          this.render();
          this.hideCustomStatusModal();
        }
      } catch (error) {
        console.error('UserPanel: Failed to clear custom status', error);
      }
    },

    saveCustomStatus: async function () {
      const textInput = document.getElementById('customStatusText');
      const emojiPreview = document.getElementById('customStatusEmojiPreview');
      const durationSelect = document.getElementById('customStatusDuration');
      const statusOptions = document.getElementById('customStatusStatusOptions');

      const customStatus = textInput?.value?.trim() || '';
      const customStatusEmoji = emojiPreview?.textContent?.trim() || '';
      const durationMinutes = parseInt(durationSelect?.value) || -1;
      
      // Get selected status from modal
      const selectedStatusBtn = statusOptions?.querySelector('.custom-status-status-btn.active');
      const selectedStatus = selectedStatusBtn?.dataset?.status || this.currentUser?.status || 'ONLINE';

      try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('/api/users/me/status', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: selectedStatus,
            customStatus: customStatus,
            customStatusEmoji: customStatusEmoji,
            customStatusDuration: durationMinutes > 0 ? durationMinutes : null
          })
        });

        if (response.ok) {
          // Update local state
          this.currentUser.status = selectedStatus;
          this.currentUser.customStatus = customStatus || null;
          this.currentUser.customStatusEmoji = customStatusEmoji || null;
          
          // Calculate expiry time if duration is set
          if (durationMinutes > 0) {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
            this.currentUser.customStatusExpiresAt = expiresAt.toISOString();
          } else {
            this.currentUser.customStatusExpiresAt = null;
          }
          
          // Re-render UI
          this.render();
          this.hideCustomStatusModal();
          
          // Initialize auto-clear timer
          this.initCustomStatusClearTimer();
          
          // Notify presence system of status change
          if (window.CoCoCordPresence?.updateStatus) {
            window.CoCoCordPresence.updateStatus(selectedStatus);
          }
        }
      } catch (error) {
        console.error('UserPanel: Failed to save custom status', error);
      }
    },

    handlePopoutAction: function (action) {
      this.hidePopout();

      switch (action) {
        case "edit-profile":
          if (window.SettingsModal?.open) {
            window.SettingsModal.open("profiles", this.currentUser);
          } else {
            window.location.href = "/settings/profile";
          }
          break;

        case "set-status":
          this.openStatusPicker();
          break;

        case "switch-account":
          if (confirm("Đổi sang tài khoản khác? Bạn sẽ bị đăng xuất.")) {
            this.performLogout();
          }
          break;

        case "logout":
          if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            this.performLogout();
          }
          break;
      }
    },

    performLogout: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore logout errors
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userPanel_muted");
      localStorage.removeItem("userPanel_deafened");
      window.location.href = "/login";
    },

    // ============================================
    // Presence Heartbeat
    // ============================================
    startPresenceHeartbeat: function () {
      // Send presence heartbeat every 30 seconds
      setInterval(() => this.sendHeartbeat(), 30000);
    },

    sendHeartbeat: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        await fetch("/api/users/heartbeat", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("UserPanel: Heartbeat failed", error);
      }
    },

    // ============================================
    // Public API
    // ============================================
    update: function (userData) {
      if (userData) {
        this.currentUser = { ...this.currentUser, ...userData };
        this.render();
      }
    },

    // Sync mute/deafen state from external source (e.g., voice channel)
    syncAudioState: function (isMuted, isDeafened) {
      this.isMuted = isMuted;
      this.isDeafened = isDeafened;
      this.updateAudioButtons();
    },

    // ============================================
    // Utilities
    // ============================================
    escapeHtml: function (text) {
      if (!text) return "";
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },
  };

  // Export to window
  window.UserPanel = UserPanel;

  // Auto-initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => UserPanel.init());
  } else {
    setTimeout(() => UserPanel.init(), 100);
  }
})();
