/**
 * CoCoCord Chat Application - Discord-like Realtime Chat
 * Uses STOMP over WebSocket for realtime messaging
 */

const ChatApp = {
    stompClient: null,
    currentChannelId: null,
    currentServerId: null,
    currentUserId: null,
    currentUsername: null,
    currentDisplayName: null,
    typingTimeout: null,
    isTyping: false,
    messagesCache: new Map(),
    serversCache: [],
    channelsCache: [],
    channelSubscription: null,
    deleteSubscription: null,
    typingSubscription: null,

    /**
     * Initialize the chat application
     */
    async init() {
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

        // Load user's servers
        await this.loadServers();

        // Connect to WebSocket
        this.connectWebSocket();

        // Setup event listeners
        this.setupEventListeners();
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

        // Subscribe to personal error queue
        this.stompClient.subscribe('/user/queue/errors', (message) => {
            console.error('Error from server:', message.body);
            this.showNotification('Error: ' + message.body, 'error');
        });

        // Update presence
        this.updatePresence('ONLINE');

        // Subscribe to current channel if exists
        if (this.currentChannelId) {
            this.subscribeToChannel(this.currentChannelId);
            this.loadChannelMessages(this.currentChannelId);
        }

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
        // Unsubscribe from previous channel
        if (this.channelSubscription) {
            this.channelSubscription.unsubscribe();
        }
        if (this.deleteSubscription) {
            this.deleteSubscription.unsubscribe();
        }
        if (this.typingSubscription) {
            this.typingSubscription.unsubscribe();
        }

        // Subscribe to new messages
        this.channelSubscription = this.stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
            const chatMessage = JSON.parse(message.body);
            this.onMessageReceived(chatMessage);
        });

        // Subscribe to message deletions
        this.deleteSubscription = this.stompClient.subscribe(`/topic/channel/${channelId}/delete`, (message) => {
            const messageId = message.body.replace(/"/g, '');
            this.onMessageDeleted(messageId);
        });

        // Subscribe to typing indicators
        this.typingSubscription = this.stompClient.subscribe(`/topic/channel/${channelId}/typing`, (message) => {
            const typingNotif = JSON.parse(message.body);
            this.onUserTyping(typingNotif);
        });

        console.log(`Subscribed to channel ${channelId}`);
    },

    /**
     * Load user's servers from API
     */
    async loadServers() {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/servers', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load servers');
            }

            this.serversCache = await response.json();
            this.renderServers();

            // If user has servers, load first server's channels
            if (this.serversCache.length > 0) {
                await this.selectServer(this.serversCache[0].id);
            } else {
                // Show welcome message for no servers
                this.showNoServersMessage();
            }
        } catch (error) {
            console.error('Error loading servers:', error);
            this.showNotification('Failed to load servers', 'error');
        }
    },

    /**
     * Render servers in the server list sidebar
     */
    renderServers() {
        const serverList = document.querySelector('.server-list');
        const homeBtn = serverList.querySelector('.server-home');
        const divider = serverList.querySelector('.server-divider');
        const addBtn = serverList.querySelector('.server-add');

        // Remove existing server icons (except home, divider, add)
        serverList.querySelectorAll('.server-icon').forEach(el => el.remove());

        // Add server icons
        this.serversCache.forEach(server => {
            const serverIcon = document.createElement('div');
            serverIcon.className = 'server-icon';
            serverIcon.setAttribute('data-server-id', server.id);
            serverIcon.setAttribute('title', server.name);
            
            if (server.iconUrl) {
                serverIcon.innerHTML = `<img src="${server.iconUrl}" alt="${this.escapeHtml(server.name)}">`;
            } else {
                // Use first letter as placeholder
                serverIcon.textContent = server.name.charAt(0).toUpperCase();
            }
            
            serverIcon.addEventListener('click', () => this.selectServer(server.id));
            
            // Insert before add button
            serverList.insertBefore(serverIcon, addBtn);
        });
    },

    /**
     * Select a server and load its channels
     */
    async selectServer(serverId) {
        this.currentServerId = serverId;
        
        // Update server name in header
        const server = this.serversCache.find(s => s.id === serverId);
        if (server) {
            document.getElementById('server-name').textContent = server.name;
        }

        // Update active state
        document.querySelectorAll('.server-icon').forEach(icon => {
            icon.classList.toggle('active', parseInt(icon.dataset.serverId) === serverId);
        });

        // Load channels
        await this.loadChannels(serverId);
    },

    /**
     * Load channels for a server
     */
    async loadChannels(serverId) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/channels/servers/${serverId}/channels`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load channels');
            }

            this.channelsCache = await response.json();
            this.renderChannels();

            // Select first text channel
            const firstTextChannel = this.channelsCache.find(c => c.type === 'TEXT');
            if (firstTextChannel) {
                this.switchChannel(firstTextChannel.id);
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showNotification('Failed to load channels', 'error');
        }
    },

    /**
     * Render channels in the channel sidebar
     */
    renderChannels() {
        const textChannelsContainer = document.getElementById('text-channels');
        const voiceChannelsContainer = document.getElementById('voice-channels');

        textChannelsContainer.innerHTML = '';
        voiceChannelsContainer.innerHTML = '';

        this.channelsCache.forEach(channel => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';
            channelItem.setAttribute('data-channel-id', channel.id);
            channelItem.setAttribute('data-channel-type', channel.type.toLowerCase());

            const icon = channel.type === 'VOICE' ? 'bi-volume-up-fill' : 'bi-hash';
            channelItem.innerHTML = `
                <i class="bi ${icon} channel-icon"></i>
                <span class="channel-name">${this.escapeHtml(channel.name)}</span>
            `;

            channelItem.addEventListener('click', () => {
                if (channel.type === 'TEXT') {
                    this.switchChannel(channel.id);
                }
            });

            if (channel.type === 'VOICE') {
                voiceChannelsContainer.appendChild(channelItem);
            } else {
                textChannelsContainer.appendChild(channelItem);
            }
        });
    },

    /**
     * Show message when user has no servers
     */
    showNoServersMessage() {
        document.getElementById('server-name').textContent = 'Welcome!';
        document.getElementById('channel-name').textContent = 'No servers yet';
        document.getElementById('channel-topic').textContent = 'Create or join a server to start chatting';
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
        
        // Update channel info in header
        const channel = this.channelsCache.find(c => c.id === channelId);
        if (channel) {
            document.getElementById('channel-name').textContent = channel.name;
            document.getElementById('channel-topic').textContent = channel.topic || `Welcome to #${channel.name}!`;
            document.getElementById('chat-header-channel-name').textContent = channel.name;
            document.getElementById('message-input').setAttribute('placeholder', `Message #${channel.name}`);
        }
        
        // Subscribe to new channel if connected
        if (this.stompClient && this.stompClient.connected) {
            this.subscribeToChannel(channelId);
            this.loadChannelMessages(channelId);
        }
        
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
        
        // Handle beforeunload to update presence
        window.addEventListener('beforeunload', () => {
            this.updatePresence('OFFLINE');
        });

        // Server add button
        document.querySelector('.server-add').addEventListener('click', () => {
            this.openModal('create-server-modal');
        });

        // Channel add buttons
        document.querySelectorAll('.add-channel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal('create-channel-modal');
            });
        });

        // Create server form
        document.getElementById('create-server-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createServer();
        });

        // Create channel form
        document.getElementById('create-channel-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChannel();
        });

        // Channel type selector
        document.querySelectorAll('.channel-type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.channel-type-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    },

    /**
     * Open modal
     */
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    },

    /**
     * Close modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    },

    /**
     * Create a new server
     */
    async createServer() {
        const name = document.getElementById('server-name-input').value.trim();
        const description = document.getElementById('server-description-input').value.trim();

        if (!name) {
            this.showNotification('Server name is required', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/servers', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    isPublic: true,
                    maxMembers: 1000
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create server');
            }

            const server = await response.json();
            this.serversCache.push(server);
            this.renderServers();
            this.selectServer(server.id);
            this.closeModal('create-server-modal');
            
            // Clear form
            document.getElementById('server-name-input').value = '';
            document.getElementById('server-description-input').value = '';
            
            this.showNotification('Server created successfully!', 'success');
        } catch (error) {
            console.error('Error creating server:', error);
            this.showNotification('Failed to create server', 'error');
        }
    },

    /**
     * Create a new channel
     */
    async createChannel() {
        const name = document.getElementById('channel-name-input').value.trim().toLowerCase().replace(/\s+/g, '-');
        const topic = document.getElementById('channel-topic-input').value.trim();
        const type = document.querySelector('input[name="channel-type"]:checked').value;

        if (!name) {
            this.showNotification('Channel name is required', 'error');
            return;
        }

        if (!this.currentServerId) {
            this.showNotification('No server selected', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/channels/servers/${this.currentServerId}/channels`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    type: type,
                    topic: topic,
                    isPrivate: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create channel');
            }

            const channel = await response.json();
            this.channelsCache.push(channel);
            this.renderChannels();
            
            if (channel.type === 'TEXT') {
                this.switchChannel(channel.id);
            }
            
            this.closeModal('create-channel-modal');
            
            // Clear form
            document.getElementById('channel-name-input').value = '';
            document.getElementById('channel-topic-input').value = '';
            
            this.showNotification('Channel created successfully!', 'success');
        } catch (error) {
            console.error('Error creating channel:', error);
            this.showNotification('Failed to create channel', 'error');
        }
    },

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    },

    /**
     * Show notification as toast
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create toast container if not exists
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
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
