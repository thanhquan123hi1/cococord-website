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
            console.log('Field action:', action);
            // TODO: Implement field edit modals
            alert('This feature is coming soon!');
        },

        /**
         * Show confirmation dialog
         */
        showConfirmDialog: function(title, message, onConfirm, isDanger = false) {
            if (confirm(message)) {
                onConfirm();
            }
        },

        /**
         * Handle logout
         */
        handleLogout: function() {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
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
