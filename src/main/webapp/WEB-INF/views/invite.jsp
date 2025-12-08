<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Invite - CoCoCord</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
    <style>
        body { 
            background: linear-gradient(135deg, #5865f2 0%, #3ba55d 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .invite-card {
            background-color: #313338;
            border-radius: 8px;
            padding: 32px;
            width: 100%;
            max-width: 440px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .server-icon {
            width: 80px;
            height: 80px;
            border-radius: 24px;
            background-color: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
            font-weight: 600;
            color: white;
        }
        .btn-join {
            width: 100%;
            padding: 14px;
            background-color: #5865f2;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.15s;
        }
        .btn-join:hover {
            background-color: #4752c4;
        }
        .btn-join:disabled {
            background-color: #4e5058;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="invite-card" id="invite-content">
        <div id="loading" class="py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
            <p class="text-gray-400 mt-4">Loading invite...</p>
        </div>
        
        <div id="invite-info" style="display: none;">
            <p class="text-gray-400 mb-4">You've been invited to join a server</p>
            <div class="server-icon" id="server-icon">?</div>
            <h2 class="text-xl font-bold text-white mb-2" id="server-name">Server Name</h2>
            <p class="text-gray-400 mb-2" id="server-description"></p>
            <div class="flex justify-center gap-6 mb-6">
                <div class="text-center">
                    <p class="text-white font-semibold" id="member-count">0</p>
                    <p class="text-gray-500 text-sm">Members</p>
                </div>
                <div class="text-center">
                    <p class="text-green-500 font-semibold" id="online-count">0</p>
                    <p class="text-gray-500 text-sm">Online</p>
                </div>
            </div>
            <button class="btn-join" id="join-btn" onclick="joinServer()">
                Accept Invite
            </button>
            <p class="text-gray-500 text-xs mt-4" id="invite-expiry"></p>
        </div>
        
        <div id="invite-error" style="display: none;">
            <i class="fas fa-times-circle text-6xl text-red-500 mb-4"></i>
            <h2 class="text-xl font-bold text-white mb-2">Invalid Invite</h2>
            <p class="text-gray-400 mb-6" id="error-message">This invite link is invalid or has expired.</p>
            <a href="/home" class="btn-join inline-block">Go to Home</a>
        </div>
        
        <div id="invite-success" style="display: none;">
            <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
            <h2 class="text-xl font-bold text-white mb-2">Welcome!</h2>
            <p class="text-gray-400 mb-6">You've successfully joined the server.</p>
            <a href="/home" class="btn-join inline-block">Go to CoCoCord</a>
        </div>
    </div>

    <script>
        var token = localStorage.getItem('token');
        var inviteCode = window.location.pathname.split('/').pop();
        
        function loadInvite() {
            $.ajax({
                url: '/api/invite/' + inviteCode,
                method: 'GET',
                success: function(data) {
                    $('#loading').hide();
                    $('#invite-info').show();
                    
                    $('#server-name').text(data.serverName);
                    $('#server-description').text(data.serverDescription || '');
                    $('#server-icon').text(data.serverName.charAt(0).toUpperCase());
                    $('#member-count').text(data.memberCount || 0);
                    $('#online-count').text(data.onlineCount || 0);
                    
                    if (data.expiresAt) {
                        var expiry = new Date(data.expiresAt);
                        $('#invite-expiry').text('Expires: ' + expiry.toLocaleString());
                    }
                    
                    if (!token) {
                        $('#join-btn').text('Login to Join');
                    }
                },
                error: function(xhr) {
                    $('#loading').hide();
                    $('#invite-error').show();
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        $('#error-message').text(xhr.responseJSON.message);
                    }
                }
            });
        }
        
        function joinServer() {
            if (!token) {
                // Save invite code and redirect to login
                localStorage.setItem('pendingInvite', inviteCode);
                window.location.href = '/login';
                return;
            }
            
            $('#join-btn').prop('disabled', true).text('Joining...');
            
            $.ajax({
                url: '/api/invite/' + inviteCode + '/join',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(data) {
                    $('#invite-info').hide();
                    $('#invite-success').show();
                },
                error: function(xhr) {
                    $('#join-btn').prop('disabled', false).text('Accept Invite');
                    if (xhr.status === 409) {
                        alert('You are already a member of this server');
                        window.location.href = '/home';
                    } else {
                        alert('Failed to join server: ' + (xhr.responseJSON ? xhr.responseJSON.message : xhr.responseText));
                    }
                }
            });
        }
        
        // Check for pending invite after login
        $(document).ready(function() {
            loadInvite();
        });
    </script>
</body>
</html>
