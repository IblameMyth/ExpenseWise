# Firebase Integration Steps for ExpenseWise

## 📋 Prerequisites
You need your Firebase project configuration. Get it from:
- Firebase Console: https://console.firebase.google.com/
- Your project → Settings (⚙️) → Project settings → Your apps → Web app config

## 🔧 Step 1: Update Firebase Configuration

Open `firebase-config.js` and replace the placeholder values with your actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // Your actual API key
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 🔐 Step 2: Enable Authentication Methods in Firebase Console

1. Go to Firebase Console → Authentication → Sign-in method
2. **Enable Email/Password**: Click "Email/Password" → Toggle ON → Save
3. **Enable Google Sign-In**: 
   - Click "Google" → Toggle ON
   - Add support email (your email)
   - Save

## 🌐 Step 3: Add Firebase SDK to Your HTML Files

Your app needs Firebase SDK loaded before it can work. Add these scripts to the `<head>` section of:
- `login.html`
- `signup.html`
- `index.html`

### Add Firebase SDK Scripts:

```html
<!-- Firebase App (the core Firebase SDK) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<!-- Firebase Authentication -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<!-- Your Firebase Config -->
<script src="firebase-config.js"></script>
```

**Important**: Add these scripts BEFORE any other scripts that use Firebase!

## 📝 Step 4: Current Authentication Flow

Your app currently uses **localStorage-based authentication** with the following features:
- ✅ User-specific data isolation (via user-data-manager.js)
- ✅ Email/password login (stored locally)
- ✅ Multiple account management
- ✅ Logout synchronization across pages
- ⚠️ No real Google OAuth (uses mock picker)

## 🔄 Step 5: Integration Options

You have two paths forward:

### Option A: Hybrid Approach (Recommended for gradual migration)
Keep localStorage authentication but add **real Firebase Google Sign-In**:
- Existing email/password → stays localStorage
- Google Sign-In → uses Firebase OAuth popup
- User data → still managed by user-data-manager.js

**Pros**: Minimal changes, existing users unaffected, real Google auth
**Cons**: Mixed auth systems

### Option B: Full Firebase Migration
Replace entire auth system with Firebase:
- All login → Firebase Authentication
- User sessions → Firebase Auth state
- Data sync → Firebase Firestore (optional)

**Pros**: Professional, scalable, secure, password reset, email verification
**Cons**: More work, existing localStorage data needs migration

## 🚀 Quick Start: Test Firebase Connection

1. **Update firebase-config.js** with your credentials (Step 1)
2. **Enable Auth methods** in Firebase Console (Step 2)
3. **Add Firebase SDKs** to login.html (Step 3)
4. **Initialize Firebase**: Add this after the SDK scripts:

```html
<script>
  // Initialize Firebase when page loads
  document.addEventListener('DOMContentLoaded', () => {
    if (initializeFirebase()) {
      console.log('✅ Firebase connected successfully!');
    } else {
      console.error('❌ Firebase connection failed');
    }
  });
</script>
```

5. **Open login.html** in browser and check console for "✅ Firebase connected successfully!"

## 🧪 Testing Google Sign-In

Once Firebase is initialized, you can test Google Sign-In:

```javascript
// Add this to login.html's Google Sign-In button click handler
async function handleGoogleSignIn() {
  try {
    const user = await signInWithGoogle();
    console.log('Signed in user:', user);
    
    // Save to localStorage for compatibility
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Redirect to dashboard
    window.location.href = 'expense_manager_system.html';
  } catch (error) {
    alert('Google Sign-In failed: ' + error.message);
  }
}
```

## 📊 Current System Status

✅ **Completed**:
- User-specific data storage (user-data-manager.js)
- Main dashboard with user isolation
- Food & Travel pages updated
- Logout synchronization

⏳ **Pending**:
- EMI.html user-specific storage
- Entertainment.html user-specific storage
- Vacation.html user-specific storage
- Firebase SDK integration in HTML files
- Real Google OAuth implementation

## 🔑 Firebase Security Rules (Optional)

If you plan to use Firestore for data storage:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📞 Need Help?

1. **Firebase not initializing?** 
   - Check browser console for errors
   - Verify firebase-config.js credentials
   - Ensure Firebase SDK scripts loaded before firebase-config.js

2. **Google Sign-In not working?**
   - Check Firebase Console → Authentication → Sign-in method → Google is enabled
   - Verify authDomain in config matches your Firebase project

3. **Authentication state issues?**
   - Check user-data-manager.js is loaded on all pages
   - Verify currentUser is set in localStorage after login

---

**Next Steps**: 
1. Get your Firebase credentials
2. Update firebase-config.js
3. Add Firebase SDK scripts to HTML files
4. Test the connection
5. Implement real Google Sign-In (optional)
