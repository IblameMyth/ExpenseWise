// Firebase-enabled expense utility functions
// This file provides both Firebase (cloud) and localStorage (fallback) storage

// Storage mode: 'firebase' or 'local'
let storageMode = 'firebase';
let currentUserId = null;

// Check if Firebase is available
function isFirebaseAvailable() {
  return typeof firebase !== 'undefined' && window.firebaseDB && window.firebaseAuth;
}

// Get current user ID (always check Firebase auth first)
function getCurrentUserId() {
  // Always check Firebase auth first (don't use cache for authenticated users)
  if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    currentUserId = window.firebaseAuth.currentUser.uid;
    console.log('✓ Using Firebase user ID:', currentUserId);
    return currentUserId;
  }
  
  // Only use cache for guest users
  if (currentUserId && currentUserId.startsWith('guest_')) {
    return currentUserId;
  }
  
  if (typeof window.getOrCreateUserId === 'function') {
    currentUserId = window.getOrCreateUserId();
    return currentUserId;
  }
  
  // Fallback to localStorage user ID
  let userId = localStorage.getItem('expenseWiseUserId');
  if (!userId) {
    userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('expenseWiseUserId', userId);
  }
  currentUserId = userId;
  return userId;
}

// Initialize storage system
async function initializeStorage() {
  if (isFirebaseAvailable()) {
    try {
      const user = await initFirebaseAuth();
      storageMode = 'firebase';
      if (user) {
        currentUserId = user.uid;
        console.log('✓ Using Firebase cloud storage with authentication');
        console.log('✓ User:', user.email || user.uid);
      } else {
        currentUserId = getCurrentUserId();
        console.log('⚠ Using Firebase cloud storage without authentication');
        console.log('✓ Guest User ID:', currentUserId);
      }
      return true;
    } catch (error) {
      console.warn('⚠ Firebase unavailable, using localStorage:', error);
      storageMode = 'local';
      getCurrentUserId();
      return false;
    }
  } else {
    console.log('📱 Using localStorage (offline mode)');
    storageMode = 'local';
    getCurrentUserId();
    return false;
  }
}

// Enhanced ExpenseUtils with Firebase support
const ExpenseUtils = {
  // Save expense to Firebase or localStorage
  async save(expenseType, monthKey, expenseData) {
    const userId = getCurrentUserId();
    
    if (storageMode === 'firebase' && isFirebaseAvailable()) {
      try {
        const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        await ref.set({
          ...expenseData,
          date: monthKey,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log(`✓ Saved ${expenseType} to Firebase`);
        return true;
      } catch (error) {
        console.error('Firebase save error:', error);
        // Fallback to localStorage
        return this.saveLocal(expenseType, monthKey, expenseData);
      }
    } else {
      return this.saveLocal(expenseType, monthKey, expenseData);
    }
  },

  // Save to localStorage (fallback)
  saveLocal(expenseType, monthKey, expenseData) {
    const userId = getCurrentUserId();
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        ...expenseData,
        date: monthKey,
        updatedAt: Date.now()
      }));
      console.log(`✓ Saved ${expenseType} to localStorage`);
      return true;
    } catch (error) {
      console.error('localStorage save error:', error);
      return false;
    }
  },

  // Load expense from Firebase or localStorage
  async load(expenseType, monthKey) {
    const userId = getCurrentUserId();
    
    if (storageMode === 'firebase' && isFirebaseAvailable()) {
      try {
        const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        if (data) {
          console.log(`✓ Loaded ${expenseType} from Firebase`);
          return data;
        }
      } catch (error) {
        console.error('Firebase load error:', error);
      }
    }
    
    // Fallback to localStorage
    return this.loadLocal(expenseType, monthKey);
  },

  // Load from localStorage
  loadLocal(expenseType, monthKey) {
    const userId = getCurrentUserId();
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`✓ Loaded ${expenseType} from localStorage`);
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('localStorage load error:', error);
    }
    return null;
  },

  // Delete specific expense
  async delete(expenseType, monthKey) {
    const userId = getCurrentUserId();
    let deleted = false;
    
    if (storageMode === 'firebase' && isFirebaseAvailable()) {
      try {
        const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
        await ref.remove();
        console.log(`✓ Deleted ${expenseType}/${monthKey} from Firebase`);
        deleted = true;
      } catch (error) {
        console.error('Firebase delete error:', error);
      }
    }
    
    // Also delete from localStorage
    const key = `expense_${userId}_${expenseType}_${monthKey}`;
    try {
      localStorage.removeItem(key);
      console.log(`✓ Deleted ${expenseType}/${monthKey} from localStorage`);
      deleted = true;
    } catch (error) {
      console.error('localStorage delete error:', error);
    }
    
    return deleted;
  },

  // Get all expenses of a type
  async getAll(expenseType) {
    const userId = getCurrentUserId();
    const expenses = [];
    
    if (storageMode === 'firebase' && isFirebaseAvailable()) {
      try {
        const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}`);
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        
        if (data) {
          Object.keys(data).forEach(key => {
            expenses.push({ monthKey: key, ...data[key] });
          });
          console.log(`✓ Loaded ${expenses.length} ${expenseType} expenses from Firebase`);
          return expenses;
        }
      } catch (error) {
        console.error('Firebase getAll error:', error);
      }
    }
    
    // Fallback to localStorage
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
    
    console.log(`✓ Loaded ${expenses.length} ${expenseType} expenses from localStorage`);
    return expenses;
  },

  // Clear all expenses of a type
  async clearAll(expenseType) {
    const userId = getCurrentUserId();
    let deletedCount = 0;
    
    if (storageMode === 'firebase' && isFirebaseAvailable()) {
      try {
        const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}`);
        const snapshot = await ref.once('value');
        const count = snapshot.numChildren();
        await ref.remove();
        console.log(`✓ Cleared ${count} ${expenseType} expenses from Firebase`);
        deletedCount = count;
      } catch (error) {
        console.error('Firebase clearAll error:', error);
      }
    }
    
    // Also clear from localStorage
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
    
    console.log(`✓ Cleared ${deletedCount} ${expenseType} expenses total`);
    return deletedCount;
  },

  // Sync localStorage to Firebase (migration helper)
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
          
          const ref = firebaseDB.ref(`users/${userId}/expenses/${expenseType}/${monthKey}`);
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

// Clear user cache (call this on sign out/switch account)
function clearUserCache() {
  currentUserId = null;
  console.log('✓ User cache cleared');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeStorage();
});

// Export functions
window.ExpenseUtils = ExpenseUtils;
window.initializeStorage = initializeStorage;
window.getCurrentUserId = getCurrentUserId;
window.isFirebaseAvailable = isFirebaseAvailable;
window.clearUserCache = clearUserCache;
