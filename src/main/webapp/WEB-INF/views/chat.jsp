<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Chat - CoCoCord</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/css/chat.css">
</head>
<body>
    <div class="app-container">
        <!-- Server List (Left Sidebar) -->
        <div class="server-list">
            <div class="server-home" data-server-id="home" title="Home">
                <i class="bi bi-house-door-fill"></i>
            </div>
            <div class="server-divider"></div>
            <div class="server-add" title="Add a Server">
                <i class="bi bi-plus-lg"></i>
            </div>
        </div>

        <!-- Channel List (Middle Sidebar) -->
        <div class="channel-sidebar">
            <div class="server-header">
                <h2 id="server-name">CoCoCord</h2>
                <button class="dropdown-btn" title="Server Options">
                    <i class="bi bi-chevron-down"></i>
                </button>
            </div>

            <!-- Text Channels -->
            <div class="channel-category">
                <div class="category-header">
                    <i class="bi bi-chevron-down category-icon"></i>
                    <span>TEXT CHANNELS</span>
                    <i class="bi bi-plus add-channel-btn" title="Create Channel"></i>
                </div>
                <div class="channel-list" id="text-channels">
                    <div class="channel-item active" data-channel-id="1" data-channel-type="text">
                        <i class="bi bi-hash channel-icon"></i>
                        <span class="channel-name">general</span>
                    </div>
                    <div class="channel-item" data-channel-id="2" data-channel-type="text">
                        <i class="bi bi-hash channel-icon"></i>
                        <span class="channel-name">random</span>
                    </div>
                </div>
            </div>

            <!-- Voice Channels -->
            <div class="channel-category">
                <div class="category-header">
                    <i class="bi bi-chevron-down category-icon"></i>
                    <span>VOICE CHANNELS</span>
                    <i class="bi bi-plus add-channel-btn" title="Create Channel"></i>
                </div>
                <div class="channel-list" id="voice-channels">
                    <div class="channel-item" data-channel-id="3" data-channel-type="voice">
                        <i class="bi bi-volume-up-fill channel-icon"></i>
                        <span class="channel-name">General Voice</span>
                    </div>
                </div>
            </div>

            <!-- User Panel -->
            <div class="user-panel">
                <div class="user-info">
                    <div class="user-avatar">
                        <img id="user-avatar" src="/images/default-avatar.png" alt="Avatar">
                        <div class="status-indicator status-online"></div>
                    </div>
                    <div class="user-details">
                        <div class="user-name" id="user-display-name">Loading...</div>
                        <div class="user-status" id="user-status">Online</div>
                    </div>
                </div>
                <div class="user-controls">
                    <button class="control-btn" title="Mute">
                        <i class="bi bi-mic-fill"></i>
                    </button>
                    <button class="control-btn" title="Deafen">
                        <i class="bi bi-headphones"></i>
                    </button>
                    <button class="control-btn" title="Settings">
                        <i class="bi bi-gear-fill"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chat-container">
            <!-- Chat Header -->
            <div class="chat-header">
                <div class="channel-info">
                    <i class="bi bi-hash channel-hash"></i>
                    <h3 id="current-channel-name">general</h3>
                    <div class="channel-divider"></div>
                    <span id="channel-topic" class="channel-topic">Welcome to CoCoCord!</span>
                </div>
                <div class="chat-controls">
                    <button class="header-btn" title="Threads">
                        <i class="bi bi-chat-right-text"></i>
                    </button>
                    <button class="header-btn" title="Notifications">
                        <i class="bi bi-bell"></i>
                    </button>
                    <button class="header-btn" title="Pinned Messages">
                        <i class="bi bi-pin-angle"></i>
                    </button>
                    <button class="header-btn" title="Members">
                        <i class="bi bi-people"></i>
                    </button>
                    <div class="search-box">
                        <input type="text" placeholder="Search">
                        <i class="bi bi-search"></i>
                    </div>
                </div>
            </div>

            <!-- Messages Area -->
            <div class="messages-container" id="messages-container">
                <div class="channel-welcome">
                    <div class="welcome-icon">
                        <i class="bi bi-hash"></i>
                    </div>
                    <h1>Welcome to #<span id="welcome-channel-name">general</span>!</h1>
                    <p>This is the start of the #<span id="welcome-channel-name-2">general</span> channel.</p>
                </div>
                <!-- Messages will be dynamically loaded here -->
            </div>

            <!-- Typing Indicator -->
            <div class="typing-indicator" id="typing-indicator" style="display: none;">
                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
                <span id="typing-users">Someone</span> is typing...
            </div>

            <!-- Message Input -->
            <div class="message-input-container">
                <div class="message-input-wrapper">
                    <button class="input-btn" title="Add Attachment">
                        <i class="bi bi-plus-circle-fill"></i>
                    </button>
                    <div class="message-input-box">
                        <textarea 
                            id="message-input" 
                            placeholder="Message #general" 
                            rows="1"
                            maxlength="2000"></textarea>
                    </div>
                    <div class="message-actions">
                        <button class="action-btn" title="Gift">
                            <i class="bi bi-gift-fill"></i>
                        </button>
                        <button class="action-btn" title="GIF">
                            <i class="bi bi-filetype-gif"></i>
                        </button>
                        <button class="action-btn" title="Sticker">
                            <i class="bi bi-stickies-fill"></i>
                        </button>
                        <button class="action-btn" title="Emoji">
                            <i class="bi bi-emoji-smile-fill"></i>
                        </button>
                    </div>
                </div>
                <div class="char-count" id="char-count">
                    <span id="char-current">0</span>/2000
                </div>
            </div>
        </div>

        <!-- Members Sidebar (Right - Initially Hidden) -->
        <div class="members-sidebar" id="members-sidebar" style="display: none;">
            <div class="members-header">
                <span>Members — <span id="member-count">0</span></span>
            </div>
            <div class="members-list" id="members-list">
                <!-- Members will be loaded here -->
            </div>
        </div>
    </div>

    <!-- WebSocket & Chat Logic -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7/bundles/stomp.umd.min.js"></script>
    <script src="/js/auth.js"></script>
    <script src="/js/chat.js"></script>

    <script>
        // Initialize chat when page loads
        if (!isLoggedIn()) {
            window.location.href = '/login';
        } else {
            // Set user info
            document.getElementById('user-display-name').textContent = localStorage.getItem('displayName') || 'User';
            
            // Initialize chat application
            window.addEventListener('DOMContentLoaded', () => {
                ChatApp.init();
            });
        }
    </script>
</body>
</html>
