# Firebase Setup Guide for ExpenseWise

## 🔥 Quick Setup Instructions

Your ExpenseWise app is now configured to use **real Google Authentication** via Firebase! Follow these steps to complete the setup:

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `ExpenseWise` (or any name you prefer)
4. Disable Google Analytics (optional, not needed for this app)
5. Click **"Create project"**

---

## Step 2: Enable Google Authentication

1. In your Firebase project, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Google"** provider
5. Toggle **"Enable"** switch to ON
6. Enter your **Project support email** (your Gmail address)
7. Click **"Save"**

---

## Step 3: Register Your Web App

1. In Firebase Console, go to **Project Overview** (home icon)
2. Click the **web icon** (`</>`) to add a web app
3. Enter app nickname: `ExpenseWise Web`
4. Check **"Also set up Firebase Hosting"** (optional)
5. Click **"Register app"**

---

## Step 4: Copy Firebase Configuration

After registering your app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDf3mM6xXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**Copy all these values!** You'll need them in the next step.

---

## Step 5: Update firebase-config.js

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",           // ← Replace this
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // ← Replace this
  projectId: "YOUR_PROJECT_ID",                  // ← Replace this
  storageBucket: "YOUR_PROJECT_ID.appspot.com",  // ← Replace this
  messagingSenderId: "YOUR_SENDER_ID",           // ← Replace this
  appId: "YOUR_APP_ID"                          // ← Replace this
};
```

3. **Save the file**

---

## Step 6: Test Your App

1. Open `index.html` in your browser
2. Click **"Get Started Free"** or **"Sign In"**
3. Click **"Sign in with Google"** button
4. You should see Google's real account picker popup
5. Select your Google account
6. Grant permissions when prompted
7. You'll be redirected to the dashboard!

---

## 🎉 What's Changed?

### Before (Mock Authentication):
- Fake account picker with hardcoded emails
- localStorage-only user management
- No real Google authentication

### After (Real Firebase Authentication):
- **Real Google OAuth popup** with account selection
- **Actual Google accounts** from users
- **Secure authentication** with Firebase
- **Automatic profile picture** from Google account
- **Multi-account support** built into Google's picker
- **Session management** handled by Firebase

---

## 🔒 Security Notes

- Your Firebase API key is **safe to expose** in client-side code (it's designed for that)
- Firebase automatically handles token refresh and session management
- Authentication state is managed by Firebase, not just localStorage
- Google accounts are verified through Google's OAuth servers

---

## 🚀 Features Now Available

✅ **Real Google Sign-In**: Users can sign in with their actual Google accounts  
✅ **Profile Pictures**: Automatically pulled from Google profiles  
✅ **Email Verification**: Google-verified email addresses  
✅ **Multi-Account**: Google's native account picker  
✅ **Secure Sessions**: Firebase manages authentication tokens  
✅ **Account Picker**: Google shows "Select account" when multiple accounts exist  

---

## 📝 Troubleshooting

### Error: "Firebase not initialized"
- Make sure you've replaced ALL placeholder values in `firebase-config.js`
- Check that `firebase-config.js` is loaded before other scripts

### Error: "Popup blocked"
- Browser blocked the Google Sign-In popup
- Click the popup blocker icon and allow popups for your site

### Error: "This domain is not authorized"
- In Firebase Console → Authentication → Settings → Authorized domains
- Add your domain (e.g., `localhost`, `127.0.0.1`, or your production domain)

### No popup appears
- Check browser console for errors (F12)
- Verify Firebase configuration is correct
- Make sure Google Sign-In is enabled in Firebase Console

---

## 🎯 Next Steps

After Firebase is configured, you can:

1. **Deploy to hosting**: Use Firebase Hosting or any static host
2. **Add email/password**: Firebase supports native email/password auth too
3. **Add more providers**: Facebook, GitHub, Twitter, etc.
4. **Set up database**: Use Firestore to store expenses in the cloud
5. **Enable offline mode**: PWA features for offline access

---

## 📧 Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all Firebase configuration values are correct
3. Ensure Google Sign-In is enabled in Firebase Console
4. Check that your domain is authorized in Firebase settings

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)

---

**Made with ❤️ for ExpenseWise**
