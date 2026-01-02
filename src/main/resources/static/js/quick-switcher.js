/**
 * Quick Switcher Modal Component
 * Discord-style command palette / search modal
 */
(function() {
    'use strict';

    const QuickSwitcherModal = {
        isOpen: false,
        modalElement: null,
        selectedIndex: -1,
        results: [],
        searchTimeout: null,

        // Data sources
        servers: [],
        channels: [],
        dmItems: [],
        friends: [],

        /**
         * Initialize the Quick Switcher
         */
        init: function() {
            // Bind keyboard shortcut (Ctrl+K or Cmd+K)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        },

        /**
         * Replace static search inputs with Quick Switcher buttons
         */
        replaceSearchInputs: function() {
            const searchSelectors = [
                '.sidebar-search',
                '.search-wrap'
            ];

            searchSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(wrapper => {
                    // Skip if already replaced
                    if (wrapper.querySelector('.search-switcher-btn')) return;

                    const existingInput = wrapper.querySelector('input[type="text"], input.search-input, #globalSearch');
                    if (existingInput) {
                        const button = this.createSwitcherButton();
                        existingInput.style.display = 'none';
                        wrapper.appendChild(button);
                    }
                });
            });
        },

        /**
         * Create the switcher trigger button
         */
        createSwitcherButton: function() {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'search-switcher-btn';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.707 20.293l-5.387-5.387a8.5 8.5 0 10-1.414 1.414l5.387 5.387a1 1 0 001.414-1.414zM10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>
                </svg>
                <span>Tìm hoặc bắt đầu cuộc trò chuyện</span>
                <span class="shortcut-hint">Ctrl K</span>
            `;
            button.addEventListener('click', () => this.open());
            return button;
        },

        /**
         * Toggle the modal
         */
        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        /**
         * Open the Quick Switcher modal
         */
        open: function() {
            if (this.isOpen) return;

            // Gather data from app state
            this.gatherData();

            // Create and append modal
            this.modalElement = this.createModal();
            document.body.appendChild(this.modalElement);

            // Focus input
            const input = this.modalElement.querySelector('.quick-switcher-input');
            if (input) {
                setTimeout(() => input.focus(), 50);
            }

            // Bind events
            this.bindEvents();

            this.isOpen = true;
            this.selectedIndex = -1;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        },

        /**
         * Close the Quick Switcher modal
         */
        close: function() {
            if (!this.isOpen || !this.modalElement) return;

            // Animate out
            this.modalElement.style.animation = 'qsOverlayFadeIn 0.15s ease reverse';
            
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentNode) {
                    this.modalElement.parentNode.removeChild(this.modalElement);
                }
                this.modalElement = null;
                this.isOpen = false;
                this.results = [];
                this.selectedIndex = -1;

                // Restore body scroll
                document.body.style.overflow = '';
            }, 150);
        },

        /**
         * Gather data from various sources
         */
        gatherData: function() {
            try {
                // From CoCoCordApp exports
                if (window.CoCoCordApp) {
                    if (typeof window.CoCoCordApp.getDmItems === 'function') {
                        this.dmItems = window.CoCoCordApp.getDmItems() || [];
                    }
                    if (typeof window.CoCoCordApp.getFriends === 'function') {
                        this.friends = window.CoCoCordApp.getFriends() || [];
                    }
                    if (typeof window.CoCoCordApp.getServers === 'function') {
                        this.servers = window.CoCoCordApp.getServers() || [];
                    }
                }
            } catch (e) {
                console.warn('QuickSwitcher: Could not gather app data', e);
            }
        },

        /**
         * Create the modal HTML structure
         */
        createModal: function() {
            const overlay = document.createElement('div');
            overlay.className = 'quick-switcher-overlay';
            overlay.innerHTML = `
                <div class="quick-switcher-modal" role="dialog" aria-modal="true" aria-label="Quick Switcher">
                    <div class="quick-switcher-input-wrapper">
                        <input 
                            type="text" 
                            class="quick-switcher-input" 
                            placeholder="Chúng tôi có thể phục vụ bạn gì nào?"
                            autocomplete="off"
                            spellcheck="false"
                        />
                    </div>
                    
                    <div class="quick-switcher-content">
                        ${this.renderEmptyState()}
                    </div>
                    
                    <div class="quick-switcher-footer">
                        <div class="quick-switcher-hints">
                            <div class="quick-switcher-hint">
                                <span class="quick-switcher-key">↑</span>
                                <span class="quick-switcher-key">↓</span>
                                <span>để điều hướng</span>
                            </div>
                            <div class="quick-switcher-hint">
                                <span class="quick-switcher-key">Enter</span>
                                <span>để chọn</span>
                            </div>
                            <div class="quick-switcher-hint">
                                <span class="quick-switcher-key">Esc</span>
                                <span>để đóng</span>
                            </div>
                        </div>
                        <div class="quick-switcher-protip">
                            <strong>PROTIP:</strong> Bắt đầu với @ để tìm bạn bè
                        </div>
                    </div>
                </div>
            `;

            return overlay;
        },

        /**
         * Render empty state
         */
        renderEmptyState: function() {
            return `
                <div class="quick-switcher-empty">
                    <div class="quick-switcher-empty-emoji">🔍</div>
                    <div class="quick-switcher-empty-text">
                        Cuộc trò chuyện mới của tôi chưa thấy ai xuất hiện...
                    </div>
                </div>
            `;
        },

        /**
         * Render search results
         */
        renderResults: function() {
            if (this.results.length === 0) {
                return this.renderEmptyState();
            }

            const grouped = this.groupResults();
            let html = '<div class="quick-switcher-results">';

            if (grouped.dms.length > 0) {
                html += this.renderSection('TIN NHẮN TRỰC TIẾP', grouped.dms);
            }

            if (grouped.friends.length > 0) {
                html += this.renderSection('BẠN BÈ', grouped.friends);
            }

            if (grouped.servers.length > 0) {
                html += this.renderSection('MÁY CHỦ', grouped.servers);
            }

            if (grouped.channels.length > 0) {
                html += this.renderSection('KÊNH', grouped.channels);
            }

            html += '</div>';
            return html;
        },

        /**
         * Group results by type
         */
        groupResults: function() {
            return {
                dms: this.results.filter(r => r.type === 'dm'),
                friends: this.results.filter(r => r.type === 'friend'),
                servers: this.results.filter(r => r.type === 'server'),
                channels: this.results.filter(r => r.type === 'channel')
            };
        },

        /**
         * Render a section of results
         */
        renderSection: function(title, items) {
            let html = `
                <div class="quick-switcher-section">
                    <div class="quick-switcher-section-title">${this.escapeHtml(title)}</div>
            `;

            items.forEach((item) => {
                const globalIdx = this.results.indexOf(item);
                const isSelected = globalIdx === this.selectedIndex;
                html += this.renderItem(item, isSelected, globalIdx);
            });

            html += '</div>';
            return html;
        },

        /**
         * Render a single result item
         */
        renderItem: function(item, isSelected, index) {
            const selectedClass = isSelected ? 'selected' : '';
            
            let iconHtml = '';
            if (item.type === 'channel') {
                iconHtml = `<div class="quick-switcher-item-icon channel">#</div>`;
            } else if (item.avatarUrl) {
                iconHtml = `<div class="quick-switcher-item-icon"><img src="${this.escapeHtml(item.avatarUrl)}" alt=""></div>`;
            } else {
                const initial = (item.name || item.displayName || '?').charAt(0).toUpperCase();
                iconHtml = `<div class="quick-switcher-item-icon">${this.escapeHtml(initial)}</div>`;
            }

            let metaHtml = '';
            if (item.meta) {
                metaHtml = `<div class="quick-switcher-item-meta">${this.escapeHtml(item.meta)}</div>`;
            }

            return `
                <div class="quick-switcher-item ${selectedClass}" 
                     data-index="${index}" 
                     data-type="${item.type}" 
                     data-id="${item.id}">
                    ${iconHtml}
                    <div class="quick-switcher-item-info">
                        <div class="quick-switcher-item-name">${this.highlightMatch(item.name || item.displayName || 'Unknown')}</div>
                        ${metaHtml}
                    </div>
                </div>
            `;
        },

        /**
         * Highlight matched text
         */
        highlightMatch: function(text) {
            const input = this.modalElement?.querySelector('.quick-switcher-input');
            const query = input?.value?.toLowerCase() || '';
            
            if (!query) return this.escapeHtml(text);

            const escaped = this.escapeHtml(text);
            const queryEscaped = this.escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${queryEscaped})`, 'gi');
            
            return escaped.replace(regex, '<mark>$1</mark>');
        },

        /**
         * Perform search
         */
        search: function(query) {
            query = query.trim().toLowerCase();
            this.results = [];

            if (!query) {
                this.updateContent(this.renderEmptyState());
                return;
            }

            // Search DMs
            if (this.dmItems && this.dmItems.length > 0) {
                this.dmItems.forEach(dm => {
                    const name = (dm.displayName || dm.username || '').toLowerCase();
                    if (name.includes(query)) {
                        this.results.push({
                            type: 'dm',
                            id: dm.dmGroupId || dm.id,
                            name: dm.displayName || dm.username,
                            avatarUrl: dm.avatarUrl,
                            meta: dm.username ? `@${dm.username}` : null,
                            data: dm
                        });
                    }
                });
            }

            // Search friends (if query starts with @)
            if (query.startsWith('@') && this.friends && this.friends.length > 0) {
                const friendQuery = query.slice(1);
                this.friends.forEach(friend => {
                    const name = (friend.displayName || friend.username || '').toLowerCase();
                    if (name.includes(friendQuery)) {
                        this.results.push({
                            type: 'friend',
                            id: friend.id,
                            name: friend.displayName || friend.username,
                            avatarUrl: friend.avatarUrl,
                            meta: `@${friend.username}`,
                            data: friend
                        });
                    }
                });
            }

            // Search servers
            if (this.servers && this.servers.length > 0) {
                this.servers.forEach(server => {
                    const name = (server.name || '').toLowerCase();
                    if (name.includes(query)) {
                        this.results.push({
                            type: 'server',
                            id: server.id,
                            name: server.name,
                            avatarUrl: server.iconUrl,
                            meta: `${server.memberCount || 0} thành viên`,
                            data: server
                        });
                    }
                });
            }

            this.selectedIndex = this.results.length > 0 ? 0 : -1;
            this.updateContent(this.renderResults());
        },

        /**
         * Update content area
         */
        updateContent: function(html) {
            if (!this.modalElement) return;
            const content = this.modalElement.querySelector('.quick-switcher-content');
            if (content) {
                content.innerHTML = html;
                this.bindItemEvents();
            }
        },

        /**
         * Bind item click events
         */
        bindItemEvents: function() {
            if (!this.modalElement) return;

            this.modalElement.querySelectorAll('.quick-switcher-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index, 10);
                    this.selectItem(index);
                });

                item.addEventListener('mouseenter', () => {
                    const index = parseInt(item.dataset.index, 10);
                    this.selectedIndex = index;
                    this.updateSelection();
                });
            });
        },

        /**
         * Bind modal events
         */
        bindEvents: function() {
            if (!this.modalElement) return;

            const overlay = this.modalElement;
            const modal = overlay.querySelector('.quick-switcher-modal');
            const input = overlay.querySelector('.quick-switcher-input');

            // Click outside to close
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });

            // Prevent modal click from closing
            modal?.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Keyboard events
            overlay.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        this.close();
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.navigateDown();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.navigateUp();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (this.selectedIndex >= 0) {
                            this.selectItem(this.selectedIndex);
                        }
                        break;
                }
            });

            // Search input
            input?.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 150);
            });
        },

        /**
         * Navigate selection down
         */
        navigateDown: function() {
            if (this.results.length === 0) return;
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
            this.updateSelection();
        },

        /**
         * Navigate selection up
         */
        navigateUp: function() {
            if (this.results.length === 0) return;
            this.selectedIndex = this.selectedIndex <= 0 
                ? this.results.length - 1 
                : this.selectedIndex - 1;
            this.updateSelection();
        },

        /**
         * Update visual selection
         */
        updateSelection: function() {
            if (!this.modalElement) return;

            this.modalElement.querySelectorAll('.quick-switcher-item').forEach((item) => {
                const itemIndex = parseInt(item.dataset.index, 10);
                item.classList.toggle('selected', itemIndex === this.selectedIndex);
            });

            // Scroll into view
            const selected = this.modalElement.querySelector('.quick-switcher-item.selected');
            if (selected) {
                selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        },

        /**
         * Select an item and perform action
         */
        selectItem: function(index) {
            const item = this.results[index];
            if (!item) return;

            this.close();

            // Perform action based on type
            switch (item.type) {
                case 'dm':
                    this.openDm(item);
                    break;
                case 'friend':
                    this.openFriendDm(item);
                    break;
                case 'server':
                    this.navigateToServer(item);
                    break;
                case 'channel':
                    this.navigateToChannel(item);
                    break;
            }
        },

        /**
         * Open DM conversation
         */
        openDm: function(item) {
            if (window.CoCoCordApp?.openDm) {
                window.CoCoCordApp.openDm(item.id);
            } else if (typeof spaNavigate === 'function') {
                spaNavigate(`/messages?dmGroupId=${item.id}`);
            } else {
                window.location.href = `/messages?dmGroupId=${item.id}`;
            }
        },

        /**
         * Open DM with a friend
         */
        openFriendDm: async function(item) {
            try {
                const response = await fetch(`/api/direct-messages/create-dm/${item.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
                    }
                });

                if (response.ok) {
                    const dmGroup = await response.json();
                    this.openDm({ id: dmGroup.id });
                }
            } catch (e) {
                console.error('QuickSwitcher: Failed to open DM', e);
            }
        },

        /**
         * Navigate to server
         */
        navigateToServer: function(item) {
            if (typeof spaNavigate === 'function') {
                spaNavigate(`/chat?serverId=${item.id}`);
            } else {
                window.location.href = `/chat?serverId=${item.id}`;
            }
        },

        /**
         * Navigate to channel
         */
        navigateToChannel: function(item) {
            if (typeof spaNavigate === 'function') {
                spaNavigate(`/chat?serverId=${item.data?.serverId}&channelId=${item.id}`);
            } else {
                window.location.href = `/chat?serverId=${item.data?.serverId}&channelId=${item.id}`;
            }
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml: function(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => QuickSwitcherModal.init());
    } else {
        QuickSwitcherModal.init();
    }

    // Expose globally
    window.QuickSwitcherModal = QuickSwitcherModal;

})();
