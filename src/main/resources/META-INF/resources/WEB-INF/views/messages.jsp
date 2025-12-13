<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tin nhắn - CoCoCord</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/chat.css">
    <style>
        .messages-container {
            display: flex;
            height: calc(100vh - 60px);
            background: #f5f5f5;
        }
        
        /* Left Sidebar - Conversations List */
        .conversations-sidebar {
            width: 300px;
            background: white;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
        }
        
        .conversations-header {
            padding: 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .conversations-header h2 {
            margin: 0;
            font-size: 18px;
        }
        
        .new-dm-btn {
            padding: 8px 15px;
            background: #5865F2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .new-dm-btn:hover {
            background: #4752C4;
        }
        
        .conversations-list {
            flex: 1;
            overflow-y: auto;
        }
        
        .conversation-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .conversation-item:hover {
            background: #f8f8f8;
        }
        
        .conversation-item.active {
            background: #e8e8ff;
        }
        
        .conversation-avatar {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            margin-right: 12px;
            object-fit: cover;
            position: relative;
        }
        
        .group-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        
        .conversation-info {
            flex: 1;
            min-width: 0;
        }
        
        .conversation-name {
            font-weight: 600;
            font-size: 14px;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .conversation-preview {
            font-size: 12px;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 3px;
        }
        
        .conversation-badge {
            background: #5865F2;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 600;
        }
        
        /* Main Chat Area */
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
        }
        
        .chat-header {
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .chat-title h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .chat-members-count {
            font-size: 12px;
            color: #666;
        }
        
        .chat-actions {
            display: flex;
            gap: 10px;
        }
        
        .chat-action-btn {
            padding: 6px 12px;
            background: #f0f0f0;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .chat-action-btn:hover {
            background: #e0e0e0;
        }
        
        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column-reverse;
        }
        
        .message-item {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .message-content {
            flex: 1;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        
        .message-author {
            font-weight: 600;
            font-size: 14px;
            color: #333;
        }
        
        .message-time {
            font-size: 11px;
            color: #999;
        }
        
        .message-text {
            font-size: 14px;
            color: #333;
            line-height: 1.5;
            word-wrap: break-word;
        }
        
        .message-edited {
            font-size: 11px;
            color: #999;
            margin-left: 5px;
        }
        
        .message-actions {
            display: none;
            gap: 5px;
            margin-top: 5px;
        }
        
        .message-item:hover .message-actions {
            display: flex;
        }
        
        .message-action-btn {
            font-size: 11px;
            padding: 4px 8px;
            background: #f0f0f0;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .message-action-btn:hover {
            background: #e0e0e0;
        }
        
        /* Message Input */
        .message-input-area {
            padding: 20px;
            border-top: 1px solid #ddd;
        }
        
        .message-input-box {
            display: flex;
            gap: 10px;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 8px;
        }
        
        .message-input {
            flex: 1;
            padding: 10px;
            border: none;
            background: white;
            border-radius: 5px;
            font-size: 14px;
            resize: none;
            max-height: 150px;
        }
        
        .send-btn {
            padding: 10px 20px;
            background: #5865F2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        
        .send-btn:hover {
            background: #4752C4;
        }
        
        .send-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .typing-indicator {
            padding: 10px 20px;
            font-size: 12px;
            color: #666;
            font-style: italic;
        }
        
        /* Empty State */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #999;
        }
        
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .modal-header h3 {
            margin: 0;
        }
        
        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .friends-checklist {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
        }
        
        .friend-checkbox-item {
            padding: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            border-radius: 5px;
        }
        
        .friend-checkbox-item:hover {
            background: #f5f5f5;
        }
        
        .friend-checkbox-item input[type="checkbox"] {
            width: auto;
        }
        
        .btn-primary {
            width: 100%;
            padding: 12px;
            background: #5865F2;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .btn-primary:hover {
            background: #4752C4;
        }
        
        .selected-count {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #f44336;
        }
        
        .notification.info {
            border-left: 4px solid #2196F3;
        }
    </style>
</head>
<body>
    <div class="messages-container">
        <!-- Left Sidebar - Conversations List -->
        <div class="conversations-sidebar">
            <div class="conversations-header">
                <h2>Tin nhắn</h2>
                <button class="new-dm-btn" onclick="showNewDMModal()">+</button>
            </div>
            <div class="conversations-list" id="conversations-list">
                <!-- Conversations will be loaded here -->
            </div>
        </div>
        
        <!-- Main Chat Area -->
        <div class="chat-area" id="chat-area">
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <h3>Chọn một cuộc hội thoại</h3>
                <p>Chọn một cuộc hội thoại bên trái để bắt đầu nhắn tin</p>
            </div>
        </div>
    </div>
    
    <!-- New DM/Group Modal -->
    <div class="modal" id="newDMModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Tạo tin nhắn mới</h3>
                <button class="close-modal" onclick="closeNewDMModal()">&times;</button>
            </div>
            <div class="form-group">
                <label>Loại:</label>
                <select id="dmType" onchange="toggleGroupOptions()">
                    <option value="direct">Tin nhắn trực tiếp (1-1)</option>
                    <option value="group">Nhóm DM (tối đa 10 người)</option>
                </select>
            </div>
            <div class="form-group" id="groupNameField" style="display: none;">
                <label>Tên nhóm:</label>
                <input type="text" id="groupName" placeholder="Nhập tên nhóm...">
            </div>
            <div class="form-group">
                <label>Chọn bạn bè:</label>
                <div class="friends-checklist" id="friendsChecklist">
                    <!-- Friends will be loaded here -->
                </div>
                <div class="selected-count" id="selectedCount">Đã chọn: 0/9</div>
            </div>
            <button class="btn-primary" onclick="createDM()">Tạo</button>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    <script>
        let stompClient = null;
        let currentDMGroup = null;
        let currentUserId = null;
        let conversations = [];
        let typingTimeout = null;
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            initializeWebSocket();
            loadConversations();
            getCurrentUser();
        });
        
        // Get current user info
        function getCurrentUser() {
            const token = localStorage.getItem('accessToken');
            fetch('/api/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(user => {
                currentUserId = user.id;
            })
            .catch(error => console.error('Error getting current user:', error));
        }
        
        // Initialize WebSocket connection
        function initializeWebSocket() {
            const token = localStorage.getItem('accessToken');
            const socket = new SockJS('/ws?token=' + token);
            stompClient = Stomp.over(socket);
            
            stompClient.connect({}, function(frame) {
                console.log('WebSocket Connected for DM');
                
                // Subscribe to private errors
                stompClient.subscribe('/user/queue/errors', function(message) {
                    showNotification(message.body, 'error');
                });
            }, function(error) {
                console.error('WebSocket connection error:', error);
                setTimeout(initializeWebSocket, 5000);
            });
        }
        
        // Load all conversations
        function loadConversations() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/direct-messages/conversations', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(data => {
                conversations = data;
                displayConversations(data);
            })
            .catch(error => {
                console.error('Error loading conversations:', error);
                showNotification('Không thể tải danh sách tin nhắn', 'error');
            });
        }
        
        // Display conversations list
        function displayConversations(convos) {
            const listContainer = document.getElementById('conversations-list');
            
            if (convos.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state" style="padding: 40px 20px;">
                        <p style="text-align: center; color: #999;">Chưa có tin nhắn nào</p>
                    </div>
                `;
                return;
            }
            
            listContainer.innerHTML = convos.map(convo => {
                const isGroup = convo.isGroup;
                const name = isGroup ? convo.name : getOtherMemberName(convo);
                const avatar = isGroup ? null : getOtherMemberAvatar(convo);
                
                return `
                    <div class="conversation-item" onclick="openConversation(${convo.id})" data-convo-id="${convo.id}">
                        ${isGroup ? 
                            `<div class="conversation-avatar group-avatar">${name.charAt(0).toUpperCase()}</div>` :
                            `<img src="${avatar || '/images/default-avatar.png'}" class="conversation-avatar">`
                        }
                        <div class="conversation-info">
                            <div class="conversation-name">${name}</div>
                            <div class="conversation-preview">${isGroup ? convo.members.length + ' thành viên' : 'Nhắn tin...'}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Get other member's name in 1-1 DM
        function getOtherMemberName(convo) {
            if (!convo.members || convo.members.length < 2) return 'Unknown';
            const otherMember = convo.members.find(m => m.user.id !== currentUserId);
            return otherMember ? otherMember.user.displayName : 'Unknown';
        }
        
        // Get other member's avatar in 1-1 DM
        function getOtherMemberAvatar(convo) {
            if (!convo.members || convo.members.length < 2) return null;
            const otherMember = convo.members.find(m => m.user.id !== currentUserId);
            return otherMember ? otherMember.user.avatarUrl : null;
        }
        
        // Open conversation
        function openConversation(dmGroupId) {
            // Mark as active
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-convo-id="${dmGroupId}"]`).classList.add('active');
            
            currentDMGroup = conversations.find(c => c.id === dmGroupId);
            
            // Unsubscribe from previous conversation
            if (stompClient && stompClient.subscriptions) {
                Object.keys(stompClient.subscriptions).forEach(id => {
                    if (id.includes('/topic/dm/')) {
                        stompClient.unsubscribe(id);
                    }
                });
            }
            
            // Subscribe to this DM group
            stompClient.subscribe('/topic/dm/' + dmGroupId, function(message) {
                const newMessage = JSON.parse(message.body);
                appendMessage(newMessage);
            });
            
            stompClient.subscribe('/topic/dm/' + dmGroupId + '/delete', function(message) {
                removeMessage(message.body);
            });
            
            stompClient.subscribe('/topic/dm/' + dmGroupId + '/typing', function(message) {
                const typing = JSON.parse(message.body);
                showTypingIndicator(typing);
            });
            
            // Load messages
            loadMessages(dmGroupId);
            
            // Mark as read
            markAsRead(dmGroupId);
        }
        
        // Load messages for a conversation
        function loadMessages(dmGroupId) {
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/direct-messages/${dmGroupId}/messages?page=0&size=50`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(data => {
                displayChatArea(dmGroupId, data.content);
            })
            .catch(error => {
                console.error('Error loading messages:', error);
                showNotification('Không thể tải tin nhắn', 'error');
            });
        }
        
        // Display chat area with messages
        function displayChatArea(dmGroupId, messages) {
            const chatArea = document.getElementById('chat-area');
            const isGroup = currentDMGroup.isGroup;
            const chatName = isGroup ? currentDMGroup.name : getOtherMemberName(currentDMGroup);
            
            chatArea.innerHTML = `
                <div class="chat-header">
                    <div class="chat-title">
                        <h3>${chatName}</h3>
                        ${isGroup ? `<span class="chat-members-count">${currentDMGroup.members.length} thành viên</span>` : ''}
                    </div>
                    <div class="chat-actions">
                        ${isGroup && currentDMGroup.owner.id === currentUserId ? 
                            `<button class="chat-action-btn" onclick="manageGroup()">Quản lý</button>` : ''}
                        <button class="chat-action-btn" onclick="leaveConversation()">Rời khỏi</button>
                    </div>
                </div>
                <div class="messages-area" id="messages-area">
                    ${messages.map(msg => createMessageHTML(msg)).join('')}
                </div>
                <div class="typing-indicator" id="typing-indicator" style="display: none;"></div>
                <div class="message-input-area">
                    <div class="message-input-box">
                        <textarea class="message-input" id="messageInput" 
                                  placeholder="Nhập tin nhắn..." 
                                  onkeydown="handleMessageInput(event)"
                                  oninput="handleTyping()"></textarea>
                        <button class="send-btn" onclick="sendMessage()">Gửi</button>
                    </div>
                </div>
            `;
        }
        
        // Create message HTML
        function createMessageHTML(msg) {
            const isMine = msg.senderId === currentUserId;
            return `
                <div class="message-item" data-message-id="${msg.id}">
                    <img src="${msg.senderAvatarUrl || '/images/default-avatar.png'}" class="message-avatar">
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${msg.senderDisplayName}</span>
                            <span class="message-time">${formatTime(msg.createdAt)}</span>
                        </div>
                        <div class="message-text">${escapeHtml(msg.content)}${msg.isEdited ? '<span class="message-edited">(đã chỉnh sửa)</span>' : ''}</div>
                        ${isMine ? `
                            <div class="message-actions">
                                <button class="message-action-btn" onclick="editMessage('${msg.id}')">Sửa</button>
                                <button class="message-action-btn" onclick="deleteMessage('${msg.id}', ${currentDMGroup.id})">Xóa</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Append new message
        function appendMessage(msg) {
            const messagesArea = document.getElementById('messages-area');
            if (messagesArea) {
                const messageHTML = createMessageHTML(msg);
                messagesArea.insertAdjacentHTML('beforeend', messageHTML);
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }
        }
        
        // Send message
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            
            if (!content || !currentDMGroup) return;
            
            stompClient.send('/app/dm.sendMessage', {}, JSON.stringify({
                dmGroupId: currentDMGroup.id,
                senderId: currentUserId,
                content: content,
                attachmentUrls: []
            }));
            
            input.value = '';
        }
        
        // Handle message input (Enter to send)
        function handleMessageInput(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }
        
        // Handle typing indicator
        function handleTyping() {
            if (!currentDMGroup || !stompClient) return;
            
            stompClient.send('/app/dm.typing', {}, JSON.stringify({
                dmGroupId: currentDMGroup.id,
                isTyping: true
            }));
            
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                stompClient.send('/app/dm.typing', {}, JSON.stringify({
                    dmGroupId: currentDMGroup.id,
                    isTyping: false
                }));
            }, 3000);
        }
        
        // Show typing indicator
        function showTypingIndicator(typing) {
            const indicator = document.getElementById('typing-indicator');
            if (!indicator) return;
            
            if (typing.isTyping) {
                indicator.textContent = `${typing.username} đang nhập...`;
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        }
        
        // Edit message
        function editMessage(messageId) {
            const newContent = prompt('Nhập nội dung mới:');
            if (!newContent) return;
            
            stompClient.send('/app/dm.editMessage', {}, JSON.stringify({
                messageId: messageId,
                senderId: currentUserId,
                newContent: newContent
            }));
        }
        
        // Delete message
        function deleteMessage(messageId, dmGroupId) {
            if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
            
            stompClient.send('/app/dm.deleteMessage', {}, JSON.stringify({
                messageId: messageId,
                dmGroupId: dmGroupId,
                userId: currentUserId
            }));
        }
        
        // Remove message from UI
        function removeMessage(messageId) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.remove();
            }
        }
        
        // Mark as read
        function markAsRead(dmGroupId) {
            const token = localStorage.getItem('accessToken');
            fetch(`/api/direct-messages/${dmGroupId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
        }
        
        // Show new DM modal
        function showNewDMModal() {
            loadFriendsForDM();
            document.getElementById('newDMModal').classList.add('active');
        }
        
        // Close new DM modal
        function closeNewDMModal() {
            document.getElementById('newDMModal').classList.remove('active');
            document.getElementById('friendsChecklist').innerHTML = '';
        }
        
        // Toggle group options
        function toggleGroupOptions() {
            const dmType = document.getElementById('dmType').value;
            const groupNameField = document.getElementById('groupNameField');
            
            if (dmType === 'group') {
                groupNameField.style.display = 'block';
            } else {
                groupNameField.style.display = 'none';
            }
        }
        
        // Load friends for DM creation
        function loadFriendsForDM() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/friends', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(friends => {
                displayFriendsChecklist(friends);
            })
            .catch(error => {
                console.error('Error loading friends:', error);
            });
        }
        
        // Display friends checklist
        function displayFriendsChecklist(friends) {
            const container = document.getElementById('friendsChecklist');
            
            container.innerHTML = friends.map(friend => `
                <label class="friend-checkbox-item">
                    <input type="checkbox" value="${friend.id}" onchange="updateSelectedCount()">
                    <img src="${friend.avatarUrl || '/images/default-avatar.png'}" 
                         style="width: 30px; height: 30px; border-radius: 50%;">
                    <span>${friend.displayName}</span>
                </label>
            `).join('');
        }
        
        // Update selected count
        function updateSelectedCount() {
            const checkboxes = document.querySelectorAll('#friendsChecklist input[type="checkbox"]:checked');
            const dmType = document.getElementById('dmType').value;
            const maxCount = dmType === 'group' ? 9 : 1;
            
            document.getElementById('selectedCount').textContent = `Đã chọn: ${checkboxes.length}/${maxCount}`;
            
            // Disable other checkboxes if limit reached
            if (checkboxes.length >= maxCount) {
                document.querySelectorAll('#friendsChecklist input[type="checkbox"]:not(:checked)').forEach(cb => {
                    cb.disabled = true;
                });
            } else {
                document.querySelectorAll('#friendsChecklist input[type="checkbox"]').forEach(cb => {
                    cb.disabled = false;
                });
            }
        }
        
        // Create DM/Group
        function createDM() {
            const dmType = document.getElementById('dmType').value;
            const selectedCheckboxes = document.querySelectorAll('#friendsChecklist input[type="checkbox"]:checked');
            const memberIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
            
            if (memberIds.length === 0) {
                showNotification('Vui lòng chọn ít nhất một người', 'error');
                return;
            }
            
            const token = localStorage.getItem('accessToken');
            
            if (dmType === 'direct') {
                // Create 1-1 DM
                fetch(`/api/direct-messages/create-dm/${memberIds[0]}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                .then(response => response.json())
                .then(dmGroup => {
                    showNotification('Đã tạo tin nhắn trực tiếp', 'success');
                    closeNewDMModal();
                    loadConversations();
                    openConversation(dmGroup.id);
                })
                .catch(error => {
                    console.error('Error creating DM:', error);
                    showNotification('Không thể tạo tin nhắn', 'error');
                });
            } else {
                // Create group DM
                const groupName = document.getElementById('groupName').value.trim();
                if (!groupName) {
                    showNotification('Vui lòng nhập tên nhóm', 'error');
                    return;
                }
                
                fetch('/api/direct-messages/create-group', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        groupName: groupName,
                        memberIds: memberIds
                    })
                })
                .then(response => response.json())
                .then(dmGroup => {
                    showNotification('Đã tạo nhóm DM', 'success');
                    closeNewDMModal();
                    loadConversations();
                    openConversation(dmGroup.id);
                })
                .catch(error => {
                    console.error('Error creating group DM:', error);
                    showNotification('Không thể tạo nhóm', 'error');
                });
            }
        }
        
        // Leave conversation
        function leaveConversation() {
            if (!confirm('Bạn có chắc muốn rời khỏi cuộc hội thoại này?')) return;
            
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/direct-messages/${currentDMGroup.id}/members/${currentUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(() => {
                showNotification('Đã rời khỏi cuộc hội thoại', 'info');
                loadConversations();
                document.getElementById('chat-area').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <h3>Chọn một cuộc hội thoại</h3>
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error leaving conversation:', error);
                showNotification('Không thể rời khỏi', 'error');
            });
        }
        
        // Utility functions
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Vừa xong';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
            
            return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    </script>
</body>
</html>
