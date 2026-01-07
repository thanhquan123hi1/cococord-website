/**
 * Message Actions Manager
 * Provides message context menu and reaction functionality
 * for both /chat and /app pages
 */

(function (window) {
    'use strict';

    // Quick reaction emojis
    const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    // Common emojis for picker
    const COMMON_EMOJIS = [
        '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '✅', '🎉', '👋',
        '💯', '👀', '✨', '🤔', '🤣', '🤢', '🤮', '🤧', '🤕', '🥳',
        '🥴', '🤤', '🤠', '🤡', '💩', '👻', '💀', '👽', '🤖', '👾',
        '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
        '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
        '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
        '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
        '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻',
        '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'
    ];

    class MessageActionsManager {
        constructor(options = {}) {
            this.containerSelector = options.containerSelector || '.messages-area, .dm-messages';
            this.messageSelector = options.messageSelector || '.message-row, .message-item, .dm-message-row';
            this.onReaction = options.onReaction || null;
            this.onEdit = options.onEdit || null;
            this.onReply = options.onReply || null;
            this.onForward = options.onForward || null;
            this.onCopy = options.onCopy || null;
            this.onPin = options.onPin || null;
            this.onDelete = options.onDelete || null;
            this.getCurrentUserId = options.getCurrentUserId || (() => null);

            this.activeContextMenu = null;
            this.activeMessageId = null;
            this.activeEmojiPicker = null;

            this._init();
        }

        /**
         * Static method to generate HTML for reaction pills
         * @param {Array} reactions - Array of reaction objects {emoji, count, userIds}
         * @param {String|Number} currentUserId
         */
        static generateReactionsHtml(reactions, currentUserId) {
            if (!reactions || reactions.length === 0) return '';

            // Ensure currentUserId is Long/String consistent
            const currentUserIdStr = String(currentUserId);

            let html = '<div class="message-reactions">';
            reactions.forEach(reaction => {
                const hasReacted = reaction.userIds && reaction.userIds.some(id => String(id) === currentUserIdStr);
                const activeClass = hasReacted ? 'active' : '';

                html += `
                    <div class="reaction-pill ${activeClass}" 
                         data-emoji="${reaction.emoji}" 
                         data-count="${reaction.count}"
                         onclick="window.messageActionsInstance._handleReactionClick(this, event)">
                        <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${reaction.emoji.codePointAt(0).toString(16)}.png" 
                             alt="${reaction.emoji}" 
                             class="emoji" 
                             onerror="this.src=''; this.outerHTML='${reaction.emoji}'">
                        <span class="count">${reaction.count}</span>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }

        /**
         * Handle click on a reaction pill (Toggle)
         * Called from inline onclick for simplicity
         */
        _handleReactionClick(pillEl, event) {
            event.stopPropagation();
            const messageEl = pillEl.closest(this.messageSelector);
            if (!messageEl) return;
            const messageId = messageEl.dataset.messageId || messageEl.dataset.id;
            const emoji = pillEl.dataset.emoji;

            this._handleReaction(messageId, emoji);
        }

        _init() {
            this._injectReactionBars();
            this._bindContextMenu();
            this._bindClickOutside();
        }

        // ... _injectReactionBars and _createReactionBar logic remains mostly the same ...
        // BUT I need to inject the method _createReactionBar correctly or assume it's there.
        // Since I'm using `replace_file_content` with ranges, I need to be careful.

        // I will replace the BEGINNING of the file until the constructor to add COMMON_EMOJIS
        // AND add the helper static method.

        // Wait, replace_file_content is block-based.
        // It's better to update individual methods if I can't overwrite easily.

        /**
         * Add reaction bar to each message on hover
         */
        _injectReactionBars() {
            // Use event delegation for dynamically loaded messages
            document.addEventListener('mouseover', (e) => {
                const messageEl = e.target.closest(this.messageSelector);
                if (!messageEl) return;

                // Check if reaction bar already exists
                if (messageEl.querySelector('.message-reaction-bar')) return;

                const reactionBar = this._createReactionBar(messageEl);

                // Position relative to message
                const messageContent = messageEl.querySelector('.message-content, .dm-message-content') || messageEl;
                messageContent.style.position = 'relative'; // Ensure relative positioning
                messageContent.appendChild(reactionBar);
            });
        }

        _createReactionBar(messageEl) {
            const messageId = messageEl.dataset.messageId || messageEl.dataset.id;
            /* Update to include proper class names for CSS */
            const bar = document.createElement('div');
            bar.className = 'message-reaction-bar';
            bar.innerHTML = `
                <div class="quick-reactions">
                    ${QUICK_REACTIONS.slice(0, 4).map(emoji => `
                        <button class="quick-reaction-btn" data-emoji="${emoji}" title="${emoji}">${emoji}</button>
                    `).join('')}
                </div>
                <div class="reaction-bar-divider"></div>
                <button class="reaction-bar-btn emoji-btn" title="Thêm reaction">
                    <i class="bi bi-emoji-smile"></i>
                </button>
                <button class="reaction-bar-btn reply-btn" title="Trả lời">
                    <i class="bi bi-reply"></i>
                </button>
                <button class="reaction-bar-btn more-btn" title="Thêm">
                    <i class="bi bi-three-dots"></i>
                </button>
            `;

            // ... existing listeners ...
            bar.querySelectorAll('.quick-reaction-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = btn.dataset.emoji;
                    this._handleReaction(messageId, emoji);
                });
            });

            bar.querySelector('.emoji-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this._showEmojiPickerForReaction(messageId, e.currentTarget);
            });

            // Reply
            bar.querySelector('.reply-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onReply) this.onReply(messageId, messageEl);
            });

            // Context Menu
            bar.querySelector('.more-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this._showContextMenu(messageEl, e.clientX, e.clientY);
            });

            return bar;
        }

        /* ... _bindContextMenu, _showContextMenu, _hideContextMenu ... */

        /* Replace _showEmojiPickerForReaction */
        _showEmojiPickerForReaction(messageId, anchorEl) {
            // Remove existing picker if any
            if (this.activeEmojiPicker) {
                this.activeEmojiPicker.remove();
                this.activeEmojiPicker = null;
            }

            // Create Overlay (transparent) to handle click outside
            const overlay = document.createElement('div');
            overlay.className = 'emoji-picker-overlay';
            overlay.addEventListener('click', () => {
                popup.remove();
                overlay.remove();
                this.activeEmojiPicker = null;
            });

            const popup = document.createElement('div');
            popup.className = 'emoji-picker-popup';

            const header = document.createElement('div');
            header.className = 'emoji-picker-header';
            header.textContent = 'Emoji phổ biến';
            popup.appendChild(header);

            const content = document.createElement('div');
            content.className = 'emoji-picker-content';

            COMMON_EMOJIS.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleReaction(messageId, emoji);
                    popup.remove();
                    overlay.remove();
                    this.activeEmojiPicker = null;
                });
                content.appendChild(item);
            });
            popup.appendChild(content);

            // Append to body
            document.body.appendChild(overlay);
            document.body.appendChild(popup);
            this.activeEmojiPicker = popup;

            // Position (Popper-like)
            const rect = anchorEl.getBoundingClientRect();
            let top = rect.bottom + 8;
            let left = rect.left;

            // Adjust boundaries
            if (left + 320 > window.innerWidth) {
                left = window.innerWidth - 330;
            }
            if (top + 400 > window.innerHeight) {
                top = rect.top - 408; // show above
            }

            popup.style.top = top + 'px';
            popup.style.left = left + 'px';
        }

        /* ... existing _getToken, _showToast, destroy ... */


        /**
         * Right-click context menu
         */
        _bindContextMenu() {
            document.addEventListener('contextmenu', (e) => {
                const messageEl = e.target.closest(this.messageSelector);
                if (!messageEl) return;

                // Don't show context menu on links/buttons
                if (e.target.closest('a, button')) return;

                e.preventDefault();
                this._showContextMenu(messageEl, e.clientX, e.clientY);
            });
        }

        _showContextMenu(messageEl, x, y) {
            this._hideContextMenu();

            const messageId = messageEl.dataset.messageId || messageEl.dataset.id;
            const authorId = messageEl.dataset.authorId || messageEl.dataset.userId;
            const currentUserId = this.getCurrentUserId();
            const isOwnMessage = authorId && currentUserId && String(authorId) === String(currentUserId);
            const isPinned = messageEl.dataset.pinned === 'true';

            this.activeMessageId = messageId;

            const menu = document.createElement('div');
            menu.className = 'message-context-menu';
            menu.innerHTML = `
                <div class="context-menu-reactions">
                    ${QUICK_REACTIONS.map(emoji => `
                        <button class="context-reaction-btn" data-emoji="${emoji}" title="${emoji}">${emoji}</button>
                    `).join('')}
                </div>
                <div class="context-menu-item" data-action="reply">
                    <i class="bi bi-reply"></i>
                    <span>Trả lời</span>
                </div>
                ${isOwnMessage ? `
                <div class="context-menu-item" data-action="edit">
                    <i class="bi bi-pencil"></i>
                    <span>Chỉnh sửa</span>
                </div>
                ` : ''}
                <div class="context-menu-item" data-action="forward">
                    <i class="bi bi-forward"></i>
                    <span>Chuyển tiếp</span>
                </div>
                <div class="context-menu-item" data-action="copy">
                    <i class="bi bi-clipboard"></i>
                    <span>Sao chép văn bản</span>
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item" data-action="pin">
                    <i class="bi bi-pin${isPinned ? '-fill' : ''}"></i>
                    <span>${isPinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}</span>
                </div>
                ${isOwnMessage ? `
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" data-action="delete">
                    <i class="bi bi-trash"></i>
                    <span>Xóa tin nhắn</span>
                </div>
                ` : ''}
            `;

            // Position menu
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            document.body.appendChild(menu);

            // Adjust if menu goes off-screen
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - rect.width - 8}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - rect.height - 8}px`;
            }

            // Bind actions
            menu.querySelectorAll('.context-reaction-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleReaction(messageId, btn.dataset.emoji);
                    this._hideContextMenu();
                });
            });

            menu.querySelectorAll('.context-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    this._handleAction(action, messageId, messageEl, isPinned);
                    this._hideContextMenu();
                });
            });

            this.activeContextMenu = menu;
        }

        _hideContextMenu() {
            if (this.activeContextMenu) {
                this.activeContextMenu.remove();
                this.activeContextMenu = null;
            }
            this.activeMessageId = null;
        }

        _bindClickOutside() {
            document.addEventListener('click', () => {
                this._hideContextMenu();
            });

            document.addEventListener('scroll', () => {
                this._hideContextMenu();
            }, true);
        }

        /**
         * Handle reaction add/toggle
         */
        async _handleReaction(messageId, emoji) {
            if (!messageId || !emoji) return;

            try {
                const response = await fetch(`/api/messages/${messageId}/reactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._getToken()}`
                    },
                    body: JSON.stringify({ emoji })
                });

                if (!response.ok) throw new Error('Failed to add reaction');

                if (this.onReaction) this.onReaction(messageId, emoji);
                this._showToast(`Đã thêm ${emoji}`, 'success');
            } catch (error) {
                console.error('[MessageActions] Failed to add reaction:', error);
                this._showToast('Không thể thêm reaction', 'error');
            }
        }

        /**
         * Handle context menu actions
         */
        _handleAction(action, messageId, messageEl, isPinned) {
            switch (action) {
                case 'reply':
                    if (this.onReply) this.onReply(messageId, messageEl);
                    break;

                case 'edit':
                    this._startEditMode(messageEl, messageId);
                    break;

                case 'forward':
                    if (this.onForward) this.onForward(messageId, messageEl);
                    else this._showToast('Chức năng chuyển tiếp đang phát triển', 'info');
                    break;

                case 'copy':
                    this._copyMessageText(messageEl);
                    break;

                case 'pin':
                    this._togglePin(messageId, isPinned);
                    break;

                case 'delete':
                    this._confirmDelete(messageId, messageEl);
                    break;
            }
        }

        /**
         * Copy message text
         */
        _copyMessageText(messageEl) {
            const textEl = messageEl.querySelector('.message-text, .dm-message-text, .msg-content');
            if (!textEl) {
                this._showToast('Không có văn bản để sao chép', 'warning');
                return;
            }

            navigator.clipboard.writeText(textEl.textContent).then(() => {
                this._showToast('Đã sao chép văn bản', 'success');
            }).catch(() => {
                // Fallback
                const range = document.createRange();
                range.selectNode(textEl);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                this._showToast('Đã sao chép văn bản', 'success');
            });
        }

        /**
         * Toggle pin/unpin message
         */
        async _togglePin(messageId, isPinned) {
            try {
                const method = isPinned ? 'DELETE' : 'POST';
                const response = await fetch(`/api/messages/${messageId}/pin`, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                if (!response.ok) throw new Error('Failed to pin/unpin');

                // Update UI
                const messageEl = document.querySelector(`[data-message-id="${messageId}"], [data-id="${messageId}"]`);
                if (messageEl) {
                    messageEl.dataset.pinned = !isPinned;

                    // Add/remove pin badge
                    let badge = messageEl.querySelector('.message-pinned-badge');
                    if (isPinned && badge) {
                        badge.remove();
                    } else if (!isPinned) {
                        const header = messageEl.querySelector('.message-header, .dm-message-header') || messageEl;
                        badge = document.createElement('span');
                        badge.className = 'message-pinned-badge';
                        badge.innerHTML = '<i class="bi bi-pin-fill"></i> Đã ghim';
                        header.appendChild(badge);
                    }
                }

                if (this.onPin) this.onPin(messageId, !isPinned);
                this._showToast(isPinned ? 'Đã bỏ ghim' : 'Đã ghim tin nhắn', 'success');
            } catch (error) {
                console.error('[MessageActions] Failed to toggle pin:', error);
                this._showToast('Không thể ghim/bỏ ghim', 'error');
            }
        }

        /**
         * Start edit mode for a message
         */
        _startEditMode(messageEl, messageId) {
            const textEl = messageEl.querySelector('.message-text, .dm-message-text, .msg-content');
            if (!textEl) return;

            const originalText = textEl.textContent;

            // Create edit UI
            const editContainer = document.createElement('div');
            editContainer.className = 'message-edit-mode';
            editContainer.innerHTML = `
                <textarea class="message-edit-input">${originalText}</textarea>
                <div class="message-edit-actions">
                    <span class="cancel-edit">Hủy</span>
                    <span> • </span>
                    <span class="save-hint">Enter để lưu</span>
                </div>
            `;

            textEl.style.display = 'none';
            textEl.parentNode.insertBefore(editContainer, textEl.nextSibling);

            const input = editContainer.querySelector('.message-edit-input');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);

            // Auto-resize
            input.style.height = input.scrollHeight + 'px';
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
            });

            // Cancel
            editContainer.querySelector('.cancel-edit').addEventListener('click', () => {
                editContainer.remove();
                textEl.style.display = '';
            });

            // Save on Enter
            input.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const newText = input.value.trim();

                    if (newText && newText !== originalText) {
                        await this._saveEdit(messageId, newText, textEl, editContainer);
                    } else {
                        editContainer.remove();
                        textEl.style.display = '';
                    }
                }

                if (e.key === 'Escape') {
                    editContainer.remove();
                    textEl.style.display = '';
                }
            });
        }

        async _saveEdit(messageId, newText, textEl, editContainer) {
            try {
                const response = await fetch(`/api/messages/${messageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._getToken()}`
                    },
                    body: JSON.stringify({ content: newText })
                });

                if (!response.ok) throw new Error('Failed to edit');

                textEl.textContent = newText;

                // Add edited indicator if not exists
                if (!textEl.parentNode.querySelector('.message-edited-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'message-edited-indicator';
                    indicator.textContent = '(đã chỉnh sửa)';
                    textEl.after(indicator);
                }

                editContainer.remove();
                textEl.style.display = '';

                if (this.onEdit) this.onEdit(messageId, newText);
                this._showToast('Đã lưu chỉnh sửa', 'success');
            } catch (error) {
                console.error('[MessageActions] Failed to edit message:', error);
                this._showToast('Không thể chỉnh sửa tin nhắn', 'error');
            }
        }

        /**
         * Confirm and delete message
         */
        _confirmDelete(messageId, messageEl) {
            if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

            this._deleteMessage(messageId, messageEl);
        }

        async _deleteMessage(messageId, messageEl) {
            try {
                const response = await fetch(`/api/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                if (!response.ok) throw new Error('Failed to delete');

                // Animate removal
                messageEl.style.transition = 'opacity 0.2s, transform 0.2s';
                messageEl.style.opacity = '0';
                messageEl.style.transform = 'translateX(-20px)';

                setTimeout(() => {
                    messageEl.remove();
                }, 200);

                if (this.onDelete) this.onDelete(messageId);
                this._showToast('Đã xóa tin nhắn', 'success');
            } catch (error) {
                console.error('[MessageActions] Failed to delete message:', error);
                this._showToast('Không thể xóa tin nhắn', 'error');
            }
        }

        _showEmojiPickerForReaction(messageId, anchorEl) {
            // Remove existing picker if any
            if (this.activeEmojiPicker) {
                this.activeEmojiPicker.remove();
                this.activeEmojiPicker = null;
            }

            // Create Overlay (transparent) to handle click outside
            const overlay = document.createElement('div');
            overlay.className = 'emoji-picker-overlay';
            overlay.addEventListener('click', () => {
                popup.remove();
                overlay.remove();
                this.activeEmojiPicker = null;
            });

            const popup = document.createElement('div');
            popup.className = 'emoji-picker-popup';

            const header = document.createElement('div');
            header.className = 'emoji-picker-header';
            header.textContent = 'Emoji phổ biến';
            popup.appendChild(header);

            const content = document.createElement('div');
            content.className = 'emoji-picker-content';

            COMMON_EMOJIS.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleReaction(messageId, emoji);
                    popup.remove();
                    overlay.remove();
                    this.activeEmojiPicker = null;
                });
                content.appendChild(item);
            });
            popup.appendChild(content);

            // Append to body
            document.body.appendChild(overlay);
            document.body.appendChild(popup);
            this.activeEmojiPicker = popup;

            // Position (Popper-like)
            const rect = anchorEl.getBoundingClientRect();
            let top = rect.bottom + 8;
            let left = rect.left;

            // Adjust boundaries
            if (left + 320 > window.innerWidth) {
                left = window.innerWidth - 330;
            }
            if (top + 400 > window.innerHeight) {
                top = rect.top - 408; // show above
            }

            popup.style.top = top + 'px';
            popup.style.left = left + 'px';
        }

        /**
         * Handle reaction update from WebSocket
         * @param {Object} payload - ReactionEvent { messageId, emoji, userId, action, count }
         * @param {String|Number} currentUserId
         */
        handleReactionUpdate(payload, currentUserId) {
            const { messageId, emoji, userId, action, count } = payload;
            const messageEl = document.querySelector(`${this.messageSelector}[data-message-id="${messageId}"]`);

            if (!messageEl) return;

            const isCurrentUser = String(userId) === String(currentUserId);

            // Find container
            let reactionsContainer = messageEl.querySelector('.message-reactions');
            if (!reactionsContainer && action === 'ADD') {
                // Create container if not exists
                reactionsContainer = document.createElement('div');
                reactionsContainer.className = 'message-reactions';
                // Insert after message content
                const contentEl = messageEl.querySelector('.message-content');
                if (contentEl) {
                    contentEl.after(reactionsContainer);
                } else {
                    messageEl.querySelector('.message-body').appendChild(reactionsContainer);
                }
            }
            if (!reactionsContainer) return; // Should not happen for ADD

            // Find pill
            let pill = reactionsContainer.querySelector(`.reaction-pill[data-emoji="${emoji}"]`);

            if (action === 'ADD') {
                if (pill) {
                    // Update count from payload (reliable) or increment
                    if (count !== undefined) {
                        pill.dataset.count = count;
                        pill.querySelector('.count').textContent = count;
                    } else {
                        // Fallback
                        const newCount = parseInt(pill.dataset.count || 0) + 1;
                        pill.dataset.count = newCount;
                        pill.querySelector('.count').textContent = newCount;
                    }

                    if (isCurrentUser) pill.classList.add('active');
                } else {
                    // Create new pill
                    // Use static generator for single pill? No, reusing logic.
                    // We need HTML for one pill.
                    const pillHtml = `
                        <div class="reaction-pill ${isCurrentUser ? 'active' : ''}" 
                             data-emoji="${emoji}" 
                             data-count="${count || 1}"
                             onclick="window.messageActionsInstance._handleReactionClick(this, event)">
                            <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${emoji.codePointAt(0).toString(16)}.png" 
                                 alt="${emoji}" 
                                 class="emoji" 
                                 onerror="this.src=''; this.outerHTML='${emoji}'">
                            <span class="count">${count || 1}</span>
                        </div>
                    `;
                    reactionsContainer.insertAdjacentHTML('beforeend', pillHtml);
                }
            } else if (action === 'REMOVE') {
                if (pill) {
                    if (count !== undefined) {
                        // If count is 0, remove
                        if (count <= 0) {
                            pill.remove();
                        } else {
                            pill.dataset.count = count;
                            pill.querySelector('.count').textContent = count;
                            if (isCurrentUser) pill.classList.remove('active');
                        }
                    } else {
                        // Fallback logic
                        let newCount = parseInt(pill.dataset.count || 1) - 1;
                        if (newCount <= 0) {
                            pill.remove();
                        } else {
                            pill.dataset.count = newCount;
                            pill.querySelector('.count').textContent = newCount;
                            if (isCurrentUser) pill.classList.remove('active');
                        }
                    }
                }
            }

            // If container empty, remove it? Optional but cleaner
            if (reactionsContainer.children.length === 0) {
                reactionsContainer.remove();
            }
        }

        _getToken() {
            return localStorage.getItem('accessToken') ||
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] ||
                '';
        }

        _showToast(message, type = 'info') {
            if (window.ToastManager) {
                window.ToastManager.show(message, type);
            } else {
                console.log(`[Toast] ${type}: ${message}`);
            }
        }

        destroy() {
            this._hideContextMenu();
        }
    }

    // Export globally
    window.MessageActionsManager = MessageActionsManager;

    // Auto-initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize for chat/app pages
        if (document.querySelector('.message-list, #messageList, #dmMessages, .dm-messages')) {
            window.messageActionsInstance = new MessageActionsManager({
                containerSelector: '.message-list, #messageList, #dmMessages, .dm-messages',
                messageSelector: '.message-row, .message-item, .dm-message-row',
                getCurrentUserId: function () {
                    // Try to get current user ID from various sources
                    if (window.currentUser) return window.currentUser.id;
                    if (window.state && window.state.currentUser) return window.state.currentUser.id;
                    return null;
                }
            });
            console.log('[MessageActions] Initialized automatically');
        }
    });

})(window);
