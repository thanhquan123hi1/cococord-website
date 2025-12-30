// Authentication utilities

// ============================================================
// Tab-scoped auth storage
//
// Problem: localStorage is shared across tabs, so logging in on
// a new tab overwrites tokens for all other tabs.
//
// Fix: store auth/session-specific keys in sessionStorage.
// For backward compatibility, we also bridge localStorage access
// for those keys to sessionStorage (per-tab).
// ============================================================

(function installTabScopedStorageBridge() {
    const TAB_SCOPED_KEYS = new Set([
        'accessToken',
        'refreshToken',
        'token', // legacy key used by some pages
        'userId',
        'username',
        'email',
        'displayName',
        'avatarUrl',
        'user',
        'activeDmGroupId'
    ]);

    const legacyKeyMap = {
        token: 'accessToken'
    };

    const ls = window.localStorage;
    const ss = window.sessionStorage;
    const original = {
        getItem: ls.getItem.bind(ls),
        setItem: ls.setItem.bind(ls),
        removeItem: ls.removeItem.bind(ls),
        clear: ls.clear.bind(ls)
    };

    // One-time migration: move legacy localStorage values into sessionStorage.
    for (const key of TAB_SCOPED_KEYS) {
        const targetKey = legacyKeyMap[key] || key;
        if (ss.getItem(targetKey) == null) {
            const legacyValue = original.getItem(key);
            if (legacyValue != null) {
                ss.setItem(targetKey, legacyValue);
                original.removeItem(key);
            }
        }
    }

    // Bridge localStorage access for tab-scoped keys to sessionStorage.
    ls.getItem = (key) => {
        if (TAB_SCOPED_KEYS.has(key)) {
            return ss.getItem(legacyKeyMap[key] || key);
        }
        return original.getItem(key);
    };

    ls.setItem = (key, value) => {
        if (TAB_SCOPED_KEYS.has(key)) {
            ss.setItem(legacyKeyMap[key] || key, String(value));
            return;
        }
        original.setItem(key, value);
    };

    ls.removeItem = (key) => {
        if (TAB_SCOPED_KEYS.has(key)) {
            ss.removeItem(legacyKeyMap[key] || key);
            return;
        }
        original.removeItem(key);
    };

    // Avoid cross-tab collateral damage from code calling localStorage.clear().
    ls.clear = () => {
        for (const key of TAB_SCOPED_KEYS) {
            ss.removeItem(legacyKeyMap[key] || key);
        }
    };
})();

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
    const token = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    return token && refreshToken;
}

// Get access token
function getAccessToken() {
    return sessionStorage.getItem('accessToken');
}

// Get refresh token
function getRefreshToken() {
    return sessionStorage.getItem('refreshToken');
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
            sessionStorage.setItem('accessToken', data.accessToken);
            return true;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
    }

    return false;
}

// Logout
async function logout() {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Clear per-tab auth/session storage
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('displayName');
    sessionStorage.removeItem('avatarUrl');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('activeDmGroupId');

    // Clear legacy keys if any remain
    try {
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('refreshToken');
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('activeDmGroupId');
    } catch (e) {
        // ignore
    }
    
    // Clear legacy cookie (no longer used for auth)
    clearCookie('accessToken');

    // Redirect to login
    window.location.href = '/login';
}

// Show alert
function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
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
        const displayName = sessionStorage.getItem('displayName') || sessionStorage.getItem('username');
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
