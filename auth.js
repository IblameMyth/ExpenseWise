// Authentication Manager for ExpenseWise
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication on page load
        this.checkAuth();
        this.setupLogout();
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

    // Check authentication and redirect if needed
    checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        const isLoginPage = currentPage === 'login.html' || currentPage === '';
        
        if (!this.isLoggedIn() && !isLoginPage) {
            // Not logged in and not on login page - redirect to login
            window.location.href = 'login.html';
            return false;
        }

        if (this.isLoggedIn() && isLoginPage) {
            // Logged in but on login page - redirect to main app
            window.location.href = 'expense_manager_system.html';
            return false;
        }

        return true;
    }

    // Logout function
    logout() {
        localStorage.removeItem('expenseWiseSession');
        
        // Optionally clear remembered user if they want to logout completely
        if (confirm('Do you want to remove saved login credentials as well?')) {
            localStorage.removeItem('rememberedUser');
        }
        
        window.location.href = 'login.html';
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
            console.log('Logged in as:', user.fullName, '(' + user.email + ')');
            
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
                    <span style="color: var(--muted); margin-left: 8px;">${user.email}</span>
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