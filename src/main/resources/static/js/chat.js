/**
 * CoCoCord Chat Application - Discord-like Realtime Chat
 * Uses STOMP over WebSocket for realtime messaging
 */

const ChatApp = {
    stompClient: null,
    currentChannelId: 1,
    currentUserId: null,
    currentUsername: null,
    currentDisplayName: null,
    typingTimeout: null,
    isTyping: false,
    messagesCache: new Map(),

    /**
     * Initialize the chat application
     */
    init() {
        console.log('Initializing CoCoCord Chat...');
        
        // Get user info from localStorage
        this.currentUserId = localStorage.getItem('userId');
        this.currentUsername = localStorage.getItem('username');
        this.currentDisplayName = localStorage.getItem('displayName') || this.currentUsername;

        if (!this.currentUsername) {
            console.error('User not logged in');
            window.location.href = '/login';
            return;
        }

        // Connect to WebSocket
        this.connectWebSocket();

        // Setup event listeners
        this.setupEventListeners();

        // Load initial messages for default channel
        this.loadChannelMessages(this.currentChannelId);
    },

    /**
     * Connect to WebSocket server
     */
    connectWebSocket() {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            console.error('No access token found');
            return;
        }

        // Create WebSocket connection using SockJS
        const socket = new SockJS('/ws');
        this.stompClient = Stomp.over(socket);

        // Connect with JWT token
        this.stompClient.connect(
            { 'Authorization': 'Bearer ' + token },
            (frame) => this.onConnected(frame),
            (error) => this.onError(error)
        );

        // Enable debug for development
        this.stompClient.debug = (str) => {
            console.log('STOMP: ' + str);
        };
    },

    /**
     * Called when WebSocket connection is established
     */
    onConnected(frame) {
        console.log('Connected to WebSocket:', frame);

        // Subscribe to channel messages
        this.subscribeToChannel(this.currentChannelId);

        // Subscribe to personal error queue
        this.stompClient.subscribe('/user/queue/errors', (message) => {
            console.error('Error from server:', message.body);
            this.showNotification('Error: ' + message.body, 'error');
        });

        // Update presence
        this.updatePresence('ONLINE');

        this.showNotification('Connected to chat server', 'success');
    },

    /**
     * Called when WebSocket connection fails
     */
    onError(error) {
        console.error('WebSocket connection error:', error);
        this.showNotification('Failed to connect to chat server. Retrying...', 'error');
        
        // Retry connection after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
    },

    /**
     * Subscribe to a channel for realtime messages
     */
    subscribeToChannel(channelId) {
        // Subscribe to new messages
        this.stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
            const chatMessage = JSON.parse(message.body);
            this.onMessageReceived(chatMessage);
        });

        // Subscribe to message deletions
        this.stompClient.subscribe(`/topic/channel/${channelId}/delete`, (message) => {
            const messageId = message.body;
            this.onMessageDeleted(messageId);
        });

        // Subscribe to typing indicators
        this.stompClient.subscribe(`/topic/channel/${channelId}/typing`, (message) => {
            const typingNotif = JSON.parse(message.body);
            this.onUserTyping(typingNotif);
        });

        console.log(`Subscribed to channel ${channelId}`);
    },

    /**
     * Load message history for a channel via REST API
     */
    async loadChannelMessages(channelId, page = 0, size = 50) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/messages/channel/${channelId}?page=${page}&size=${size}`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            
            // Display messages (reverse order for chronological display)
            const messages = data.content.reverse();
            
            messages.forEach(msg => {
                this.messagesCache.set(msg.id, msg);
                this.displayMessage(msg, false); // false = don't animate
            });

            // Scroll to bottom
            this.scrollToBottom();

            console.log(`Loaded ${messages.length} messages for channel ${channelId}`);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showNotification('Failed to load message history', 'error');
        }
    },

    /**
     * Send a message via WebSocket
     */
    sendMessage(content) {
        if (!content || !content.trim()) {
            return;
        }

        if (!this.stompClient || !this.stompClient.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }

        const messageRequest = {
            channelId: this.currentChannelId,
            content: content.trim(),
            parentMessageId: null,
            threadId: null
        };

        this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(messageRequest));
        
        console.log('Message sent:', messageRequest);
    },

    /**
     * Edit a message
     */
    editMessage(messageId, newContent) {
        if (!newContent || !newContent.trim()) {
            return;
        }

        const editRequest = {
            messageId: messageId,
            content: newContent.trim()
        };

        this.stompClient.send('/app/chat.editMessage', {}, JSON.stringify(editRequest));
        console.log('Edit message request sent:', editRequest);
    },

    /**
     * Delete a message
     */
    deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }

        this.stompClient.send('/app/chat.deleteMessage', {}, JSON.stringify(messageId));
        console.log('Delete message request sent:', messageId);
    },

    /**
     * Called when a new message is received
     */
    onMessageReceived(message) {
        console.log('Message received:', message);
        
        this.messagesCache.set(message.id, message);
        this.displayMessage(message, true); // true = animate
        
        // Play notification sound if not from current user
        if (message.username !== this.currentUsername) {
            this.playNotificationSound();
        }
    },

    /**
     * Called when a message is deleted
     */
    onMessageDeleted(messageId) {
        console.log('Message deleted:', messageId);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('message-deleted');
            setTimeout(() => messageElement.remove(), 300);
        }
        
        this.messagesCache.delete(messageId);
    },

    /**
     * Display a message in the chat
     */
    displayMessage(message, animate = false) {
        const container = document.getElementById('messages-container');
        const messageElement = this.createMessageElement(message);
        
        if (animate) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
        }
        
        container.appendChild(messageElement);
        
        if (animate) {
            setTimeout(() => {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 10);
        }
        
        this.scrollToBottom();
    },

    /**
     * Create a message DOM element
     */
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = 'message-group';
        div.setAttribute('data-message-id', message.id);
        
        const isOwnMessage = message.username === this.currentUsername;
        const avatarUrl = message.avatarUrl || '/images/default-avatar.png';
        
        const editedBadge = message.isEdited ? '<span class="message-edited">(edited)</span>' : '';
        const timestamp = this.formatTimestamp(message.createdAt);
        
        div.innerHTML = `
            <div class="message-avatar">
                <img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(message.displayName)}">
            </div>
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(message.displayName || message.username)}</span>
                    <span class="message-timestamp">${timestamp}</span>
                </div>
                <div class="message-content">
                    ${this.formatMessageContent(message.content)}
                    ${editedBadge}
                </div>
                ${isOwnMessage ? this.createMessageActions(message.id) : ''}
            </div>
        `;
        
        return div;
    },

    /**
     * Create message action buttons
     */
    createMessageActions(messageId) {
        return `
            <div class="message-actions">
                <button class="message-action-btn" onclick="ChatApp.editMessagePrompt('${messageId}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="message-action-btn" onclick="ChatApp.deleteMessage('${messageId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    },

    /**
     * Prompt user to edit a message
     */
    editMessagePrompt(messageId) {
        const message = this.messagesCache.get(messageId);
        if (!message) return;

        const newContent = prompt('Edit message:', message.content);
        if (newContent !== null && newContent.trim()) {
            this.editMessage(messageId, newContent);
        }
    },

    /**
     * Format message content (add markdown support, links, etc.)
     */
    formatMessageContent(content) {
        // Escape HTML
        content = this.escapeHtml(content);
        
        // Convert URLs to links
        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Convert markdown bold **text**
        content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert markdown italic *text*
        content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert markdown code `text`
        content = content.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Convert newlines to <br>
        content = content.replace(/\n/g, '<br>');
        
        return content;
    },

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        // If today, show time only
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // If this year, show date without year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }) + ' ' +
                   date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Show full date
        return date.toLocaleDateString('vi-VN') + ' ' +
               date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Send typing notification
     */
    sendTypingNotification() {
        if (!this.isTyping) {
            this.isTyping = true;
            
            const typingNotif = {
                channelId: this.currentChannelId,
                username: this.currentUsername,
                isTyping: true
            };
            
            this.stompClient.send('/app/chat.typing', {}, JSON.stringify(typingNotif));
        }
        
        // Clear previous timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        // Reset typing status after 3 seconds
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, 3000);
    },

    /**
     * Handle user typing notification
     */
    onUserTyping(notification) {
        // Ignore own typing
        if (notification.username === this.currentUsername) {
            return;
        }
        
        const indicator = document.getElementById('typing-indicator');
        const usersSpan = document.getElementById('typing-users');
        
        if (notification.isTyping) {
            usersSpan.textContent = notification.username;
            indicator.style.display = 'flex';
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 5000);
        }
    },

    /**
     * Update user presence
     */
    updatePresence(status) {
        const presenceUpdate = {
            username: this.currentUsername,
            status: status,
            timestamp: new Date().toISOString()
        };
        
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.send('/app/presence.update', {}, JSON.stringify(presenceUpdate));
        }
    },

    /**
     * Switch to different channel
     */
    switchChannel(channelId) {
        if (this.currentChannelId === channelId) {
            return;
        }

        console.log(`Switching to channel ${channelId}`);
        
        this.currentChannelId = channelId;
        
        // Clear current messages
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        this.messagesCache.clear();
        
        // Subscribe to new channel
        this.subscribeToChannel(channelId);
        
        // Load messages
        this.loadChannelMessages(channelId);
        
        // Update UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-channel-id="${channelId}"]`)?.classList.add('active');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('message-input');
        const charCurrent = document.getElementById('char-current');
        
        messageInput.addEventListener('input', (e) => {
            // Update character count
            charCurrent.textContent = e.target.value.length;
            
            // Auto-resize textarea
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            
            // Send typing notification
            if (e.target.value.length > 0) {
                this.sendTypingNotification();
            }
        });
        
        // Send message on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(e.target.value);
                e.target.value = '';
                e.target.style.height = 'auto';
                charCurrent.textContent = '0';
            }
        });
        
        // Channel switching
        document.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', () => {
                const channelId = parseInt(item.dataset.channelId);
                this.switchChannel(channelId);
            });
        });
        
        // Handle beforeunload to update presence
        window.addEventListener('beforeunload', () => {
            this.updatePresence('OFFLINE');
        });
    },

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple console log for now, can be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    /**
     * Play notification sound
     */
    playNotificationSound() {
        // Can add sound notification here
        // const audio = new Audio('/sounds/notification.mp3');
        // audio.play();
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Inner class for typing notification (referenced in WebSocketMessageController)
class TypingNotification {
    constructor() {
        this.channelId = null;
        this.username = null;
        this.isTyping = true;
    }
}

class PresenceUpdate {
    constructor() {
        this.username = null;
        this.status = 'ONLINE';
        this.timestamp = null;
    }
}
