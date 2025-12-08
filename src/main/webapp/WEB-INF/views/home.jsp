<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<jsp:include page="/WEB-INF/includes/header.jsp">
    <jsp:param name="title" value="CoCoCord - Home"/>
</jsp:include>

<!-- Discord-like Layout -->
<div class="flex h-screen overflow-hidden" style="height: calc(100vh);">
    
    <!-- Server List (Left sidebar - 72px) -->
    <div class="server-list flex flex-col items-center py-3 space-y-2" style="width: 72px; min-width: 72px;">
        <!-- Home/DM Button -->
        <div class="server-icon active" id="homeBtn" title="Direct Messages">
            <i class="fas fa-comments text-xl"></i>
        </div>
        <div class="w-8 h-0.5 bg-gray-700 rounded-full my-1"></div>
        
        <!-- Server Icons -->
        <div id="serverIconList" class="space-y-2"></div>
        
        <!-- Add Server Button -->
        <div class="server-icon" id="addServerBtn" title="Add a Server" style="color: #3ba55c;">
            <i class="fas fa-plus text-xl"></i>
        </div>
    </div>

    <!-- Channel/DM Sidebar (240px) -->
    <div class="sidebar flex flex-col" style="width: 240px; min-width: 240px;">
        <!-- Header -->
        <div class="p-4 border-b border-gray-900 shadow-md">
            <h2 id="sidebarTitle" class="font-bold text-white truncate">Direct Messages</h2>
        </div>
        
        <!-- Friends Section (shown when DM selected) -->
        <div id="dmSection" class="flex-1 overflow-y-auto">
            <!-- Find/Add Friends -->
            <div class="p-2">
                <button id="findFriendsBtn" class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-700 text-gray-300 text-sm">
                    <i class="fas fa-user-plus mr-2"></i>Find or start a conversation
                </button>
            </div>
            
            <!-- Friend Requests -->
            <div class="px-2 mt-2">
                <div class="flex items-center justify-between px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    <span>Friend Requests</span>
                    <span id="friendRequestCount" class="bg-red-500 text-white text-xs rounded-full px-1.5 hidden">0</span>
                </div>
                <ul id="friendRequestList" class="mt-1 space-y-0.5"></ul>
            </div>
            
            <!-- Direct Messages List -->
            <div class="px-2 mt-4">
                <div class="px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    Direct Messages
                </div>
                <ul id="conversationList" class="mt-1 space-y-0.5"></ul>
            </div>
            
            <!-- Online Friends -->
            <div class="px-2 mt-4">
                <div class="px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    Online Friends
                </div>
                <ul id="friendList" class="mt-1 space-y-0.5"></ul>
            </div>
        </div>
        
        <!-- Channel Section (shown when server selected) -->
        <div id="channelSection" class="flex-1 overflow-y-auto hidden">
            <div id="channelList" class="p-2 space-y-1"></div>
        </div>
        
        <!-- User Panel (bottom) -->
        <div class="p-2 bg-gray-900 flex items-center">
            <div class="relative">
                <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span id="userAvatar" class="text-white text-sm font-bold">U</span>
                </div>
                <div class="status-indicator status-online"></div>
            </div>
            <div class="ml-2 flex-1 overflow-hidden">
                <div id="currentUser" class="text-white text-sm font-medium truncate">User</div>
                <div class="text-gray-400 text-xs">Online</div>
            </div>
            <div class="flex space-x-1">
                <button class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Settings">
                    <i class="fas fa-cog"></i>
                </button>
                <button id="logoutBtn" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Chat Area -->
    <div class="chat-container flex flex-col flex-1">
        <!-- Chat Header -->
        <div class="h-12 px-4 flex items-center border-b border-gray-900 shadow-md" style="background-color: #36393f;">
            <div id="chatHeaderIcon" class="text-gray-400 mr-2">
                <i class="fas fa-hashtag"></i>
            </div>
            <h3 id="chatTitle" class="font-bold text-white">Select a conversation</h3>
            <div class="ml-auto flex items-center space-x-4 text-gray-400">
                <button class="hover:text-white" title="Pinned Messages"><i class="fas fa-thumbtack"></i></button>
                <button class="hover:text-white" title="Add Friends to DM"><i class="fas fa-user-plus"></i></button>
                <div class="relative">
                    <input type="text" placeholder="Search" class="bg-gray-900 text-sm rounded px-2 py-1 w-32 focus:w-48 transition-all">
                    <i class="fas fa-search absolute right-2 top-1.5 text-xs"></i>
                </div>
            </div>
        </div>
        
        <!-- Welcome Screen (default) -->
        <div id="welcomeScreen" class="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div class="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-4">
                <i class="fas fa-comments text-4xl text-white"></i>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Welcome to CoCoCord!</h2>
            <p class="text-gray-400 max-w-md">
                Select a friend to start chatting, join a server, or create your own server to begin your journey.
            </p>
            <div class="mt-6 flex space-x-4">
                <button id="createServerBtn2" class="btn-discord px-6 py-2">
                    <i class="fas fa-plus mr-2"></i>Create Server
                </button>
            </div>
        </div>
        
        <!-- Chat Section (hidden by default) -->
        <div id="chatSection" class="flex-1 flex flex-col hidden">
            <!-- Messages -->
            <div id="messages" class="messages-container flex-1 overflow-y-auto p-4 space-y-4"></div>
            
            <!-- Message Input -->
            <div class="message-input-container px-4 pb-4">
                <form id="messageForm" class="flex items-center bg-gray-700 rounded-lg">
                    <button type="button" class="p-3 text-gray-400 hover:text-white">
                        <i class="fas fa-plus-circle text-xl"></i>
                    </button>
                    <input type="text" id="messageInput" 
                           class="flex-1 bg-transparent border-none py-3 text-white placeholder-gray-400 focus:outline-none" 
                           placeholder="Message #channel">
                    <div class="flex items-center space-x-2 px-3">
                        <button type="button" class="text-gray-400 hover:text-white"><i class="fas fa-gift"></i></button>
                        <button type="button" class="text-gray-400 hover:text-white"><i class="fas fa-image"></i></button>
                        <button type="button" class="text-gray-400 hover:text-white"><i class="fas fa-smile"></i></button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Members Sidebar (Right - 240px, shown in server channels) -->
    <div id="membersSidebar" class="members-sidebar hidden" style="width: 240px;">
        <div class="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
            Online — <span id="onlineCount">0</span>
        </div>
        <div id="memberList" class="space-y-0.5"></div>
    </div>
