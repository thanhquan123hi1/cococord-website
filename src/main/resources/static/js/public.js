/**
 * Public Pages JavaScript
 * Hỗ trợ cho Landing Page, Login, Register, Forgot Password, Reset Password
 */

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
        const accessToken = localStorage.getItem('accessToken');
        
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
                    // Token is invalid, clear storage and cookie
                    localStorage.clear();
                    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
    const refreshToken = localStorage.getItem('refreshToken');
    
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
            localStorage.setItem('accessToken', data.accessToken);
            // Cập nhật cookie cho server-side rendering
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `accessToken=${encodeURIComponent(data.accessToken)}; expires=${expires}; path=/; SameSite=Lax`;
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data.accessToken;
        } else {
            // Refresh failed, clear storage and redirect to login
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
