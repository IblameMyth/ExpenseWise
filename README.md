# ExpenseWise - Smart Expense Management App

A modern, feature-rich expense tracking application with Firebase backend, dark mode, and unified categories interface.

## 📁 Project Structure

```
Code.laddha/
├── index.html                      # Entry point (redirects to welcome.html)
├── welcome.html                    # Landing page with features
├── ExpenseWise Main.html           # Main dashboard
├── expense_manager_system.html     # Expense manager redirect
├── categories.html                 # Unified categories page (ALL-IN-ONE)
│
├── firebase-config.js              # Firebase configuration & authentication
├── expense_manager.js              # Dashboard logic & budget management
├── expense-utils.js                # Utility functions
├── styles.css                      # Main stylesheet
├── expense_manager.css             # Dashboard styles
│
├── js/                             # JavaScript services (unified)
│   ├── database-service.js         # Firebase & localStorage operations
│   └── app-service.js              # Theme, UI, and Future Expenses
│
├── images/                         # Image assets
│   ├── logo.png
│   └── new-logo.svg
│
├── assets/                         # Additional assets
├── pages/                          # Prepared for future expansion
│
└── README.md                       # This file
```

## 🚀 Features

### ✅ Authentication
- Google Sign-In with popup fallback to redirect
- Guest mode support
- Account switching
- Session persistence

### 💰 Expense Tracking
- **Daily Budget** - Track daily expenses by category
- **Monthly View** - See spending patterns
- **Future Expenses** - Plan upcoming expenses
- **Categories** - Food, Travel, Entertainment, EMI, Vacation, Miscellaneous

### 🎨 User Experience
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works on desktop and mobile
- **Real-time Sync** - Firebase cloud synchronization
- **Offline Support** - localStorage fallback

### 🔐 Security
- Firebase Authentication
- User-specific data isolation
- Session persistence (closes on browser close)

## 🛠 Installation

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection (for Firebase)

### Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/Code.laddha.git
   ```

2. Open in Live Server (VS Code extension recommended)
   - Right-click `index.html` or `welcome.html`
   - Select "Open with Live Server"

3. The app opens at `http://localhost:5500`

## 📋 Key Files

### Configuration
- **firebase-config.js** - Firebase setup, Google auth, session management

### Stylesheets
- **styles.css** - Global styles and theme variables
- **expense_manager.css** - Dashboard-specific styles

### JavaScript Services (Unified)
- **js/database-service.js** - All database operations (Firebase + localStorage)
- **js/app-service.js** - Theme, UI, and Future Expenses management

### Main Pages
- **welcome.html** - Landing page with feature overview
- **ExpenseWise Main.html** - Dashboard (daily budget tracking)
- **categories.html** - Unified categories page (ALL 5 categories + Future Expenses)

## 🎮 How to Use

### Adding Daily Expenses
1. Go to Dashboard (ExpenseWise Main.html)
2. Enter date, amounts for each category
3. Click "Add Budget"
4. View monthly table with totals

### Monthly Budget Management
1. Click "Show Monthly Budget" button
2. Set your budget for the month
3. View progress ring showing spent vs budget
4. Auto-updates every 2 seconds

### Categories & Expenses
1. Click "📁 All Categories" on dashboard
2. Select a category tab (Food, Travel, etc.)
3. Enter monthly expenses
4. Click "Show Chart" to visualize
5. Click "Save Data" to store

### Future Expenses
1. In Categories page, click "📅 Future Expenses" tab
2. Add expense name, amount, date
3. Click "➕ Add Future Expense"
4. Click "📋 Show All Future Expenses" to view
5. Delete items as needed
6. View summary statistics

### Dark Mode
- Click "🌙 Dark Mode" button (top right)
- Preference saves to localStorage

### Sign In/Out
1. Click ☰ hamburger menu
2. Choose "Sign In" or "Switch Account"
3. Follow Google auth flow

## 💾 Data Storage

**Firebase (Cloud)** - Default, syncs across devices  
**localStorage (Offline)** - Automatic fallback if Firebase unavailable

## 🔄 Tech Stack

- **Frontend** - HTML5, CSS3, Vanilla JavaScript
- **Backend** - Firebase (Realtime Database, Authentication)
- **Charts** - Chart.js
- **Storage** - Firebase Database + localStorage

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase auth error | Allow popups, check Firebase settings |
| Data not showing | Open F12, check Console and localStorage |
| Sign-in not working | Clear cache, try incognito mode |

## 📝 Future Enhancements

- Budget alerts
- Recurring expenses
- PDF exports
- Monthly reports
- Spending goals
- Mobile app

---

**Version:** 1.0  
**Status:** Active  
**Last Updated:** January 2026
