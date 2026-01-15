// Unified Database Service
// Consolidates firebase-expense-utils.js + expense_manager.js
// Handles all database operations (Firebase + localStorage)

let currentUserId = null;
let lastAuthenticatedUid = null;

// ============= CORE DATABASE FUNCTIONS =============

// Check if Firebase is available
function isFirebaseAvailable() {
  return typeof firebase !== 'undefined' && window.firebaseDB && window.firebaseAuth;
}

// Check if user is actually authenticated
function isUserAuthenticated() {
  if (!window.firebaseAuth) return false;
  const user = window.firebaseAuth.currentUser;
  return user && user.uid && !user.uid.startsWith('guest_');
}

// Get current user ID - STRICT VERSION
function getCurrentUserId() {
  // Priority 1: Check actual Firebase authentication
  if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    const uid = window.firebaseAuth.currentUser.uid;
    
    // Detect account switch
    if (lastAuthenticatedUid && lastAuthenticatedUid !== uid) {
      console.warn(`🔄 Account switched from ${lastAuthenticatedUid} to ${uid}`);
      clearLocalExpenseCache();
    }
    
    lastAuthenticatedUid = uid;
    currentUserId = uid;
    return uid;
  }
  
  // Priority 2: Use cached authenticated UID (if still valid)
  if (currentUserId && !currentUserId.startsWith('guest_')) {
    return currentUserId;
  }
  
  // Priority 3: Create or reuse guest ID (localStorage only)
  let guestId = localStorage.getItem('guestUserId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestUserId', guestId);
    console.log('👤 Created new guest user:', guestId);
  }
  
  currentUserId = guestId;
  return guestId;
}

