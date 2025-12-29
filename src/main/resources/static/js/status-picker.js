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

            const currentStatus = this.currentUser.status || 'ONLINE';
            const customStatus = this.currentUser.customStatus || '';
            const customEmoji = this.currentUser.customStatusEmoji || '';

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
                dropdown.style.left = `${rect.left}px`;
                dropdown.style.bottom = `${window.innerHeight - rect.top + 10}px`;
            }

            document.body.appendChild(dropdown);
            this.attachEventListeners();

            // Stop propagation to prevent closing
            dropdown.addEventListener('click', (e) => e.stopPropagation());
        },

        /**
         * Render status option radio button
         */
        renderStatusOption: function(value, emoji, label, currentStatus) {
            const checked = value === currentStatus ? 'checked' : '';
            return `
                <label class="status-option">
                    <input type="radio" 
                           name="status" 
                           value="${value}" 
                           ${checked}
                           class="status-radio">
                    <span class="status-emoji">${emoji}</span>
                    <span class="status-label">${label}</span>
                </label>
            `;
        },

        /**
         * Render emoji picker
         */
        renderEmojiPicker: function() {
            const emojis = ['😊', '😎', '🎮', '🎵', '🎨', '📚', '💼', '🏃', 
                           '☕', '🍕', '🎉', '💤', '🚀', '💻', '🎯', '🔥',
                           '❤️', '👍', '🙌', '✨', '⭐', '🌟', '💪', '🧠'];
            
            return emojis.map(emoji => 
                `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
            ).join('');
        },

        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            // Emoji picker toggle
            const emojiPickerBtn = document.getElementById('emojiPickerBtn');
            const emojiPickerPopup = document.getElementById('emojiPickerPopup');
            
            if (emojiPickerBtn) {
                emojiPickerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    emojiPickerPopup.style.display = 
                        emojiPickerPopup.style.display === 'none' ? 'block' : 'none';
                });
            }

            // Emoji selection
            document.querySelectorAll('.emoji-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const emoji = e.target.dataset.emoji;
                    emojiPickerBtn.textContent = emoji;
                    emojiPickerPopup.style.display = 'none';
                });
            });

            // Save button
            document.getElementById('saveStatusBtn').addEventListener('click', () => {
                this.saveStatus();
            });

            // Clear button
            document.getElementById('clearStatusBtn').addEventListener('click', () => {
                this.clearStatus();
            });
        },

        /**
         * Save status
         */
        saveStatus: async function() {
            const selectedStatus = document.querySelector('input[name="status"]:checked').value;
            const customStatusInput = document.getElementById('customStatusInput');
            const emojiPickerBtn = document.getElementById('emojiPickerBtn');
            const durationSelect = document.getElementById('durationSelect');

            const customStatus = customStatusInput.value.trim();
            const customEmoji = customStatus ? emojiPickerBtn.textContent : null;
            const duration = durationSelect.value ? parseInt(durationSelect.value) : null;

            try {
                const response = await fetch('/api/users/me/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({
                        status: selectedStatus,
                        customStatus: customStatus || null,
                        customStatusEmoji: customEmoji,
                        customStatusDuration: duration
                    })
                });

                if (response.ok) {
                    // Update local state
                    const updatedStatus = {
                        status: selectedStatus,
                        customStatus: customStatus || null,
                        customStatusEmoji: customEmoji
                    };

                    if (this.callback) {
                        this.callback(updatedStatus);
                    }

                    this.hide();
                } else {
                    alert('Failed to update status');
                }
            } catch (error) {
                console.error('Error saving status:', error);
                alert('Failed to save status');
            }
        },

        /**
         * Clear status
         */
        clearStatus: async function() {
            try {
                const response = await fetch('/api/users/me/custom-status', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.ok) {
                    document.getElementById('customStatusInput').value = '';
                    document.getElementById('emojiPickerBtn').textContent = '😊';
                    document.getElementById('durationSelect').value = '';
                    
                    if (this.callback) {
                        this.callback({
                            status: this.currentUser.status,
                            customStatus: null,
                            customStatusEmoji: null
                        });
                    }

                    this.hide();
                }
            } catch (error) {
                console.error('Error clearing status:', error);
            }
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to window
    window.StatusPicker = StatusPicker;
})();
