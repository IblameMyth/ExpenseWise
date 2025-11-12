# 🚀 How to Run Your ExpenseWise App

## ⚠️ Important: Firebase Requires HTTP/HTTPS

Firebase Authentication **DOES NOT work** when opening HTML files directly (file:// protocol).

You're seeing this error:
```
auth/operation-not-supported-in-this-environment
```

This happens because you opened the file directly from your file system.

---

## ✅ Solution: Use a Local Web Server

Choose ONE of these methods:

---

### Method 1: VS Code Live Server (EASIEST) ⭐ RECOMMENDED

1. **Install Live Server Extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server"
   - Install "Live Server" by Ritwick Dey
   - Click "Install"

2. **Start the Server**:
   - Open `login.html` in VS Code
   - Right-click anywhere in the file
   - Select **"Open with Live Server"**
   - Your browser will open automatically at `http://127.0.0.1:5500/login.html`

3. **Test Google Sign-In**:
   - Click "Continue with Google"
   - Google popup should work! 🎉

---

### Method 2: Python (If Installed)

```powershell
# Open PowerShell in your project folder
cd "c:\Users\Lenovo\Documents\GitHub\Code.laddha"

# Start server
python -m http.server 8000

# Open browser and go to:
# http://localhost:8000/login.html
```

---

### Method 3: Node.js http-server (If Node.js Installed)

```powershell
# Install http-server globally (one time)
npm install -g http-server

# Start server
cd "c:\Users\Lenovo\Documents\GitHub\Code.laddha"
http-server -p 8000 -o

# Opens browser automatically
```

---

### Method 4: PHP (If PHP Installed)

```powershell
cd "c:\Users\Lenovo\Documents\GitHub\Code.laddha"
php -S localhost:8000

# Open browser and go to:
# http://localhost:8000/login.html
```

---

### Method 5: Chrome Extension "Web Server for Chrome"

1. Install "Web Server for Chrome" extension
2. Launch it from Chrome Apps
3. Choose folder: `c:\Users\Lenovo\Documents\GitHub\Code.laddha`
4. Click "Start Server"
5. Open the URL shown (usually http://127.0.0.1:8887)

---

## 🎯 After Starting Server

Once you have a server running:

1. **Open browser** and go to:
   - `http://localhost:8000/login.html` (or whatever port your server uses)

2. **Test Google Sign-In**:
   - Click "Continue with Google"
   - Google OAuth popup should appear
   - Select your account
   - Success! 🎉

---

## 🔧 Firebase Configuration Still Needed

Even with a server running, you still need to:

1. **Get Firebase credentials** from Firebase Console
2. **Update firebase-config.js** with real values
3. **Enable Google Sign-In** in Firebase Authentication settings

See `REAL_GOOGLE_SIGNIN_SETUP.md` for detailed Firebase setup instructions.

---

## 🐛 Troubleshooting

### "Connection Refused"
- Server not running - start it again
- Wrong port - check which port your server is using

### Still getting Firebase error?
- Make sure URL starts with `http://` not `file://`
- Check firebase-config.js has real Firebase credentials
- Verify Google Sign-In is enabled in Firebase Console

### Port already in use?
- Try a different port: `python -m http.server 8001`
- Or kill the process using that port

---

## ⭐ RECOMMENDED: Use VS Code Live Server

**Why?**
- ✅ Zero configuration
- ✅ Auto-refresh on file changes
- ✅ One-click start
- ✅ Works perfectly with Firebase
- ✅ No command line needed

**Install it now**: Extensions → Search "Live Server" → Install

---

## 🎉 Next Steps

1. ✅ Install VS Code Live Server (or start any server)
2. ✅ Open http://localhost:XXXX/login.html
3. ✅ Update firebase-config.js with real credentials
4. ✅ Test Google Sign-In
5. ✅ Enjoy real authentication!

---

**Need Help?** Make sure you're accessing via `http://` and not `file://` - that's the key! 🔑
