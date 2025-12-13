<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bạn bè - CoCoCord</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/chat.css">
    <style>
        .friends-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px 0;
        }
        
        .page-header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
        }
        
        .header-btn {
            padding: 10px 20px;
            background: #5865F2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s;
        }
        
        .header-btn:hover {
            background: #4752C4;
        }
        
        .friends-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .tab-button {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            transition: all 0.3s;
            position: relative;
        }
        
        .tab-button.active {
            color: #5865F2;
            font-weight: bold;
        }
        
        .tab-button.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: #5865F2;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .search-box {
            margin-bottom: 20px;
        }
        
        .search-box input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .user-list {
            display: grid;
            gap: 15px;
        }
        
        .user-card {
            display: flex;
            align-items: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }
        
        .user-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        
        .user-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }
        
        .user-info {
            flex: 1;
        }
        
        .user-name {
            font-weight: bold;
            font-size: 16px;
            color: #333;
        }
        
        .user-status {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
        }
        
        .user-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #5865F2;
            color: white;
        }
        
        .btn-primary:hover {
            background: #4752C4;
        }
        
        .btn-success {
            background: #43B581;
            color: white;
        }
        
        .btn-success:hover {
            background: #3CA374;
        }
        
        .btn-danger {
            background: #F04747;
            color: white;
        }
        
        .btn-danger:hover {
            background: #D84040;
        }
        
        .btn-secondary {
            background: #747F8D;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5D6773;
        }
        
        .status-online {
            color: #43B581;
        }
        
        .status-offline {
            color: #747F8D;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .badge-pending {
            background: #FFA500;
            color: white;
        }
        
        .badge-sent {
            background: #5865F2;
            color: white;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
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
            border-left: 4px solid #43B581;
        }
        
        .notification.error {
            border-left: 4px solid #F04747;
        }
        
        .notification.info {
            border-left: 4px solid #5865F2;
        }
    </style>
