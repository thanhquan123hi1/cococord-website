/**
 * Rich Message System Integration Example
 * Shows how to integrate enhanced messages, file uploads, and reactions
 */

(() => {
    'use strict';

    // Initialize components
    let fileUploader;
    let currentChannel = null;
    let currentUser = null;
    let stompClient = null;
    let pendingAttachments = [];

    // ==================== INITIALIZATION ====================

    function init() {
        // Get current user info
        fetchCurrentUser().then(user => {
            currentUser = user;
            initializeComponents();
            setupWebSocket();
        });
    }

    function initializeComponents() {
        // Initialize file uploader
        fileUploader = new FileUploader({
            maxFileSize: 8 * 1024 * 1024, // 8MB
            onFileSelect: handleFileSelect,
            onUploadProgress: handleUploadProgress,
            onUploadComplete: handleUploadComplete,
            onUploadError: handleUploadError
        });

        // Add upload button to message input
        const messageInputContainer = document.querySelector('.message-input-container');
        if (messageInputContainer) {
            const uploadBtn = fileUploader.createUploadButton();
            const inputActions = messageInputContainer.querySelector('.input-actions');
            if (inputActions) {
                inputActions.insertBefore(uploadBtn, inputActions.firstChild);
            }

            // Setup drag and drop on message area
            const messageArea = document.querySelector('.messages-area');
            if (messageArea) {
                fileUploader.setupDragAndDrop(messageArea);
                messageArea.classList.add('drop-zone');
            }
        }

        // Setup message input handlers
        setupMessageInput();

        // Setup reply handler
        document.addEventListener('message:reply', (e) => {
            handleReplyToMessage(e.detail.message);
        });
    }

    // ==================== FILE UPLOAD HANDLERS ====================

    function handleFileSelect(files) {
        console.log('Files selected:', files);
        
        // Show preview container
        let previewContainer = document.querySelector('.file-previews-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'file-previews-container';
            
            const messageInputContainer = document.querySelector('.message-input-container');
            messageInputContainer.insertBefore(previewContainer, messageInputContainer.firstChild);
        }

        // Create previews for each file
        files.forEach(file => {
            const preview = fileUploader.createPreview(file);
            previewContainer.appendChild(preview);
        });
    }

    function handleUploadProgress(file, percent) {
        console.log(`Upload progress for ${file.name}: ${percent}%`);
        
        const preview = document.querySelector(`.file-preview[data-file-id="${file.name}"]`);
        if (preview) {
            fileUploader.updateProgress(preview, percent);
        }
    }

    function handleUploadComplete(file, response) {
        console.log('Upload complete:', file.name, response);
        
        // Update preview with file ID
        const preview = document.querySelector(`.file-preview[data-file-id="${file.name}"]`);
        if (preview) {
            preview.dataset.fileId = response.fileId;
            fileUploader.updateProgress(preview, 100);
        }

        // Add to pending attachments
        pendingAttachments.push({
            id: response.fileId,
            fileName: response.fileName,
            fileUrl: response.fileUrl,
            fileType: response.mimeType,
            fileSize: response.fileSize,
            thumbnailUrl: response.thumbnailUrl,
            width: response.width,
            height: response.height
        });
    }

    function handleUploadError(file, error) {
        console.error('Upload error:', file.name, error);
        alert(`Failed to upload ${file.name}: ${error}`);
        
        // Remove preview
        const preview = document.querySelector(`.file-preview[data-file-id="${file.name}"]`);
        if (preview) {
            preview.remove();
        }
    }

    // ==================== MESSAGE SENDING ====================

    function setupMessageInput() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        if (!messageInput || !sendButton) return;

        sendButton.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Character counter
        messageInput.addEventListener('input', () => {
            const length = messageInput.value.length;
            const maxLength = 2000;
            
            let counter = document.querySelector('.char-counter');
            if (!counter) {
                counter = document.createElement('div');
                counter.className = 'char-counter';
                messageInput.parentElement.appendChild(counter);
            }

            if (length > maxLength * 0.9) {
                counter.textContent = `${length}/${maxLength}`;
                counter.style.display = 'block';
                counter.style.color = length > maxLength ? '#ed4245' : '#72767d';
            } else {
                counter.style.display = 'none';
            }
        });
    }

    async function sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();

        if (!content && pendingAttachments.length === 0) {
            return;
        }

        if (content.length > 2000) {
            alert('Message cannot exceed 2000 characters');
            return;
        }

        if (!currentChannel) {
            alert('No channel selected');
            return;
        }

        try {
            // Create message object
            const message = {
                channelId: currentChannel.id,
                content: content,
                attachments: pendingAttachments.map(att => ({
                    fileName: att.fileName,
                    fileUrl: att.fileUrl,
                    fileType: att.fileType,
                    fileSize: att.fileSize,
                    thumbnailUrl: att.thumbnailUrl,
                    width: att.width,
                    height: att.height
                }))
            };

            // Show optimistic UI
            const optimisticMessage = {
                id: 'temp-' + Date.now(),
                ...message,
                userId: currentUser.id,
                username: currentUser.username,
                displayName: currentUser.displayName,
                avatarUrl: currentUser.avatarUrl,
                createdAt: new Date().toISOString(),
                isEdited: false,
                reactions: [],
                sending: true
            };

            addMessageToUI(optimisticMessage);

            // Send via API
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const sentMessage = await response.json();

            // Update optimistic message
            updateMessageInUI(optimisticMessage.id, sentMessage);

            // Clear input and attachments
            messageInput.value = '';
            pendingAttachments = [];
            const previewContainer = document.querySelector('.file-previews-container');
            if (previewContainer) {
                previewContainer.remove();
            }

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    // ==================== MESSAGE UI ====================

    function addMessageToUI(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const messageElement = window.EnhancedMessage.createMessageElement(message, currentUser);
        messagesList.appendChild(messageElement);

        // Scroll to bottom
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function updateMessageInUI(tempId, newMessage) {
        const messageElement = document.querySelector(`[data-message-id="${tempId}"]`);
        if (messageElement) {
            const newElement = window.EnhancedMessage.createMessageElement(newMessage, currentUser);
            messageElement.replaceWith(newElement);
        }
    }

    function removeMessageFromUI(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }
    }

    function handleReplyToMessage(message) {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        // Show reply preview
        let replyPreview = document.querySelector('.reply-preview');
        if (!replyPreview) {
            replyPreview = document.createElement('div');
            replyPreview.className = 'reply-preview';
            messageInput.parentElement.insertBefore(replyPreview, messageInput);
        }

        replyPreview.innerHTML = `
            <div class="reply-preview-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                </svg>
                <span>Replying to <strong>${message.displayName || message.username}</strong></span>
            </div>
            <button class="reply-preview-close" type="button">&times;</button>
        `;

        replyPreview.querySelector('.reply-preview-close').addEventListener('click', () => {
            replyPreview.remove();
        });

        // Focus input and mention user
        messageInput.focus();
        messageInput.value = `@${message.username} ` + messageInput.value;
    }

    // ==================== WEBSOCKET ====================

    function setupWebSocket() {
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, () => {
            console.log('WebSocket connected');

            // Subscribe to channel updates
            if (currentChannel) {
                subscribeToChannel(currentChannel.id);
            }
        }, (error) => {
            console.error('WebSocket error:', error);
            setTimeout(setupWebSocket, 5000); // Reconnect after 5s
        });
    }

    function subscribeToChannel(channelId) {
        if (!stompClient) return;

        stompClient.subscribe(`/topic/channel.${channelId}`, (message) => {
            const event = JSON.parse(message.body);
            handleWebSocketEvent(event);
        });
    }

    function handleWebSocketEvent(event) {
        console.log('WebSocket event:', event);

        switch (event.type) {
            case 'message.created':
                if (event.payload.userId !== currentUser.id) {
                    addMessageToUI(event.payload);
                }
                break;

            case 'message.updated':
                updateMessageInUI(event.payload.id, event.payload);
                break;

            case 'message.deleted':
                removeMessageFromUI(event.payload);
                break;

            case 'reaction.added':
            case 'reaction.removed':
                updateMessageReactions(event.payload);
                break;

            default:
                console.log('Unknown event type:', event.type);
        }
    }

    function updateMessageReactions(reactionEvent) {
        // Refresh the specific message to update reactions
        const messageElement = document.querySelector(`[data-message-id="${reactionEvent.messageId}"]`);
        if (messageElement) {
            // Fetch updated message
            fetch(`/api/messages/${reactionEvent.messageId}`)
                .then(res => res.json())
                .then(message => {
                    updateMessageInUI(reactionEvent.messageId, message);
                });
        }
    }

    // ==================== API HELPERS ====================

    async function fetchCurrentUser() {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            throw new Error('Failed to fetch current user');
        }
        return response.json();
    }

    // ==================== EXPORT ====================

    window.RichMessageSystem = {
        init,
        setChannel: (channel) => {
            currentChannel = channel;
            if (stompClient) {
                subscribeToChannel(channel.id);
            }
        }
    };

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
