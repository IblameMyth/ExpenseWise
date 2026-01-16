// Firebase Configuration for ExpenseWise
// Replace the config values below with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC9SD02sgr5NrfN2h6g0oM9GBXUmPo9sHM",
  authDomain: "xpensewise-fe3d8.firebaseapp.com",
  databaseURL: "https://xpensewise-fe3d8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xpensewise-fe3d8",
  storageBucket: "xpensewise-fe3d8.firebasestorage.app",
  messagingSenderId: "159805452276",
  appId: "1:159805452276:web:e3d4ca2013d6930e1513a1"
};


// Initialize Firebase
let app, db, auth;
try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  auth = firebase.auth();
  
  // Default to LOCAL persistence (keep user signed in across browser sessions)
  // This will be changed to SESSION if user unchecks "Remember Me"
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('✓ Firebase auth persistence set to LOCAL (Remember Me enabled by default)');
    })
    .catch((error) => {
      console.error('Error setting persistence:', error);
    });
  
  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Current user state
let currentUser = null;

// Detect mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
}

// Google Sign-In with account selection and Remember Me support
async function signInWithGoogle(forceAccountSelection = false) {
  // Check Remember Me preference before signing in
  const rememberMe = localStorage.getItem('rememberMe') !== 'false'; // Default to true
  const persistence = rememberMe 
    ? firebase.auth.Auth.Persistence.LOCAL   // Keep signed in across sessions
    : firebase.auth.Auth.Persistence.SESSION; // Sign out when browser closes
  
  console.log(`🔐 Remember Me: ${rememberMe}, Persistence: ${persistence === firebase.auth.Auth.Persistence.LOCAL ? 'LOCAL' : 'SESSION'}`);
  
  try {
    // CRITICAL: Set persistence before signing in
    await auth.setPersistence(persistence);
    console.log(`✓ Auth persistence set to ${rememberMe ? 'LOCAL (Remember Me)' : 'SESSION (Sign out on close)'}`);
  } catch (error) {
    console.error('Error setting persistence:', error);
    // Continue anyway - persistence error shouldn't block sign-in
  }
  
  const provider = new firebase.auth.GoogleAuthProvider();
  
  // Force account selection popup (allows choosing different account)
  if (forceAccountSelection) {
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  // Use redirect flow on mobile devices, popup on desktop
  const useMobile = isMobileDevice();
  
  console.log(`📱 Device type: ${useMobile ? 'Mobile (using redirect)' : 'Desktop (using popup)'}`);
  
  if (useMobile) {
    console.log('🔄 Starting redirect-based sign-in...');
    try {
      // Store that we're attempting sign-in (for redirect detection)
      sessionStorage.setItem('authRedirectPending', 'true');
      await auth.signInWithRedirect(provider);
      // Page will reload after redirect, result handled in getRedirectResult
      return;
    } catch (error) {
      sessionStorage.removeItem('authRedirectPending');
      console.error('Google Sign-In redirect error:', error);
      alert('Sign-in failed: ' + (error.message || 'Please try again'));
      throw error;
    }
  }

  // Desktop: Use popup flow
  console.log('🪟 Starting popup-based sign-in...');
  try {
    const result = await auth.signInWithPopup(provider);
    currentUser = result.user;
    console.log('✓ Signed in with Google:', result.user.email);
    saveAccountToHistory(result.user);
    updateUIForUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);

    // When Chrome blocks third-party cookies or the domain is not whitelisted, Firebase reports auth/internal-error.
    // Fall back to redirect-based sign-in which is more tolerant of these restrictions.
    if (error.code === 'auth/internal-error' || error.code === 'auth/popup-blocked') {
      try {
        console.warn('⚠ Popup failed, falling back to redirect-based Google sign-in...');
        sessionStorage.setItem('authRedirectPending', 'true');
        await auth.signInWithRedirect(provider);
        return; // Redirect will navigate away
      } catch (redirectError) {
        sessionStorage.removeItem('authRedirectPending');
        console.error('Google Sign-In redirect error:', redirectError);
        throw redirectError;
      }
    }

    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      alert('Sign-in failed: ' + (error.message || 'Please try again'));
    }
    throw error;
  }
}

