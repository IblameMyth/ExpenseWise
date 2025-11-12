// Authentication Manager for ExpenseWise with Device-Specific Security
class AuthManager {
    constructor() {
        this.deviceId = null;
        this.init();
    }

    // Generate unique device fingerprint
    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform,
            canvas.toDataURL()
        ].join('|');
        
        // Create a simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Get or create device ID
    getDeviceId() {
        if (this.deviceId) return this.deviceId;
        
        let deviceId = localStorage.getItem('deviceFingerprint');
        if (!deviceId) {
            deviceId = this.generateDeviceFingerprint();
            localStorage.setItem('deviceFingerprint', deviceId);
            console.log('New device detected, generated device ID:', deviceId);
        }
        
        this.deviceId = deviceId;
        return deviceId;
    }

    // Check if this is a new device
    isNewDevice() {
        const currentDeviceId = this.generateDeviceFingerprint();
        const storedDeviceId = localStorage.getItem('deviceFingerprint');
        
        if (!storedDeviceId || currentDeviceId !== storedDeviceId) {
            console.log('Device change detected!');
            this.clearAllDeviceData();
            return true;
        }
        return false;
    }

    // Clear all device-specific data when device changes
    clearAllDeviceData() {
        const keysToRemove = [];
        
        // Find all device-specific keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('expenseWiseUsers_') ||
                key.startsWith('rememberedUser') ||
                key.startsWith('savedCredentials_') ||
                key.includes('_DEVICE_') ||
                key === 'expenseWiseSession'
            )) {
                keysToRemove.push(key);
            }
        }
        
        // Remove device-specific data
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('Cleared device data for new device, removed', keysToRemove.length, 'items');
    }

    init() {
        // Check for device changes first
        this.isNewDevice();
        this.getDeviceId();
        
        // Check authentication on page load
        this.checkAuth();
        this.setupLogout();
        this.setupMultiTabLogout();
    }

    // Setup multi-tab logout functionality
    setupMultiTabLogout() {
        // Listen for storage changes (when session is removed from another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'expenseWiseSession' && e.newValue === null) {
                // Session was removed from another tab - redirect to login
                console.log('Session removed from another tab, redirecting to login...');
                window.location.href = 'login.html';
            }
        });

        // Auto-logout when page/tab is closed or refreshed
        window.addEventListener('beforeunload', () => {
            console.log('Tab closing - clearing session for security');
            localStorage.removeItem('expenseWiseSession');
        });

        // Also handle page hide (when tab becomes inactive)
        window.addEventListener('pagehide', () => {
            console.log('Page hidden - clearing session for security');
            localStorage.removeItem('expenseWiseSession');
        });

        // Clear session on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                console.log('Tab hidden - clearing session for security');
                localStorage.removeItem('expenseWiseSession');
            }
        });

        // Also check periodically if session still exists
        setInterval(() => {
            if (!this.isLoggedIn() && !this.isLoginPage()) {
                console.log('Session expired, redirecting to login...');
                window.location.href = 'login.html';
            }
        }, 1000); // Check every 1 second for immediate response
    }

    // Helper to check if current page is login page
    isLoginPage() {
        const currentPage = window.location.pathname.split('/').pop();
        return currentPage === 'login.html' || currentPage === '';
    }

    // Check if user is logged in
    isLoggedIn() {
        const session = localStorage.getItem('expenseWiseSession');
        return session !== null;
    }

    // Get current user data
    getCurrentUser() {
        const session = localStorage.getItem('expenseWiseSession');
        return session ? JSON.parse(session) : null;
    }

    // Get user-specific data key
    getUserDataKey(baseKey) {
        const user = this.getCurrentUser();
        if (!user) return null;
        return `${baseKey}_${user.username || user.userId}`;
    }

    // Clear user-specific data when logging out
    clearUserData() {
        const user = this.getCurrentUser();
        if (!user) return;

        const userPrefix = `_${user.username || user.userId}`;
        const keysToRemove = [];

        // Find all localStorage keys that belong to this user
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith(userPrefix)) {
                keysToRemove.push(key);
            }
        }

        // Remove user-specific data (optional - only on explicit request)
        return keysToRemove;
    }

    // Check authentication and redirect if needed
    checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        const isLoginPage = currentPage === 'login.html' || currentPage === '' || currentPage === 'index.html';
        
        // ALWAYS require fresh login - force start with login page
        if (!isLoginPage) {
            console.log('Forcing login - redirecting to login page');
            window.location.href = 'login.html';
            return false;
        }

        // If on login page, clear any existing session to force fresh login
        if (isLoginPage && this.isLoggedIn()) {
            console.log('Clearing existing session for fresh login');
            localStorage.removeItem('expenseWiseSession');
        }

        return true;
    }

    // Logout function
    logout() {
        // Remove session data - this will trigger storage event in other tabs
        localStorage.removeItem('expenseWiseSession');
        
        // Optionally clear remembered user if they want to logout completely
        if (confirm('Do you want to remove saved login credentials as well?')) {
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                const deviceId = this.getDeviceId();
                localStorage.removeItem(`rememberedUser_DEVICE_${deviceId}`);
                localStorage.removeItem(`savedCredentials_DEVICE_${deviceId}_${currentUser.username}`);
            }
        }
        
        // Add a small delay to ensure storage event is fired
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
    }

    // Setup logout button functionality
    setupLogout() {
        // Add logout button to existing headers if user is logged in
        if (this.isLoggedIn()) {
            this.addLogoutButton();
            this.showUserInfo();
        }
    }

    // Add logout button to page header
    addLogoutButton() {
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
            // Check if logout button already exists
            if (!header.querySelector('.logout-btn')) {
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'logout-btn';
                logoutBtn.textContent = 'Logout';
                logoutBtn.style.cssText = `
                    background: linear-gradient(90deg, #dc2626, #ef4444);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                    transition: transform 0.2s ease;
                `;
                
                logoutBtn.addEventListener('click', () => this.logout());
                logoutBtn.addEventListener('mouseover', function() {
                    this.style.transform = 'translateY(-1px)';
                });
                logoutBtn.addEventListener('mouseout', function() {
                    this.style.transform = 'translateY(0)';
                });

                // Add to header - try to find existing button container or theme toggle
                const existingThemeToggle = header.querySelector('.theme-toggle');
                if (existingThemeToggle && existingThemeToggle.parentElement) {
                    existingThemeToggle.parentElement.appendChild(logoutBtn);
                } else {
                    header.appendChild(logoutBtn);
                }
            }
        });
    }

    // Show user info in console or page
    showUserInfo() {
        const user = this.getCurrentUser();
        if (user) {
            console.log('Logged in as:', user.fullName, '(@' + (user.username || user.email) + ')');
            
            // Add welcome message to page if there's a suitable container
            const welcomeContainer = document.querySelector('.user-welcome') || document.querySelector('main');
            if (welcomeContainer && !document.querySelector('.user-info')) {
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                userInfo.style.cssText = `
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: var(--text);
                `;
                userInfo.innerHTML = `
                    <strong>Welcome back, ${user.fullName}!</strong>
                    <span style="color: var(--muted); margin-left: 8px;">@${user.username || user.email}</span>
                `;
                welcomeContainer.insertBefore(userInfo, welcomeContainer.firstChild);
            }
        }
    }

    // Validate session (check if session is still valid)
    validateSession() {
        const session = this.getCurrentUser();
        if (session) {
            // Check if session is older than 7 days (optional)
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 7) {
                // Session expired
                this.logout();
                return false;
            }
        }
        return true;
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}