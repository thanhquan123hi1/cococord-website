// Authentication utilities

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

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('displayName');
    localStorage.removeItem('avatarUrl');

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
        const displayName = localStorage.getItem('displayName') || localStorage.getItem('username');
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName) {
            userDisplayName.textContent = displayName;
        }
    }
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
