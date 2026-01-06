/**
 * Channel Settings Manager
 * Handles UI for channel settings modal (Overview, Permissions, Delete)
 * Refactored: Vietnamese UI, Removed Invites/NSFW/Slowmode, Fixed DTO mapping
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

                // Initialize Permissions State (Mock for now, defaulting to 'inherit')
                this.initialData.permissions = {
                    'view_channel': 'inherit',
                    'send_messages': 'inherit',
                    'attach_files': 'inherit',
                    'embed_links': 'inherit',
                    'read_message_history': 'inherit'
                };

                // Map backend fields to frontend state if needed
                // Backend: name, topic, bitrate, userLimit
                this.currentData = {
                    ...channel,
                    permissions: { ...this.initialData.permissions }
                };

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
            const headers = (window.fetchWithAuth) ? {} : { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` };
            const fetchFn = window.fetchWithAuth || ((url, options) => fetch(url, { ...options, headers: { ...options?.headers, ...headers } }));

            // 1. Fetch Basic Channel Info
            const channelRes = await fetchFn(`/api/channels/${channelId}`);
            if (!channelRes.ok) throw new Error('Failed to fetch channel');
            const channel = await channelRes.json();

            // 2. Fetch Permission Overrides
            let overrides = [];
            try {
                const permRes = await fetchFn(`/api/channels/${channelId}/permissions`);
                if (permRes.ok) {
                    overrides = await permRes.json();
                }
            } catch (e) {
                console.warn("Could not fetch permissions", e);
            }

            // 3. Find @Everyone Role ID
            // Automatic Method: Try to fetch server details if role not in context
            let everyoneRoleId = null;
            try {
                // Try fetching server details to get fresh roles
                const serverRes = await fetchFn(`/api/servers/${channel.serverId}`);
                if (serverRes.ok) {
                    const server = await serverRes.json();
                    if (server.roles) {
                        const defaultRole = server.roles.find(r => r.isDefault);
                        if (defaultRole) everyoneRoleId = defaultRole.id;
                    }
                } else if (window.servers) {
                    // Fallback to global state
                    const server = window.servers.find(s => s.id == channel.serverId);
                    if (server && server.roles) {
                        const defaultRole = server.roles.find(r => r.isDefault);
                        if (defaultRole) everyoneRoleId = defaultRole.id;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch server roles", e);
            }

            // 4. Map Overrides to UI State
            // We only care about the @everyone role override for this simple UI
            const myPermissions = {
                'view_channel': 'inherit',
                'send_messages': 'inherit',
                'attach_files': 'inherit',
                'embed_links': 'inherit',
                'read_message_history': 'inherit'
            };

            if (everyoneRoleId) {
                const override = overrides.find(o => Number(o.targetId) === Number(everyoneRoleId) && o.type === 'ROLE');
                if (override) {
                    // Map Allowed
                    if (override.allowedPermissions) {
                        override.allowedPermissions.forEach(p => {
                            const key = p.toLowerCase();
                            if (myPermissions[key] !== undefined) myPermissions[key] = 'allow';
                        });
                    }
                    // Map Denied
                    if (override.deniedPermissions) {
                        override.deniedPermissions.forEach(p => {
                            const key = p.toLowerCase();
                            if (myPermissions[key] !== undefined) myPermissions[key] = 'deny';
                        });
                    }
                }
            }
            channel.permissions = myPermissions;
            channel.everyoneRoleId = everyoneRoleId; // Store for saving

            return channel;
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
                                    <span class="cs-category text-uppercase">${this.initialData.type || 'TEXT'} CHANNEL</span>
                                </div>
                                <div class="cs-nav">
                                    <div class="cs-nav-item active" data-tab="overview">Tổng quan</div>
                                    <div class="cs-nav-item" data-tab="permissions">Quyền</div>
                                    <div class="cs-nav-separator"></div>
                                    <div class="cs-nav-item danger" data-tab="delete">Xóa kênh</div>
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
                                    <span>Cẩn thận — bạn có thay đổi chưa lưu!</span>
                                    <div class="cs-save-actions">
                                        <button class="cs-btn-reset">Đặt lại</button>
                                        <button class="cs-btn-save">Lưu thay đổi</button>
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
            else if (tab === 'delete') this._renderDelete();
        }

        // ==================== TABS ====================

        _renderOverview() {
            const container = this.modal.querySelector('#csContentParams');
            const isVoice = this.initialData.type === 'VOICE';

            let html = `
                <h3 class="cs-section-title">Tổng quan</h3>
                
                <div class="cs-form-group">
                    <label>TÊN KÊNH</label>
                    <input type="text" class="cs-input" id="csNameInput" value="${this.escapeHtml(this.currentData.name)}">
                </div>

                <div class="cs-form-group">
                    <label>CHỦ ĐỀ KÊNH</label>
                    <textarea class="cs-textarea" id="csTopicInput" placeholder="Cho mọi người biết cách sử dụng kênh này">${this.escapeHtml(this.currentData.topic || '')}</textarea>
                </div>
            `;

            if (isVoice) {
                html += `
                    <div class="cs-divider"></div>
                    <h3 class="cs-section-title">Cài đặt Thoại</h3>
                    
                    <div class="cs-form-group">
                        <label>BITRATE: <span id="csBitrateValue">${this.currentData.bitrate ? Math.round(this.currentData.bitrate / 1000) : 64}</span>kbps</label>
                        <input type="range" class="cs-range" id="csBitrateInput" min="8000" max="96000" step="1000" value="${this.currentData.bitrate || 64000}">
                    </div>

                    <div class="cs-form-group">
                        <label>GIỚI HẠN NGƯỜI DÙNG: <span id="csUserLimitValue">${this.currentData.userLimit === 0 ? 'Không giới hạn' : this.currentData.userLimit + ' người dùng'}</span></label>
                        <input type="range" class="cs-range" id="csLimitInput" min="0" max="99" step="1" value="${this.currentData.userLimit || 0}">
                    </div>
                `;
            }

            container.innerHTML = html;

            // Bind Events
            this._bindInput('csNameInput', 'name');
            this._bindInput('csTopicInput', 'topic');

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
                    document.getElementById('csUserLimitValue').textContent = val === 0 ? 'Không giới hạn' : val + ' người dùng';
                    this._updateField('userLimit', val);
                });
            }
        }

        _renderPermissions() {
            const container = this.modal.querySelector('#csContentParams');

            // Mock permissions list for UI demonstration - Translated to Vietnamese
            const permissions = [
                { id: 'view_channel', name: 'Xem Kênh', desc: 'Cho phép thành viên xem kênh này (mặc định).' },
                { id: 'send_messages', name: 'Gửi Tin Nhắn', desc: 'Cho phép thành viên gửi tin nhắn trong kênh này.' },
                { id: 'attach_files', name: 'Đính Kèm File', desc: 'Cho phép thành viên tải lên tệp hoặc media.' },
                { id: 'embed_links', name: 'Nhúng Liên Kết', desc: 'Cho phép hiển thị bản xem trước cho các liên kết.' },
                { id: 'read_message_history', name: 'Đọc Lịch Sử Tin Nhắn', desc: 'Cho phép thành viên đọc các tin nhắn trước đó.' }
            ];

            let html = `
                <h3 class="cs-section-title">Quyền</h3>
                <p class="cs-section-desc">Cài đặt quyền nâng cao cho kênh này.</p>
                <div class="cs-divider"></div>
                <div class="cs-perm-list">
            `;

            permissions.forEach(perm => {
                const currentState = this.currentData.permissions[perm.id] || 'inherit';
                html += `
                    <div class="cs-perm-item" data-perm-id="${perm.id}">
                        <div class="cs-perm-info">
                            <div class="cs-perm-name">${perm.name}</div>
                            <div class="cs-perm-desc">${perm.desc}</div>
                        </div>
                        <div class="cs-perm-controls">
                            <button class="cs-perm-btn deny ${currentState === 'deny' ? 'active' : ''}" data-value="deny"><i class="bi bi-x-lg"></i></button>
                            <button class="cs-perm-btn inherit ${currentState === 'inherit' ? 'active' : ''}" data-value="inherit"><i class="bi bi-slash-lg"></i></button>
                            <button class="cs-perm-btn allow ${currentState === 'allow' ? 'active' : ''}" data-value="allow"><i class="bi bi-check-lg"></i></button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

            // Simple click feedback for UI demo and State Update
            container.querySelectorAll('.cs-perm-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.currentTarget;
                    const parent = button.closest('.cs-perm-item');
                    const permId = parent.dataset.permId;
                    const value = button.dataset.value;

                    // Update UI
                    parent.querySelectorAll('.cs-perm-btn').forEach(b => b.classList.remove('active'));
                    button.classList.add('active');

                    // Update State
                    this.currentData.permissions[permId] = value;
                    this._checkDirty();
                });
            });
        }

        _renderDelete() {
            const container = this.modal.querySelector('#csContentParams');
            container.innerHTML = `
                <h3 class="cs-section-title">Xóa Kênh</h3>
                <div class="cs-delete-warning">
                    <p>Bạn có chắc chắn muốn xóa kênh <strong>#${this.escapeHtml(this.initialData.name)}</strong>? Hành động này không thể hoàn tác.</p>
                    <button class="cs-btn-danger" id="csConfirmDelete">Xóa Kênh</button>
                </div>
             `;
            document.getElementById('csConfirmDelete').addEventListener('click', () => this._deleteChannel());
        }

        // ==================== HELPERS & STATE ====================

        _bindInput(id, field) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', (e) => this._updateField(field, e.target.value));
        }

        _updateField(key, value) {
            this.currentData[key] = value;
            this._checkDirty();
        }

        _checkDirty() {
            const fields = ['name', 'topic', 'bitrate', 'userLimit'];
            let isDirty = fields.some(f => {
                const init = this.initialData[f];
                const curr = this.currentData[f];
                // Handle equality loosely for numbers/strings and nulls
                return String(init ?? '') !== String(curr ?? '');
            });

            // Check permissions dirty state
            if (!isDirty && this.currentData.permissions) {
                isDirty = Object.keys(this.initialData.permissions).some(key => {
                    return this.initialData.permissions[key] !== this.currentData.permissions[key];
                });
            }

            this.isDirty = isDirty;
            const saveBar = document.getElementById('csSaveBar');

            if (this.isDirty) saveBar.classList.add('visible');
            else saveBar.classList.remove('visible');
        }

        async _saveChanges() {
            const btn = this.modal.querySelector('.cs-btn-save');
            const originalText = btn.textContent;
            btn.textContent = 'Đang lưu...';
            btn.disabled = true;

            try {
                let hasChanges = false;

                // 1. Save Basic Settings
                const basicFields = ['name', 'topic', 'bitrate', 'userLimit'];
                const basicDirty = basicFields.some(f => String(this.initialData[f] ?? '') !== String(this.currentData[f] ?? ''));

                if (basicDirty) {
                    const payload = {};
                    if (this.currentData.name !== undefined) payload.name = this.currentData.name;
                    if (this.currentData.topic !== undefined) payload.topic = this.currentData.topic;
                    if (this.currentData.bitrate !== undefined) payload.bitrate = this.currentData.bitrate;
                    if (this.currentData.userLimit !== undefined) payload.userLimit = this.currentData.userLimit;

                    const url = `/api/channels/${this.channelId}`;
                    let res;
                    if (window.fetchWithAuth) {
                        res = await window.fetchWithAuth(url, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    } else {
                        const token = localStorage.getItem('accessToken');
                        res = await fetch(url, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });
                    }
                    if (!res.ok) throw new Error('Failed to save channel details');

                    const updated = await res.json();

                    // Carefully update initialData to preserve our extra fields (permissions, everyoneRoleId)
                    Object.assign(this.initialData, updated);
                    // currentData is already updated by user input, but better to sync with backend response for normalized values
                    Object.assign(this.currentData, updated);
                    hasChanges = true;
                }

                // 2. Save Permissions
                const currentPerms = this.currentData.permissions;
                const initPerms = this.initialData.permissions;
                const permDirty = Object.keys(currentPerms).some(key => currentPerms[key] !== initPerms[key]);

                if (permDirty) {
                    if (!this.currentData.everyoneRoleId) {
                        throw new Error('Cannot save permissions: Cannot find @everyone role ID');
                    }

                    const roleId = this.currentData.everyoneRoleId;
                    const allowed = [];
                    const denied = [];

                    Object.entries(currentPerms).forEach(([key, value]) => {
                        const backendKey = key.toUpperCase();
                        if (value === 'allow') allowed.push(backendKey);
                        else if (value === 'deny') denied.push(backendKey);
                    });

                    const url = `/api/channels/${this.channelId}/permissions/roles/${roleId}`;
                    const payload = {
                        allowedPermissions: allowed,
                        deniedPermissions: denied
                    };

                    let res;
                    if (window.fetchWithAuth) {
                        res = await window.fetchWithAuth(url, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    } else {
                        const token = localStorage.getItem('accessToken');
                        res = await fetch(url, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });
                    }
                    if (!res.ok) throw new Error('Failed to save permissions');

                    // Sync permission state
                    this.initialData.permissions = { ...currentPerms };
                    hasChanges = true;
                }

                // Synchronization Complete
                if (hasChanges) {
                    this.isDirty = false;
                    this._checkDirty(); // Should now be false

                    if (window.showToast) window.showToast('Đã lưu thay đổi!', 'success');

                    // Refresh Global UI
                    if (window.loadServers) window.loadServers();
                    if (window.activeChannelId == this.channelId) {
                        const nameEl = document.getElementById('channelName');
                        if (nameEl) nameEl.textContent = this.currentData.name;
                        const topicEl = document.getElementById('channelTopic');
                        if (topicEl) topicEl.textContent = this.currentData.topic || '';
                    }
                } else {
                    // No changes were actually detected/processable?
                    this.isDirty = false;
                    this._checkDirty();
                }

            } catch (e) {
                console.error(e);
                if (window.showToast) window.showToast('Lỗi: ' + e.message, 'error');
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
            if (!confirm(`Bạn có chắc muốn xóa kênh #${this.initialData.name}?`)) return;

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
                    if (window.showToast) window.showToast('Đã xóa kênh', 'success');
                    this.close();
                    if (window.loadServers) window.loadServers(); // Reload to refresh list
                    else location.reload();
                } else {
                    if (window.showToast) window.showToast('Lỗi khi xóa kênh', 'error');
                }
            } catch (e) {
                console.error(e);
            }
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
            `;
            document.head.appendChild(style);
        }
    }

    // Expose global instance
    window.ChannelSettingsManager = new ChannelSettingsManager();

})(window);
