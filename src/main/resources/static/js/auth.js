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

    /* ==================== TOAST NOTIFICATION SYSTEM ==================== */
    /* Discord-style dark theme toast notifications */
    
    .toast-container {
        position: fixed;
        z-index: 99999;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 420px;
        width: calc(100% - 32px);
    }
    
    /* Position variants */
    .toast-container.top-right {
        top: 16px;
        right: 16px;
    }
    
    .toast-container.top-center {
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast-container.top-left {
        top: 16px;
        left: 16px;
    }
    
    .toast-container.bottom-right {
        bottom: 16px;
        right: 16px;
    }
    
    .toast-container.bottom-center {
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast-container.bottom-left {
        bottom: 16px;
        left: 16px;
    }
    
    /* Toast item */
    .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        background-color: #36393f;
        box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.24),
            0 0 0 1px rgba(255, 255, 255, 0.06);
        color: #dcddde;
        font-size: 14px;
        line-height: 1.4;
        pointer-events: auto;
        transform: translateX(120%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 100%;
        word-wrap: break-word;
    }
    
    /* Animation states */
    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .toast.hide {
        transform: translateX(120%);
        opacity: 0;
    }
    
    /* Left-side animations for left-positioned containers */
    .toast-container.top-left .toast,
    .toast-container.bottom-left .toast {
        transform: translateX(-120%);
    }
    
    .toast-container.top-left .toast.show,
    .toast-container.bottom-left .toast.show {
        transform: translateX(0);
    }
    
    .toast-container.top-left .toast.hide,
    .toast-container.bottom-left .toast.hide {
        transform: translateX(-120%);
    }
    
    /* Center animations */
    .toast-container.top-center .toast,
    .toast-container.bottom-center .toast {
        transform: translateY(-20px);
    }
    
    .toast-container.top-center .toast.show,
    .toast-container.bottom-center .toast.show {
        transform: translateY(0);
    }
    
    .toast-container.top-center .toast.hide,
    .toast-container.bottom-center .toast.hide {
        transform: translateY(-20px);
    }
    
    /* Toast icon */
    .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 14px;
    }
    
    .toast-icon i {
        font-size: 14px;
    }
    
    /* Toast content */
    .toast-content {
        flex: 1;
        min-width: 0;
    }
    
    .toast-title {
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 2px;
    }
    
    .toast-message {
        color: #b9bbbe;
        word-break: break-word;
    }
    
    /* Toast close button */
    .toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: #72767d;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s ease;
        padding: 0;
        margin: -4px -8px -4px 0;
    }
    
    .toast-close:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #dcddde;
    }
    
    .toast-close i {
        font-size: 16px;
    }
    
    /* Toast progress bar */
    .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background-color: currentColor;
        border-radius: 0 0 8px 8px;
        opacity: 0.3;
        transition: width linear;
    }
    
    /* ==================== TOAST VARIANTS ==================== */
    
    /* Success */
    .toast.toast-success {
        border-left: 4px solid #43b581;
    }
    
    .toast.toast-success .toast-icon {
        background-color: rgba(67, 181, 129, 0.2);
        color: #43b581;
    }
    
    .toast.toast-success .toast-progress {
        background-color: #43b581;
    }
    
    /* Error */
    .toast.toast-error {
        border-left: 4px solid #f04747;
    }
    
    .toast.toast-error .toast-icon {
        background-color: rgba(240, 71, 71, 0.2);
        color: #f04747;
    }
    
    .toast.toast-error .toast-progress {
        background-color: #f04747;
    }
    
    /* Warning */
    .toast.toast-warning {
        border-left: 4px solid #faa61a;
    }
    
    .toast.toast-warning .toast-icon {
        background-color: rgba(250, 166, 26, 0.2);
        color: #faa61a;
    }
    
    .toast.toast-warning .toast-progress {
        background-color: #faa61a;
    }
    
    /* Info */
    .toast.toast-info {
        border-left: 4px solid #5865f2;
    }
    
    .toast.toast-info .toast-icon {
        background-color: rgba(88, 101, 242, 0.2);
        color: #5865f2;
    }
    
    .toast.toast-info .toast-progress {
        background-color: #5865f2;
    }
    
    /* ==================== RESPONSIVE ==================== */
    
    @media (max-width: 480px) {
        .toast-container {
            left: 8px !important;
            right: 8px !important;
            width: auto;
            max-width: none;
            transform: none !important;
        }
        
        .toast-container.top-center,
        .toast-container.top-left,
        .toast-container.top-right {
            top: 8px;
        }
        
        .toast-container.bottom-center,
        .toast-container.bottom-left,
        .toast-container.bottom-right {
            bottom: 8px;
        }
        
        .toast {
            padding: 10px 12px;
            font-size: 13px;
        }
        
        .toast-icon {
            width: 20px;
            height: 20px;
        }
        
        .toast-icon i {
            font-size: 12px;
        }
    }
    
    /* ==================== LEGACY TOAST COMPATIBILITY ==================== */
    /* Support for existing .chat-toast classes */
    
    .chat-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: #36393f;
        color: #dcddde;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
        max-width: 400px;
        text-align: center;
    }
    
    .chat-toast.show {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }
    
    .chat-toast-success {
        border-left: 4px solid #43b581;
    }
    
    .chat-toast-error {
        border-left: 4px solid #f04747;
    }
    
    .chat-toast-warning {
        border-left: 4px solid #faa61a;
    }
    
    .chat-toast-info {
        border-left: 4px solid #5865f2;
    }    window.location.href = '/login';
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