// Clear all local expense cache (for account switches)
function clearLocalExpenseCache() {
  console.warn('🗑️ Clearing local expense cache due to account change');
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('expense_')) {
      keys.push(key);
    }
  }
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  Removed: ${key}`);
  });
}

// Initialize storage system
async function initializeStorage() {
  if (isFirebaseAvailable()) {
    try {
      const user = await initFirebaseAuth();
      if (user && user.uid) {
        currentUserId = user.uid;
        lastAuthenticatedUid = user.uid;
        console.log('✓ Firebase initialized - Authenticated user');
        console.log('  UID:', user.uid);
        console.log('  Email:', user.email);
        return true;
      } else {
        const guestId = getCurrentUserId();
        console.log('⚠ Firebase initialized - Guest mode');
        console.log('  Guest ID:', guestId);
        return true;
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      getCurrentUserId();
      return false;
    }
  } else {
    console.log('📱 Firebase not available - Using localStorage only');
    getCurrentUserId();
    return false;
  }
}

// ============= EXPENSE OPERATIONS =============

const ExpenseService = {
  // Save single expense - AUTHENTICATED USERS MUST USE FIREBASE
  async save(expenseType, monthKey, expenseData) {
    const userId = getCurrentUserId();
    const isAuthenticated = isUserAuthenticated();
    
    // RULE 1: Authenticated users MUST use Firebase
    if (isAuthenticated) {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase not available for authenticated user');
      }
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        await ref.set({
          ...expenseData,
          date: monthKey,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log(`✅ [FIREBASE] Saved ${expenseType} for user ${userId.substring(0, 8)}...`);
        return true;
      } catch (error) {
        console.error(`❌ [FIREBASE] Failed to save ${expenseType}:`, error);
        throw error; // Don't fallback - this is an error condition
      }
    }
    
    // RULE 2: Guest users use localStorage only
    return this.saveLocal(expenseType, monthKey, expenseData);
  },

  // Save to localStorage (GUEST ONLY)
  saveLocal(expenseType, monthKey, expenseData) {
    const userId = getCurrentUserId();
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        ...expenseData,
        date: monthKey,
        updatedAt: Date.now()
      }));
      console.log(`✅ [LOCAL] Saved ${expenseType} for guest ${userId.substring(0, 8)}...`);
      return true;
    } catch (error) {
      console.error('❌ [LOCAL] Save error:', error);
      throw error;
    }
  },

  // Load single expense - AUTHENTICATED USERS MUST USE FIREBASE
  async load(expenseType, monthKey) {
    const userId = getCurrentUserId();
    const isAuthenticated = isUserAuthenticated();
    
    // RULE 1: Authenticated users MUST use Firebase
    if (isAuthenticated) {
      if (!isFirebaseAvailable()) {
        throw new Error('Firebase not available for authenticated user');
      }
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        if (data) {
          console.log(`✅ [FIREBASE] Loaded ${expenseType} for user ${userId.substring(0, 8)}...`);
          return data;
        }
        console.log(`⚠️ [FIREBASE] No data found for ${expenseType}`);
        return null;
      } catch (error) {
        console.error(`❌ [FIREBASE] Failed to load ${expenseType}:`, error);
        throw error; // Don't fallback - this is an error condition
      }
    }
    
    // RULE 2: Guest users use localStorage only
    return this.loadLocal(expenseType, monthKey);
  },

  // Load from localStorage (GUEST ONLY)
  loadLocal(expenseType, monthKey) {
    const userId = getCurrentUserId();
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`✅ [LOCAL] Loaded ${expenseType} for guest ${userId.substring(0, 8)}...`);
        return JSON.parse(data);
      }
      console.log(`⚠️ [LOCAL] No data found for ${expenseType}`);
      return null;
    } catch (error) {
      console.error('❌ [LOCAL] Load error:', error);
      throw error;
    }
    return null;
  },

  // Delete single expense
  async delete(expenseType, monthKey) {
    const userId = getCurrentUserId();
    const isAuthenticated = isUserAuthenticated();
    let deleted = false;
    
    // Delete from Firebase if user is authenticated
    if (isAuthenticated && isFirebaseAvailable()) {
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        await ref.remove();
        console.log(`✅ [FIREBASE] Deleted ${expenseType}/${monthKey}`);
        deleted = true;
      } catch (error) {
        console.error('❌ [FIREBASE] Delete error:', error);
      }
    }
    
    // Delete from localStorage (for guests or as backup)
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      localStorage.removeItem(key);
      console.log(`✅ [LOCAL] Deleted ${expenseType}/${monthKey}`);
      deleted = true;
    } catch (error) {
      console.error('❌ [LOCAL] Delete error:', error);
    }
    
    return deleted;
  },

  // Get all expenses of a type
  async getAll(expenseType) {
    const userId = getCurrentUserId();
    const isAuthenticated = isUserAuthenticated();
    const expenses = [];
    
    // Load from Firebase if user is authenticated
    if (isAuthenticated && isFirebaseAvailable()) {
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        
        if (data) {
          Object.keys(data).forEach(key => {
            expenses.push({ monthKey: key, ...data[key] });
          });
          console.log(`✅ [FIREBASE] Loaded ${expenses.length} ${expenseType} expenses`);
          return expenses;
        }
        console.log(`⚠️ [FIREBASE] No ${expenseType} expenses found`);
        return expenses;
      } catch (error) {
        console.error('❌ [FIREBASE] getAll error:', error);
        return expenses;
      }
    }
    
    // Load from localStorage (for guests)
    const prefix = `expense_${userId}_${expenseType}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const monthKey = key.replace(prefix, '');
          expenses.push({ monthKey, ...data });
        } catch (error) {
          console.error('Error parsing expense:', error);
        }
      }
    }
    
    console.log(`✅ [LOCAL] Loaded ${expenses.length} ${expenseType} expenses`);
    return expenses;
  },

  // Clear all expenses of a type
  async clearAll(expenseType) {
    const userId = getCurrentUserId();
    const isAuthenticated = isUserAuthenticated();
    let deletedCount = 0;
    
    // Clear from Firebase if user is authenticated
    if (isAuthenticated && isFirebaseAvailable()) {
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}`);
        const snapshot = await ref.once('value');
        const count = snapshot.numChildren();
        await ref.remove();
        console.log(`✅ [FIREBASE] Cleared ${count} ${expenseType} expenses`);
        deletedCount = count;
      } catch (error) {
        console.error('❌ [FIREBASE] clearAll error:', error);
      }
    }
    
    // Clear from localStorage (for guests or as backup)
    const prefix = `expense_${userId}_${expenseType}_`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      deletedCount++;
    });
    
    if (keys.length > 0) {
      console.log(`✅ [LOCAL] Cleared ${keys.length} ${expenseType} expenses`);
    }
    
    console.log(`✓ Cleared ${deletedCount} ${expenseType} expenses total`);
    return deletedCount;
  },

  // Sync localStorage to Firebase
  async syncToFirebase() {
    if (!isFirebaseAvailable()) {
      console.error('Firebase not available');
      return false;
    }
    
    const userId = getCurrentUserId();
    const prefix = `expense_${userId}_`;
    let syncCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const parts = key.replace(prefix, '').split('_');
          const expenseType = parts[0];
          const monthKey = parts.slice(1).join('_');
          
          const ref = window.firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
          await ref.set(data);
          syncCount++;
        } catch (error) {
          console.error('Sync error for key:', key, error);
        }
      }
    }
    
    console.log(`✓ Synced ${syncCount} expenses to Firebase`);
    return syncCount;
  }
};

// ============= FUTURE EXPENSES OPERATIONS =============

const FutureExpenseService = {
  // Add future expense
  async add(expenseId, expenseData) {
    const userId = getCurrentUserId();
    
    try {
      if (window.firebaseDB && userId) {
        const ref = window.firebaseDB.ref(`users/${userId}/futureExpenses/${expenseId}`);
        await ref.set(expenseData);
        console.log('✓ Saved future expense to Firebase');
      }
      
      const key = `futureExpenses_${userId}`;
      let list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(expenseData);
      localStorage.setItem(key, JSON.stringify(list));
      console.log('✓ Saved future expense to localStorage');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      return false;
    }
  },

  // Get all future expenses
  async getAll() {
    const userId = getCurrentUserId();
    let expenses = [];
    
    if (window.firebaseDB) {
      try {
        const ref = window.firebaseDB.ref(`users/${userId}/futureExpenses`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        if (data) {
          expenses = Object.values(data);
          console.log('✓ Loaded future expenses from Firebase:', expenses.length);
        }
      } catch (err) {
        console.warn('Firebase load error:', err);
      }
    }
    
    if (expenses.length === 0) {
      const key = `futureExpenses_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        expenses = JSON.parse(stored);
        console.log('✓ Loaded future expenses from localStorage:', expenses.length);
      }
    }
    
    return expenses;
  },

  // Delete single future expense
  async delete(expenseId) {
    const userId = getCurrentUserId();
    
    try {
      if (window.firebaseDB) {
        try {
          const ref = window.firebaseDB.ref(`users/${userId}/futureExpenses/${expenseId}`);
          await ref.remove();
          console.log('✓ Deleted from Firebase');
        } catch (err) {
          console.warn('Firebase delete error:', err);
        }
      }
      
      const key = `futureExpenses_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        let list = JSON.parse(stored);
        list = list.filter(e => e.id !== expenseId);
        localStorage.setItem(key, JSON.stringify(list));
        console.log('✓ Deleted from localStorage');
      }
      
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  },

  // Delete all future expenses
  async deleteAll() {
    const userId = getCurrentUserId();
    
    try {
      if (window.firebaseDB) {
        try {
          const ref = window.firebaseDB.ref(`users/${userId}/futureExpenses`);
          await ref.remove();
          console.log('✓ All deleted from Firebase');
        } catch (err) {
          console.warn('Firebase delete all error:', err);
        }
      }
      
      localStorage.removeItem(`futureExpenses_${userId}`);
      console.log('✓ All deleted from localStorage');
      return true;
    } catch (err) {
      console.error('Delete all error:', err);
      return false;
    }
  }
};

// ============= CACHE & EXPORT =============

// Clear user cache
function clearUserCache() {
  currentUserId = null;
  console.log('✓ User cache cleared');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeStorage();
});

// Export functions and services
window.ExpenseService = ExpenseService;
window.FutureExpenseService = FutureExpenseService;
window.initializeStorage = initializeStorage;
window.getCurrentUserId = getCurrentUserId;
window.isFirebaseAvailable = isFirebaseAvailable;
window.clearUserCache = clearUserCache;

// Backward compatibility (keep old names working)
window.ExpenseUtils = ExpenseService;