</head>
<body>
    <div class="friends-container">
        <h1>Bạn bè</h1>
        
        <div class="friends-tabs">
            <button class="tab-button active" data-tab="friends">Tất cả bạn bè</button>
            <button class="tab-button" data-tab="pending">Lời mời kết bạn</button>
            <button class="tab-button" data-tab="sent">Đã gửi lời mời</button>
            <button class="tab-button" data-tab="blocked">Đã chặn</button>
            <button class="tab-button" data-tab="add">Thêm bạn</button>
        </div>
        
        <!-- All Friends Tab -->
        <div id="friends-tab" class="tab-content active">
            <div class="search-box">
                <input type="text" id="search-friends" placeholder="Tìm kiếm bạn bè...">
            </div>
            <div id="friends-list" class="user-list"></div>
        </div>
        
        <!-- Pending Requests Tab -->
        <div id="pending-tab" class="tab-content">
            <div id="pending-list" class="user-list"></div>
        </div>
        
        <!-- Sent Requests Tab -->
        <div id="sent-tab" class="tab-content">
            <div id="sent-list" class="user-list"></div>
        </div>
        
        <!-- Blocked Users Tab -->
        <div id="blocked-tab" class="tab-content">
            <div id="blocked-list" class="user-list"></div>
        </div>
        
        <!-- Add Friend Tab -->
        <div id="add-tab" class="tab-content">
            <div class="search-box">
                <input type="text" id="search-users" placeholder="Nhập tên người dùng hoặc ID...">
                <button class="btn btn-primary" id="btn-search-users" style="margin-top: 10px;">Tìm kiếm</button>
            </div>
            <div id="search-results" class="user-list"></div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
    <script src="/js/auth.js"></script>
    <script>
        let stompClient = null;
        let currentUser = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadCurrentUser();
            loadFriends();
            connectWebSocket();
            setupTabSwitching();
            setupEventListeners();
        });
        
        // Load current user info
        function loadCurrentUser() {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            
            fetch('/api/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(data => {
                currentUser = data;
            })
            .catch(error => console.error('Error loading user:', error));
        }
        
        // Connect to WebSocket for real-time updates
        function connectWebSocket() {
            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            
            const token = localStorage.getItem('accessToken');
            
            stompClient.connect({'Authorization': 'Bearer ' + token}, function(frame) {
                console.log('Connected to WebSocket');
                
                // Subscribe to friend notifications
                stompClient.subscribe('/user/topic/friend-requests', function(message) {
                    const notification = JSON.parse(message.body);
                    handleFriendNotification(notification);
                });
                
                // Subscribe to friend status updates
                stompClient.subscribe('/topic/user-status', function(message) {
                    const statusUpdate = JSON.parse(message.body);
                    updateUserStatus(statusUpdate);
                });
            });
        }
        
        // Handle friend notifications
        function handleFriendNotification(notification) {
            showNotification(notification.message, 'info');
            
            // Refresh the appropriate list based on notification type
            if (notification.type === 'FRIEND_REQUEST_RECEIVED') {
                loadPendingRequests();
            } else if (notification.type === 'FRIEND_REQUEST_ACCEPTED') {
                loadFriends();
                loadSentRequests();
            }
        }
        
        // Update user online status
        function updateUserStatus(statusUpdate) {
            const userCards = document.querySelectorAll(`[data-user-id="${statusUpdate.userId}"]`);
            userCards.forEach(card => {
                const statusElement = card.querySelector('.user-status');
                if (statusElement) {
                    statusElement.textContent = statusUpdate.status;
                    statusElement.className = 'user-status status-' + statusUpdate.status.toLowerCase();
                }
            });
        }
        
        // Tab switching
        function setupTabSwitching() {
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const tabName = this.dataset.tab;
                    switchTab(tabName);
                });
            });
        }
        
        function switchTab(tabName) {
            // Update active button
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Load data for the tab
            switch(tabName) {
                case 'friends':
                    loadFriends();
                    break;
                case 'pending':
                    loadPendingRequests();
                    break;
                case 'sent':
                    loadSentRequests();
                    break;
                case 'blocked':
                    loadBlockedUsers();
                    break;
            }
        }
        
        // Event listeners
        function setupEventListeners() {
            // Search friends
            document.getElementById('search-friends').addEventListener('input', function(e) {
                filterFriends(e.target.value);
            });
            
            // Search users to add
            document.getElementById('btn-search-users').addEventListener('click', searchUsers);
            document.getElementById('search-users').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchUsers();
                }
            });
        }
        
        // Load friends list
        function loadFriends() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/friends', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(friends => {
                displayFriends(friends);
            })
            .catch(error => {
                console.error('Error loading friends:', error);
                showNotification('Không thể tải danh sách bạn bè', 'error');
            });
        }
        
        // Display friends
        function displayFriends(friends) {
            const friendsList = document.getElementById('friends-list');
            
            if (friends.length === 0) {
                friendsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>Chưa có bạn bè</h3>
                        <p>Hãy thêm bạn bè để bắt đầu trò chuyện!</p>
                    </div>
                `;
                return;
            }
            
            friendsList.innerHTML = friends.map(friend => `
                <div class="user-card" data-user-id="${friend.id}">
                    <img src="${friend.avatarUrl || '/images/default-avatar.png'}" alt="${friend.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${friend.displayName}</div>
                        <div class="user-status status-${friend.status.toLowerCase()}">${friend.status}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-primary" onclick="startChat(${friend.id})">💬 Nhắn tin</button>
                        <button class="btn btn-danger" onclick="removeFriend(${friend.id})">Xóa bạn</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Filter friends
        function filterFriends(searchTerm) {
            const cards = document.querySelectorAll('#friends-list .user-card');
            cards.forEach(card => {
                const name = card.querySelector('.user-name').textContent.toLowerCase();
                if (name.includes(searchTerm.toLowerCase())) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // Load pending friend requests
        function loadPendingRequests() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/friends/requests/pending', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(requests => {
                displayPendingRequests(requests);
            })
            .catch(error => {
                console.error('Error loading pending requests:', error);
                showNotification('Không thể tải lời mời kết bạn', 'error');
            });
        }
        
        // Display pending requests
        function displayPendingRequests(requests) {
            const pendingList = document.getElementById('pending-list');
            
            if (requests.length === 0) {
                pendingList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📬</div>
                        <h3>Không có lời mời kết bạn</h3>
                    </div>
                `;
                return;
            }
            
            pendingList.innerHTML = requests.map(request => `
                <div class="user-card">
                    <img src="${request.sender.avatarUrl || '/images/default-avatar.png'}" alt="${request.sender.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${request.sender.displayName}</div>
                        <div class="user-status">@${request.sender.username}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-success" onclick="acceptFriendRequest(${request.id})">Chấp nhận</button>
                        <button class="btn btn-danger" onclick="declineFriendRequest(${request.id})">Từ chối</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Load sent friend requests
        function loadSentRequests() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/friends/requests/sent', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(requests => {
                displaySentRequests(requests);
            })
            .catch(error => {
                console.error('Error loading sent requests:', error);
                showNotification('Không thể tải danh sách đã gửi', 'error');
            });
        }
        
        // Display sent requests
        function displaySentRequests(requests) {
            const sentList = document.getElementById('sent-list');
            
            if (requests.length === 0) {
                sentList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📤</div>
                        <h3>Chưa gửi lời mời nào</h3>
                    </div>
                `;
                return;
            }
            
            sentList.innerHTML = requests.map(request => `
                <div class="user-card">
                    <img src="${request.receiver.avatarUrl || '/images/default-avatar.png'}" alt="${request.receiver.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${request.receiver.displayName}</div>
                        <div class="user-status">@${request.receiver.username} <span class="badge badge-pending">Đang chờ</span></div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-secondary" onclick="cancelFriendRequest(${request.id})">Hủy lời mời</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Load blocked users
        function loadBlockedUsers() {
            const token = localStorage.getItem('accessToken');
            
            fetch('/api/friends/blocked', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(users => {
                displayBlockedUsers(users);
            })
            .catch(error => {
                console.error('Error loading blocked users:', error);
                showNotification('Không thể tải danh sách đã chặn', 'error');
            });
        }
        
        // Display blocked users
        function displayBlockedUsers(users) {
            const blockedList = document.getElementById('blocked-list');
            
            if (users.length === 0) {
                blockedList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚫</div>
                        <h3>Chưa chặn ai</h3>
                    </div>
                `;
                return;
            }
            
            blockedList.innerHTML = users.map(user => `
                <div class="user-card">
                    <img src="${user.avatarUrl || '/images/default-avatar.png'}" alt="${user.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${user.displayName}</div>
                        <div class="user-status">@${user.username}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-primary" onclick="unblockUser(${user.id})">Bỏ chặn</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Search users
        function searchUsers() {
            const searchTerm = document.getElementById('search-users').value.trim();
            if (!searchTerm) {
                showNotification('Vui lòng nhập tên người dùng', 'error');
                return;
            }
            
            const token = localStorage.getItem('accessToken');
            
            // Using GraphQL for search
            const query = `
                query SearchUsers($search: String!) {
                    searchUsers(search: $search) {
                        id
                        username
                        displayName
                        avatarUrl
                        status
                    }
                }
            `;
            
            fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    query: query,
                    variables: { search: searchTerm }
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.errors) {
                    // Fallback to REST API
                    return fetch(`/api/users/search?query=${encodeURIComponent(searchTerm)}`, {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }).then(r => r.json());
                }
                return result.data.searchUsers;
            })
            .then(users => {
                displaySearchResults(users);
            })
            .catch(error => {
                console.error('Error searching users:', error);
                showNotification('Không thể tìm kiếm người dùng', 'error');
            });
        }
        
        // Display search results
        function displaySearchResults(users) {
            const searchResults = document.getElementById('search-results');
            
            if (users.length === 0) {
                searchResults.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <h3>Không tìm thấy kết quả</h3>
                    </div>
                `;
                return;
            }
            
            searchResults.innerHTML = users.map(user => `
                <div class="user-card">
                    <img src="${user.avatarUrl || '/images/default-avatar.png'}" alt="${user.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${user.displayName}</div>
                        <div class="user-status">@${user.username}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-primary" onclick="sendFriendRequest(${user.id})">Gửi lời mời</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Send friend request
        function sendFriendRequest(userId) {
            const token = localStorage.getItem('accessToken');
            
            // Using GraphQL Mutation
            const mutation = `
                mutation SendFriendRequest($receiverUserId: ID!) {
                    sendFriendRequest(receiverUserId: $receiverUserId) {
                        id
                        status
                    }
                }
            `;
            
            fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { receiverUserId: userId }
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.errors) {
                    throw new Error(result.errors[0].message);
                }
                showNotification('Đã gửi lời mời kết bạn', 'success');
                loadSentRequests();
            })
            .catch(error => {
                console.error('Error sending friend request:', error);
                showNotification('Không thể gửi lời mời kết bạn', 'error');
            });
        }
        
        // Accept friend request
        function acceptFriendRequest(requestId) {
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/requests/${requestId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã chấp nhận lời mời kết bạn', 'success');
                loadPendingRequests();
                loadFriends();
            })
            .catch(error => {
                console.error('Error accepting friend request:', error);
                showNotification('Không thể chấp nhận lời mời', 'error');
            });
        }
        
        // Decline friend request
        function declineFriendRequest(requestId) {
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/requests/${requestId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã từ chối lời mời kết bạn', 'info');
                loadPendingRequests();
            })
            .catch(error => {
                console.error('Error declining friend request:', error);
                showNotification('Không thể từ chối lời mời', 'error');
            });
        }
        
        // Cancel friend request
        function cancelFriendRequest(requestId) {
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/requests/${requestId}/cancel`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã hủy lời mời kết bạn', 'info');
                loadSentRequests();
            })
            .catch(error => {
                console.error('Error cancelling friend request:', error);
                showNotification('Không thể hủy lời mời', 'error');
            });
        }
        
        // Remove friend
        function removeFriend(friendId) {
            if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) {
                return;
            }
            
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã xóa bạn bè', 'success');
                loadFriends();
            })
            .catch(error => {
                console.error('Error removing friend:', error);
                showNotification('Không thể xóa bạn bè', 'error');
            });
        }
        
        // Block user
        function blockUser(userId) {
            if (!confirm('Bạn có chắc muốn chặn người dùng này?')) {
                return;
            }
            
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/block/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã chặn người dùng', 'success');
                loadBlockedUsers();
            })
            .catch(error => {
                console.error('Error blocking user:', error);
                showNotification('Không thể chặn người dùng', 'error');
            });
        }
        
        // Unblock user
        function unblockUser(userId) {
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/friends/unblock/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(result => {
                showNotification('Đã bỏ chặn người dùng', 'success');
                loadBlockedUsers();
            })
            .catch(error => {
                console.error('Error unblocking user:', error);
                showNotification('Không thể bỏ chặn người dùng', 'error');
            });
        }
        
        // Start chat with friend
        function startChat(friendId) {
            // Create or get 1-1 DM and redirect to messages page
            const token = localStorage.getItem('accessToken');
            
            fetch(`/api/direct-messages/create-dm/${friendId}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => response.json())
            .then(dmGroup => {
                window.location.href = `/messages?dmId=${dmGroup.id}`;
            })
            .catch(error => {
                console.error('Error creating DM:', error);
                showNotification('Không thể tạo tin nhắn', 'error');
            });
        }
        
        // Show notification
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
