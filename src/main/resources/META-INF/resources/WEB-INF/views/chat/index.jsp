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
                    <!-- Channels will be loaded dynamically -->
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
                    <!-- Voice channels will be loaded dynamically -->
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
                    <h3 id="chat-header-channel-name">general</h3>
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

    <!-- Create Server Modal -->
    <div class="modal-overlay" id="create-server-modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create a Server</h3>
                <button class="modal-close" onclick="ChatApp.closeModal('create-server-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="create-server-form">
                    <div class="form-group">
                        <label for="server-name-input">Server Name</label>
                        <input type="text" id="server-name-input" placeholder="My Awesome Server" required>
                    </div>
                    <div class="form-group">
                        <label for="server-description-input">Description (optional)</label>
                        <textarea id="server-description-input" placeholder="What's this server about?"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="ChatApp.closeModal('create-server-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Create Server</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Create Channel Modal -->
    <div class="modal-overlay" id="create-channel-modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create a Channel</h3>
                <button class="modal-close" onclick="ChatApp.closeModal('create-channel-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="create-channel-form">
                    <div class="form-group">
                        <label>Channel Type</label>
                        <div class="channel-type-selector">
                            <label class="channel-type-option selected">
                                <input type="radio" name="channel-type" value="TEXT" checked>
                                <i class="bi bi-hash"></i> Text Channel
                            </label>
                            <label class="channel-type-option">
                                <input type="radio" name="channel-type" value="VOICE">
                                <i class="bi bi-volume-up-fill"></i> Voice Channel
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="channel-name-input">Channel Name</label>
                        <input type="text" id="channel-name-input" placeholder="new-channel" required>
                    </div>
                    <div class="form-group">
                        <label for="channel-topic-input">Topic (optional)</label>
                        <input type="text" id="channel-topic-input" placeholder="Let everyone know what this channel is about">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="ChatApp.closeModal('create-channel-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">Create Channel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- WebSocket & Chat Logic -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js"></script>
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
