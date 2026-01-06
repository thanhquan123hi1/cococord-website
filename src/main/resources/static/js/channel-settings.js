/**
 * Channel Settings Manager
 * Handles UI for channel settings modal (Overview, Permissions, Invites, Delete)
 * Refactored to use Centered Overlay UI
 */

(function (window) {
    'use strict';

    class ChannelSettingsManager {
        constructor() {
            this.modal = null;
            this.channelId = null;
            this.initialData = {};
            this.currentData = {};
            this.isDirty = false;
        }

        async open(channelId) {
            console.log("Opening Channel Settings for channel:", channelId);
            this.channelId = channelId;
            try {
                // Fetch channel data
                const channel = await this._fetchChannelData(channelId);
                this.initialData = { ...channel };
                this.currentData = { ...channel };

                this._createModal();
                this._renderOverview(); // Default tab
            } catch (error) {
                console.error("Failed to load channel settings:", error);
                if (window.showToast) window.showToast("Không thể tải thông tin kênh", "error");
                else alert("Không thể tải thông tin kênh");
            }
        }

        async _fetchChannelData(channelId) {
            // Using global fetchWithAuth if available (from auth.js)
            if (window.fetchWithAuth) {
                const res = await window.fetchWithAuth(`/api/channels/${channelId}`);
                if (!res.ok) throw new Error('Failed to fetch channel');
                return await res.json();
            } else {
                // Fallback (might fail if auth required)
                const res = await fetch(`/api/channels/${channelId}`);
                if (!res.ok) throw new Error('Failed to fetch channel');
                return res.json();
            }
        }

        /**
         * Create the Centered Overlay Modal Structure
         */
        _createModal() {
            if (this.modal) this.modal.remove();

            const modalHtml = `
                <div class="cs-overlay-backdrop">
                    <div class="cs-centered-modal">
                        <div class="cs-sidebar">
                            <div class="cs-sidebar-content">
                                <div class="cs-header">
                                    <span class="cs-channel-name"># ${this.escapeHtml(this.initialData.name)}</span>
                                    <span class="cs-category text-uppercase">${this.initialData.type} CHANNEL</span>
                                </div>
                                <div class="cs-nav">
                                    <div class="cs-nav-item active" data-tab="overview">Overview</div>
                                    <div class="cs-nav-item" data-tab="permissions">Permissions</div>
                                    <div class="cs-nav-item" data-tab="invites">Invites</div>
                                    <div class="cs-nav-separator"></div>
                                    <div class="cs-nav-item danger" data-tab="delete">Delete Channel</div>
                                </div>
                            </div>
                        </div>
                        <div class="cs-content-wrapper">
                            <div class="cs-content">
                                <div class="cs-content-scroll" id="csContentParams">
                                    <!-- Content injected here -->
                                </div>
                                <div class="cs-close-btn-wrapper">
                                    <button class="cs-close-btn">
                                        <i class="bi bi-x-lg"></i>
                                        <span>ESC</span>
                                    </button>
                                </div>
                            </div>
                            <div class="cs-save-bar" id="csSaveBar">
                                <div class="cs-save-bar-content">
                                    <span>Careful — you have unsaved changes!</span>
                                    <div class="cs-save-actions">
                                        <button class="cs-btn-reset">Reset</button>
                                        <button class="cs-btn-save">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.modal = document.querySelector('.cs-overlay-backdrop');
            this._injectStyles();

            // Event Listeners
            this.modal.querySelector('.cs-close-btn').addEventListener('click', () => this.close());

            // Backdrop click to close (optional, but good UX)
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });

            this.modal.querySelectorAll('.cs-nav-item').forEach(item => {
                item.addEventListener('click', (e) => this._switchTab(e.currentTarget));
            });

            // Save Bar Listeners
            this.modal.querySelector('.cs-btn-reset').addEventListener('click', () => this._resetChanges());
            this.modal.querySelector('.cs-btn-save').addEventListener('click', () => this._saveChanges());

            // Close on ESC
            document.addEventListener('keydown', this._handleEscKey);
        }

        _handleEscKey = (e) => {
            if (e.key === 'Escape') this.close();
        }

        close() {
            if (this.isDirty) {
                if (!confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?")) return;
            }
            if (this.modal) {
                this.modal.classList.add('closing'); // Animation hook
                setTimeout(() => {
                    if (this.modal) this.modal.remove();
                    this.modal = null;
                }, 200);
            }
            document.removeEventListener('keydown', this._handleEscKey);
        }

        _switchTab(target) {
            this.modal.querySelectorAll('.cs-nav-item').forEach(i => i.classList.remove('active'));
            target.classList.add('active');

            const tab = target.dataset.tab;
            if (tab === 'overview') this._renderOverview();
            else if (tab === 'permissions') this._renderPermissions();
            else if (tab === 'invites') this._renderInvites();
            else if (tab === 'delete') this._renderDelete();
        }

        // ==================== TABS ====================

        _renderOverview() {
            const container = this.modal.querySelector('#csContentParams');
            const isVoice = this.initialData.type === 'VOICE';

            let html = `
                <h3 class="cs-section-title">Overview</h3>
                
                <div class="cs-form-group">
                    <label>CHANNEL NAME</label>
                    <input type="text" class="cs-input" id="csNameInput" value="${this.escapeHtml(this.currentData.name)}">
                </div>

                <div class="cs-form-group">
                    <label>CHANNEL TOPIC</label>
                    <textarea class="cs-textarea" id="csTopicInput" placeholder="Let everyone know how to use this channel">${this.escapeHtml(this.currentData.topic || '')}</textarea>
                </div>

                <div class="cs-divider"></div>
                
                <div class="cs-form-group-row">
                    <div class="cs-label-desc">
                        <label>Age-Restricted Channel</label>
                        <p>Users will need to confirm they are of over legal age to view this channel.</p>
                    </div>
                    <label class="cs-switch">
                        <input type="checkbox" id="csNsfwInput" ${this.currentData.nsfw ? 'checked' : ''}>
                        <span class="cs-slider-round"></span>
                    </label>
                </div>
                
                <div class="cs-form-group">
                    <label>SLOWMODE</label>
                    <div class="cs-range-wrapper">
                        <input type="range" class="cs-range" id="csSlowmodeInput" min="0" max="21600" step="5" value="${this.currentData.rateLimitPerUser || 0}">
                         <div class="cs-range-value" id="csSlowmodeValue">${this._formatDuration(this.currentData.rateLimitPerUser || 0)}</div>
                    </div>
                    <p class="cs-help-text">Members will be restricted to sending one message and creating one thread per this interval, unless they have Manage Channel or Manage Messages permissions.</p>
                </div>
            `;

            if (isVoice) {
                html += `
                    <div class="cs-divider"></div>
                    <h3 class="cs-section-title">Voice Settings</h3>
                    
                    <div class="cs-form-group">
                        <label>BITRATE: <span id="csBitrateValue">${this.currentData.bitrate ? Math.round(this.currentData.bitrate / 1000) : 64}</span>kbps</label>
                        <input type="range" class="cs-range" id="csBitrateInput" min="8000" max="96000" step="1000" value="${this.currentData.bitrate || 64000}">
                    </div>

                    <div class="cs-form-group">
                        <label>USER LIMIT: <span id="csUserLimitValue">${this.currentData.userLimit === 0 ? 'No Limit' : this.currentData.userLimit + ' users'}</span></label>
                        <input type="range" class="cs-range" id="csLimitInput" min="0" max="99" step="1" value="${this.currentData.userLimit || 0}">
                    </div>
                `;
            }

            container.innerHTML = html;

            // Bind Events
            this._bindInput('csNameInput', 'name');
            this._bindInput('csTopicInput', 'topic');
            this._bindCheckbox('csNsfwInput', 'nsfw');

            const slowmodeInput = document.getElementById('csSlowmodeInput');
            slowmodeInput.addEventListener('input', (e) => {
                const val = Number(e.target.value);
                document.getElementById('csSlowmodeValue').textContent = this._formatDuration(val);
                this._updateField('rateLimitPerUser', val);
            });

            if (isVoice) {
                const bitrateInput = document.getElementById('csBitrateInput');
                bitrateInput.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    document.getElementById('csBitrateValue').textContent = Math.round(val / 1000);
                    this._updateField('bitrate', val);
                });

                const limitInput = document.getElementById('csLimitInput');
                limitInput.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    document.getElementById('csUserLimitValue').textContent = val === 0 ? 'No Limit' : val + ' users';
                    this._updateField('userLimit', val);
                });
            }
        }

        _renderPermissions() {
            const container = this.modal.querySelector('#csContentParams');

            // Mock permissions list for UI demonstration
            const permissions = [
                { id: 'view_channel', name: 'View Channel', desc: 'Allows members to view this channel by default.' },
                { id: 'send_messages', name: 'Send Messages', desc: 'Allows members to send messages in this channel.' },
                { id: 'attach_files', name: 'Attach Files', desc: 'Allows members to upload files or media.' },
                { id: 'embed_links', name: 'Embed Links', desc: 'Allows links to display preview cards.' },
                { id: 'read_message_history', name: 'Read Message History', desc: 'Allows members to read previous messages.' }
            ];

            let html = `
                <h3 class="cs-section-title">Permissions</h3>
                <p class="cs-section-desc">Advanced permissions settings for this channel. (Mock UI)</p>
                <div class="cs-divider"></div>
                <div class="cs-perm-list">
            `;

            permissions.forEach(perm => {
                html += `
                    <div class="cs-perm-item">
                        <div class="cs-perm-info">
                            <div class="cs-perm-name">${perm.name}</div>
                            <div class="cs-perm-desc">${perm.desc}</div>
                        </div>
                        <div class="cs-perm-controls">
                            <button class="cs-perm-btn deny"><i class="bi bi-x-lg"></i></button>
                            <button class="cs-perm-btn inherit active"><i class="bi bi-slash-lg"></i></button>
                            <button class="cs-perm-btn allow"><i class="bi bi-check-lg"></i></button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

            // Simple click feedback for UI demo
            container.querySelectorAll('.cs-perm-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const parent = this.parentElement;
                    parent.querySelectorAll('.cs-perm-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }

        async _renderInvites() {
            const container = this.modal.querySelector('#csContentParams');
            container.innerHTML = `<div class="cs-loader"><div class="spinner-border text-light" role="status"></div> Loading invites...</div>`;

            try {
                let invites = [];
                // Mock API call if wrapper exists, else just empty or mock
                if (window.fetchWithAuth) {
                    const res = await window.fetchWithAuth(`/api/channels/${this.channelId}/invites`);
                    if (res.ok) invites = await res.json();
                }

                // If no invites or API fail (handled by catch), default empty
                if (!invites || invites.length === 0) {
                    container.innerHTML = `
                        <h3 class="cs-section-title">Invites</h3>
                        <div class="cs-empty-state">
                            <div class="cs-empty-icon"><i class="bi bi-envelope-paper"></i></div>
                            <div class="cs-empty-text">No active invites for this channel.</div>
                            <button class="cs-btn-primary mt-3" id="csCreateInvite">Create Invite</button>
                        </div>
                    `;
                    return;
                }

                // Render Invites Table
                let html = `
                    <h3 class="cs-section-title">Invites</h3>
                    <div class="cs-invites-table">
                        <div class="cs-invites-header">
                            <div class="col-inviter">INVITER</div>
                            <div class="col-code">INVITE CODE</div>
                            <div class="col-expires">EXPIRES</div>
                            <div class="col-uses">USES</div>
                            <div class="col-actions"></div>
                        </div>
                `;

                invites.forEach(inv => {
                    html += `
                        <div class="cs-invite-row">
                            <div class="col-inviter">
                                <span class="cs-inviter-name">${this.escapeHtml(inv.inviter?.username || 'Unknown')}</span>
                            </div>
                            <div class="col-code">
                                <span class="cs-code">${inv.code}</span>
                            </div>
                            <div class="col-expires">
                                ${inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'Never'}
                            </div>
                            <div class="col-uses">
                                ${inv.uses} / ${inv.maxUses || '∞'}
                            </div>
                            <div class="col-actions">
                                <button class="cs-icon-btn text-danger" title="Revoke"><i class="bi bi-x-lg"></i></button>
                            </div>
                        </div>
                    `;
                });

                html += `</div>`;
                container.innerHTML = html;

            } catch (e) {
                console.error("Error loading invites", e);
                container.innerHTML = `<div class="text-danger">Failed to load invites.</div>`;
            }
        }

        _renderDelete() {
            const container = this.modal.querySelector('#csContentParams');
            container.innerHTML = `
                <h3 class="cs-section-title">Delete Channel</h3>
                <div class="cs-delete-warning">
                    <p>Are you sure you want to delete <strong>#${this.escapeHtml(this.initialData.name)}</strong>? This cannot be undone.</p>
                    <button class="cs-btn-danger" id="csConfirmDelete">Delete Channel</button>
                </div>
             `;
            document.getElementById('csConfirmDelete').addEventListener('click', () => this._deleteChannel());
        }

        // ==================== HELPERS & STATE ====================

        _bindInput(id, field) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', (e) => this._updateField(field, e.target.value));
        }

        _bindCheckbox(id, field) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', (e) => this._updateField(field, e.target.checked));
        }

        _updateField(key, value) {
            this.currentData[key] = value;
            this._checkDirty();
        }

        _checkDirty() {
            const fields = ['name', 'topic', 'bitrate', 'userLimit', 'nsfw', 'rateLimitPerUser'];
            this.isDirty = fields.some(f => {
                const init = this.initialData[f];
                const curr = this.currentData[f];
                // Handle equality loosely for numbers/strings and nulls
                return String(init ?? '') !== String(curr ?? '');
            });

            const saveBar = document.getElementById('csSaveBar');
            if (this.isDirty) saveBar.classList.add('visible');
            else saveBar.classList.remove('visible');
        }

        async _saveChanges() {
            const btn = this.modal.querySelector('.cs-btn-save');
            const originalText = btn.textContent;
            btn.textContent = 'Saving...';
            btn.disabled = true;

            try {
                // Construct patch payload (only changed fields)
                // However, user requested PATCH /api/channels/{id} to save changes
                const payload = {};
                // We send full object or partial? Usually patch expects partial.
                // For simplicity, let's send mapped fields.
                ['name', 'topic', 'bitrate', 'userLimit', 'nsfw', 'rateLimitPerUser'].forEach(key => {
                    if (this.currentData[key] !== undefined) {
                        payload[key] = this.currentData[key];
                    }
                });

                const url = `/api/channels/${this.channelId}`;
                let res;

                if (window.fetchWithAuth) {
                    res = await window.fetchWithAuth(url, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    const token = localStorage.getItem('accessToken');
                    res = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    const updated = await res.json();
                    this.initialData = { ...updated };
                    this.currentData = { ...updated };
                    this.isDirty = false;
                    this._checkDirty();
                    if (window.showToast) window.showToast('Channel settings saved!', 'success');

                    // Refresh channel list in UI
                    if (window.loadServers) window.loadServers();
                    if (window.renderChannelList && window.channels) {
                        // Manually update local channel object to reflect change immediately without full reload
                        const idx = window.channels.findIndex(c => c.id == this.channelId);
                        if (idx !== -1) {
                            window.channels[idx] = { ...window.channels[idx], ...updated };
                            window.renderChannelList();
                        }
                    }
                    // Update header if active
                    if (window.activeChannelId == this.channelId) {
                        const nameEl = document.getElementById('channelName');
                        if (nameEl) nameEl.textContent = updated.name;
                        const topicEl = document.getElementById('channelTopic');
                        if (topicEl) topicEl.textContent = updated.topic || '';
                    }

                } else {
                    const err = await res.json();
                    if (window.showToast) window.showToast(err.message || 'Error saving changes', 'error');
                }
            } catch (e) {
                console.error(e);
                if (window.showToast) window.showToast('Failed to connect to server', 'error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }

        _resetChanges() {
            this.currentData = { ...this.initialData };
            this._renderOverview(); // Re-render logic
            this._checkDirty();
        }

        async _deleteChannel() {
            if (!confirm(`Are you sure you want to delete #${this.initialData.name}?`)) return;

            try {
                let res;
                if (window.fetchWithAuth) {
                    res = await window.fetchWithAuth(`/api/channels/${this.channelId}`, { method: 'DELETE' });
                } else {
                    const token = localStorage.getItem('accessToken');
                    res = await fetch(`/api/channels/${this.channelId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (res.ok) {
                    if (window.showToast) window.showToast('Channel deleted', 'success');
                    this.close();
                    if (window.loadServers) window.loadServers(); // Reload to refresh list
                    else location.reload();
                } else {
                    if (window.showToast) window.showToast('Failed to delete channel', 'error');
                }
            } catch (e) {
                console.error(e);
            }
        }

        _formatDuration(seconds) {
            if (seconds === 0) return 'Off';
            if (seconds < 60) return `${seconds}s`;
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
            return `${Math.floor(seconds / 3600)}h`;
        }

        escapeHtml(text) {
            if (!text) return '';
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        _injectStyles() {
            if (document.getElementById('cs-overlay-styles')) return;
            const style = document.createElement('style');
            style.id = 'cs-overlay-styles';
            style.textContent = `
                /* Overlay Backdrop */
                .cs-overlay-backdrop {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    opacity: 0;
                    animation: csFadeIn 0.2s forwards;
                    font-family: 'gg sans', sans-serif;
                }
                .cs-overlay-backdrop.closing {
                    animation: csFadeOut 0.2s forwards;
                }
                @keyframes csFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes csFadeOut { from { opacity: 1; } to { opacity: 0; } }

                /* Centered Modal */
                .cs-centered-modal {
                    width: 800px;
                    height: 80vh;
                    max-height: 720px;
                    background: #313338; /* stored in var(--background-primary) usually */
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                    display: flex;
                    overflow: hidden;
                    position: relative;
                    animation: csScaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes csScaleIn { from { transform: scale(0.9); } to { transform: scale(1); } }

                /* Sidebar */
                .cs-sidebar {
                    width: 230px;
                    background: #2b2d31; /* --background-secondary */
                    display: flex;
                    flex-direction: column;
                }
                .cs-sidebar-content {
                    padding: 20px 10px 20px 20px;
                    overflow-y: auto;
                }
                .cs-header {
                    margin-bottom: 20px;
                    padding-left: 10px;
                }
                .cs-channel-name {
                    display: block; color: #f2f3f5; font-weight: 700; font-size: 14px;
                    text-transform: uppercase;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .cs-category {
                    display: block; color: #949ba4; font-size: 11px; margin-top: 4px; font-weight: 600;
                }
                .cs-nav-item {
                    padding: 6px 10px; margin-bottom: 2px;
                    border-radius: 4px; color: #b5bac1; cursor: pointer;
                    font-size: 15px; font-weight: 500;
                }
                .cs-nav-item:hover { background: #35373c; color: #dbdee1; }
                .cs-nav-item.active { background: #404249; color: #fff; }
                .cs-nav-item.danger { color: #da373c; }
                .cs-nav-item.danger:hover { background: #da373c1a; }
                .cs-nav-separator { height: 1px; background: #3f4147; margin: 8px 10px; }

                /* Content Area */
                .cs-content-wrapper {
                   flex: 1;
                   display: flex;
                   flex-direction: column;
                   position: relative;
                   background: #313338;
                }
                .cs-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                .cs-content-scroll {
                    flex: 1;
                    padding: 40px;
                    overflow-y: auto;
                }
                .cs-close-btn-wrapper {
                    flex-basis: 60px;
                    padding-top: 40px;
                    padding-right: 20px;
                }
                .cs-close-btn {
                    display: flex; flex-direction: column; align-items: center;
                    background: none; border: 2px solid #b5bac1; border-radius: 50%;
                    width: 32px; height: 32px; color: #b5bac1; cursor: pointer;
                    justify-content: center;
                    opacity: 0.7; transition: all 0.2s;
                }
                .cs-close-btn span { font-size: 9px; margin-top: 2px; font-weight: 700; }
                .cs-close-btn:hover { border-color: #fff; color: #fff; opacity: 1; }

                /* Forms */
                .cs-section-title { color: #fff; font-size: 20px; margin-bottom: 20px; font-weight: 600; }
                .cs-form-group { margin-bottom: 24px; }
                .cs-form-group label {
                    display: block; color: #b5bac1; font-size: 12px; font-weight: 700; margin-bottom: 8px;
                    text-transform: uppercase;
                }
                .cs-input, .cs-textarea {
                    width: 100%; background: #1e1f22; border: none; padding: 10px;
                    border-radius: 4px; color: #dbdee1; font-size: 16px;
                }
                .cs-input:focus, .cs-textarea:focus { outline: none; background: #1e1f22; box-shadow: 0 0 0 2px #5865f2; }
                .cs-textarea { min-height: 80px; resize: vertical; }
                .cs-divider { height: 1px; background: #3f4147; margin: 30px 0; }

                /* Range & Switch */
                .cs-range-wrapper { position: relative; }
                .cs-range { width: 100%; accent-color: #5865f2; }
                .cs-range-value { position: absolute; right: 0; top: -20px; color: #f2f3f5; font-weight: 600; }
                
                .cs-form-group-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .cs-label-desc label { margin-bottom: 4px; color: #f2f3f5; font-size: 14px; text-transform: none; }
                .cs-label-desc p { color: #b5bac1; font-size: 13px; margin: 0; }
                
                /* Switch */
                .cs-switch {
                    position: relative; display: inline-block; width: 40px; height: 24px;
                }
                .cs-switch input { opacity: 0; width: 0; height: 0; }
                .cs-slider-round {
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #80848e; transition: .4s; border-radius: 34px;
                }
                .cs-slider-round:before {
                    position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
                    background-color: white; transition: .4s; border-radius: 50%;
                }
                input:checked + .cs-slider-round { background-color: #3ba55c; }
                input:checked + .cs-slider-round:before { transform: translateX(16px); }

                /* Permissions List (Mock) */
                .cs-perm-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 0; border-bottom: 1px solid #3f4147;
                }
                .cs-perm-name { color: #f2f3f5; font-weight: 500; }
                .cs-perm-desc { color: #b5bac1; font-size: 12px; }
                .cs-perm-controls { display: flex; gap: 4px; }
                .cs-perm-btn {
                    background: #2b2d31; border: 1px solid #4e5058; color: #b5bac1;
                    width: 32px; height: 32px; border-radius: 4px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }
                .cs-perm-btn:hover { border-color: #80848e; }
                .cs-perm-btn.deny.active { background: #da373c; border-color: #da373c; color: #fff; }
                .cs-perm-btn.inherit.active { background: #4e5058; border-color: #4e5058; color: #fff; }
                .cs-perm-btn.allow.active { background: #23a559; border-color: #23a559; color: #fff; }

                /* Invites Table */
                .cs-invites-table { background: #2b2d31; border-radius: 8px; overflow: hidden; }
                .cs-invites-header {
                    display: flex; padding: 8px 16px; background: #1e1f22;
                    color: #949ba4; font-size: 11px; font-weight: 700; text-transform: uppercase;
                }
                .cs-invite-row {
                    display: flex; padding: 12px 16px; border-bottom: 1px solid #3f4147;
                    align-items: center; color: #dbdee1; font-size: 14px;
                }
                .col-inviter { flex: 2; display: flex; align-items: center; }
                .col-code { flex: 1.5; font-family: monospace; }
                .col-expires { flex: 1.5; }
                .col-uses { flex: 1; text-align: right; }
                .col-actions { flex: 0.5; text-align: right; }
                .cs-icon-btn { background: none; border: none; cursor: pointer; color: #b5bac1; }
                .cs-icon-btn:hover { color: #dbdee1; }

                /* Save Bar (Floating at bottom inside content-wrapper) */
                .cs-save-bar {
                    position: absolute; bottom: -80px; left: 20px; right: 40px; z-index: 10;
                    display: flex; justify-content: center;
                    transition: bottom 0.3s cubic-bezier(0.3, 2, 0.4, 0.8);
                }
                .cs-save-bar.visible { bottom: 20px; }
                .cs-save-bar-content {
                    background: #111214; padding: 10px 10px 10px 16px; border-radius: 5px;
                    display: flex; align-items: center; justify-content: space-between;
                    min-width: 440px; box-shadow: 0 4px 4px rgba(0,0,0,0.16);
                }
                .cs-save-bar-content span { color: #fff; font-weight: 500; margin-right: 20px; }
                .cs-btn-reset { color: #fff; background: none; border: none; cursor: pointer; margin-right: 10px; font-weight: 500; }
                .cs-btn-reset:hover { text-decoration: underline; }
                .cs-btn-save {
                    background: #248046; color: #fff; border: none; padding: 8px 24px;
                    border-radius: 3px; font-weight: 500; cursor: pointer; transition: background .17s;
                }
                .cs-btn-save:hover { background: #1a6334; }
                .cs-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Delete */
                .cs-btn-danger {
                    background: #da373c; color: #fff; border: none; padding: 10px 16px;
                    border-radius: 3px; font-weight: 500; cursor: pointer;
                }
                .cs-btn-danger:hover { background: #a1282c; }
                
                /* Empty States */
                .cs-empty-state { text-align: center; padding: 40px; }
                .cs-empty-icon { font-size: 48px; color: #4e5058; margin-bottom: 10px; }
                .cs-empty-text { color: #949ba4; }
                .cs-btn-primary { background: #5865f2; color: #fff; border: none; padding: 8px 16px; border-radius: 3px; }
            `;
            document.head.appendChild(style);
        }
    }

    // Expose global instance
    window.ChannelSettingsManager = new ChannelSettingsManager();

})(window);
