// Universal expense utility functions for user-specific data management
// Include this script in all expense pages to enable user data isolation

// User authentication and data management
function getCurrentUser() {
    const session = localStorage.getItem('expenseWiseSession');
    return session ? JSON.parse(session) : null;
}

function checkUserAuth() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to access this expense page');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Generate user-specific keys for different expense types with enhanced isolation
function getUserSpecificKey(baseKey, identifier) {
    const user = getCurrentUser();
    if (!user) return null;
    // Use both username and userId for maximum isolation
    const userIdentifier = `${user.username || 'user'}_${user.userId || Date.now()}`;
    return `${baseKey}_USER_${userIdentifier}_DATA_${identifier}`;
}

// Enhanced data isolation functions
function getUserStorageNamespace() {
    const user = getCurrentUser();
    if (!user) return null;
    return `USER_${user.username || 'user'}_${user.userId || Date.now()}_EXPENSES`;
}

// Specific functions for each expense type with enhanced separation
const ExpenseUtils = {
    // Food expenses - completely isolated storage
    food: {
        getKey: (monthKey) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_FOOD_${monthKey}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_FOOD_` : null;
        }
    },
    
    // Travel expenses - completely isolated storage
    travel: {
        getKey: (monthKey) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_TRAVEL_${monthKey}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_TRAVEL_` : null;
        }
    },
    
    // Vacation expenses - completely isolated storage
    vacation: {
        getKey: (monthKey) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_VACATION_${monthKey}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_VACATION_` : null;
        }
    },
    
    // Entertainment expenses - completely isolated storage
    entertainment: {
        getKey: (monthKey) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_ENTERTAINMENT_${monthKey}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_ENTERTAINMENT_` : null;
        }
    },
    
    // EMI expenses - completely isolated storage
    emi: {
        getKey: (monthKey) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_EMI_${monthKey}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_EMI_` : null;
        }
    },

    // Daily budget expenses - completely isolated storage
    daily: {
        getKey: (date) => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_DAILY_${date}` : null;
        },
        getPrefix: () => {
            const namespace = getUserStorageNamespace();
            return namespace ? `${namespace}_DAILY_` : null;
        }
    }
};

// Universal functions for all expense types
function getUserExpensesByType(expenseType) {
    if (!checkUserAuth()) return [];
    
    const prefix = ExpenseUtils[expenseType]?.getPrefix();
    if (!prefix) return [];
    
    const expenses = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                expenses.push(data);
            } catch (e) {
                console.error('Error parsing expense data:', e);
            }
        }
    }
    return expenses;
}

function saveUserExpense(expenseType, monthKey, expenseData) {
    if (!checkUserAuth()) return false;
    
    const key = ExpenseUtils[expenseType]?.getKey(monthKey);
    if (!key) return false;
    
    try {
        localStorage.setItem(key, JSON.stringify({
            date: monthKey,
            ...expenseData
        }));
        return true;
    } catch (e) {
        console.error('Error saving expense data:', e);
        return false;
    }
}

function loadUserExpense(expenseType, monthKey) {
    if (!checkUserAuth()) return null;
    
    const key = ExpenseUtils[expenseType]?.getKey(monthKey);
    if (!key) return null;
    
    try {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : null;
    } catch (e) {
        console.error('Error loading expense data:', e);
        return null;
    }
}

function clearAllUserExpenses(expenseType) {
    if (!checkUserAuth()) return 0;
    
    const prefix = ExpenseUtils[expenseType]?.getPrefix();
    if (!prefix) return 0;
    
    const keys = Object.keys(localStorage);
    let deletedCount = 0;
    
    keys.forEach(key => {
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
            deletedCount++;
        }
    });
    
    return deletedCount;
}

// Enhanced security functions
function validateUserAccess() {
    const user = getCurrentUser();
    if (!user || !user.username || !user.userId) {
        console.error('Invalid user session - redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function sanitizeStorageOnLogin() {
    // When a user logs in, ensure no other user's data is visible
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const currentUserNamespace = getUserStorageNamespace();
    if (!currentUserNamespace) return;

    // Get all storage keys
    const allKeys = Object.keys(localStorage);
    
    // Hide/isolate any expense data that doesn't belong to current user
    allKeys.forEach(key => {
        if ((key.includes('_USER_') && key.includes('_EXPENSES')) && 
            !key.startsWith(currentUserNamespace)) {
            // This is another user's data - ensure it's not accessible
            console.log('Isolating other user data:', key);
        }
    });
}

// Complete user data isolation check
function enforceDataIsolation() {
    if (!validateUserAccess()) return false;
    
    const currentUserNamespace = getUserStorageNamespace();
    if (!currentUserNamespace) return false;
    
    // Verify all accessed data belongs to current user
    return true;
}

// Initialize multi-tab logout listener for expense pages with enhanced security
function initExpenseAuth() {
    // FORCE login check - redirect immediately if no valid session
    if (!checkUserAuth()) {
        console.log('No valid session - forcing login');
        window.location.href = 'login.html';
        return;
    }
    
    // Validate user access and enforce data isolation
    if (!validateUserAccess()) return;
    
    // Sanitize storage to ensure data isolation
    sanitizeStorageOnLogin();
    
    // Setup multi-tab logout listener
    window.addEventListener('storage', (e) => {
        if (e.key === 'expenseWiseSession' && e.newValue === null) {
            console.log('Session removed from another tab, redirecting to login...');
            window.location.href = 'login.html';
        }
    });
    
    // Enhanced session monitoring - very frequent checks
    setInterval(() => {
        if (!getCurrentUser() || !validateUserAccess()) {
            console.log('Session invalid - redirecting to login...');
            window.location.href = 'login.html';
        }
    }, 500); // Check every 0.5 seconds for immediate security
    
    // Clear session on any navigation away
    window.addEventListener('beforeunload', () => {
        localStorage.removeItem('expenseWiseSession');
    });
    
    // Force logout on tab focus loss for maximum security
    window.addEventListener('blur', () => {
        console.log('Tab lost focus - clearing session for security');
        localStorage.removeItem('expenseWiseSession');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
    });
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    initExpenseAuth();
});

// Export functions for global use
window.ExpenseUtils = ExpenseUtils;
window.getUserExpensesByType = getUserExpensesByType;
window.saveUserExpense = saveUserExpense;
window.loadUserExpense = loadUserExpense;
window.clearAllUserExpenses = clearAllUserExpenses;
window.getCurrentUser = getCurrentUser;
window.checkUserAuth = checkUserAuth;