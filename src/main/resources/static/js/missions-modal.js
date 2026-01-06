/**
 * Missions Modal
 * View and track daily/weekly missions
 */

(function () {
  "use strict";

  const MissionsModal = {
    missions: {
      daily: [],
      weekly: [],
      oneTime: [],
    },
    summary: null,
    activeTab: "daily",
    isOpen: false,

    icons: {
      close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/></svg>`,
      check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
      gift: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>`,
      clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    },

    difficultyColors: {
      EASY: "#57f287",
      MEDIUM: "#faa61a",
      HARD: "#f04747",
      EXPERT: "#9b59b6",
    },

    difficultyLabels: {
      EASY: "Dễ",
      MEDIUM: "Trung bình",
      HARD: "Khó",
      EXPERT: "Chuyên gia",
    },

    init: async function () {
      // Pre-load
    },

    open: async function () {
      if (this.isOpen) return;

      await this.loadMissions();
      await this.loadSummary();

      this.isOpen = true;
      this.render();
    },

    close: function () {
      const modal = document.getElementById("missionsModal");
      if (modal) modal.remove();
      this.isOpen = false;
    },

    loadMissions: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/missions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          this.missions = await response.json();
        }
      } catch (error) {
        console.error("MissionsModal: Failed to load missions", error);
      }
    },

    loadSummary: async function () {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/missions/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          this.summary = await response.json();
        }
      } catch (error) {
        console.error("MissionsModal: Failed to load summary", error);
      }
    },

    render: function () {
      const existing = document.getElementById("missionsModal");
      if (existing) existing.remove();

      const modal = document.createElement("div");
      modal.id = "missionsModal";
      modal.className = "missions-modal-overlay";

      const currentMissions = this.missions[this.activeTab] || [];

      modal.innerHTML = `
        <div class="missions-modal">
          <button class="missions-modal-close" id="missionsModalClose">${
            this.icons.close
          }</button>
          
          <div class="missions-header">
            <h2>🎯 Nhiệm vụ</h2>
            <p>Hoàn thành nhiệm vụ để nhận CoCo Credits</p>
            
            ${
              this.summary
                ? `
              <div class="missions-summary">
                <div class="summary-stat">
                  <span class="stat-value">${this.summary.dailyCompleted}/${
                    this.summary.dailyTotal
                  }</span>
                  <span class="stat-label">Hàng ngày</span>
                </div>
                <div class="summary-stat">
                  <span class="stat-value">${this.summary.weeklyCompleted}/${
                    this.summary.weeklyTotal
                  }</span>
                  <span class="stat-label">Hàng tuần</span>
                </div>
                ${
                  this.summary.claimableRewards > 0
                    ? `
                  <div class="summary-stat claimable">
                    <span class="stat-value">${this.summary.claimableRewards}</span>
                    <span class="stat-label">Phần thưởng chờ nhận</span>
                  </div>
                `
                    : ""
                }
              </div>
            `
                : ""
            }
          </div>

          <div class="missions-tabs">
            <button class="missions-tab ${
              this.activeTab === "daily" ? "active" : ""
            }" data-tab="daily">
              Hàng ngày
              ${this.getClaimableBadge("daily")}
            </button>
            <button class="missions-tab ${
              this.activeTab === "weekly" ? "active" : ""
            }" data-tab="weekly">
              Hàng tuần
              ${this.getClaimableBadge("weekly")}
            </button>
            <button class="missions-tab ${
              this.activeTab === "oneTime" ? "active" : ""
            }" data-tab="oneTime">
              Một lần
              ${this.getClaimableBadge("oneTime")}
            </button>
          </div>

          <div class="missions-list">
            ${
              currentMissions.length > 0
                ? currentMissions
                    .map((mission) => this.renderMissionCard(mission))
                    .join("")
                : `
              <div class="empty-state">
                <p>Không có nhiệm vụ nào</p>
              </div>
            `
            }
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.attachModalEvents();
    },

    getClaimableBadge: function (tab) {
      const missions = this.missions[tab] || [];
      const claimable = missions.filter((m) => m.status === "COMPLETED").length;
      if (claimable > 0) {
        return `<span class="claimable-badge">${claimable}</span>`;
      }
      return "";
    },

    renderMissionCard: function (mission) {
      const progressPercent = mission.progressPercent || 0;
      const isCompleted =
        mission.status === "COMPLETED" || mission.status === "CLAIMED";
      const canClaim = mission.status === "COMPLETED";
      const isClaimed = mission.status === "CLAIMED";

      return `
        <div class="mission-card ${isCompleted ? "completed" : ""} ${
        isClaimed ? "claimed" : ""
      }" 
             data-mission-id="${mission.id}"
             data-user-mission-id="${mission.userMissionId || ""}">
          <div class="mission-icon">
            ${mission.iconEmoji || "🎯"}
          </div>
          
          <div class="mission-content">
            <div class="mission-header-row">
              <h4 class="mission-title">${mission.title}</h4>
              <span class="mission-difficulty" style="color: ${
                this.difficultyColors[mission.difficulty]
              }">
                ${this.difficultyLabels[mission.difficulty]}
              </span>
            </div>
            
            ${
              mission.description
                ? `<p class="mission-desc">${mission.description}</p>`
                : ""
            }
            
            <div class="mission-progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-text">${mission.currentProgress || 0}/${
        mission.requiredCount
      }</span>
            </div>
          </div>
          
          <div class="mission-reward">
            <div class="reward-amount">+${mission.rewardCredits}</div>
            <div class="reward-label">Credits</div>
            
            ${
              canClaim
                ? `
              <button class="claim-btn" data-action="claim">${this.icons.gift} Nhận</button>
            `
                : isClaimed
                ? `
              <div class="claimed-badge">${this.icons.check} Đã nhận</div>
            `
                : ""
            }
          </div>
        </div>
      `;
    },

    attachModalEvents: function () {
      const modal = document.getElementById("missionsModal");
      if (!modal) return;

      // Close
      modal
        .querySelector("#missionsModalClose")
        ?.addEventListener("click", () => this.close());
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.close();
      });

      // Tab switching
      modal.querySelectorAll(".missions-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          this.activeTab = tab.dataset.tab;
          this.render();
        });
      });

      // Claim buttons
      modal.querySelectorAll(".claim-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const card = btn.closest(".mission-card");
          const userMissionId = card.dataset.userMissionId;
          if (userMissionId) {
            this.claimReward(userMissionId);
          }
        });
      });

      // ESC to close
      document.addEventListener("keydown", this.handleEsc);
    },

    handleEsc: function (e) {
      if (e.key === "Escape") {
        MissionsModal.close();
        document.removeEventListener("keydown", MissionsModal.handleEsc);
      }
    },

    claimReward: async function (userMissionId) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`/api/missions/${userMissionId}/claim`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const mission = await response.json();
          if (window.Toast) {
            window.Toast.success(
              "Nhận thưởng thành công!",
              `+${mission.rewardCredits} CoCo Credits`
            );
          }
          if (window.CocoCredits) {
            window.CocoCredits.refresh();
          }
          await this.loadMissions();
          await this.loadSummary();
          this.render();
        } else {
          const error = await response.json();
          if (window.Toast) {
            window.Toast.error("Không thể nhận thưởng", error.message);
          }
        }
      } catch (error) {
        console.error("MissionsModal: Claim failed", error);
      }
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    MissionsModal.init();
  });

  window.MissionsModal = MissionsModal;
})();