</div>

<!-- Add Friend Modal -->
<div id="addFriendModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-white mb-4">Add Friend</h3>
        <p class="text-gray-400 text-sm mb-4">You can add a friend with their username.</p>
        <form id="addFriendForm">
            <input type="text" id="friendUsername" 
                   class="discord-input w-full mb-4" 
                   placeholder="Enter a Username">
            <div class="flex justify-end space-x-3">
                <button type="button" class="px-4 py-2 text-gray-300 hover:underline" onclick="$('#addFriendModal').addClass('hidden')">Cancel</button>
                <button type="submit" class="btn-discord px-6 py-2">Send Friend Request</button>
            </div>
        </form>
    </div>
</div>

<!-- Create Server Modal -->
<div id="createServerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-white mb-2">Create Your Server</h3>
        <p class="text-gray-400 text-sm mb-4">Give your new server a name and an icon.</p>
        <form id="createServerForm">
            <div class="mb-4">
                <label class="block text-gray-300 text-sm font-semibold mb-2">SERVER NAME</label>
                <input type="text" id="serverName" class="discord-input w-full" placeholder="My Awesome Server" required>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" class="px-4 py-2 text-gray-300 hover:underline" onclick="$('#createServerModal').addClass('hidden')">Cancel</button>
                <button type="submit" class="btn-discord px-6 py-2">Create</button>
            </div>
        </form>
    </div>
