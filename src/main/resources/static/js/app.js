/**
 * Main App JavaScript
 * Hỗ trợ cho các trang authenticated (Dashboard, Chat, Friends, etc.)
 */

// Check authentication on app pages
(function checkAuth() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        // No token found, redirect to login
        window.location.href = '/login';
        return;
    }
    
    // Verify token is still valid (backend provides /api/auth/me)
    fetch('/api/auth/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token is invalid, try to refresh
            refreshAccessToken();
        }
    })
    .catch(error => {
        console.error('Auth verification error:', error);
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    });
})();

// Logout function
function logout() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
        // Call logout API
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(() => {
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
        });
    } else {
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
    }
}

// Refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return null;
    }
    
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            // Cập nhật cookie cho server-side rendering
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `accessToken=${encodeURIComponent(data.accessToken)}; expires=${expires}; path=/; SameSite=Lax`;
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.accessToken;
        } else {
            localStorage.clear();
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        localStorage.clear();
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return null;
    }
}

// API request helper with auto token refresh
async function apiRequest(url, options = {}) {
    let accessToken = localStorage.getItem('accessToken');
    
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };
    
    let response = await fetch(url, options);
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, options);
        }
    }
    
    return response;
}

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update user display name
    const displayNameElements = document.querySelectorAll('#user-display-name, #current-username, .user-name');
    displayNameElements.forEach(element => {
        if (user.displayName || user.username) {
            element.textContent = user.displayName || user.username;
        }
    });
    
    // Update user avatar
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(element => {
        if (user.avatarUrl) {
            element.innerHTML = `<img src="${user.avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }
    });
}

// ==================== GLOBAL SERVER SIDEBAR LOGIC ====================

// Load servers for global sidebar
async function loadGlobalServers() {
    const serverList = document.getElementById('globalServerList');
    if (!serverList) return;
    
    try {
        const response = await apiRequest('/api/servers');
        if (!response.ok) throw new Error('Failed to load servers');
        
        const servers = await response.json();
        serverList.innerHTML = '';
        
        servers.forEach(server => {
            const serverItem = document.createElement('div');
            serverItem.className = 'server-item';
            serverItem.setAttribute('data-server-id', server.id);
            serverItem.setAttribute('title', server.name);
            
            if (server.iconUrl) {
                serverItem.innerHTML = `<img src="${server.iconUrl}" alt="${server.name}">`;
            } else {
                const initial = server.name.charAt(0).toUpperCase();
                serverItem.innerHTML = `<span class="server-initial">${initial}</span>`;
            }
            
            serverItem.addEventListener('click', () => {
                // Navigate to server's chat page
                window.location.href = `/chat?serverId=${server.id}`;
            });
            
            serverList.appendChild(serverItem);
        });
        
        // Highlight current server if on chat page
        const urlParams = new URLSearchParams(window.location.search);
        const currentServerId = urlParams.get('serverId');
        if (currentServerId) {
            const activeItem = serverList.querySelector(`[data-server-id="${currentServerId}"]`);
            if (activeItem) activeItem.classList.add('active');
        }
        
        // Highlight home button on friends page
        if (window.location.pathname.includes('/friends')) {
            const homeBtn = document.querySelector('.server-sidebar .home-btn');
            if (homeBtn) homeBtn.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

// Global modal handling
function openGlobalModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeGlobalModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Create Server functionality
async function handleCreateServer(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('globalServerNameInput');
    const serverName = nameInput ? nameInput.value.trim() : '';
    
    if (!serverName) {
        alert('Vui lòng nhập tên server');
        return;
    }
    
    try {
        const response = await apiRequest('/api/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: serverName })
        });
        
        if (!response.ok) throw new Error('Failed to create server');
        
        const newServer = await response.json();
        closeGlobalModal('globalCreateServerModal');
        if (nameInput) nameInput.value = '';
        
        // Refresh server list and navigate to new server
        await loadGlobalServers();
        window.location.href = `/chat?serverId=${newServer.id}`;
    } catch (error) {
        console.error('Error creating server:', error);
        alert('Lỗi khi tạo server: ' + error.message);
    }
}

// Join Server functionality
async function handleJoinServer(e) {
    if (e) e.preventDefault();
    const codeInput = document.getElementById('globalInviteCodeInput');
    const inviteCode = codeInput ? codeInput.value.trim() : '';
    
    if (!inviteCode) {
        alert('Vui lòng nhập mã mời');
        return;
    }
    
    // Extract code if full URL is pasted
    let code = inviteCode;
    if (inviteCode.includes('/')) {
        code = inviteCode.split('/').pop();
    }
    
    try {
        const response = await apiRequest(`/api/servers/join/${code}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Mã mời không hợp lệ');
        }
        
        const server = await response.json();
        closeGlobalModal('globalJoinServerModal');
        if (codeInput) codeInput.value = '';
        
        // Refresh and navigate
        await loadGlobalServers();
        window.location.href = `/chat?serverId=${server.id}`;
    } catch (error) {
        console.error('Error joining server:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Initialize global sidebar events
function initGlobalSidebar() {
    // Add Server button
    const addServerBtn = document.getElementById('globalAddServerBtn');
    if (addServerBtn) {
        addServerBtn.addEventListener('click', () => openGlobalModal('globalCreateServerModal'));
    }
    
    // Discover button
    const discoverBtn = document.getElementById('globalDiscoverBtn');
    if (discoverBtn) {
        discoverBtn.addEventListener('click', () => openGlobalModal('globalJoinServerModal'));
    }
    
    // Create Server Modal - Close buttons
    const closeCreateBtn = document.getElementById('closeGlobalCreateServerModal');
    if (closeCreateBtn) {
        closeCreateBtn.addEventListener('click', () => closeGlobalModal('globalCreateServerModal'));
    }
    
    const cancelCreateBtn = document.getElementById('cancelGlobalCreateServer');
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => closeGlobalModal('globalCreateServerModal'));
    }
    
    // Create Server Modal - Confirm button
    const confirmCreateBtn = document.getElementById('confirmGlobalCreateServer');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', handleCreateServer);
    }
    
    // Join Server Modal - Close buttons
    const closeJoinBtn = document.getElementById('closeGlobalJoinServerModal');
    if (closeJoinBtn) {
        closeJoinBtn.addEventListener('click', () => closeGlobalModal('globalJoinServerModal'));
    }
    
    const cancelJoinBtn = document.getElementById('cancelGlobalJoinServer');
    if (cancelJoinBtn) {
        cancelJoinBtn.addEventListener('click', () => closeGlobalModal('globalJoinServerModal'));
    }
    
    // Join Server Modal - Confirm button
    const confirmJoinBtn = document.getElementById('confirmGlobalJoinServer');
    if (confirmJoinBtn) {
        confirmJoinBtn.addEventListener('click', handleJoinServer);
    }
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Load servers
    loadGlobalServers();
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    initGlobalSidebar();
    
    // Auto-refresh token before it expires (every 45 minutes)
    setInterval(() => {
        refreshAccessToken();
    }, 45 * 60 * 1000);
});

// Export functions
window.CoCoCordApp = {
    logout,
    apiRequest,
    refreshAccessToken,
    loadUserInfo,
    loadGlobalServers,
    openGlobalModal,
    closeGlobalModal
};