// Switch to a different Google account
function switchAccount() {
  // Clear user cache first
  if (window.clearUserCache) {
    window.clearUserCache();
  }
  
  signOut().then(() => {
    // Force account selection
    setTimeout(() => {
      signInWithGoogle(true).then(() => {
        // Reload page to refresh all data
        window.location.reload();
      });
    }, 500);
  });
}

// Save account to history (for recent accounts)
function saveAccountToHistory(user) {
  try {
    let accounts = JSON.parse(localStorage.getItem('recentAccounts') || '[]');
    
    // Remove if already exists
    accounts = accounts.filter(acc => acc.uid !== user.uid);
    
    // Add to front
    accounts.unshift({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastAccess: Date.now()
    });
    
    // Keep only last 5 accounts
    accounts = accounts.slice(0, 5);
    
    localStorage.setItem('recentAccounts', JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving account history:', e);
  }
}

// Get recent accounts
function getRecentAccounts() {
  try {
    return JSON.parse(localStorage.getItem('recentAccounts') || '[]');
  } catch (e) {
    return [];
  }
}

// Sign Out
function signOut() {
  return auth.signOut()
    .then(() => {
      currentUser = null;
      // Clear user cache
      if (window.clearUserCache) {
        window.clearUserCache();
      }
      console.log('✓ Signed out');
      updateUIForUser(null);
      // Reload page to clear all data from UI
      setTimeout(() => window.location.reload(), 100);
    })
    .catch((error) => {
      console.error('Sign out error:', error);
    });
}

// Update UI based on user state
function updateUIForUser(user) {
  const authContainer = document.getElementById('auth-container');
  const userInfoDropdown = document.getElementById('user-info-dropdown');
  const mainContent = document.getElementById('main-content');
  
  if (!authContainer) return;
  
  if (user) {
    authContainer.style.display = 'none';
    if (userInfoDropdown) {
      userInfoDropdown.innerHTML = `
        <div class="user-info-content">
          <img src="${user.photoURL || 'https://via.placeholder.com/40'}" 
               class="user-avatar"
               alt="Profile">
          <div class="user-details">
            <p class="user-name">${user.displayName || user.email}</p>
            <p class="user-email">${user.email}</p>
          </div>
        </div>
        <div class="user-actions">
          <button onclick="window.location.href='categories.html#future'" class="menu-item-btn" style="width:100%; text-align:left; padding:12px; background:transparent; border:none; cursor:pointer; font-size:14px; color:var(--text); transition:background 0.2s;" onmouseover="this.style.background='rgba(37,99,235,0.05)'" onmouseout="this.style.background='transparent'">
            📅 Future Expenses
          </button>
          <button onclick="switchAccount()" class="switch-account-btn">
            🔄 Switch Account
          </button>
          <button onclick="signOut()" class="sign-out-btn">
            🚪 Sign Out
          </button>
        </div>
      `;
    }
    if (mainContent) mainContent.style.display = 'block';
  } else {
    authContainer.style.display = 'flex';
    if (userInfoDropdown) userInfoDropdown.innerHTML = '';
    if (mainContent) mainContent.style.display = 'none';
    
    // Show recent accounts on login screen
    showRecentAccounts();
  }
}

// Show recent accounts on login screen
function showRecentAccounts() {
  const recentAccountsDiv = document.getElementById('recent-accounts');
  if (!recentAccountsDiv) return;
  
  const accounts = getRecentAccounts();
  
  if (accounts.length === 0) {
    recentAccountsDiv.style.display = 'none';
    return;
  }
  
  recentAccountsDiv.style.display = 'block';
  recentAccountsDiv.innerHTML = `
    <div style="margin-top:20px; padding-top:20px; border-top:1px solid var(--card-border);">
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Recent accounts:</p>
      ${accounts.map(acc => `
        <div onclick="signInWithGoogle(false)" 
             style="display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; cursor:pointer; transition:background 0.2s;"
             onmouseover="this.style.background='rgba(37,99,235,0.05)'"
             onmouseout="this.style.background='transparent'">
          <img src="${acc.photoURL || 'https://via.placeholder.com/32'}" 
               style="width:32px; height:32px; border-radius:50%;" 
               alt="${acc.displayName}">
          <div style="flex:1; text-align:left;">
            <div style="font-size:13px; font-weight:500;">${acc.displayName || acc.email}</div>
            <div style="font-size:11px; color:var(--muted);">${acc.email}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Listen for auth state changes
function initFirebaseAuth() {
  return new Promise((resolve) => {
    let resolved = false;
    let redirectHandled = false;
    
    const finish = (user) => {
      if (!resolved) {
        resolved = true;
        resolve(user);
      }
    };

    // Handle redirect-based sign-in results (after signInWithRedirect)
    // This must complete BEFORE onAuthStateChanged processes
    console.log('🔍 Checking for redirect result...');
    
    auth.getRedirectResult()
      .then((result) => {
        redirectHandled = true;
        const wasRedirectPending = sessionStorage.getItem('authRedirectPending') === 'true';
        sessionStorage.removeItem('authRedirectPending');
        
        if (result && result.user) {
          currentUser = result.user;
          console.log('✅ Redirect sign-in SUCCESS for:', result.user.email);
          console.log('✅ User UID:', result.user.uid);
          saveAccountToHistory(result.user);
          
          // Apply Remember Me preference after redirect
          const rememberMe = localStorage.getItem('rememberMe') !== 'false';
          const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
          
          console.log(`🔐 Setting persistence to ${persistence === firebase.auth.Auth.Persistence.LOCAL ? 'LOCAL' : 'SESSION'}`);
          
          auth.setPersistence(persistence)
            .then(() => {
              console.log('✓ Persistence set after redirect');
              updateUIForUser(result.user);
              finish(result.user);
            })
            .catch(err => {
              console.error('Error setting persistence after redirect:', err);
              updateUIForUser(result.user);
              finish(result.user);
            });
        } else if (wasRedirectPending) {
          // Redirect was pending but no result - possible error
          console.error('⚠ Redirect was pending but no user result received');
          const currentAuthUser = auth.currentUser;
          if (currentAuthUser) {
            console.log('✓ But found existing user session:', currentAuthUser.email);
            currentUser = currentAuthUser;
            updateUIForUser(currentAuthUser);
            finish(currentAuthUser);
          } else {
            updateUIForUser(null);
            finish(null);
          }
        } else {
          // No redirect result, check current auth state
          console.log('ℹ No redirect result');
          const currentAuthUser = auth.currentUser;
          if (currentAuthUser) {
            console.log('✓ Existing user session found:', currentAuthUser.email);
            currentUser = currentAuthUser;
            updateUIForUser(currentAuthUser);
            finish(currentAuthUser);
          } else {
            console.log('ℹ No existing session');
          }
        }
      })
      .catch((error) => {
        redirectHandled = true;
        sessionStorage.removeItem('authRedirectPending');
        console.error('❌ Redirect sign-in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Show error to user
        if (error.code !== 'auth/popup-closed-by-user' && 
            error.code !== 'auth/cancelled-popup-request' &&
            error.code !== 'auth/user-cancelled') {
          alert('Sign-in failed: ' + (error.message || 'Please try again.\n\nMake sure you have a stable internet connection.'));
        }
        
        updateUIForUser(null);
        finish(null);
      });

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      // Wait for redirect to be handled first
      if (!redirectHandled) {
        return;
      }
      
      currentUser = user;
      
      // Clear cache when user changes
      if (window.clearUserCache) {
        window.clearUserCache();
      }
      
      if (user) {
        console.log('✓ Auth state changed - User authenticated:', user.email);
        updateUIForUser(user);
        finish(user);
      } else {
        console.log('⚠ Auth state changed - No user signed in');
        updateUIForUser(null);
        finish(null);
      }
    });
  });
}

// Get current user ID
function getOrCreateUserId() {
  if (currentUser) {
    return currentUser.uid;
  }
  
  // Fallback for guest users
  let userId = localStorage.getItem('expenseWiseUserId');
  if (!userId) {
    userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('expenseWiseUserId', userId);
  }
  return userId;
}

// Export Firebase instances
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseAuth = auth;
window.getOrCreateUserId = getOrCreateUserId;
window.initFirebaseAuth = initFirebaseAuth;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.switchAccount = switchAccount;
window.updateUIForUser = updateUIForUser;
window.getRecentAccounts = getRecentAccounts;

// Note: SESSION persistence automatically logs out when browser closes
// No need for beforeunload/visibilitychange handlers as they interfere with navigation
