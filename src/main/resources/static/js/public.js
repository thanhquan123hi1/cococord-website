/**
 * Public Pages JavaScript
 * Hỗ trợ cho Landing Page, Login, Register, Forgot Password, Reset Password
 */

// ============================================================
// Tab-scoped auth storage bridge (public pages)
// Ensures accessToken/refreshToken are not shared across tabs.
// ============================================================
(function installTabScopedStorageBridge() {
    const TAB_SCOPED_KEYS = new Set([
        'accessToken',
        'refreshToken',
        'token',
        'user',
        'userId',
        'username',
        'email',
        'displayName',
        'avatarUrl',
        'activeDmGroupId'
    ]);

    const legacyKeyMap = { token: 'accessToken' };

    const ls = window.localStorage;
    const ss = window.sessionStorage;
    const original = {
        getItem: ls.getItem.bind(ls),
        setItem: ls.setItem.bind(ls),
        removeItem: ls.removeItem.bind(ls),
        clear: ls.clear.bind(ls)
    };

    // Migrate legacy tokens/user data to sessionStorage (per-tab) and remove from localStorage.
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

    // Avoid clearing shared localStorage across tabs.
    ls.clear = () => {
        for (const key of TAB_SCOPED_KEYS) {
            ss.removeItem(legacyKeyMap[key] || key);
        }
    };
})();

// Utility function to show alerts
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.warn('Alert container not found');
        return;
    }
    
    const alertId = 'alert-' + Date.now();
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 5000);
}

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// Form validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,50}$/;
    return re.test(username);
}

function validatePassword(password) {
    return password.length >= 8;
}

// Check if user is already logged in on public pages
(function checkAuth() {
    const currentPath = window.location.pathname;
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    
    if (publicPaths.includes(currentPath)) {
        const accessToken = sessionStorage.getItem('accessToken');
        
        // If token exists on public pages, verify it and clear storage if invalid.
        // Do NOT auto-redirect away from login/register (allows switching accounts).
        if (accessToken && currentPath !== '/') {
            // Verify token is still valid (backend provides /api/auth/me)
            fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    // Token is invalid, clear per-tab storage
                    sessionStorage.removeItem('accessToken');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('user');
                }
            })
            .catch(error => {
                console.error('Auth verification error:', error);
            });
        }
    }
})();

// Handle token expiry and auto-refresh
async function refreshAccessToken() {
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    if (!refreshToken) {
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
            sessionStorage.setItem('accessToken', data.accessToken);
            if (data.refreshToken) {
                sessionStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.accessToken;
        } else {
            // Refresh failed, clear per-tab storage and redirect to login
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return null;
    }
}

// API request helper with auto token refresh
async function apiRequest(url, options = {}) {
    let accessToken = sessionStorage.getItem('accessToken');
    
    if (accessToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        };
    }
    
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

// Export functions for use in other scripts
window.CoCoCordUtils = {
    showAlert,
    validateEmail,
    validateUsername,
    validatePassword,
    apiRequest,
    refreshAccessToken
};
