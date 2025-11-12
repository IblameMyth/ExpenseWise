// Firebase Configuration
// Replace these with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let auth;
let googleProvider;

function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    try {
      app = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      googleProvider = new firebase.auth.GoogleAuthProvider();
      
      // Force account selection every time
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }
  console.error('Firebase SDK not loaded');
  return false;
}

// Helper function to sign in with Google
async function signInWithGoogle() {
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  try {
    const result = await auth.signInWithPopup(googleProvider);
    return {
      email: result.user.email,
      name: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Helper function to sign in with email/password
async function signInWithEmail(email, password) {
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return {
      email: result.user.email,
      name: result.user.displayName || email.split('@')[0],
      photoURL: result.user.photoURL,
      uid: result.user.uid
    };
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
}

// Helper function to create user with email/password
async function createUserWithEmail(email, password, displayName) {
  if (!auth) {
    console.error('Firebase not initialized');
    return null;
  }
  
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    
    // Update profile with display name
    if (displayName) {
      await result.user.updateProfile({
        displayName: displayName
      });
    }
    
    return {
      email: result.user.email,
      name: displayName || email.split('@')[0],
      photoURL: result.user.photoURL,
      uid: result.user.uid
    };
  } catch (error) {
    console.error('Sign-up error:', error);
    throw error;
  }
}

// Helper function to sign out
async function signOutUser() {
  if (!auth) return;
  
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    console.error('Sign-out error:', error);
    return false;
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  window.initializeFirebase = initializeFirebase;
  window.signInWithGoogle = signInWithGoogle;
  window.signInWithEmail = signInWithEmail;
  window.createUserWithEmail = createUserWithEmail;
  window.signOutUser = signOutUser;
}
