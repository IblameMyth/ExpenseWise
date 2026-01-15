// Unified App Service
// Consolidates: theme.js + ui.js + future-expenses.js logic
// Handles UI, theme, and future expenses operations

// ============= THEME MANAGEMENT =============

const ThemeManager = {
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateButton();
  },

  updateButton() {
    const btn = document.querySelector('.theme-toggle');
    const current = document.documentElement.getAttribute('data-theme');
    if (btn) {
      btn.textContent = current === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  },

  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateButton();
  }
};

// ============= UI MANAGEMENT =============

const UIManager = {
  toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },

  closeMenuOnClickOutside() {
    document.addEventListener('click', (e) => {
      const menuContainer = document.querySelector('.user-menu-container');
      const dropdown = document.getElementById('userMenuDropdown');
      if (menuContainer && dropdown && !menuContainer.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  },

  continueAsGuest() {
    const authContainer = document.getElementById('auth-container');
    const mainContent = document.getElementById('main-content');
    if (authContainer) authContainer.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    console.log('✓ Continuing as guest');
  },

  init() {
    this.closeMenuOnClickOutside();
  }
};

// ============= FUTURE EXPENSES MANAGEMENT =============

let futureExpensesState = {
  isInitialized: false
};

const FutureExpensesManager = {
  // Initialize page
  async init() {
    console.log('=== Initializing Future Expenses ===');
    
    let attempts = 0;
    while (attempts < 30 && (typeof initializeStorage === 'undefined' || typeof getCurrentUserId === 'undefined')) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof initializeStorage === 'undefined') {
      console.warn('Firebase not available, using guest mode');
      UIManager.continueAsGuest();
      return;
    }
    
    try {
      await initializeStorage();
      await initFirebaseAuth();
      const userId = getCurrentUserId();
      futureExpensesState.isInitialized = true;
      console.log('✓ Initialized for user:', userId);
    } catch (error) {
      console.error('Init error:', error);
      UIManager.continueAsGuest();
    }
  },

  // Add new future expense
  async add(e) {
    if (e) e.preventDefault();
    console.log('=== Adding future expense ===');
    
    const nameInput = document.getElementById('expenseName');
    const amountInput = document.getElementById('expenseAmount');
    const dateInput = document.getElementById('expenseDate');
    const notesInput = document.getElementById('expenseNotes');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const amount = amountInput ? parseFloat(amountInput.value) : 0;
    const date = dateInput ? dateInput.value : '';
    const notes = notesInput ? notesInput.value.trim() : '';
    
    if (!name || !amount || !date) {
      console.log('Please fill all required fields');
      return;
    }
    
    const expenseId = Date.now().toString();
    const expenseData = { id: expenseId, name, amount, date, notes, createdAt: new Date().toISOString() };
    
    try {
      const success = await FutureExpenseService.add(expenseId, expenseData);
      if (success) {
        console.log('✓ Expense added successfully!');
        nameInput.value = '';
        amountInput.value = '';
        dateInput.value = '';
        notesInput.value = '';
      }
    } catch (err) {
      console.error('Save error:', err);
      console.log('Error: ' + err.message);
    }
  },

  // Show/load all expenses
  async showAll() {
    console.log('=== Loading future expenses ===');
    const listDiv = document.getElementById('futureExpensesList');
    const container = document.getElementById('futureExpensesContainer');
    const statsContainer = document.getElementById('statsContainer');
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (container && container.style.display === 'block') {
      console.log('Hiding list');
      container.style.display = 'none';
      if (statsContainer) statsContainer.style.display = 'none';
      if (toggleBtn) toggleBtn.textContent = '📋 Show All Future Expenses';
      return;
    }
    
    if (listDiv) listDiv.innerHTML = '<p style="text-align: center;">Loading...</p>';
    
    try {
      let expenses = await FutureExpenseService.getAll();
      
      if (expenses.length === 0) {
        if (listDiv) listDiv.innerHTML = '<p style="text-align: center; color: var(--muted);">No expenses found</p>';
        this.updateStats(0, 0);
      } else {
        expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let totalAmount = 0;
        let html = '';
        
        expenses.forEach(exp => {
          totalAmount += parseFloat(exp.amount);
          const expDate = new Date(exp.date);
          const today = new Date();
          const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          
          const status = daysLeft < 0 ? '⏰ Overdue' : daysLeft === 0 ? '⚠️ Today' : `📅 ${daysLeft} days`;
          
          html += `
            <div style="padding:12px; background:var(--card-border); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:var(--text);">${exp.name}</strong>
                <div style="font-size:12px; color:var(--muted);">₹${exp.amount} on ${exp.date} - ${status}</div>
                ${exp.notes ? `<div style="font-size:11px; color:var(--muted); margin-top:4px;">📝 ${exp.notes}</div>` : ''}
              </div>
              <button onclick="FutureExpensesManager.delete('${exp.id}')" 
                      style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">
                🗑️ Delete
              </button>
            </div>
          `;
        });
        
        if (listDiv) listDiv.innerHTML = html;
        this.updateStats(expenses.length, totalAmount);
      }
      
      if (container) container.style.display = 'block';
      if (statsContainer) statsContainer.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = '📋 Hide Future Expenses';
      
    } catch (err) {
      console.error('Load error:', err);
      if (listDiv) listDiv.innerHTML = '<p style="text-align: center; color:red;">Error loading expenses</p>';
    }
  },

  // Delete single expense
  async delete(expenseId) {
    if (!confirm('Delete this expense?')) return;
    
    try {
      const success = await FutureExpenseService.delete(expenseId);
      if (success) {
        await this.showAll();
      }
    } catch (err) {
      console.error('Delete error:', err);
      console.log('Error deleting expense');
    }
  },

  // Delete all expenses
  async deleteAll() {
    if (!confirm('Delete ALL expenses?')) return;
    
    try {
      const success = await FutureExpenseService.deleteAll();
      if (success) {
        console.log('✓ All expenses deleted!');
        const container = document.getElementById('futureExpensesContainer');
        const statsContainer = document.getElementById('statsContainer');
        const toggleBtn = document.getElementById('toggleBtn');
        
        if (container) container.style.display = 'none';
        if (statsContainer) statsContainer.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '📋 Show All Future Expenses';
      }
    } catch (err) {
      console.error('Delete all error:', err);
      console.log('Error deleting expenses');
    }
  },

  // Update statistics
  updateStats(count, amount) {
    const countEl = document.getElementById('totalCount');
    const amountEl = document.getElementById('totalAmount');
    if (countEl) countEl.textContent = count;
    if (amountEl) amountEl.textContent = '₹' + amount.toLocaleString();
  }
};

// ============= GLOBAL API (Backward Compatibility) =============

// Theme functions
window.toggleTheme = () => ThemeManager.toggle();
window.initTheme = () => ThemeManager.init();

// UI functions
window.toggleUserMenu = () => UIManager.toggleUserMenu();
window.continueAsGuest = () => UIManager.continueAsGuest();

// Future Expenses functions
window.addFutureExpense = (e) => FutureExpensesManager.add(e);
window.showAllExpenses = () => FutureExpensesManager.showAll();
window.deleteExpense = (id) => FutureExpensesManager.delete(id);
window.deleteAllExpenses = () => FutureExpensesManager.deleteAll();
window.updateStats = (count, amount) => FutureExpensesManager.updateStats(count, amount);

// Managers
window.FutureExpensesManager = FutureExpensesManager;
window.ThemeManager = ThemeManager;
window.UIManager = UIManager;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  UIManager.init();
});

// Initialize future expenses page on load
window.addEventListener('DOMContentLoaded', async () => {
  if (typeof FutureExpensesManager !== 'undefined') {
    await FutureExpensesManager.init();
  }
});
