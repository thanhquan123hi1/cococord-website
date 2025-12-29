/**
 * Enhanced Message Component with Attachments, Reactions, and Actions
 * Discord Clone - Rich Message System
 */

(() => {
    'use strict';

    // ==================== UTILITIES ====================
    
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = diffDays === 1;

        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });

        if (isToday) {
            return `Today at ${timeStr}`;
        } else if (isYesterday) {
            return `Yesterday at ${timeStr}`;
        } else if (diffDays < 7) {
            return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric' 
            }) + ' ' + timeStr;
        }
    }

    function parseMarkdown(text, mentionedUserIds) {
        if (!text) return '';
        
        let html = escapeHtml(text);

        // Code blocks (```code```)
        html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
        });

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_)
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough (~~text~~)
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Underline (__text__)
        html = html.replace(/___(.+?)___/g, '<u>$1</u>');

        // Mentions <@userId> - highlight with Discord-like styling
        html = html.replace(/&lt;@(\d+)&gt;/g, (match, userId) => {
            const isMentioned = mentionedUserIds && mentionedUserIds.includes(parseInt(userId));
            const mentionClass = isMentioned ? 'mention mention-highlight' : 'mention';
            // Get username from cache if available
            const username = window.userCache && window.userCache[userId] 
                ? `@${window.userCache[userId].displayName || window.userCache[userId].username}` 
                : `@user${userId}`;
            return `<span class="${mentionClass}" data-user-id="${userId}">${username}</span>`;
        });

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Auto-link URLs
        html = html.replace(/(https?:\/\/[^\s<]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // ==================== MESSAGE RENDERING ====================

    function createMessageElement(message, currentUser) {
        const div = document.createElement('div');
        div.className = 'message-item';
        div.dataset.messageId = message.id;

        const isOwnMessage = currentUser && message.userId === currentUser.id;
        if (isOwnMessage) {
            div.classList.add('own-message');
        }

        // Check if current user is mentioned in this message
        const isMentioned = currentUser && message.mentionedUserIds && 
            message.mentionedUserIds.includes(currentUser.id);
        if (isMentioned) {
            div.classList.add('message-mentioned');
        }

        const timestamp = formatRelativeTime(message.createdAt);
        const editedLabel = message.isEdited ? '<span class="edited-label">(edited)</span>' : '';

        div.innerHTML = `
            <div class="message-avatar">
                <img src="${message.avatarUrl || '/images/default-avatar.png'}" 
                     alt="${escapeHtml(message.displayName || message.username)}" 
                     width="40" height="40" />
            </div>
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="message-author ${message.roleColor ? 'has-role-color' : ''}" 
                          style="${message.roleColor ? 'color: ' + message.roleColor : ''}">
                        ${escapeHtml(message.displayName || message.username)}
                    </span>
                    <span class="message-timestamp">${timestamp}</span>
                    ${editedLabel}
                </div>
                <div class="message-content">
                    ${parseMarkdown(message.content, message.mentionedUserIds)}
                </div>
                ${renderAttachments(message.attachments)}
                ${renderReactions(message.reactions, currentUser)}
                <div class="message-actions">
                    <button class="action-btn" data-action="reply" title="Reply">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                        </svg>
                    </button>
                    <button class="action-btn" data-action="react" title="Add Reaction">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 6c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                    </button>
                    <button class="action-btn more-btn" data-action="more" title="More Options">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        setupMessageActions(div, message, currentUser);
        return div;
    }

    function renderAttachments(attachments) {
        if (!attachments || attachments.length === 0) return '';

        const html = attachments.map(att => {
            const isImage = att.fileType?.startsWith('image/');
            const isVideo = att.fileType?.startsWith('video/');

            if (isImage) {
                return `
                    <div class="message-attachment image-attachment">
                        <img src="${att.thumbnailUrl || att.fileUrl}" 
                             alt="${escapeHtml(att.fileName)}"
                             class="attachment-image"
                             data-full-url="${att.fileUrl}"
                             loading="lazy" />
                        <div class="image-overlay">
                            ${att.width && att.height ? `${att.width} x ${att.height}` : ''}
                        </div>
                    </div>
                `;
            } else if (isVideo) {
                return `
                    <div class="message-attachment video-attachment">
                        <video controls width="400" preload="metadata">
                            <source src="${att.fileUrl}" type="${att.fileType}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            } else {
                const fileSize = att.fileSize ? formatFileSize(att.fileSize) : '';
                const icon = getFileIcon(att.fileType);
                return `
                    <a href="${att.fileUrl}" target="_blank" class="message-attachment file-attachment">
                        <div class="file-icon">${icon}</div>
                        <div class="file-info">
                            <div class="file-name">${escapeHtml(att.fileName)}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <svg class="download-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                    </a>
                `;
            }
        }).join('');

        return `<div class="message-attachments">${html}</div>`;
    }

    function renderReactions(reactions, currentUser) {
        if (!reactions || reactions.length === 0) return '';

        const html = reactions.map(reaction => {
            const hasReacted = currentUser && reaction.userIds?.includes(currentUser.id);
            const users = reaction.usernames?.join(', ') || `${reaction.count} user(s)`;

            return `
                <button class="reaction-item ${hasReacted ? 'reacted' : ''}" 
                        data-emoji="${escapeHtml(reaction.emoji)}"
                        title="${escapeHtml(users)}">
                    <span class="reaction-emoji">${reaction.emoji}</span>
                    <span class="reaction-count">${reaction.count}</span>
                </button>
            `;
        }).join('');

        return `<div class="message-reactions">${html}</div>`;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    function getFileIcon(mimeType) {
        if (!mimeType) return '📄';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
        if (mimeType.includes('text')) return '📝';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
        return '📄';
    }

    // ==================== MESSAGE ACTIONS ====================

    function setupMessageActions(messageElement, message, currentUser) {
        const actionsDiv = messageElement.querySelector('.message-actions');
        
        actionsDiv.querySelector('[data-action="reply"]')?.addEventListener('click', () => {
            handleReply(message);
        });

        actionsDiv.querySelector('[data-action="react"]')?.addEventListener('click', (e) => {
            showEmojiPicker(e.target, message.id);
        });

        actionsDiv.querySelector('[data-action="more"]')?.addEventListener('click', (e) => {
            showContextMenu(e, message, currentUser);
        });

        // Right-click context menu
        messageElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, message, currentUser);
        });

        // Image lightbox
        messageElement.querySelectorAll('.attachment-image').forEach(img => {
            img.addEventListener('click', () => {
                openLightbox(img.dataset.fullUrl);
            });
        });

        // Reaction clicks
        messageElement.querySelectorAll('.reaction-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                const hasReacted = btn.classList.contains('reacted');
                if (hasReacted) {
                    removeReaction(message.id, emoji);
                } else {
                    addReaction(message.id, emoji);
                }
            });
        });
    }

    function handleReply(message) {
        const event = new CustomEvent('message:reply', {
            detail: { message }
        });
        document.dispatchEvent(event);
    }

    function showEmojiPicker(button, messageId) {
        // This would integrate with a library like emoji-mart
        // For now, show a simple picker
        const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];
        
        const picker = document.createElement('div');
        picker.className = 'emoji-picker-simple';
        picker.innerHTML = emojis.map(emoji => 
            `<button class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
        ).join('');

        const rect = button.getBoundingClientRect();
        picker.style.position = 'absolute';
        picker.style.top = (rect.bottom + window.scrollY) + 'px';
        picker.style.left = rect.left + 'px';

        picker.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                addReaction(messageId, btn.dataset.emoji);
                picker.remove();
            });
        });

        document.body.appendChild(picker);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closePickerHandler(e) {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', closePickerHandler);
                }
            });
        }, 100);
    }

    function showContextMenu(event, message, currentUser) {
        event.preventDefault();

        const menu = document.createElement('div');
        menu.className = 'context-menu';

        const isOwnMessage = currentUser && message.userId === currentUser.id;

        menu.innerHTML = `
            <button class="context-menu-item" data-action="reply">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
                Reply
            </button>
            ${isOwnMessage ? `
                <button class="context-menu-item" data-action="edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit Message
                </button>
                <button class="context-menu-item danger" data-action="delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete Message
                </button>
            ` : ''}
            <button class="context-menu-item" data-action="copy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy Message
            </button>
            <button class="context-menu-item" data-action="pin">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
                Pin Message
            </button>
        `;

        // Position menu
        menu.style.position = 'fixed';
        menu.style.top = event.clientY + 'px';
        menu.style.left = event.clientX + 'px';

        // Add event listeners
        menu.querySelector('[data-action="reply"]')?.addEventListener('click', () => {
            handleReply(message);
            menu.remove();
        });

        menu.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
            startEditingMessage(message);
            menu.remove();
        });

        menu.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
            deleteMessage(message.id);
            menu.remove();
        });

        menu.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
            navigator.clipboard.writeText(message.content);
            menu.remove();
        });

        menu.querySelector('[data-action="pin"]')?.addEventListener('click', () => {
            pinMessage(message.id);
            menu.remove();
        });

        document.body.appendChild(menu);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenuHandler(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenuHandler);
                }
            });
        }, 100);
    }

    function openLightbox(imageUrl) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <img src="${imageUrl}" alt="Image" />
            </div>
        `;

        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        const close = () => {
            lightbox.remove();
            document.body.style.overflow = '';
        };

        lightbox.querySelector('.lightbox-close').addEventListener('click', close);
        lightbox.querySelector('.lightbox-backdrop').addEventListener('click', close);
    }

    function startEditingMessage(message) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (!messageElement) return;

        const contentDiv = messageElement.querySelector('.message-content');
        const originalContent = message.content;

        contentDiv.innerHTML = `
            <div class="edit-message-container">
                <textarea class="edit-message-input" rows="3">${escapeHtml(originalContent)}</textarea>
                <div class="edit-message-actions">
                    <small>Press ESC to cancel • Enter to save</small>
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-save">Save</button>
                </div>
            </div>
        `;

        const textarea = contentDiv.querySelector('.edit-message-input');
        const btnCancel = contentDiv.querySelector('.btn-cancel');
        const btnSave = contentDiv.querySelector('.btn-save');

        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        const cancel = () => {
            contentDiv.innerHTML = parseMarkdown(originalContent);
        };

        const save = () => {
            const newContent = textarea.value.trim();
            if (newContent && newContent !== originalContent) {
                editMessage(message.id, newContent);
            } else {
                cancel();
            }
        };

        btnCancel.addEventListener('click', cancel);
        btnSave.addEventListener('click', save);

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
            }
        });
    }

    // ==================== API CALLS ====================

    async function addReaction(messageId, emoji) {
        try {
            const response = await fetch(`/api/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emoji })
            });

            if (!response.ok) {
                throw new Error('Failed to add reaction');
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
            alert('Failed to add reaction. Please try again.');
        }
    }

    async function removeReaction(messageId, emoji) {
        try {
            const response = await fetch(`/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to remove reaction');
            }
        } catch (error) {
            console.error('Error removing reaction:', error);
            alert('Failed to remove reaction. Please try again.');
        }
    }

    async function editMessage(messageId, content) {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageId, content })
            });

            if (!response.ok) {
                throw new Error('Failed to edit message');
            }

            // Message will be updated via WebSocket
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message. Please try again.');
        }
    }

    async function deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete message');
            }

            // Message will be removed via WebSocket
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message. Please try again.');
        }
    }

    async function pinMessage(messageId) {
        try {
            const response = await fetch(`/api/messages/${messageId}/pin`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to pin message');
            }

            alert('Message pinned successfully');
        } catch (error) {
            console.error('Error pinning message:', error);
            alert('Failed to pin message. Please try again.');
        }
    }

    // ==================== EXPORT ====================

    window.EnhancedMessage = {
        createMessageElement,
        parseMarkdown,
        formatRelativeTime,
        formatFileSize
    };

})();
