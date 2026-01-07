/**
 * Message Actions Manager
 * Provides message context menu and reaction functionality
 * for both /chat and /app pages
 */

(function (window) {
    'use strict';

    // Quick reaction emojis
    const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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

            // Bind handlers
            this._handleMouseOver = this._onMouseOver.bind(this);
            this._handleContextMenu = this._onContextMenu.bind(this);
            this._handleClickOutside = this._onClickOutside.bind(this);

            this._init();
        }

        _init() {
            document.addEventListener('mouseover', this._handleMouseOver);
            document.addEventListener('contextmenu', this._handleContextMenu);
            document.addEventListener('click', this._handleClickOutside);
        }

        /**
         * Add reaction bar to each message on hover
         */
        _onMouseOver(e) {
            const messageEl = e.target.closest(this.messageSelector);
            if (!messageEl) return;

            // Check if reaction bar already exists
            if (messageEl.querySelector('.message-reaction-bar')) return;

            const reactionBar = this._createReactionBar(messageEl);

            // Position relative to message
            const messageContent = messageEl.querySelector('.message-content, .dm-message-content') || messageEl;
            messageContent.style.position = 'relative';
            messageContent.appendChild(reactionBar);
        }

        _createReactionBar(messageEl) {
            const messageId = messageEl.dataset.messageId || messageEl.dataset.id;
            const authorId = messageEl.dataset.authorId || messageEl.dataset.userId;
            const currentUserId = this.getCurrentUserId();
            const isOwnMessage = authorId && currentUserId && String(authorId) === String(currentUserId);
            
            // DEBUG: ownership check
            if (!isOwnMessage) {
                 console.log(`[MessageActions] Not own message. MsgId: ${messageId}, Author: ${authorId}, Me: ${currentUserId}, RawAuthor: ${messageEl.getAttribute('data-author-id')}, dataset:`, messageEl.dataset);
            }

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
                ${isOwnMessage ? `
                <button class="reaction-bar-btn delete-btn" title="Xóa" style="color: #ef4444;">
                    <i class="bi bi-trash"></i>
                </button>
                ` : ''}
                <button class="reaction-bar-btn more-btn" title="Thêm">
                    <i class="bi bi-three-dots"></i>
                </button>
            `;

            // Quick reaction click
            bar.querySelectorAll('.quick-reaction-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = btn.dataset.emoji;
                    this._handleReaction(messageId, emoji);
                });
            });

            // Emoji picker button
            bar.querySelector('.emoji-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this._showEmojiPickerForReaction(messageId, e.currentTarget);
            });

            // Reply button
            bar.querySelector('.reply-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onReply) this.onReply(messageId, messageEl);
                else {
                     // Fallback if no handler: trigger global event or log
                     const event = new CustomEvent('message-reply', { detail: { messageId, messageEl } });
                     document.dispatchEvent(event);
                }
            });

            // Delete button
            const deleteBtn = bar.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._confirmDelete(messageId, messageEl);
                });
            }

            // More button (context menu)
            bar.querySelector('.more-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this._showContextMenu(messageEl, e.clientX, e.clientY);
            });

            return bar;
        }

        /**
         * Right-click context menu
         */
        _onContextMenu(e) {
            const messageEl = e.target.closest(this.messageSelector);
            if (!messageEl) return;

            // Don't show context menu on links/buttons
            if (e.target.closest('a, button')) return;

            e.preventDefault();
            this._showContextMenu(messageEl, e.clientX, e.clientY);
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

        _onClickOutside(e) {
            if (this.activeContextMenu && !e.target.closest('.message-context-menu')) {
                this._hideContextMenu();
            }
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
            // User requested no confirmation
            // if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

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

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[MessageActions] Delete failed:', response.status, errorText);
                    throw new Error('Failed to delete: ' + response.status);
                }

                // Don't remove element directly, let the app handle state update via onDelete
                // or just update content to show it's deleted
                
                if (this.onDelete) {
                    this.onDelete(messageId);
                } else {
                    // Fallback if no handler: update UI to show deleted state
                    const contentEl = messageEl.querySelector('.message-content, .dm-message-content');
                    if (contentEl) {
                        contentEl.innerHTML = '<em style="color: #999;">Tin nhắn đã bị xóa</em>';
                        messageEl.classList.add('message-deleted-placeholder');
                        // Remove actions
                        const reactionBar = messageEl.querySelector('.message-reaction-bar');
                        if (reactionBar) reactionBar.remove();
                    }
                }

                this._showToast('Đã xóa tin nhắn', 'success');
            } catch (error) {
                console.error('[MessageActions] Failed to delete message:', error);
                this._showToast('Không thể xóa tin nhắn', 'error');
            }
        }

        _showEmojiPickerForReaction(messageId, anchorEl) {
            // Use existing ChatInputManager emoji picker if available
            if (window.ChatInputManager) {
                // For now, show quick reactions
                this._showToast('Bấm vào emoji nhanh để react', 'info');
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
            document.removeEventListener('mouseover', this._handleMouseOver);
            document.removeEventListener('contextmenu', this._handleContextMenu);
            document.removeEventListener('click', this._handleClickOutside);
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
