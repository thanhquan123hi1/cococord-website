<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="_csrf" content="${_csrf.token}"/>
    <meta name="_csrf_header" content="${_csrf.headerName}"/>
    <title>Settings - CoCoCord</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <style>
        * { box-sizing: border-box; }
        body { 
            background-color: #313338; 
            color: #dbdee1; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
        }
        .discord-bg-primary { background-color: #313338; }
        .discord-bg-secondary { background-color: #2b2d31; }
        .discord-bg-tertiary { background-color: #1e1f22; }
        .discord-text-primary { color: #f2f3f5; }
        .discord-text-secondary { color: #b5bac1; }
        .discord-text-muted { color: #949ba4; }
        .discord-brand { color: #5865f2; }
        .discord-brand-bg { background-color: #5865f2; }
        .discord-danger { color: #ed4245; }
        .discord-danger-bg { background-color: #ed4245; }
        .discord-success { color: #3ba55d; }
        
        .settings-container {
            display: flex;
            height: 100vh;
        }
        
        .settings-sidebar {
            width: 220px;
            background-color: #2b2d31;
            padding: 60px 6px 20px 20px;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        .settings-content {
            flex: 1;
            padding: 60px 40px 20px 40px;
            overflow-y: auto;
            max-width: 740px;
        }
        
        .settings-close {
            position: fixed;
            right: 40px;
            top: 60px;
            z-index: 100;
        }
        
        .nav-category {
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 600;
            color: #949ba4;
            padding: 6px 10px;
            margin-top: 16px;
        }
        
        .nav-item {
            padding: 8px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.15s;
            margin: 2px 0;
            color: #b5bac1;
        }
        
        .nav-item:hover {
            background-color: #35373c;
            color: #dbdee1;
        }
        
        .nav-item.active {
            background-color: #404249;
            color: #fff;
        }
        
        .nav-item.danger {
            color: #ed4245;
        }
        
        .nav-item.danger:hover {
            background-color: rgba(237, 66, 69, 0.1);
            color: #ed4245;
        }
        
        .divider {
            height: 1px;
            background-color: #3f4147;
            margin: 8px 10px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #f2f3f5;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #b5bac1;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .form-input {
            width: 100%;
            background-color: #1e1f22;
            border: none;
            border-radius: 4px;
            padding: 10px 12px;
            color: #dbdee1;
            font-size: 16px;
        }
        
        .form-input:focus {
            outline: none;
        }
        
        .form-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-discord {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: background-color 0.15s, opacity 0.15s;
        }
        
        .btn-discord:hover {
            opacity: 0.9;
        }
        
        .btn-primary {
            background-color: #5865f2;
            color: white;
        }
        
        .btn-danger {
            background-color: #ed4245;
            color: white;
        }
        
        .btn-secondary {
            background-color: #4e5058;
            color: white;
        }
        
        .btn-link {
            background: none;
            color: #00a8fc;
            padding: 0;
        }
        
        .btn-link:hover {
            text-decoration: underline;
        }
        
        .card {
            background-color: #2b2d31;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .avatar-large {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 600;
            position: relative;
        }
        
        .avatar-edit {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 4px solid #2b2d31;
        }
        
        .toggle {
            position: relative;
            width: 40px;
            height: 24px;
            background-color: #72767d;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .toggle.active {
            background-color: #3ba55d;
        }
        
        .toggle-handle {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 18px;
            height: 18px;
            background-color: white;
            border-radius: 50%;
            transition: left 0.2s;
        }
        
        .toggle.active .toggle-handle {
            left: 19px;
        }
        
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #3f4147;
        }
        
        .setting-row:last-child {
            border-bottom: none;
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .close-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 2px solid #72767d;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #72767d;
            transition: border-color 0.15s, color 0.15s;
        }
        
        .close-btn:hover {
            border-color: #dbdee1;
            color: #dbdee1;
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: #1a1b1e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background-color: #2e2f34; }
    </style>
</head>
<body>
    <div class="settings-container">
        <!-- Sidebar -->
        <div class="settings-sidebar">
            <div class="nav-category">User Settings</div>
            <div class="nav-item active" onclick="showTab('my-account')">My Account</div>
            <div class="nav-item" onclick="showTab('profile')">Profile</div>
            <div class="nav-item" onclick="showTab('privacy')">Privacy & Safety</div>
            
            <div class="divider"></div>
            
            <div class="nav-category">App Settings</div>
            <div class="nav-item" onclick="showTab('appearance')">Appearance</div>
            <div class="nav-item" onclick="showTab('accessibility')">Accessibility</div>
            <div class="nav-item" onclick="showTab('notifications')">Notifications</div>
            <div class="nav-item" onclick="showTab('keybinds')">Keybinds</div>
            <div class="nav-item" onclick="showTab('language')">Language</div>
            
            <div class="divider"></div>
            
            <div class="nav-item danger" onclick="logout()">
                <i class="fas fa-sign-out-alt mr-2"></i> Log Out
            </div>
        </div>
        
        <!-- Content -->
        <div class="settings-content">
            <!-- My Account Tab -->
            <div id="tab-my-account" class="tab-content active">
                <h2 class="section-title">My Account</h2>
                
                <div class="card">
                    <div class="flex items-start gap-4">
                        <div class="avatar-large" id="user-avatar">
                            <span id="avatar-initial">?</span>
                            <div class="avatar-edit" onclick="changeAvatar()">
                                <i class="fas fa-camera text-white text-xs"></i>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="text-lg font-semibold discord-text-primary" id="display-username">Username</h3>
                                    <p class="discord-text-muted" id="display-email">email@example.com</p>
                                </div>
                                <button class="btn-discord btn-primary" onclick="showEditProfile()">Edit User Profile</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Username</p>
                            <p class="discord-text-muted text-sm" id="account-username">username</p>
                        </div>
                        <button class="btn-discord btn-secondary" onclick="showEditUsername()">Edit</button>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Email</p>
                            <p class="discord-text-muted text-sm" id="account-email">e***l@example.com</p>
                        </div>
                        <button class="btn-discord btn-secondary" onclick="showEditEmail()">Edit</button>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Phone Number</p>
                            <p class="discord-text-muted text-sm">Not added</p>
                        </div>
                        <button class="btn-discord btn-secondary" onclick="showAddPhone()">Add</button>
                    </div>
                </div>
                
                <h3 class="text-lg font-semibold discord-text-primary mt-8 mb-4">Password and Authentication</h3>
                
                <div class="card">
                    <button class="btn-discord btn-primary mb-4" onclick="showChangePassword()">Change Password</button>
                    
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Two-Factor Authentication</p>
                            <p class="discord-text-muted text-sm">Protect your account with an extra layer of security</p>
                        </div>
                        <button class="btn-discord btn-secondary" onclick="setup2FA()">Enable</button>
                    </div>
                </div>
                
                <h3 class="text-lg font-semibold discord-danger mt-8 mb-4">Account Removal</h3>
                
                <div class="card">
                    <p class="discord-text-muted text-sm mb-4">
                        Disabling your account means you can recover it any time after taking this action.
                    </p>
                    <div class="flex gap-3">
                        <button class="btn-discord btn-danger" onclick="disableAccount()">Disable Account</button>
                        <button class="btn-discord btn-danger" onclick="deleteAccount()">Delete Account</button>
                    </div>
                </div>
            </div>
            
            <!-- Profile Tab -->
            <div id="tab-profile" class="tab-content">
                <h2 class="section-title">Profile</h2>
                
                <div class="form-group">
                    <label class="form-label">Display Name</label>
                    <input type="text" id="profile-display-name" class="form-input" placeholder="Display name">
                </div>
                
                <div class="form-group">
                    <label class="form-label">About Me</label>
                    <textarea id="profile-about" class="form-input" rows="4" placeholder="Tell us about yourself"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Banner Color</label>
                    <div class="flex items-center gap-4">
                        <input type="color" id="profile-banner-color" value="#5865f2" class="w-12 h-12 rounded cursor-pointer">
                        <span class="discord-text-muted">Choose your profile banner color</span>
                    </div>
                </div>
                
                <button class="btn-discord btn-primary" onclick="saveProfile()">Save Changes</button>
            </div>
            
            <!-- Privacy Tab -->
            <div id="tab-privacy" class="tab-content">
                <h2 class="section-title">Privacy & Safety</h2>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Allow DMs from server members</p>
                            <p class="discord-text-muted text-sm">Allow people from your servers to send you DMs</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Allow friend requests from everyone</p>
                            <p class="discord-text-muted text-sm">Anyone can send you a friend request</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Show online status</p>
                            <p class="discord-text-muted text-sm">Let others see when you're online</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-lg font-semibold discord-text-primary mt-8 mb-4">Blocked Users</h3>
                
                <div class="card">
                    <p class="discord-text-muted text-sm">You have no blocked users</p>
                </div>
            </div>
            
            <!-- Appearance Tab -->
            <div id="tab-appearance" class="tab-content">
                <h2 class="section-title">Appearance</h2>
                
                <h3 class="text-base font-semibold discord-text-secondary mb-4">Theme</h3>
                
                <div class="card">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 rounded-lg bg-gray-800 border-2 border-blue-500 cursor-pointer text-center">
                            <i class="fas fa-moon text-2xl mb-2 discord-brand"></i>
                            <p class="discord-text-primary font-medium">Dark</p>
                        </div>
                        <div class="p-4 rounded-lg bg-gray-700 border-2 border-transparent cursor-pointer text-center hover:border-gray-500">
                            <i class="fas fa-sun text-2xl mb-2 discord-text-muted"></i>
                            <p class="discord-text-muted font-medium">Light</p>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-base font-semibold discord-text-secondary mt-6 mb-4">Message Display</h3>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Compact Mode</p>
                            <p class="discord-text-muted text-sm">Reduce the space between messages</p>
                        </div>
                        <div class="toggle" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Accessibility Tab -->
            <div id="tab-accessibility" class="tab-content">
                <h2 class="section-title">Accessibility</h2>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Reduce Motion</p>
                            <p class="discord-text-muted text-sm">Reduce animations throughout the app</p>
                        </div>
                        <div class="toggle" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Enable High Contrast</p>
                            <p class="discord-text-muted text-sm">Increase contrast for better visibility</p>
                        </div>
                        <div class="toggle" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-base font-semibold discord-text-secondary mt-6 mb-4">Text Size</h3>
                
                <div class="card">
                    <div class="form-group">
                        <label class="form-label">Chat Font Scaling</label>
                        <input type="range" min="12" max="24" value="16" class="w-full">
                        <p class="discord-text-muted text-sm mt-2">16px</p>
                    </div>
                </div>
            </div>
            
            <!-- Notifications Tab -->
            <div id="tab-notifications" class="tab-content">
                <h2 class="section-title">Notifications</h2>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Enable Desktop Notifications</p>
                            <p class="discord-text-muted text-sm">Get notifications when you're not focused on CoCoCord</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Enable Notification Sounds</p>
                            <p class="discord-text-muted text-sm">Play a sound when you receive a notification</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Enable Message Notifications</p>
                            <p class="discord-text-muted text-sm">Show notifications for new messages</p>
                        </div>
                        <div class="toggle active" onclick="toggleSetting(this)">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Keybinds Tab -->
            <div id="tab-keybinds" class="tab-content">
                <h2 class="section-title">Keybinds</h2>
                
                <div class="card">
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Toggle Mute</p>
                            <p class="discord-text-muted text-sm">Quickly mute/unmute yourself</p>
                        </div>
                        <span class="px-3 py-1 rounded bg-gray-700 discord-text-muted text-sm">Ctrl + Shift + M</span>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Toggle Deafen</p>
                            <p class="discord-text-muted text-sm">Quickly deafen/undeafen yourself</p>
                        </div>
                        <span class="px-3 py-1 rounded bg-gray-700 discord-text-muted text-sm">Ctrl + Shift + D</span>
                    </div>
                    <div class="setting-row">
                        <div>
                            <p class="discord-text-primary font-medium">Search</p>
                            <p class="discord-text-muted text-sm">Open quick search</p>
                        </div>
                        <span class="px-3 py-1 rounded bg-gray-700 discord-text-muted text-sm">Ctrl + K</span>
                    </div>
                </div>
            </div>
            
            <!-- Language Tab -->
            <div id="tab-language" class="tab-content">
                <h2 class="section-title">Language</h2>
                
                <div class="form-group">
                    <label class="form-label">Select Language</label>
                    <select class="form-input">
                        <option value="en">English</option>
                        <option value="vi">Tiếng Việt</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="zh">中文</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Close Button -->
        <div class="settings-close">
            <div class="close-btn" onclick="closeSettings()">
                <i class="fas fa-times text-lg"></i>
            </div>
            <p class="discord-text-muted text-xs mt-2 text-center">ESC</p>
        </div>
    </div>
    
    <!-- Change Password Modal -->
    <div id="password-modal" class="fixed inset-0 bg-black bg-opacity-80 hidden items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h3 class="text-xl font-semibold discord-text-primary mb-4">Change Password</h3>
            <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" id="current-password" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" id="new-password" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" id="confirm-password" class="form-input">
            </div>
            <div class="flex justify-end gap-3">
                <button class="btn-discord btn-secondary" onclick="closePasswordModal()">Cancel</button>
                <button class="btn-discord btn-primary" onclick="changePassword()">Change Password</button>
            </div>
        </div>
    </div>

    <script>
        var token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/login';
        }
        
        // Tab navigation
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(function(tab) {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-item').forEach(function(item) {
                item.classList.remove('active');
            });
            
            document.getElementById('tab-' + tabName).classList.add('active');
            event.currentTarget.classList.add('active');
        }
        
        // Toggle settings
        function toggleSetting(element) {
            element.classList.toggle('active');
        }
        
        // Load user profile
        function loadProfile() {
            $.ajax({
                url: '/api/users/profile',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    $('#display-username').text(data.username);
                    $('#display-email').text(data.email);
                    $('#account-username').text(data.username);
                    $('#account-email').text(maskEmail(data.email));
                    $('#avatar-initial').text(data.username.charAt(0).toUpperCase());
                    $('#profile-display-name').val(data.displayName || data.username);
                    
                    if (data.avatarUrl) {
                        $('#user-avatar').css('background-image', 'url(' + data.avatarUrl + ')');
                        $('#user-avatar').css('background-size', 'cover');
                        $('#avatar-initial').hide();
                    }
                },
                error: function(xhr) {
                    if (xhr.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }
                }
            });
        }
        
        function maskEmail(email) {
            var parts = email.split('@');
            var name = parts[0];
            var domain = parts[1];
            if (name.length <= 2) {
                return name + '@' + domain;
            }
            return name.charAt(0) + '***' + name.charAt(name.length - 1) + '@' + domain;
        }
        
        // Save profile
        function saveProfile() {
            var data = {
                displayName: $('#profile-display-name').val(),
                about: $('#profile-about').val()
            };
            
            $.ajax({
                url: '/api/users/profile',
                method: 'PUT',
                headers: { 
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                success: function() {
                    alert('Profile saved successfully!');
                    loadProfile();
                },
                error: function(xhr) {
                    alert('Failed to save profile: ' + xhr.responseText);
                }
            });
        }
        
        // Password modal
        function showChangePassword() {
            $('#password-modal').css('display', 'flex');
        }
        
        function closePasswordModal() {
            $('#password-modal').hide();
            $('#current-password').val('');
            $('#new-password').val('');
            $('#confirm-password').val('');
        }
        
        function changePassword() {
            var currentPassword = $('#current-password').val();
            var newPassword = $('#new-password').val();
            var confirmPassword = $('#confirm-password').val();
            
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            $.ajax({
                url: '/api/users/password',
                method: 'POST',
                headers: { 
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                }),
                success: function() {
                    alert('Password changed successfully!');
                    closePasswordModal();
                },
                error: function(xhr) {
                    alert('Failed to change password: ' + xhr.responseText);
                }
            });
        }
        
        function changeAvatar() {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (file) {
                    var formData = new FormData();
                    formData.append('file', file);
                    
                    $.ajax({
                        url: '/api/files/upload?type=avatar',
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function(data) {
                            // Update avatar URL in profile
                            $.ajax({
                                url: '/api/users/profile',
                                method: 'PUT',
                                headers: { 
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify({ avatarUrl: data.url }),
                                success: function() {
                                    loadProfile();
                                }
                            });
                        },
                        error: function(xhr) {
                            alert('Failed to upload avatar: ' + xhr.responseText);
                        }
                    });
                }
            };
            input.click();
        }
        
        function showEditProfile() {
            showTab('profile');
            document.querySelector('.nav-item:nth-child(2)').click();
        }
        
        function showEditUsername() {
            alert('Username change is not available');
        }
        
        function showEditEmail() {
            alert('Email change is not available');
        }
        
        function showAddPhone() {
            alert('Phone number feature coming soon');
        }
        
        function setup2FA() {
            alert('Two-factor authentication coming soon');
        }
        
        function disableAccount() {
            if (confirm('Are you sure you want to disable your account?')) {
                alert('Account disabled. You can reactivate it by logging in again.');
            }
        }
        
        function deleteAccount() {
            if (confirm('Are you sure you want to DELETE your account? This action cannot be undone!')) {
                alert('Account deletion is not implemented');
            }
        }
        
        function closeSettings() {
            window.location.href = '/home';
        }
        
        function logout() {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // ESC key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeSettings();
            }
        });
        
        // Initialize
        $(document).ready(function() {
            loadProfile();
        });
    </script>
</body>
</html>
