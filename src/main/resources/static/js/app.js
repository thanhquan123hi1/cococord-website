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
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
            localStorage.clear();
            window.location.href = '/login';
        });
    } else {
        localStorage.clear();
        window.location.href = '/login';
    }
}

// Refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
        localStorage.clear();
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
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.accessToken;
        } else {
            localStorage.clear();
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        localStorage.clear();
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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    
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
    loadUserInfo
};
