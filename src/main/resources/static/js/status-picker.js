/**
 * Status Picker Component
 * Dropdown for selecting user status and setting custom status
 */

(function() {
    'use strict';

    const StatusPicker = {
        currentUser: null,
        callback: null,
        visible: false,

        /**
         * Show status picker
         */
        show: function(user, callback) {
            if (!user) {
                console.warn('StatusPicker: No user provided');
                return;
            }
            
            this.currentUser = user;
            this.callback = callback;
            this.visible = true;
            this.render();
        },

        /**
         * Hide status picker
         */
        hide: function() {
            const container = document.getElementById('statusPickerDropdown');
            if (container) {
                container.remove();
            }
            this.visible = false;
        },

        /**
         * Render status picker
         */
        render: function() {
            // Remove existing picker
            this.hide();

            const currentStatus = this.currentUser?.status || 'ONLINE';
            const customStatus = this.currentUser?.customStatus || '';
            const customEmoji = this.currentUser?.customStatusEmoji || '';

            const dropdown = document.createElement('div');
            dropdown.id = 'statusPickerDropdown';
            dropdown.className = 'status-picker-dropdown';
            dropdown.innerHTML = `
                <div class="status-picker-header">
                    <h3>Set your status</h3>
                </div>
                <div class="status-picker-body">
                    <!-- Status Options -->
                    <div class="status-options">
                        ${this.renderStatusOption('ONLINE', '🟢', 'Online', currentStatus)}
                        ${this.renderStatusOption('IDLE', '🟡', 'Idle', currentStatus)}
                        ${this.renderStatusOption('DO_NOT_DISTURB', '🔴', 'Do Not Disturb', currentStatus)}
                        ${this.renderStatusOption('INVISIBLE', '⚫', 'Invisible', currentStatus)}
                    </div>

                    <!-- Custom Status -->
                    <div class="custom-status-section">
                        <label class="custom-status-label">Custom Status</label>
                        <div class="custom-status-input-wrapper">
                            <button class="emoji-picker-btn" id="emojiPickerBtn" type="button">
                                ${customEmoji || '😊'}
                            </button>
                            <input type="text" 
                                   id="customStatusInput" 
                                   class="custom-status-input" 
                                   placeholder="What's on your mind?"
                                   maxlength="128"
                                   value="${this.escapeHtml(customStatus)}">
                        </div>
                        <div class="emoji-picker-popup" id="emojiPickerPopup" style="display: none;">
                            ${this.renderEmojiPicker()}
                        </div>
                    </div>

                    <!-- Duration Selector -->
                    <div class="duration-section">
                        <label class="duration-label">Clear after</label>
                        <select id="durationSelect" class="duration-select">
                            <option value="">Don't clear</option>
                            <option value="240">4 hours</option>
                            <option value="1440">Today</option>
                            <option value="10080">This week</option>
                        </select>
                    </div>
                </div>
                <div class="status-picker-footer">
                    <button class="btn-secondary" id="clearStatusBtn">Clear Status</button>
                    <button class="btn-primary" id="saveStatusBtn">Save</button>
                </div>
            `;

            // Position dropdown near user panel
            const userPanel = document.getElementById('userPanel');
            if (userPanel) {
                const rect = userPanel.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.bottom = `${window.innerHeight - rect.top + 10}px`;
                dropdown.style.left = `${rect.left}px`;
            }

            document.body.appendChild(dropdown);
            this.visible = true;
            this.attachEventListeners();
        },

        /**
         * Render status option
         */
        renderStatusOption: function(status, emoji, label, currentStatus) {
            const isActive = status === currentStatus;
            return `
                <div class="status-option ${isActive ? 'active' : ''}" data-status="${status}">
                    <span class="status-emoji">${emoji}</span>
                    <span class="status-label">${label}</span>
                    ${isActive ? '<span class="status-check">✓</span>' : ''}
                </div>
            `;
        },

        /**
         * Render emoji picker
         */
        renderEmojiPicker: function() {
            const emojis = ['😊', '😎', '🎮', '💻', '🎧', '🎵', '📚', '🏠', '🌙', '☕', '🔥', '💪', '🎯', '✨', '🚀', '💡'];
            return `
                <div class="emoji-grid">
                    ${emojis.map(emoji => `<span class="emoji-item" data-emoji="${emoji}">${emoji}</span>`).join('')}
                </div>
            `;
        },

        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            const self = this;

            // Status options
            const statusOptions = document.querySelectorAll('.status-option');
            statusOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const status = this.dataset.status;
                    self.selectStatus(status);
                });
            });

            // Emoji picker toggle
            const emojiPickerBtn = document.getElementById('emojiPickerBtn');
            const emojiPickerPopup = document.getElementById('emojiPickerPopup');
            
            if (emojiPickerBtn && emojiPickerPopup) {
                emojiPickerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    emojiPickerPopup.style.display = emojiPickerPopup.style.display === 'none' ? 'block' : 'none';
                });
            }

            // Emoji selection
            const emojiItems = document.querySelectorAll('.emoji-item');
            emojiItems.forEach(item => {
                item.addEventListener('click', function() {
                    const emoji = this.dataset.emoji;
                    if (emojiPickerBtn) {
                        emojiPickerBtn.textContent = emoji;
                    }
                    if (emojiPickerPopup) {
                        emojiPickerPopup.style.display = 'none';
                    }
                });
            });

            // Save button
            const saveBtn = document.getElementById('saveStatusBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    self.saveStatus();
                });
            }

            // Clear button
            const clearBtn = document.getElementById('clearStatusBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    self.clearStatus();
                });
            }

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('statusPickerDropdown');
                if (dropdown && !dropdown.contains(e.target) && self.visible) {
                    const statusPickerBtn = document.getElementById('statusPickerBtn');
                    if (!statusPickerBtn || !statusPickerBtn.contains(e.target)) {
                        self.hide();
                    }
                }
            });
        },

        /**
         * Select status
         */
        selectStatus: function(status) {
            const options = document.querySelectorAll('.status-option');
            options.forEach(opt => {
                opt.classList.remove('active');
                const check = opt.querySelector('.status-check');
                if (check) check.remove();
            });

            const selected = document.querySelector(`.status-option[data-status="${status}"]`);
            if (selected) {
                selected.classList.add('active');
                selected.innerHTML += '<span class="status-check">✓</span>';
            }

            if (this.currentUser) {
                this.currentUser.status = status;
            }
        },

        /**
         * Save status
         */
        saveStatus: async function() {
            const customStatusInput = document.getElementById('customStatusInput');
            const emojiPickerBtn = document.getElementById('emojiPickerBtn');
            const durationSelect = document.getElementById('durationSelect');

            const customStatus = customStatusInput ? customStatusInput.value : '';
            const customEmoji = emojiPickerBtn ? emojiPickerBtn.textContent.trim() : '';
            const duration = durationSelect ? durationSelect.value : '';

            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.error('StatusPicker: No access token');
                    return;
                }

                const response = await fetch('/api/users/me/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: this.currentUser?.status || 'ONLINE',
                        customStatus: customStatus,
                        customStatusEmoji: customEmoji,
                        clearAfterMinutes: duration ? parseInt(duration) : null
                    })
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    this.currentUser = updatedUser;
                    
                    if (this.callback && typeof this.callback === 'function') {
                        this.callback(updatedUser);
                    }
                    
                    this.hide();
                } else {
                    console.error('StatusPicker: Failed to save status');
                }
            } catch (error) {
                console.error('StatusPicker: Error saving status:', error);
            }
        },

        /**
         * Clear status
         */
        clearStatus: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.error('StatusPicker: No access token');
                    return;
                }

                const response = await fetch('/api/users/me/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: 'ONLINE',
                        customStatus: null,
                        customStatusEmoji: null,
                        clearAfterMinutes: null
                    })
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    this.currentUser = updatedUser;
                    
                    if (this.callback && typeof this.callback === 'function') {
                        this.callback(updatedUser);
                    }
                    
                    this.hide();
                }
            } catch (error) {
                console.error('StatusPicker: Error clearing status:', error);
            }
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to window
    window.StatusPicker = StatusPicker;
})();