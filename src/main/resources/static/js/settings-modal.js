/**
 * Settings Modal Component
 * Discord-style full-screen settings overlay
 */
(function() {
    'use strict';

    const SettingsModal = {
        currentUser: null,
        activeSection: 'my-account',
        modalElement: null,
        isOpen: false,

        /**
         * Navigation items configuration
         */
        navConfig: [
            {
                header: 'USER SETTINGS',
                items: [
                    { id: 'my-account', label: 'My Account', icon: 'user' },
                    { id: 'profiles', label: 'Profiles', icon: 'id-card' },
                    { id: 'privacy-safety', label: 'Privacy & Safety', icon: 'shield' }
                ]
            },
            {
                header: 'APP SETTINGS',
                items: [
                    { id: 'appearance', label: 'Appearance', icon: 'palette' },
                    { id: 'accessibility', label: 'Accessibility', icon: 'universal-access' },
                    { id: 'voice-video', label: 'Voice & Video', icon: 'microphone' },
                    { id: 'keybinds', label: 'Keybinds', icon: 'keyboard' },
                    { id: 'language', label: 'Language', icon: 'globe' }
                ]
            },
            {
                divider: true
            },
            {
                items: [
                    { id: 'logout', label: 'Log Out', icon: 'sign-out-alt', isLogout: true }
                ]
            }
        ],

        /**
         * Initialize the settings modal
         */
        init: function() {
            // Create modal element if not exists
            if (!document.getElementById('settingsModalOverlay')) {
                this.createModalElement();
            }
            this.attachGlobalListeners();
        },

        /**
         * Create the modal DOM element
         */
        createModalElement: function() {
            const modal = document.createElement('div');
            modal.id = 'settingsModalOverlay';
            modal.className = 'settings-modal-overlay';
            modal.style.display = 'none';
            document.body.appendChild(modal);
            this.modalElement = modal;
        },

        /**
         * Attach global event listeners
         */
        attachGlobalListeners: function() {
            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },

        /**
         * Open the settings modal
         */
        open: async function(section = 'my-account') {
            if (!this.modalElement) {
                this.createModalElement();
            }

            // Load current user data
            await this.loadCurrentUser();
            
            this.activeSection = section;
            this.render();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus trap
            this.modalElement.focus();
        },

        /**
         * Close the settings modal
         */
        close: function() {
            if (this.modalElement) {
                this.modalElement.style.display = 'none';
            }
            this.isOpen = false;
            document.body.style.overflow = '';
        },

        /**
         * Load current user data
         */
        loadCurrentUser: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return null;

                const response = await fetch('/api/users/me/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.currentUser = await response.json();
                    return this.currentUser;
                }
            } catch (error) {
                console.error('SettingsModal: Failed to load user profile:', error);
            }
            return null;
        },

        /**
         * Render the complete modal
         */
        render: function() {
            if (!this.modalElement) return;

            this.modalElement.innerHTML = `
                <div class="settings-modal-container">
                    <!-- Left Sidebar -->
                    <div class="settings-sidebar-wrapper">
                        <div class="settings-sidebar-scroller">
                            <nav class="settings-sidebar">
                                ${this.renderSearchBar()}
                                ${this.renderNavigation()}
                            </nav>
                        </div>
                    </div>

                    <!-- Right Content Area -->
                    <div class="settings-content-wrapper">
                        <div class="settings-content-scroller">
                            <div class="settings-content-column" id="settingsContentArea">
                                ${this.renderContent()}
                            </div>
                        </div>
                        
                        <!-- Close Button -->
                        <div class="settings-close-wrapper" id="settingsCloseBtn">
                            <button class="settings-close-button" title="Close">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                                </svg>
                            </button>
                            <span class="settings-close-keybind">ESC</span>
                        </div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        },

        /**
         * Render the search bar
         */
        renderSearchBar: function() {
            return `
                <div class="settings-search-container">
                    <input type="text" class="settings-search-input" placeholder="Search" id="settingsSearch">
                </div>
            `;
        },

        /**
         * Render the navigation sidebar
         */
        renderNavigation: function() {
            let html = '';

            this.navConfig.forEach(group => {
                if (group.divider) {
                    html += '<div class="settings-nav-divider"></div>';
                    return;
                }

                html += '<div class="settings-nav-group">';
                
                if (group.header) {
                    html += `<div class="settings-nav-header">${group.header}</div>`;
                }

                group.items.forEach(item => {
                    const isActive = this.activeSection === item.id ? 'active' : '';
                    const isLogout = item.isLogout ? 'logout-item' : '';
                    
                    html += `
                        <button class="settings-nav-item ${isActive} ${isLogout}" 
                                data-section="${item.id}">
                            <span>${item.label}</span>
                        </button>
                    `;
                });

                html += '</div>';
            });

            return html;
        },

        /**
         * Render the content area based on active section
         */
        renderContent: function() {
            switch (this.activeSection) {
                case 'my-account':
                    return this.renderMyAccount();
                case 'profiles':
                    return this.renderProfiles();
                case 'privacy-safety':
                    return this.renderPrivacySafety();
                case 'appearance':
                    return this.renderAppearance();
                case 'accessibility':
                    return this.renderAccessibility();
                case 'voice-video':
                    return this.renderVoiceVideo();
                case 'keybinds':
                    return this.renderKeybinds();
                case 'language':
                    return this.renderLanguage();
                default:
                    return this.renderMyAccount();
            }
        },

        /**
         * Render My Account section
         */
        renderMyAccount: function() {
            const user = this.currentUser || {};
            const displayName = user.displayName || user.username || 'User';
            const username = user.username || 'username';
            const email = user.email || 'email@example.com';
            const maskedEmail = this.maskEmail(email);
            const status = (user.status || 'online').toLowerCase();
            const bannerColor = user.bannerColor || 'linear-gradient(135deg, #5865f2 0%, #eb459e 100%)';

            return `
                <div class="settings-header">
                    <h1>My Account</h1>
                </div>

                <!-- Profile Card -->
                <div class="settings-profile-card">
                    <div class="settings-profile-banner" 
                         style="${user.bannerUrl ? `background-image: url('${this.escapeHtml(user.bannerUrl)}')` : `background: ${bannerColor}`}">
                    </div>
                    <div class="settings-profile-info">
                        <div class="settings-profile-avatar-wrapper">
                            ${user.avatarUrl 
                                ? `<img src="${this.escapeHtml(user.avatarUrl)}" alt="Avatar" class="settings-profile-avatar">`
                                : `<div class="settings-profile-avatar-placeholder">${displayName.charAt(0).toUpperCase()}</div>`
                            }
                            <div class="settings-profile-avatar-status status-${status}"></div>
                        </div>
                        <div class="settings-profile-details">
                            <div class="settings-profile-name-section">
                                <span class="settings-profile-displayname">${this.escapeHtml(displayName)}</span>
                                <span class="settings-profile-badge">User</span>
                            </div>
                            <button class="settings-edit-profile-btn" id="editUserProfileBtn">
                                Edit User Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Editable Fields -->
                <div class="settings-fields-section">
                    <div class="settings-field-row">
                        <div class="settings-field-info">
                            <div class="settings-field-label">DISPLAY NAME</div>
                            <div class="settings-field-value">${this.escapeHtml(displayName)}</div>
                        </div>
                        <button class="settings-field-btn" data-action="edit-displayname">Edit</button>
                    </div>
                    <div class="settings-field-row">
                        <div class="settings-field-info">
                            <div class="settings-field-label">USERNAME</div>
                            <div class="settings-field-value">${this.escapeHtml(username)}</div>
                        </div>
                        <button class="settings-field-btn" data-action="edit-username">Edit</button>
                    </div>
                    <div class="settings-field-row">
                        <div class="settings-field-info">
                            <div class="settings-field-label">EMAIL</div>
                            <div class="settings-field-value reveal-hidden">${maskedEmail}</div>
                        </div>
                        <button class="settings-field-btn" data-action="edit-email">Edit</button>
                    </div>
                    <div class="settings-field-row">
                        <div class="settings-field-info">
                            <div class="settings-field-label">PHONE NUMBER</div>
                            <div class="settings-field-value">${user.phone ? this.escapeHtml(user.phone) : 'Not added yet'}</div>
                        </div>
                        <button class="settings-field-btn" data-action="add-phone">${user.phone ? 'Edit' : 'Add'}</button>
                    </div>
                </div>

                <!-- Password & Authentication -->
                <div class="settings-password-section">
                    <h3 class="settings-section-title">Password and Authentication</h3>
                    <button class="settings-password-btn" id="changePasswordBtn">
                        Change Password
                    </button>
                </div>

                <div class="settings-section-divider"></div>

                <!-- Two-Factor Authentication -->
                <div class="settings-2fa-section">
                    <h3 class="settings-section-title">TWO-FACTOR AUTHENTICATION</h3>
                    <div class="settings-2fa-card">
                        <div class="settings-2fa-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                            </svg>
                        </div>
                        <div class="settings-2fa-content">
                            <div class="settings-2fa-title">Protect your account with Two-Factor Authentication</div>
                            <div class="settings-2fa-description">
                                Two-Factor authentication is an extra layer of security for your account. When you sign in, you'll need to enter a code from your authenticator app.
                            </div>
                            <button class="settings-2fa-btn">Enable Two-Factor Auth</button>
                        </div>
                    </div>
                </div>

                <div class="settings-section-divider"></div>

                <!-- Account Removal -->
                <div class="settings-removal-section">
                    <h3 class="settings-section-title">ACCOUNT REMOVAL</h3>
                    <p class="settings-removal-description">
                        Disabling your account means you can recover it at any time after taking this action.
                    </p>
                    <div class="settings-removal-buttons">
                        <button class="settings-disable-btn" id="disableAccountBtn">
                            Disable Account
                        </button>
                        <button class="settings-delete-btn" id="deleteAccountBtn">
                            Delete Account
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Render Profiles section
         */
        renderProfiles: function() {
            const user = this.currentUser || {};
            const displayName = user.displayName || user.username || 'User';
            const bio = user.bio || '';
            const status = (user.status || 'online').toLowerCase();

            return `
                <div class="settings-header">
                    <h1>Profiles</h1>
                </div>

                <div class="settings-profile-preview">
                    <!-- Editor Side -->
                    <div class="settings-profile-editor">
                        <div class="settings-form-group">
                            <label class="settings-form-label">DISPLAY NAME</label>
                            <input type="text" class="settings-form-input" value="${this.escapeHtml(displayName)}" id="profileDisplayName">
                        </div>

                        <div class="settings-form-group">
                            <label class="settings-form-label">AVATAR</label>
                            <div class="settings-avatar-upload">
                                ${user.avatarUrl 
                                    ? `<img src="${this.escapeHtml(user.avatarUrl)}" alt="Avatar" class="settings-avatar-preview">`
                                    : `<div class="settings-avatar-preview-placeholder">${displayName.charAt(0).toUpperCase()}</div>`
                                }
                                <div class="settings-avatar-actions">
                                    <button class="settings-avatar-change-btn" id="changeAvatarBtn">Change Avatar</button>
                                    <button class="settings-avatar-remove-btn" id="removeAvatarBtn">Remove Avatar</button>
                                </div>
                            </div>
                        </div>

                        <div class="settings-form-group">
                            <label class="settings-form-label">BANNER COLOR</label>
                            <input type="color" class="settings-form-input" value="#5865f2" style="height: 40px; padding: 4px;">
                        </div>

                        <div class="settings-form-group">
                            <label class="settings-form-label">ABOUT ME</label>
                            <textarea class="settings-form-textarea" placeholder="Tell everyone a little about yourself" id="profileBio">${this.escapeHtml(bio)}</textarea>
                        </div>
                    </div>

                    <!-- Preview Card -->
                    <div class="settings-profile-preview-card">
                        <div class="settings-profile-banner" 
                             style="${user.bannerUrl ? `background-image: url('${this.escapeHtml(user.bannerUrl)}')` : 'background: linear-gradient(135deg, #5865f2 0%, #eb459e 100%)'}; height: 60px;">
                        </div>
                        <div class="settings-profile-info" style="padding: 12px 12px 12px 80px;">
                            <div class="settings-profile-avatar-wrapper" style="top: -24px;">
                                ${user.avatarUrl 
                                    ? `<img src="${this.escapeHtml(user.avatarUrl)}" alt="Avatar" class="settings-profile-avatar" style="width: 56px; height: 56px; border-width: 4px;">`
                                    : `<div class="settings-profile-avatar-placeholder" style="width: 56px; height: 56px; font-size: 24px; border-width: 4px;">${displayName.charAt(0).toUpperCase()}</div>`
                                }
                                <div class="settings-profile-avatar-status status-${status}" style="width: 16px; height: 16px; border-width: 3px;"></div>
                            </div>
                            <div class="settings-profile-name-section">
                                <span class="settings-profile-displayname" style="font-size: 16px;">${this.escapeHtml(displayName)}</span>
                            </div>
                        </div>
                        <div style="padding: 0 12px 12px; font-size: 13px; color: #b5bac1;">
                            ${bio ? this.escapeHtml(bio) : 'No bio yet.'}
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Render Privacy & Safety section
         */
        renderPrivacySafety: function() {
            return `
                <div class="settings-header">
                    <h1>Privacy & Safety</h1>
                </div>

                <h3 class="settings-section-title">SAFE DIRECT MESSAGING</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Keep me safe</h4>
                        <p>Automatically scan and delete direct messages you receive that contain explicit media.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">SERVER PRIVACY DEFAULTS</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Allow direct messages from server members</h4>
                        <p>This setting is applied when you join a new server. It does not apply to existing servers.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Allow access to age-restricted servers</h4>
                        <p>You must be 18 years or older to access age-restricted servers.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">WHO CAN ADD YOU AS A FRIEND</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Everyone</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Friends of Friends</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Server Members</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            `;
        },

        /**
         * Render Appearance section
         */
        renderAppearance: function() {
            return `
                <div class="settings-header">
                    <h1>Appearance</h1>
                </div>

                <h3 class="settings-section-title">THEME</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Dark</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="theme" value="dark" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Light</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="theme" value="light">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">MESSAGE DISPLAY</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Cozy</h4>
                        <p>Modern display with larger avatars.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="messageDisplay" value="cozy" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Compact</h4>
                        <p>Classic IRC-style display with smaller text.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="messageDisplay" value="compact">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">CHAT FONT SCALING</h3>
                
                <div class="settings-voice-slider-container">
                    <div class="settings-voice-slider-label">
                        <span>Font Size</span>
                        <span>16px</span>
                    </div>
                    <input type="range" class="settings-voice-slider" min="12" max="24" value="16">
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">ADVANCED</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Developer Mode</h4>
                        <p>Enables Developer Tools, including ability to copy IDs.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            `;
        },

        /**
         * Render Accessibility section
         */
        renderAccessibility: function() {
            return `
                <div class="settings-header">
                    <h1>Accessibility</h1>
                </div>

                <h3 class="settings-section-title">SATURATION</h3>
                
                <div class="settings-voice-slider-container">
                    <div class="settings-voice-slider-label">
                        <span>Role Color Saturation</span>
                        <span>100%</span>
                    </div>
                    <input type="range" class="settings-voice-slider" min="0" max="100" value="100">
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">TEXT-TO-SPEECH</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Allow playback and usage of /tts command</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">TEXT-TO-SPEECH RATE</h3>
                
                <div class="settings-voice-slider-container">
                    <div class="settings-voice-slider-label">
                        <span>Speed</span>
                        <span>1.0x</span>
                    </div>
                    <input type="range" class="settings-voice-slider" min="0.5" max="2" step="0.1" value="1">
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">REDUCED MOTION</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Enable Reduced Motion</h4>
                        <p>Disables animations throughout the app.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Stickers</h4>
                        <p>Controls how animated stickers are played.</p>
                    </div>
                    <select class="settings-select">
                        <option value="always">Always animate</option>
                        <option value="hover">Animate on hover</option>
                        <option value="never">Never animate</option>
                    </select>
                </div>
            `;
        },

        /**
         * Render Voice & Video section
         */
        renderVoiceVideo: function() {
            return `
                <div class="settings-header">
                    <h1>Voice & Video</h1>
                </div>

                <h3 class="settings-section-title">INPUT DEVICE</h3>
                
                <div class="settings-voice-device">
                    <select class="settings-voice-select">
                        <option value="default">Default - Microphone</option>
                        <option value="mic1">Microphone (Built-in)</option>
                        <option value="mic2">External Microphone</option>
                    </select>
                </div>

                <div class="settings-voice-slider-container">
                    <div class="settings-voice-slider-label">
                        <span>INPUT VOLUME</span>
                        <span>100%</span>
                    </div>
                    <input type="range" class="settings-voice-slider" min="0" max="100" value="100">
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">OUTPUT DEVICE</h3>
                
                <div class="settings-voice-device">
                    <select class="settings-voice-select">
                        <option value="default">Default - Speakers</option>
                        <option value="speaker1">Speakers (Built-in)</option>
                        <option value="speaker2">Headphones</option>
                    </select>
                </div>

                <div class="settings-voice-slider-container">
                    <div class="settings-voice-slider-label">
                        <span>OUTPUT VOLUME</span>
                        <span>100%</span>
                    </div>
                    <input type="range" class="settings-voice-slider" min="0" max="100" value="100">
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">INPUT MODE</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Voice Activity</h4>
                        <p>Automatically detect when you speak.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="inputMode" value="voice" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Push to Talk</h4>
                        <p>Use a keybind to transmit voice.</p>
                    </div>
                    <label class="settings-toggle">
                        <input type="radio" name="inputMode" value="ptt">
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">ADVANCED</h3>
                
                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Echo Cancellation</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Noise Suppression</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-toggle-row">
                    <div class="settings-toggle-info">
                        <h4>Automatic Gain Control</h4>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" checked>
                        <span class="settings-toggle-slider"></span>
                    </label>
                </div>
            `;
        },

        /**
         * Render Keybinds section
         */
        renderKeybinds: function() {
            return `
                <div class="settings-header">
                    <h1>Keybinds</h1>
                </div>

                <p class="settings-removal-description">
                    Customize keyboard shortcuts to perform various actions quickly.
                </p>

                <h3 class="settings-section-title" style="margin-top: 24px;">NAVIGATION</h3>
                
                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Quick Switcher</span>
                    <span class="settings-keybind-key">Ctrl + K</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Search</span>
                    <span class="settings-keybind-key">Ctrl + F</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Navigate to previous server</span>
                    <span class="settings-keybind-key">Ctrl + Alt + ↑</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Navigate to next server</span>
                    <span class="settings-keybind-key">Ctrl + Alt + ↓</span>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">CHAT</h3>
                
                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Send message</span>
                    <span class="settings-keybind-key">Enter</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">New line</span>
                    <span class="settings-keybind-key">Shift + Enter</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Edit last message</span>
                    <span class="settings-keybind-key">↑</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Upload file</span>
                    <span class="settings-keybind-key">Ctrl + U</span>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">VOICE</h3>
                
                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Toggle Mute</span>
                    <span class="settings-keybind-key">Ctrl + Shift + M</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Toggle Deafen</span>
                    <span class="settings-keybind-key">Ctrl + Shift + D</span>
                </div>

                <h3 class="settings-section-title" style="margin-top: 32px;">OTHER</h3>
                
                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Close modal / dialog</span>
                    <span class="settings-keybind-key">Escape</span>
                </div>

                <div class="settings-keybind-row">
                    <span class="settings-keybind-action">Mark as Read</span>
                    <span class="settings-keybind-key">Escape</span>
                </div>
            `;
        },

        /**
         * Render Language section
         */
        renderLanguage: function() {
            return `
                <div class="settings-header">
                    <h1>Language</h1>
                </div>

                <h3 class="settings-section-title">SELECT LANGUAGE</h3>
                
                <p class="settings-removal-description">
                    Choose the language you'd like to use with CoCoCord.
                </p>

                <div class="settings-form-group" style="margin-top: 16px;">
                    <select class="settings-voice-select" style="width: 100%; max-width: 300px;">
                        <option value="en-US">English (United States)</option>
                        <option value="en-GB">English (United Kingdom)</option>
                        <option value="vi" selected>Tiếng Việt</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="zh-CN">中文 (简体)</option>
                        <option value="zh-TW">中文 (繁體)</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="es-ES">Español</option>
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>
            `;
        },

        /**
         * Attach event listeners after render
         */
        attachEventListeners: function() {
            // Close button
            const closeBtn = document.getElementById('settingsCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            // Navigation items
            const navItems = this.modalElement.querySelectorAll('.settings-nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const section = item.dataset.section;
                    
                    if (section === 'logout') {
                        this.handleLogout();
                        return;
                    }

                    // Update active state
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');

                    // Update content
                    this.activeSection = section;
                    const contentArea = document.getElementById('settingsContentArea');
                    if (contentArea) {
                        contentArea.innerHTML = this.renderContent();
                        this.attachContentListeners();
                    }
                });
            });

            // Attach content-specific listeners
            this.attachContentListeners();
        },

        /**
         * Attach content-specific event listeners
         */
        attachContentListeners: function() {
            // Edit User Profile button
            const editProfileBtn = document.getElementById('editUserProfileBtn');
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    this.switchToSection('profiles');
                });
            }

            // Change Password button
            const changePasswordBtn = document.getElementById('changePasswordBtn');
            if (changePasswordBtn) {
                changePasswordBtn.addEventListener('click', () => {
                    window.location.href = '/change-password';
                });
            }

            // Disable Account button
            const disableAccountBtn = document.getElementById('disableAccountBtn');
            if (disableAccountBtn) {
                disableAccountBtn.addEventListener('click', () => {
                    this.showConfirmDialog(
                        'Disable Account',
                        'Are you sure you want to disable your account? You can re-enable it at any time.',
                        () => this.disableAccount()
                    );
                });
            }

            // Delete Account button
            const deleteAccountBtn = document.getElementById('deleteAccountBtn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', () => {
                    this.showConfirmDialog(
                        'Delete Account',
                        'Are you sure you want to delete your account? This action cannot be undone.',
                        () => this.deleteAccount(),
                        true
                    );
                });
            }

            // Field edit buttons
            const fieldBtns = this.modalElement.querySelectorAll('[data-action]');
            fieldBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    this.handleFieldAction(action);
                });
            });
        },

        /**
         * Switch to a specific section
         */
        switchToSection: function(sectionId) {
            const navItem = this.modalElement.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.click();
            }
        },

        /**
         * Handle field edit actions
         */
        handleFieldAction: function(action) {
            switch (action) {
                case 'edit-displayname':
                    this.showEditDisplayNamePopup();
                    break;
                case 'edit-username':
                    this.showEditUsernamePopup();
                    break;
                case 'edit-email':
                    this.showEditEmailPopup();
                    break;
                case 'add-phone':
                    this.showEditPhonePopup();
                    break;
                default:
                    console.log('Unknown action:', action);
            }
        },

        /**
         * Show Edit Display Name Popup
         */
        showEditDisplayNamePopup: function() {
            const user = this.currentUser || {};
            const currentDisplayName = user.displayName || user.username || '';

            const popupHtml = `
                <div class="settings-edit-popup-overlay" id="settingsEditPopup">
                    <div class="settings-edit-popup">
                        <div class="settings-edit-popup-header">
                            <h2 class="settings-edit-popup-title">Change your display name</h2>
                            <p class="settings-edit-popup-subtitle">Enter a new display name</p>
                        </div>
                        <div class="settings-edit-popup-body">
                            <div class="settings-edit-popup-field">
                                <label class="settings-edit-popup-label" id="displayNameLabel">DISPLAY NAME</label>
                                <input type="text" 
                                       class="settings-edit-popup-input" 
                                       id="editDisplayNameInput" 
                                       value="${this.escapeHtml(currentDisplayName)}"
                                       maxlength="50"
                                       placeholder="Enter display name">
                                <div class="settings-edit-popup-counter" id="displayNameCounter">${currentDisplayName.length}/50</div>
                                <div class="settings-edit-popup-error" id="displayNameError"></div>
                            </div>
                        </div>
                        <div class="settings-edit-popup-footer">
                            <button class="settings-edit-popup-btn cancel" id="editPopupCancel">Cancel</button>
                            <button class="settings-edit-popup-btn save" id="editPopupSave">Done</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            this.attachEditPopupListeners('displayName');
            document.getElementById('editDisplayNameInput').focus();
            document.getElementById('editDisplayNameInput').select();
        },

        /**
         * Show Edit Username Popup
         */
        showEditUsernamePopup: function() {
            const user = this.currentUser || {};
            const currentUsername = user.username || '';

            const popupHtml = `
                <div class="settings-edit-popup-overlay" id="settingsEditPopup">
                    <div class="settings-edit-popup">
                        <div class="settings-edit-popup-header">
                            <h2 class="settings-edit-popup-title">Change your username</h2>
                            <p class="settings-edit-popup-subtitle">Enter a new username.</p>
                        </div>
                        <div class="settings-edit-popup-body">
                            <div class="settings-edit-popup-field">
                                <label class="settings-edit-popup-label" id="usernameLabel">USERNAME</label>
                                <input type="text" 
                                       class="settings-edit-popup-input" 
                                       id="editUsernameInput" 
                                       value="${this.escapeHtml(currentUsername)}"
                                       maxlength="32"
                                       placeholder="Enter username">
                                <div class="settings-edit-popup-counter" id="usernameCounter">${currentUsername.length}/32</div>
                                <div class="settings-edit-popup-hint">Username can only contain letters, numbers, and underscores (3-32 characters).</div>
                                <div class="settings-edit-popup-error" id="usernameError"></div>
                            </div>
                        </div>
                        <div class="settings-edit-popup-footer">
                            <button class="settings-edit-popup-btn cancel" id="editPopupCancel">Cancel</button>
                            <button class="settings-edit-popup-btn save" id="editPopupSave">Done</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            this.attachEditPopupListeners('username');
            document.getElementById('editUsernameInput').focus();
            document.getElementById('editUsernameInput').select();
        },

        /**
         * Show Edit Email Popup
         */
        showEditEmailPopup: function() {
            const user = this.currentUser || {};
            const currentEmail = user.email || '';

            const popupHtml = `
                <div class="settings-edit-popup-overlay" id="settingsEditPopup">
                    <div class="settings-edit-popup">
                        <div class="settings-edit-popup-header">
                            <h2 class="settings-edit-popup-title">Enter an email address</h2>
                            <p class="settings-edit-popup-subtitle">Enter a new email address.</p>
                        </div>
                        <div class="settings-edit-popup-body">
                            <div class="settings-edit-popup-field">
                                <label class="settings-edit-popup-label" id="emailLabel">EMAIL</label>
                                <input type="email" 
                                       class="settings-edit-popup-input" 
                                       id="editEmailInput" 
                                       value="${this.escapeHtml(currentEmail)}"
                                       maxlength="150"
                                       placeholder="Enter email address">
                                <div class="settings-edit-popup-error" id="emailError"></div>
                            </div>
                        </div>
                        <div class="settings-edit-popup-footer">
                            <button class="settings-edit-popup-btn cancel" id="editPopupCancel">Cancel</button>
                            <button class="settings-edit-popup-btn save" id="editPopupSave">Done</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            this.attachEditPopupListeners('email');
            document.getElementById('editEmailInput').focus();
            document.getElementById('editEmailInput').select();
        },

        /**
         * Show Edit Phone Popup
         */
        showEditPhonePopup: function() {
            const user = this.currentUser || {};
            const currentPhone = user.phone || '';

            const popupHtml = `
                <div class="settings-edit-popup-overlay" id="settingsEditPopup">
                    <div class="settings-edit-popup">
                        <div class="settings-edit-popup-header">
                            <h2 class="settings-edit-popup-title">${currentPhone ? 'Change your phone number' : 'Add phone number'}</h2>
                            <p class="settings-edit-popup-subtitle">Enter your phone number for additional account security.</p>
                        </div>
                        <div class="settings-edit-popup-body">
                            <div class="settings-edit-popup-field">
                                <label class="settings-edit-popup-label" id="phoneLabel">PHONE NUMBER</label>
                                <input type="tel" 
                                       class="settings-edit-popup-input" 
                                       id="editPhoneInput" 
                                       value="${this.escapeHtml(currentPhone)}"
                                       placeholder="+84 xxx xxx xxx">
                                <div class="settings-edit-popup-hint">Include your country code (e.g., +84 for Vietnam)</div>
                                <div class="settings-edit-popup-error" id="phoneError"></div>
                            </div>
                        </div>
                        <div class="settings-edit-popup-footer">
                            <button class="settings-edit-popup-btn cancel" id="editPopupCancel">Cancel</button>
                            <button class="settings-edit-popup-btn save" id="editPopupSave">Done</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            this.attachEditPopupListeners('phone');
            document.getElementById('editPhoneInput').focus();
        },

        /**
         * Attach event listeners for edit popup
         */
        attachEditPopupListeners: function(fieldType) {
            const popup = document.getElementById('settingsEditPopup');
            const cancelBtn = document.getElementById('editPopupCancel');
            const saveBtn = document.getElementById('editPopupSave');
            const togglePassword = document.getElementById('togglePassword');

            // Close on overlay click
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    this.closeEditPopup();
                }
            });

            // Cancel button
            cancelBtn.addEventListener('click', () => {
                this.closeEditPopup();
            });

            // ESC key to close
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeEditPopup();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Toggle password visibility
            if (togglePassword) {
                togglePassword.addEventListener('click', () => {
                    const passwordInput = document.getElementById('editCurrentPassword');
                    const type = passwordInput.type === 'password' ? 'text' : 'password';
                    passwordInput.type = type;
                    
                    // Update icon
                    togglePassword.innerHTML = type === 'password' 
                        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'
                        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
                });
            }

            // Character counter for display name
            if (fieldType === 'displayName') {
                const input = document.getElementById('editDisplayNameInput');
                const counter = document.getElementById('displayNameCounter');
                input.addEventListener('input', () => {
                    const len = input.value.length;
                    counter.textContent = `${len}/50`;
                    counter.className = 'settings-edit-popup-counter' + (len > 45 ? ' warning' : '') + (len >= 50 ? ' error' : '');
                });
            }

            // Character counter for username
            if (fieldType === 'username') {
                const input = document.getElementById('editUsernameInput');
                const counter = document.getElementById('usernameCounter');
                input.addEventListener('input', () => {
                    const len = input.value.length;
                    counter.textContent = `${len}/32`;
                    counter.className = 'settings-edit-popup-counter' + (len > 28 ? ' warning' : '') + (len >= 32 ? ' error' : '');
                });
            }

            // Save button
            saveBtn.addEventListener('click', () => {
                this.saveFieldEdit(fieldType);
            });

            // Enter key to save
            const inputs = popup.querySelectorAll('.settings-edit-popup-input');
            inputs.forEach(input => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.saveFieldEdit(fieldType);
                    }
                });
            });
        },

        /**
         * Close edit popup
         */
        closeEditPopup: function() {
            const popup = document.getElementById('settingsEditPopup');
            if (popup) {
                popup.remove();
            }
        },

        /**
         * Save field edit
         */
        saveFieldEdit: async function(fieldType) {
            const saveBtn = document.getElementById('editPopupSave');
            
            // Show loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span>Saving...';

            try {
                let requestBody = {};
                let isValid = true;

                switch (fieldType) {
                    case 'displayName':
                        const displayName = document.getElementById('editDisplayNameInput').value.trim();
                        if (!displayName) {
                            this.showFieldError('displayNameError', 'Display name cannot be empty');
                            isValid = false;
                        } else if (displayName.length > 50) {
                            this.showFieldError('displayNameError', 'Display name cannot exceed 50 characters');
                            isValid = false;
                        }
                        requestBody.displayName = displayName;
                        break;

                    case 'username':
                        const username = document.getElementById('editUsernameInput').value.trim();
                        
                        if (!username) {
                            this.showFieldError('usernameError', 'Username cannot be empty');
                            isValid = false;
                        } else if (username.length < 3) {
                            this.showFieldError('usernameError', 'Username must be at least 3 characters');
                            isValid = false;
                        } else if (username.length > 32) {
                            this.showFieldError('usernameError', 'Username cannot exceed 32 characters');
                            isValid = false;
                        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                            this.showFieldError('usernameError', 'Username can only contain letters, numbers, and underscores');
                            isValid = false;
                        }
                        
                        requestBody.username = username;
                        break;

                    case 'email':
                        const email = document.getElementById('editEmailInput').value.trim();
                        
                        if (!email) {
                            this.showFieldError('emailError', 'Email cannot be empty');
                            isValid = false;
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            this.showFieldError('emailError', 'Please enter a valid email address');
                            isValid = false;
                        }
                        
                        requestBody.email = email;
                        break;

                    case 'phone':
                        const phone = document.getElementById('editPhoneInput').value.trim();
                        if (phone && !/^\+?[0-9\s-]{8,20}$/.test(phone)) {
                            this.showFieldError('phoneError', 'Please enter a valid phone number');
                            isValid = false;
                        }
                        requestBody.phone = phone || null;
                        break;
                }

                if (!isValid) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Done';
                    return;
                }

                // Make API call
                const token = localStorage.getItem('accessToken');
                const response = await fetch('/api/users/me/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    const updatedProfile = await response.json();
                    this.currentUser = updatedProfile;
                    this.closeEditPopup();
                    this.showToast('Settings saved successfully!');
                    
                    // Refresh the content area
                    const contentArea = document.getElementById('settingsContentArea');
                    if (contentArea) {
                        contentArea.innerHTML = this.renderContent();
                        this.attachContentListeners();
                    }
                } else {
                    const errorData = await response.json();
                    let errorMessage = errorData.message || 'Failed to save changes';
                    
                    // Handle specific error cases
                    if (errorMessage.toLowerCase().includes('username')) {
                        this.showFieldError('usernameError', errorMessage);
                    } else if (errorMessage.toLowerCase().includes('email')) {
                        this.showFieldError('emailError', errorMessage);
                    } else if (errorMessage.toLowerCase().includes('password')) {
                        this.showFieldError('passwordError', errorMessage);
                    } else {
                        this.showToast(errorMessage, true);
                    }
                    
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Done';
                }
            } catch (error) {
                console.error('Failed to save settings:', error);
                this.showToast('An error occurred. Please try again.', true);
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Done';
            }
        },

        /**
         * Show field error
         */
        showFieldError: function(errorId, message) {
            const errorEl = document.getElementById(errorId);
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add('visible');
            }

            // Add error class to corresponding input
            const labelId = errorId.replace('Error', 'Label');
            const label = document.getElementById(labelId);
            if (label) {
                label.classList.add('error');
            }
        },

        /**
         * Show toast notification
         */
        showToast: function(message, isError = false) {
            // Remove existing toast
            const existingToast = document.querySelector('.settings-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `settings-toast${isError ? ' error' : ''}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            // Auto remove after 3 seconds
            setTimeout(() => {
                toast.remove();
            }, 3000);
        },

        /**
         * Show confirmation dialog
         */
        showConfirmDialog: function(title, message, onConfirm, isDanger = false) {
            const popupHtml = `
                <div class="settings-edit-popup-overlay" id="settingsConfirmPopup">
                    <div class="settings-edit-popup confirm">
                        <div class="settings-edit-popup-header">
                            <h2 class="settings-edit-popup-title">${this.escapeHtml(title)}</h2>
                            <p class="settings-edit-popup-subtitle">${this.escapeHtml(message)}</p>
                        </div>
                        <div class="settings-edit-popup-footer">
                            <button class="settings-edit-popup-btn cancel" id="confirmPopupCancel">Cancel</button>
                            <button class="settings-edit-popup-btn ${isDanger ? 'danger' : 'save'}" id="confirmPopupConfirm">${isDanger ? 'Delete' : 'Confirm'}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);

            const popup = document.getElementById('settingsConfirmPopup');
            const cancelBtn = document.getElementById('confirmPopupCancel');
            const confirmBtn = document.getElementById('confirmPopupConfirm');

            // Close on overlay click
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.remove();
                }
            });

            // Cancel button
            cancelBtn.addEventListener('click', () => {
                popup.remove();
            });

            // Confirm button
            confirmBtn.addEventListener('click', () => {
                popup.remove();
                onConfirm();
            });

            // ESC key to close
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    popup.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        /**
         * Handle logout
         */
        handleLogout: function() {
            this.showConfirmDialog(
                'Log Out',
                'Are you sure you want to log out?',
                () => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            );
        },

        /**
         * Disable account
         */
        disableAccount: async function() {
            // TODO: Implement account disable API
            alert('Account disable feature coming soon!');
        },

        /**
         * Delete account
         */
        deleteAccount: async function() {
            // TODO: Implement account delete API
            alert('Account delete feature coming soon!');
        },

        /**
         * Mask email for display
         */
        maskEmail: function(email) {
            if (!email) return '******@***';
            const [name, domain] = email.split('@');
            if (!domain) return '******@***';
            const maskedName = name.charAt(0) + '*'.repeat(Math.max(name.length - 2, 2)) + name.charAt(name.length - 1);
            return maskedName + '@' + domain;
        },

        /**
         * Escape HTML characters
         */
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to window
    window.SettingsModal = SettingsModal;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SettingsModal.init());
    } else {
        SettingsModal.init();
    }
})();
