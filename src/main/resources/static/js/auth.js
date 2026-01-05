// Authentication utilities

// Cookie utilities for server-side rendering support
function setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}

function clearCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return token && refreshToken;
}

// Get access token
function getAccessToken() {
    return localStorage.getItem('accessToken');
}

// Get refresh token
function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

// Fetch with authentication
async function fetchWithAuth(url, options = {}) {
    const token = getAccessToken();
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry the request with new token
            headers.Authorization = `Bearer ${getAccessToken()}`;
            return fetch(url, { ...options, headers });
        } else {
            // Refresh failed, redirect to login
            logout();
            return response;
        }
    }

    return response;
}

// Refresh access token
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }
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
        setCookie('accessToken', data.accessToken, 7);
        return true;
    }
    return false;
}

// Logout
async function logout() {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('displayName');
    localStorage.removeItem('avatarUrl');
    
    clearCookie('accessToken');

    window.location.href = '/login';
}



// Update navigation based on login status
function updateNavigation() {
    const isAuthenticated = isLoggedIn();
    
    // Toggle navigation items
    document.getElementById('nav-login')?.classList.toggle('d-none', isAuthenticated);
    document.getElementById('nav-register')?.classList.toggle('d-none', isAuthenticated);
    document.getElementById('nav-home')?.classList.toggle('d-none', !isAuthenticated);
    document.getElementById('nav-profile')?.classList.toggle('d-none', !isAuthenticated);
    document.getElementById('nav-user')?.classList.toggle('d-none', !isAuthenticated);

    // Set user display name
    if (isAuthenticated) {
        const displayName = localStorage.getItem('displayName') || localStorage.getItem('username');
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName) {
            userDisplayName.textContent = displayName;
        }
    }
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (days > 0) {
        return days + ' ngày trước';
    } else if (hours > 0) {
        return hours + ' giờ trước';
    } else if (minutes > 0) {
        return minutes + ' phút trước';
    } else {
        return 'Vừa xong';
    }
}

// Format datetime helper
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();

    // Auto refresh token before expiry
    if (isLoggedIn()) {
        // Refresh token every 50 minutes (tokens expire in 1 hour)
        setInterval(refreshAccessToken, 50 * 60 * 1000);
    }
});

// Expose logout to window for admin panel and other modules
window.logout = logout;
