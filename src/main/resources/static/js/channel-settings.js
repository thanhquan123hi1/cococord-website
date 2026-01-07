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
                // Fetch channel data (includes permissions mapping)
                const channel = await this._fetchChannelData(channelId);
                this.initialData = { ...channel };

                // _fetchChannelData already sets channel.permissions from backend overrides
                // DO NOT override it here with hardcoded values!

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
                    console.log('[ChannelSettings] Fetched permission overrides:', overrides);
                } else {
                    console.warn('[ChannelSettings] Permission fetch failed:', permRes.status, permRes.statusText);
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
                    console.log('[ChannelSettings] Server data:', server);
                    if (server.roles) {
                        const defaultRole = server.roles.find(r => r.isDefault);
                        if (defaultRole) {
                            everyoneRoleId = defaultRole.id;
                            console.log('[ChannelSettings] Found @everyone role ID:', everyoneRoleId);
                        } else {
                            console.warn('[ChannelSettings] No default role found in server.roles');
                        }
                    } else {
                        console.warn('[ChannelSettings] server.roles is missing');
                    }
                } else if (window.servers) {
                    // Fallback to global state
                    const server = window.servers.find(s => s.id == channel.serverId);
                    if (server && server.roles) {
                        const defaultRole = server.roles.find(r => r.isDefault);
                        if (defaultRole) {
                            everyoneRoleId = defaultRole.id;
                            console.log('[ChannelSettings] Found @everyone role ID from global state:', everyoneRoleId);
                        }
                    }
                }
            } catch (e) {
                console.warn("Could not fetch server roles", e);
            }

            console.log('[ChannelSettings] Final everyoneRoleId:', everyoneRoleId);
            console.log('[ChannelSettings] Total overrides:', overrides.length);

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
                console.log('[ChannelSettings] Looking for override with targetId:', everyoneRoleId);
                console.log('[ChannelSettings] Available overrides:', overrides.map(o => ({ targetId: o.targetId, targetType: o.targetType })));

                const override = overrides.find(o => Number(o.targetId) === Number(everyoneRoleId) && o.targetType === 'ROLE');
                console.log('[ChannelSettings] Everyone role override:', override);

                if (override) {
                    // Map Allowed
                    if (override.allowedPermissions) {
                        console.log('[ChannelSettings] Allowed permissions from backend:', override.allowedPermissions);
                        override.allowedPermissions.forEach(p => {
                            const key = p.toLowerCase();
                            console.log(`  Mapping '${p}' -> '${key}' -> ${myPermissions[key] !== undefined ? 'FOUND' : 'NOT FOUND in UI'}`);
                            if (myPermissions[key] !== undefined) myPermissions[key] = 'allow';
                        });
                    }
                    // Map Denied
                    if (override.deniedPermissions) {
                        console.log('[ChannelSettings] Denied permissions from backend:', override.deniedPermissions);
                        override.deniedPermissions.forEach(p => {
                            const key = p.toLowerCase();
                            console.log(`  Mapping '${p}' -> '${key}' -> ${myPermissions[key] !== undefined ? 'FOUND' : 'NOT FOUND in UI'}`);
                            if (myPermissions[key] !== undefined) myPermissions[key] = 'deny';
                        });
                    }
                }
                console.log('[ChannelSettings] Final myPermissions:', myPermissions);
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
                                    <button class="cs-close-btn" title="Đóng (ESC)">
                                        <span class="cs-close-icon-circle">
                                            <i class="bi bi-x-lg"></i>
                                        </span>
                                        <span class="cs-close-hint">ESC</span>
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

            // Permissions grouped by category - Vietnamese UI
            const permissionCategories = [
                {
                    category: 'general',
                    title: 'Quyền Chung',
                    icon: 'bi-gear',
                    permissions: [
                        { id: 'view_channel', name: 'Xem Kênh', desc: 'Cho phép thành viên xem và truy cập kênh này.' }
                    ]
                },
                {
                    category: 'text',
                    title: 'Quyền Tin Nhắn',
                    icon: 'bi-chat-text',
                    permissions: [
                        { id: 'send_messages', name: 'Gửi Tin Nhắn', desc: 'Cho phép thành viên gửi tin nhắn trong kênh này.' },
                        { id: 'attach_files', name: 'Đính Kèm File', desc: 'Cho phép thành viên tải lên tệp, hình ảnh hoặc media.' },
                        { id: 'embed_links', name: 'Nhúng Liên Kết', desc: 'Cho phép hiển thị bản xem trước nội dung cho các liên kết được gửi.' },
                        { id: 'read_message_history', name: 'Đọc Lịch Sử Tin Nhắn', desc: 'Cho phép thành viên đọc các tin nhắn đã gửi trước đó trong kênh.' }
                    ]
                }
            ];

            let html = `
                <div class="cs-perm-header">
                    <h3 class="cs-section-title">Quyền</h3>
                    <p class="cs-section-desc">Tùy chỉnh quyền ghi đè cho vai trò @everyone trong kênh này.</p>
                </div>
                
                <div class="cs-perm-legend">
                    <div class="cs-legend-item">
                        <span class="cs-legend-icon deny"><i class="bi bi-x-lg"></i></span>
                        <span>Từ chối</span>
                    </div>
                    <div class="cs-legend-item">
                        <span class="cs-legend-icon inherit"><i class="bi bi-slash-lg"></i></span>
                        <span>Mặc định</span>
                    </div>
                    <div class="cs-legend-item">
                        <span class="cs-legend-icon allow"><i class="bi bi-check-lg"></i></span>
                        <span>Cho phép</span>
                    </div>
                </div>
                
                <div class="cs-perm-list-container">
            `;

            permissionCategories.forEach((cat, catIndex) => {
                html += `
                    <div class="cs-perm-category" data-category="${cat.category}">
                        <div class="cs-perm-category-header">
                            <i class="bi ${cat.icon}"></i>
                            <span>${cat.title}</span>
                            <div class="cs-category-line"></div>
                        </div>
                        <div class="cs-perm-category-items">
                `;

                cat.permissions.forEach((perm, permIndex) => {
                    const currentState = this.currentData.permissions[perm.id] || 'inherit';
                    const animDelay = (catIndex * 0.1) + (permIndex * 0.05);
                    
                    html += `
                        <div class="cs-perm-item" data-perm-id="${perm.id}" style="animation-delay: ${animDelay}s">
                            <div class="cs-perm-info">
                                <div class="cs-perm-name">${perm.name}</div>
                                <div class="cs-perm-desc">${perm.desc}</div>
                            </div>
                            <div class="cs-tri-state-group">
                                <button class="cs-tri-btn cs-tri-deny ${currentState === 'deny' ? 'active' : ''}" 
                                        data-value="deny" 
                                        title="Từ chối quyền này">
                                    <i class="bi bi-x-lg"></i>
                                    <span class="cs-tri-ripple"></span>
                                </button>
                                <button class="cs-tri-btn cs-tri-inherit ${currentState === 'inherit' ? 'active' : ''}" 
                                        data-value="inherit" 
                                        title="Sử dụng mặc định từ vai trò">
                                    <i class="bi bi-slash-lg"></i>
                                    <span class="cs-tri-ripple"></span>
                                </button>
                                <button class="cs-tri-btn cs-tri-allow ${currentState === 'allow' ? 'active' : ''}" 
                                        data-value="allow" 
                                        title="Cho phép quyền này">
                                    <i class="bi bi-check-lg"></i>
                                    <span class="cs-tri-ripple"></span>
                                </button>
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

            // Bind tri-state button click handlers
            container.querySelectorAll('.cs-tri-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.currentTarget;
                    const parent = button.closest('.cs-perm-item');
                    const permId = parent.dataset.permId;
                    const value = button.dataset.value;

                    // Ripple effect
                    const ripple = button.querySelector('.cs-tri-ripple');
                    ripple.classList.remove('animate');
                    void ripple.offsetWidth; // Trigger reflow
                    ripple.classList.add('animate');

                    // Update UI with animation
                    parent.querySelectorAll('.cs-tri-btn').forEach(b => {
                        b.classList.remove('active');
                        b.classList.add('deselecting');
                    });
                    
                    setTimeout(() => {
                        parent.querySelectorAll('.cs-tri-btn').forEach(b => b.classList.remove('deselecting'));
                        button.classList.add('active');
                    }, 50);

                    // Update State (logic preserved)
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
            this.currentData = { ...this.initialData, permissions: { ...this.initialData.permissions } };
            // Re-render current active tab
            const activeTab = this.modal.querySelector('.cs-nav-item.active');
            if (activeTab) {
                const tab = activeTab.dataset.tab;
                if (tab === 'overview') this._renderOverview();
                else if (tab === 'permissions') this._renderPermissions();
            } else {
                this._renderOverview();
            }
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
                    background: #313338;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
                    display: flex;
                    overflow: hidden;
                    position: relative;
                    animation: csScaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes csScaleIn { 
                    from { 
                        transform: scale(0.9); 
                        opacity: 0;
                    } 
                    to { 
                        transform: scale(1);
                        opacity: 1;
                    } 
                }

                /* Sidebar */
                .cs-sidebar {
                    width: 230px;
                    background: linear-gradient(180deg, #2b2d31 0%, #27292d 100%);
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid rgba(0,0,0,0.2);
                    box-shadow: 1px 0 0 rgba(255,255,255,0.02);
                }
                .cs-sidebar-content {
                    padding: 24px 12px 24px 20px;
                    overflow-y: auto;
                }
                .cs-sidebar-content::-webkit-scrollbar { width: 8px; }
                .cs-sidebar-content::-webkit-scrollbar-track { background: transparent; }
                .cs-sidebar-content::-webkit-scrollbar-thumb { 
                    background: #1a1b1e; 
                    border-radius: 4px;
                }
                .cs-sidebar-content::-webkit-scrollbar-thumb:hover { background: #1e1f22; }
                
                .cs-header {
                    margin-bottom: 24px;
                    padding-left: 10px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .cs-channel-name {
                    display: block; 
                    color: #f2f3f5; 
                    font-weight: 700; 
                    font-size: 15px;
                    text-transform: uppercase;
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                    letter-spacing: 0.02em;
                }
                .cs-category {
                    display: block; 
                    color: #949ba4; 
                    font-size: 11px; 
                    margin-top: 6px; 
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .cs-nav-item {
                    padding: 8px 12px; 
                    margin-bottom: 2px;
                    border-radius: 6px; 
                    color: #b5bac1; 
                    cursor: pointer;
                    font-size: 15px; 
                    font-weight: 500;
                    transition: all 0.15s ease;
                    position: relative;
                }
                .cs-nav-item:hover { 
                    background: rgba(255,255,255,0.05); 
                    color: #dbdee1; 
                }
                .cs-nav-item.active { 
                    background: #404249; 
                    color: #fff;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
                }
                .cs-nav-item.danger { 
                    color: #f23f43;
                }
                .cs-nav-item.danger:hover { 
                    background: rgba(242, 63, 67, 0.1); 
                    color: #f85b5e;
                }
                .cs-nav-separator { 
                    height: 1px; 
                    background: rgba(255,255,255,0.04); 
                    margin: 12px 10px; 
                }

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
                    padding: 48px 40px 40px;
                    overflow-y: auto;
                }
                .cs-content-scroll::-webkit-scrollbar { width: 10px; }
                .cs-content-scroll::-webkit-scrollbar-track { background: transparent; }
                .cs-content-scroll::-webkit-scrollbar-thumb { 
                    background: #1a1b1e; 
                    border-radius: 5px;
                }
                .cs-content-scroll::-webkit-scrollbar-thumb:hover { background: #1e1f22; }
                
                /* ==================== CLOSE BUTTON (Enhanced) ==================== */
                
                .cs-close-btn-wrapper {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    z-index: 20;
                }
                
                .cs-close-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .cs-close-icon-circle {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.15);
                    border: 2px solid rgba(181, 186, 193, 0.2);
                    color: #b5bac1;
                    font-size: 18px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .cs-close-icon-circle::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .cs-close-icon-circle i {
                    position: relative;
                    z-index: 1;
                    transition: transform 0.3s ease;
                }
                
                .cs-close-hint {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    color: #72767d;
                    opacity: 0;
                    transform: translateY(-4px);
                    transition: all 0.2s ease;
                }
                
                /* Hover State */
                .cs-close-btn:hover .cs-close-icon-circle {
                    background: linear-gradient(135deg, rgba(237, 66, 69, 0.15) 0%, rgba(237, 66, 69, 0.05) 100%);
                    border-color: rgba(237, 66, 69, 0.4);
                    color: #ed4245;
                    transform: scale(1.08) rotate(90deg);
                    box-shadow: 0 4px 16px rgba(237, 66, 69, 0.2),
                                0 0 0 4px rgba(237, 66, 69, 0.05);
                }
                
                .cs-close-btn:hover .cs-close-icon-circle::before {
                    opacity: 1;
                }
                
                .cs-close-btn:hover .cs-close-icon-circle i {
                    transform: scale(1.15);
                }
                
                .cs-close-btn:hover .cs-close-hint {
                    opacity: 1;
                    transform: translateY(0);
                    color: #ed4245;
                }
                
                /* Active/Click State */
                .cs-close-btn:active .cs-close-icon-circle {
                    transform: scale(0.95) rotate(90deg);
                    box-shadow: 0 2px 8px rgba(237, 66, 69, 0.3);
                }
                
                /* Pulse animation on load */
                @keyframes csClosePulse {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(181, 186, 193, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(181, 186, 193, 0);
                    }
                }
                
                .cs-close-icon-circle {
                    animation: csClosePulse 2s ease-out 0.5s;
                }

                /* Forms */
                .cs-section-title { 
                    color: #f2f3f5; 
                    font-size: 20px; 
                    margin-bottom: 24px; 
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }
                .cs-form-group { margin-bottom: 20px; }
                .cs-form-group label {
                    display: block; 
                    color: #b5bac1; 
                    font-size: 11px; 
                    font-weight: 700; 
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .cs-input, .cs-textarea {
                    width: 100%; 
                    background: #1e1f22; 
                    border: 1px solid transparent; 
                    padding: 10px 12px;
                    border-radius: 4px; 
                    color: #dbdee1; 
                    font-size: 16px;
                    transition: all 0.15s ease;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .cs-input:hover, .cs-textarea:hover {
                    border-color: #1a1b1e;
                }
                .cs-input:focus, .cs-textarea:focus { 
                    outline: none; 
                    background: #1e1f22; 
                    border-color: #5865f2;
                }
                .cs-textarea { 
                    min-height: 100px; 
                    resize: vertical;
                    line-height: 1.5;
                }
                .cs-divider { 
                    height: 1px; 
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); 
                    margin: 32px 0; 
                }

                /* Range & Switch */
                .cs-range-wrapper { position: relative; }
                .cs-range { 
                    width: 100%; 
                    accent-color: #5865f2;
                    cursor: pointer;
                }
                .cs-range-value { 
                    position: absolute; 
                    right: 0; 
                    top: -20px; 
                    color: #f2f3f5; 
                    font-weight: 600; 
                }
                
                .cs-form-group-row { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 24px; 
                }
                .cs-label-desc label { 
                    margin-bottom: 4px; 
                    color: #f2f3f5; 
                    font-size: 14px; 
                    text-transform: none; 
                }
                .cs-label-desc p { 
                    color: #b5bac1; 
                    font-size: 13px; 
                    margin: 0;
                    line-height: 1.4; 
                }
                
                /* Switch */
                .cs-switch {
                    position: relative; 
                    display: inline-block; 
                    width: 44px; 
                    height: 26px;
                }
                .cs-switch input { opacity: 0; width: 0; height: 0; }
                .cs-slider-round {
                    position: absolute; 
                    cursor: pointer; 
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #80848e; 
                    transition: all 0.2s ease; 
                    border-radius: 34px;
                }
                .cs-slider-round:before {
                    position: absolute; 
                    content: ""; 
                    height: 20px; 
                    width: 20px; 
                    left: 3px; 
                    bottom: 3px;
                    background-color: white; 
                    transition: all 0.2s ease; 
                    border-radius: 50%;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                input:checked + .cs-slider-round { background-color: #3ba55c; }
                input:checked + .cs-slider-round:before { transform: translateX(18px); }
                .cs-slider-round:hover { opacity: 0.9; }

                /* ==================== PERMISSIONS TAB - ENHANCED ==================== */
                
                .cs-perm-header {
                    margin-bottom: 20px;
                }
                .cs-section-desc {
                    color: #949ba4;
                    font-size: 14px;
                    margin-top: 8px;
                    line-height: 1.5;
                }
                
                /* Permission Legend */
                .cs-perm-legend {
                    display: flex;
                    gap: 24px;
                    padding: 14px 18px;
                    background: linear-gradient(135deg, rgba(88, 101, 242, 0.08) 0%, rgba(88, 101, 242, 0.03) 100%);
                    border: 1px solid rgba(88, 101, 242, 0.15);
                    border-radius: 10px;
                    margin-bottom: 24px;
                    backdrop-filter: blur(10px);
                }
                .cs-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #b5bac1;
                }
                .cs-legend-icon {
                    width: 26px;
                    height: 26px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                .cs-legend-icon.deny {
                    background: rgba(218, 55, 60, 0.2);
                    color: #f23f43;
                    border: 1px solid rgba(218, 55, 60, 0.3);
                }
                .cs-legend-icon.inherit {
                    background: rgba(78, 80, 88, 0.4);
                    color: #949ba4;
                    border: 1px solid rgba(78, 80, 88, 0.5);
                }
                .cs-legend-icon.allow {
                    background: rgba(35, 165, 89, 0.2);
                    color: #23a559;
                    border: 1px solid rgba(35, 165, 89, 0.3);
                }
                
                /* Permission List Container with Custom Scrollbar */
                .cs-perm-list-container {
                    max-height: calc(100% - 180px);
                    overflow-y: auto;
                    padding-right: 8px;
                    margin-right: -8px;
                }
                .cs-perm-list-container::-webkit-scrollbar {
                    width: 6px;
                }
                .cs-perm-list-container::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                }
                .cs-perm-list-container::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #4e5058 0%, #3c3e44 100%);
                    border-radius: 3px;
                    transition: background 0.2s;
                }
                .cs-perm-list-container::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #5d6067 0%, #4a4c52 100%);
                }
                
                /* Permission Category */
                .cs-perm-category {
                    margin-bottom: 28px;
                }
                .cs-perm-category:last-child {
                    margin-bottom: 0;
                }
                .cs-perm-category-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 14px;
                    padding-bottom: 10px;
                    position: sticky;
                    top: 0;
                    background: #313338;
                    z-index: 5;
                }
                .cs-perm-category-header i {
                    color: #5865f2;
                    font-size: 15px;
                    opacity: 0.9;
                }
                .cs-perm-category-header span {
                    color: #949ba4;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .cs-category-line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(88, 101, 242, 0.3), transparent);
                }
                
                /* Permission Items */
                .cs-perm-category-items {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .cs-perm-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 16px;
                    background: rgba(30, 31, 34, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    animation: csPermItemSlideIn 0.3s ease-out backwards;
                }
                @keyframes csPermItemSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .cs-perm-item:hover {
                    background: rgba(30, 31, 34, 0.8);
                    border-color: rgba(255, 255, 255, 0.06);
                }
                .cs-perm-info {
                    flex: 1;
                    padding-right: 20px;
                }
                .cs-perm-name {
                    color: #f2f3f5;
                    font-weight: 500;
                    font-size: 15px;
                    margin-bottom: 4px;
                }
                .cs-perm-desc {
                    color: #949ba4;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                /* ==================== TRI-STATE BUTTONS ==================== */
                
                .cs-tri-state-group {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                }
                
                .cs-tri-btn {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    border: 2px solid transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    overflow: hidden;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    background: rgba(43, 45, 49, 0.6);
                    color: #6d6f78;
                }
                
                .cs-tri-btn:hover {
                    transform: scale(1.08);
                    z-index: 2;
                }
                
                .cs-tri-btn:active {
                    transform: scale(0.95);
                }
                
                .cs-tri-btn.deselecting {
                    transform: scale(0.9);
                    opacity: 0.7;
                }
                
                /* Deny Button */
                .cs-tri-deny {
                    border-color: rgba(218, 55, 60, 0.2);
                }
                .cs-tri-deny:hover {
                    background: rgba(218, 55, 60, 0.15);
                    border-color: rgba(218, 55, 60, 0.4);
                    color: #f23f43;
                    box-shadow: 0 0 20px rgba(218, 55, 60, 0.15);
                }
                .cs-tri-deny.active {
                    background: linear-gradient(135deg, #da373c 0%, #a12d31 100%);
                    border-color: #da373c;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(218, 55, 60, 0.4),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    transform: scale(1.05);
                }
                .cs-tri-deny.active:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(218, 55, 60, 0.5),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
                
                /* Inherit/Default Button */
                .cs-tri-inherit {
                    border-color: rgba(78, 80, 88, 0.3);
                }
                .cs-tri-inherit:hover {
                    background: rgba(78, 80, 88, 0.3);
                    border-color: rgba(78, 80, 88, 0.5);
                    color: #b5bac1;
                }
                .cs-tri-inherit.active {
                    background: linear-gradient(135deg, #5c5e66 0%, #4a4c52 100%);
                    border-color: #5c5e66;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(78, 80, 88, 0.3),
                                inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    transform: scale(1.05);
                }
                .cs-tri-inherit.active:hover {
                    transform: scale(1.1);
                }
                
                /* Allow Button */
                .cs-tri-allow {
                    border-color: rgba(35, 165, 89, 0.2);
                }
                .cs-tri-allow:hover {
                    background: rgba(35, 165, 89, 0.15);
                    border-color: rgba(35, 165, 89, 0.4);
                    color: #23a559;
                    box-shadow: 0 0 20px rgba(35, 165, 89, 0.15);
                }
                .cs-tri-allow.active {
                    background: linear-gradient(135deg, #23a559 0%, #1a7d43 100%);
                    border-color: #23a559;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(35, 165, 89, 0.4),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    transform: scale(1.05);
                }
                .cs-tri-allow.active:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(35, 165, 89, 0.5),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
                
                /* Ripple Effect */
                .cs-tri-ripple {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                    transform: scale(0);
                    opacity: 0;
                    pointer-events: none;
                }
                .cs-tri-ripple.animate {
                    animation: csTriRipple 0.4s ease-out;
                }
                @keyframes csTriRipple {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }
                
                /* Button Icons */
                .cs-tri-btn i {
                    position: relative;
                    z-index: 1;
                    transition: transform 0.2s ease;
                }
                .cs-tri-btn.active i {
                    transform: scale(1.1);
                }
                
                /* ==================== SAVE BAR - GLASSMORPHISM ==================== */

                .cs-save-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 60px;
                    z-index: 10;
                    display: flex;
                    justify-content: center;
                    padding: 0 20px 20px;
                    transform: translateY(100%);
                    opacity: 0;
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                                opacity 0.3s ease;
                    pointer-events: none;
                }
                .cs-save-bar.visible {
                    transform: translateY(0);
                    opacity: 1;
                    pointer-events: auto;
                    animation: csSaveBarBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes csSaveBarBounce {
                    0% {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    60% {
                        transform: translateY(-8px);
                        opacity: 1;
                    }
                    80% {
                        transform: translateY(4px);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }
                .cs-save-bar-content {
                    background: linear-gradient(135deg, 
                                    rgba(24, 25, 28, 0.95) 0%, 
                                    rgba(17, 18, 20, 0.98) 100%);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 14px 16px 14px 20px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 500px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
                                0 0 0 1px rgba(255, 255, 255, 0.06),
                                inset 0 1px 0 rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .cs-save-bar-content::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 10px;
                    padding: 1px;
                    background: linear-gradient(135deg, 
                                    rgba(88, 101, 242, 0.3) 0%, 
                                    transparent 50%,
                                    rgba(35, 165, 89, 0.2) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box,
                                  linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .cs-save-bar-content span {
                    color: #fff;
                    font-weight: 500;
                    margin-right: 24px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .cs-save-bar-content span::before {
                    content: '\F33A';
                    font-family: 'bootstrap-icons';
                    color: #faa61a;
                    font-size: 16px;
                }
                .cs-save-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .cs-btn-reset {
                    color: #b5bac1;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    padding: 10px 16px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .cs-btn-reset:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                }
                .cs-btn-save {
                    background: linear-gradient(135deg, #23a559 0%, #1e8e4a 100%);
                    color: #fff;
                    border: none;
                    padding: 10px 28px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(35, 165, 89, 0.3),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                .cs-btn-save::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                                    transparent, 
                                    rgba(255, 255, 255, 0.2), 
                                    transparent);
                    transition: left 0.5s ease;
                }
                .cs-btn-save:hover {
                    background: linear-gradient(135deg, #28b962 0%, #23a559 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(35, 165, 89, 0.4),
                                inset 0 1px 0 rgba(255, 255, 255, 0.15);
                }
                .cs-btn-save:hover::before {
                    left: 100%;
                }
                .cs-btn-save:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(35, 165, 89, 0.3);
                }
                .cs-btn-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                /* Delete */
                .cs-btn-danger {
                    background: #da373c; 
                    color: #fff; 
                    border: none; 
                    padding: 10px 18px;
                    border-radius: 4px; 
                    font-weight: 500; 
                    cursor: pointer;
                    transition: all 0.17s ease;
                    box-shadow: 0 2px 4px rgba(218, 55, 60, 0.3);
                }
                .cs-btn-danger:hover { 
                    background: #b82d31;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(218, 55, 60, 0.4);
                }
                .cs-btn-danger:active { 
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Expose global instance
    window.ChannelSettingsManager = new ChannelSettingsManager();

})(window);