</div>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
<script>
    // ============ Global State ============
    const token = sessionStorage.getItem('token');
    let stompClient = null;
    let currentView = 'dm'; // 'dm' or 'server'
    let currentServerId = null;
    let currentChannelId = null;
    let currentConversationId = null;
    let currentUsername = null;

    // ============ Auth Check ============
    $(document).ready(function() {
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        // Decode username from JWT
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUsername = payload.sub;
            $('#currentUser').text(currentUsername);
            $('#userAvatar').text(currentUsername.charAt(0).toUpperCase());
        } catch(e) {
            console.error('Failed to decode token');
        }
        
        // Load initial data
        loadServers();
        loadFriends();
        loadFriendRequests();
        loadConversations();
        
        // Connect to notification WebSocket
        connectNotifications();
    });

    // ============ WebSocket Connection ============
    function connectStomp(subscriptionPath, onMessage) {
        if (stompClient) {
            stompClient.disconnect();
        }
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logs
        stompClient.connect({ Authorization: 'Bearer ' + token }, function() {
            stompClient.subscribe(subscriptionPath, function(message) {
                const msg = JSON.parse(message.body);
                if (onMessage) onMessage(msg);
                else appendMessage(msg);
            });
        });
    }
    
    function connectNotifications() {
        // Connect to user-specific notification channel
        const notifSocket = new SockJS('/ws');
        const notifClient = Stomp.over(notifSocket);
        notifClient.debug = null;
        notifClient.connect({ Authorization: 'Bearer ' + token }, function() {
            notifClient.subscribe('/user/queue/notifications', function(message) {
                const notif = JSON.parse(message.body);
                showNotification(notif);
            });
        });
    }
    
    function showNotification(notif) {
        // Simple notification toast
        const toast = $('<div class="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">')
            .text(notif.message || 'New notification');
        $('body').append(toast);
        setTimeout(() => toast.fadeOut(() => toast.remove()), 3000);
    }

    // ============ Server Functions ============
    function loadServers() {
        $.ajax({
            url: '/api/servers',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(servers) {
                const list = $('#serverIconList');
                list.empty();
                servers.forEach(server => {
                    const icon = $('<div class="server-icon" title="' + server.name + '">')
                        .text(server.name.charAt(0).toUpperCase())
                        .attr('data-server-id', server.id)
                        .on('click', () => selectServer(server));
                    list.append(icon);
                });
            }
        });
    }
    
    function selectServer(server) {
        currentView = 'server';
        currentServerId = server.id;
        
        // Update UI
        $('.server-icon').removeClass('active');
        $('.server-icon[data-server-id="' + server.id + '"]').addClass('active');
        
        $('#sidebarTitle').text(server.name);
        $('#dmSection').addClass('hidden');
        $('#channelSection').removeClass('hidden');
        $('#membersSidebar').removeClass('hidden');
        
        loadChannels(server.id);
        loadMembers(server.id);
    }
    
    function loadChannels(serverId) {
        $.ajax({
            url: '/api/servers/' + serverId + '/channels',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(channels) {
                const list = $('#channelList');
                list.empty();
                
                // Group by category
                const textChannels = channels.filter(c => c.type === 'TEXT' || !c.type);
                const voiceChannels = channels.filter(c => c.type === 'VOICE');
                
                if (textChannels.length > 0) {
                    list.append('<div class="text-xs text-gray-400 font-semibold uppercase tracking-wide px-2 py-1">Text Channels</div>');
                    textChannels.forEach(channel => {
                        const item = $('<div class="channel-item flex items-center">')
                            .attr('data-channel-id', channel.id)
                            .html('<i class="fas fa-hashtag mr-2 text-gray-500"></i><span>' + channel.name + '</span>')
                            .on('click', () => openChannel(channel));
                        list.append(item);
                    });
                }
                
                if (voiceChannels.length > 0) {
                    list.append('<div class="text-xs text-gray-400 font-semibold uppercase tracking-wide px-2 py-1 mt-4">Voice Channels</div>');
                    voiceChannels.forEach(channel => {
                        const item = $('<div class="channel-item flex items-center">')
                            .html('<i class="fas fa-volume-up mr-2 text-gray-500"></i><span>' + channel.name + '</span>')
                            .on('click', () => alert('Voice channels coming soon!'));
                        list.append(item);
                    });
                }
            }
        });
    }
    
    function loadMembers(serverId) {
        $.ajax({
            url: '/api/servers/' + serverId + '/members',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(members) {
                const list = $('#memberList');
                list.empty();
                $('#onlineCount').text(members.length);
                
                members.forEach(member => {
                    const memberInitial = member.username.charAt(0).toUpperCase();
                    const item = $('<div class="member-item">')
                        .html(
                            '<div class="relative">' +
                                '<div class="member-avatar flex items-center justify-center text-white text-sm">' +
                                    memberInitial +
                                '</div>' +
                                '<div class="status-indicator status-online" style="width:8px;height:8px;bottom:-2px;right:-2px;"></div>' +
                            '</div>' +
                            '<span class="text-gray-300 text-sm">' + member.username + '</span>'
                        );
                    list.append(item);
                });
            }
        });
    }
    
    function openChannel(channel) {
        currentChannelId = channel.id;
        currentConversationId = null;
        
        // Update UI
        $('.channel-item').removeClass('active');
        $('.channel-item[data-channel-id="' + channel.id + '"]').addClass('active');
        
        $('#welcomeScreen').addClass('hidden');
        $('#chatSection').removeClass('hidden');
        $('#chatHeaderIcon').html('<i class="fas fa-hashtag"></i>');
        $('#chatTitle').text(channel.name);
        $('#messageInput').attr('placeholder', 'Message #' + channel.name);
        $('#messages').empty();
        
        // Load message history
        loadChannelMessages(channel.id);
        
        // Connect to WebSocket
        connectStomp('/topic/server/' + currentServerId + '/channel/' + channel.id);
        
        // Setup message form
        $('#messageForm').off('submit').on('submit', function(e) {
            e.preventDefault();
            sendChannelMessage();
        });
    }
    
    function loadChannelMessages(channelId) {
        $.ajax({
            url: '/api/servers/' + currentServerId + '/channels/' + channelId + '/messages',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(messages) {
                messages.forEach(msg => appendMessage(msg));
                scrollToBottom();
            }
        });
    }
    
    function sendChannelMessage() {
        const content = $('#messageInput').val().trim();
        if (!content) return;
        
        $('#messageInput').val('');
        stompClient.send('/app/server/' + currentServerId + '/channel/' + currentChannelId, 
            { Authorization: 'Bearer ' + token }, 
            JSON.stringify({ content: content }));
    }

    // ============ DM Functions ============
    $('#homeBtn').on('click', function() {
        currentView = 'dm';
        currentServerId = null;
        currentChannelId = null;
        
        $('.server-icon').removeClass('active');
        $(this).addClass('active');
        
        $('#sidebarTitle').text('Direct Messages');
        $('#dmSection').removeClass('hidden');
        $('#channelSection').addClass('hidden');
        $('#membersSidebar').addClass('hidden');
        
        $('#welcomeScreen').removeClass('hidden');
        $('#chatSection').addClass('hidden');
    });
    
    function loadConversations() {
        $.ajax({
            url: '/api/conversations',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(conversations) {
                const list = $('#conversationList');
                list.empty();
                conversations.forEach(conv => {
                    const name = conv.name || conv.participants.map(p => p.username).filter(u => u !== currentUsername).join(', ');
                    const nameInitial = name.charAt(0).toUpperCase();
                    const item = $('<li class="channel-item flex items-center cursor-pointer">')
                        .html(
                            '<div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">' +
                                '<span class="text-white text-sm">' + nameInitial + '</span>' +
                            '</div>' +
                            '<span class="text-gray-300">' + name + '</span>'
                        )
                        .on('click', () => openConversation(conv));
                    list.append(item);
                });
            }
        });
    }
    
    function openConversation(conv) {
        currentConversationId = conv.id;
        currentChannelId = null;
        
        const name = conv.name || conv.participants.map(p => p.username).filter(u => u !== currentUsername).join(', ');
        
        $('#welcomeScreen').addClass('hidden');
        $('#chatSection').removeClass('hidden');
        $('#chatHeaderIcon').html('<i class="fas fa-at"></i>');
        $('#chatTitle').text(name);
        $('#messageInput').attr('placeholder', 'Message @' + name);
        $('#messages').empty();
        
        // Load message history
        loadConversationMessages(conv.id);
        
        // Connect to WebSocket
        connectStomp('/topic/conversation/' + conv.id);
        
        // Setup message form
        $('#messageForm').off('submit').on('submit', function(e) {
            e.preventDefault();
            sendConversationMessage();
        });
    }
    
    function loadConversationMessages(convId) {
        $.ajax({
            url: '/api/conversations/' + convId + '/messages',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(messages) {
                messages.forEach(msg => appendMessage(msg));
                scrollToBottom();
            }
        });
    }
    
    function sendConversationMessage() {
        const content = $('#messageInput').val().trim();
        if (!content) return;
        
        $('#messageInput').val('');
        stompClient.send('/app/conversation/' + currentConversationId, 
            { Authorization: 'Bearer ' + token }, 
            JSON.stringify({ content: content }));
    }

    // ============ Friend Functions ============
    function loadFriends() {
        $.ajax({
            url: '/api/friends',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(friends) {
                const list = $('#friendList');
                list.empty();
                friends.forEach(friend => {
                    const friendInitial = friend.username.charAt(0).toUpperCase();
                    const item = $('<li class="channel-item flex items-center cursor-pointer">')
                        .html(
                            '<div class="relative mr-3">' +
                                '<div class="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">' +
                                    '<span class="text-white text-sm">' + friendInitial + '</span>' +
                                '</div>' +
                                '<div class="status-indicator status-online" style="width:10px;height:10px;"></div>' +
                            '</div>' +
                            '<span class="text-gray-300">' + friend.username + '</span>'
                        )
                        .on('click', () => createOrOpenDm(friend.username));
                    list.append(item);
                });
            }
        });
    }
    
    function loadFriendRequests() {
        $.ajax({
            url: '/api/friends/requests',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(requests) {
                const list = $('#friendRequestList');
                list.empty();
                
                if (requests.length > 0) {
                    $('#friendRequestCount').text(requests.length).removeClass('hidden');
                } else {
                    $('#friendRequestCount').addClass('hidden');
                }
                
                requests.forEach(req => {
                    const item = $('<li class="p-2 bg-gray-700 rounded mb-1">')
                        .html(
                            '<div class="flex items-center justify-between">' +
                                '<span class="text-white text-sm">' + req.fromUsername + '</span>' +
                                '<div class="flex space-x-1">' +
                                    '<button class="accept-btn p-1 text-green-500 hover:bg-green-500 hover:text-white rounded" title="Accept">' +
                                        '<i class="fas fa-check"></i>' +
                                    '</button>' +
                                    '<button class="reject-btn p-1 text-red-500 hover:bg-red-500 hover:text-white rounded" title="Reject">' +
                                        '<i class="fas fa-times"></i>' +
                                    '</button>' +
                                '</div>' +
                            '</div>'
                        );
                    
                    item.find('.accept-btn').on('click', () => acceptFriendRequest(req.id));
                    item.find('.reject-btn').on('click', () => rejectFriendRequest(req.id));
                    list.append(item);
                });
            }
        });
    }
    
    function acceptFriendRequest(requestId) {
        $.ajax({
            url: '/api/friends/requests/' + requestId + '/accept',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                loadFriendRequests();
                loadFriends();
            }
        });
    }
    
    function rejectFriendRequest(requestId) {
        $.ajax({
            url: '/api/friends/requests/' + requestId + '/reject',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                loadFriendRequests();
            }
        });
    }
    
    function createOrOpenDm(username) {
        $.ajax({
            url: '/api/conversations',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({ participants: [username] }),
            success: function(conv) {
                loadConversations();
                openConversation(conv);
            }
        });
    }

    // ============ Message Display ============
    function appendMessage(msg) {
        const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        const sender = msg.senderUsername || msg.sender || 'Unknown';
        const content = escapeHtml(msg.content || '');
        const formattedContent = formatMessage(content);
        const senderInitial = sender.charAt(0).toUpperCase();
        
        const messageHtml = 
            '<div class="message group hover:bg-gray-800 rounded px-2 py-1 -mx-2">' +
                '<div class="message-avatar">' +
                    '<span class="text-white font-bold">' + senderInitial + '</span>' +
                '</div>' +
                '<div class="message-content">' +
                    '<div class="flex items-baseline">' +
                        '<span class="message-author">' + sender + '</span>' +
                        '<span class="text-gray-500 text-xs ml-2">' + time + '</span>' +
                    '</div>' +
                    '<div class="message-text">' + formattedContent + '</div>' +
                '</div>' +
                '<div class="hidden group-hover:flex absolute right-2 top-0 bg-gray-900 rounded shadow-lg">' +
                    '<button class="p-1 text-gray-400 hover:text-white" title="Add Reaction"><i class="fas fa-smile"></i></button>' +
                    '<button class="p-1 text-gray-400 hover:text-white" title="Reply"><i class="fas fa-reply"></i></button>' +
                    '<button class="p-1 text-gray-400 hover:text-white" title="More"><i class="fas fa-ellipsis-h"></i></button>' +
                '</div>' +
            '</div>';
        $('#messages').append(messageHtml);
        scrollToBottom();
    }
    
    function formatMessage(content) {
        // Convert @mentions and #channels
        content = content.replace(/@(\w+)/g, '<span class="text-indigo-400 hover:underline cursor-pointer">@$1</span>');
        content = content.replace(/#(\w+)/g, '<span class="text-indigo-400 hover:underline cursor-pointer">#$1</span>');
        // Convert URLs to links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>');
        return content;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function scrollToBottom() {
        const container = document.getElementById('messages');
        container.scrollTop = container.scrollHeight;
    }

    // ============ Modal Handlers ============
    $('#findFriendsBtn').on('click', () => $('#addFriendModal').removeClass('hidden'));
    $('#addServerBtn, #createServerBtn2').on('click', () => $('#createServerModal').removeClass('hidden'));
    
    $('#addFriendForm').on('submit', function(e) {
        e.preventDefault();
        const username = $('#friendUsername').val().trim();
        if (!username) return;
        
        $.ajax({
            url: '/api/friends/requests',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({ username: username }),
            success: function() {
                $('#friendUsername').val('');
                $('#addFriendModal').addClass('hidden');
                showNotification({ message: 'Friend request sent to ' + username });
            },
            error: function(xhr) {
                alert('Error: ' + (xhr.responseJSON?.message || 'Failed to send request'));
            }
        });
    });
    
    $('#createServerForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#serverName').val().trim();
        if (!name) return;
        
        $.ajax({
            url: '/api/servers',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({ name: name }),
            success: function(server) {
                $('#serverName').val('');
                $('#createServerModal').addClass('hidden');
                loadServers();
                showNotification({ message: 'Server "' + name + '" created!' });
            },
            error: function(xhr) {
                alert('Error: ' + (xhr.responseJSON?.message || 'Failed to create server'));
            }
        });
    });
    
    // Close modals on outside click
    $('.fixed.inset-0').on('click', function(e) {
        if (e.target === this) {
            $(this).addClass('hidden');
        }
    });
    
    // Logout
    $('#logoutBtn').on('click', function() {
        sessionStorage.removeItem('token');
        window.location.href = '/login';
    });
</script>

<jsp:include page="/WEB-INF/includes/footer.jsp"/>
