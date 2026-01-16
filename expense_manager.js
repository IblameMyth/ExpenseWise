// Function to auto-calculate and save data
function autoCalculateAndSave() {
  const household = parseFloat(document.getElementById('household').value) || 0;
  const travel = parseFloat(document.getElementById('travel').value) || 0;
  const misc = parseFloat(document.getElementById('misc').value) || 0;
  const total = household + travel + misc;
  const date = document.getElementById('budgetDate').value;

  if (date) {  // Only save if date is selected
    // Save to localStorage with user-specific key
    const user = getCurrentUser();
    if (!user) {
      console.log('Please log in to save expenses');
      return;
    }

    const expenseData = {
      date: date,
      household: household,
      travel: travel,
      misc: misc,
      total: total
    };
    
    const userExpenseKey = getUserExpenseKey(date);
    if (userExpenseKey) {
      localStorage.setItem(userExpenseKey, JSON.stringify(expenseData));
      
      // Show daily summary
      document.getElementById('dailySummary').innerHTML = `<p><strong>${date}</strong> - Total: ₹${total}</p>`;
      
      // Update the table
      loadMonthlyData();
    }
  }
}

// Expose to global scope for inline event handlers
window.autoCalculateAndSave = autoCalculateAndSave;

// Set today's date and load data when page loads
window.addEventListener('load', function() {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  // Set today's date in the date input
  document.getElementById('budgetDate').value = todayStr;

  // Load saved data for today if exists (user-specific)
  const user = getCurrentUser();
  if (user) {
    const userExpenseKey = getUserExpenseKey(todayStr);
    if (userExpenseKey) {
      const savedData = localStorage.getItem(userExpenseKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('household').value = data.household || '';
        document.getElementById('travel').value = data.travel || '';
        document.getElementById('misc').value = data.misc || '';
        document.getElementById('dailySummary').innerHTML = `<p><strong>${data.date}</strong> - Total: ₹${data.total}</p>`;
      }
    }
  }

  // Load monthly data table
  loadMonthlyData();
});

// Update calculations when date changes
const budgetDateElement = document.getElementById('budgetDate');
if (budgetDateElement) {
  budgetDateElement.addEventListener('change', function() {
    const savedData = localStorage.getItem(`expense_${this.value}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      document.getElementById('household').value = data.household || '';
      document.getElementById('travel').value = data.travel || '';
      document.getElementById('misc').value = data.misc || '';
    } else {
      document.getElementById('household').value = '';
      document.getElementById('travel').value = '';
      document.getElementById('misc').value = '';
    }
    autoCalculateAndSave();
  });
}

// Add Budget button wiring
document.addEventListener('DOMContentLoaded', function(){
  const addBtn = document.getElementById('addDailyBudgetBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function(){
      autoCalculateAndSave();
    });
  }
});

// User data management - Use Firebase authenticated user
function getCurrentUser() {
  // Check if Firebase user is authenticated
  if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    const fbUser = window.firebaseAuth.currentUser;
    return {
      username: fbUser.email ? fbUser.email.split('@')[0] : 'user',
      userId: fbUser.uid,
      fullName: fbUser.displayName || fbUser.email || 'ExpenseWise User',
      email: fbUser.email
    };
  }
  
  // Fallback for guest users
  const guestId = window.getCurrentUserId ? window.getCurrentUserId() : 'guest_user';
  return {
    username: 'guest',
    userId: guestId,
    fullName: 'Guest User'
  };
}

function getUserDataKey(baseKey) {
  const user = getCurrentUser();
  if (!user) return null;
  return `${baseKey}_${user.userId}`;
}

function getUserExpenseKey(date) {
  const user = getCurrentUser();
  if (!user) return null;
  // Use Firebase user ID for proper isolation
  return `EXPENSE_USER_${user.userId}_DAILY_${date}`;
}

// Function to load daily budget entries table near the form
function loadMonthlyData() {
  // Table disabled by user request
  return;
  const currentUser = getCurrentUser();
  if (!currentUser) return; // No user logged in

  const table = document.createElement('table');
  table.className = 'expense-table';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Date</th>
      <th>Household</th>
      <th>Travel</th>
      <th>Misc</th>
      <th>Total</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  let monthlyTotal = 0;
  
  // Get user-specific expenses from localStorage using new key format
  const userPrefix = `EXPENSE_USER_${currentUser.userId}_DAILY_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(userPrefix)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${data.date}</td>
          <td>₹${data.household}</td>
          <td>₹${data.travel}</td>
          <td>₹${data.misc}</td>
          <td>₹${data.total}</td>
        `;
        tbody.appendChild(row);
        monthlyTotal += data.total;
      } catch (err) {
        console.error('Error parsing expense data:', err);
      }
    }
  }
  
  table.appendChild(tbody);
  
  // Create table footer
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `
    <tr>
      <td colspan="4">Monthly Total</td>
      <td>₹${monthlyTotal}</td>
    </tr>
  `;
  table.appendChild(tfoot);
  
  // Render into the dedicated daily budget table container near the form
  let container = document.getElementById('daily-budget-table-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'daily-budget-table-container';
    container.className = 'table-container';
    const anchor = document.querySelector('.daily-budget-area');
    if (anchor) anchor.appendChild(container); else document.querySelector('main').appendChild(container);
  }
  container.innerHTML = '';
  container.appendChild(table);
}

// Future expenses form handler (only if the form exists on this page)
const futureForm = document.getElementById('futureForm');
if (futureForm) {
futureForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const nameInput = document.getElementById('expenseName');
  const name = nameInput.value;
  
  // Validate that the name contains only letters and spaces
  if (!/^[A-Za-z\s]+$/.test(name)) {
    console.log('Please enter only letters and spaces for the expense name');
    return;
  }
  
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const date = document.getElementById('expenseDate').value;
  
  // Create expense object
  const expense = {
    name: name,
    amount: amount,
    date: date
  };

  // Save to localStorage with user-specific key
  const user = getCurrentUser();
  const futureExpensesKey = `futureExpenses_${user.userId}`;
  let futureExpenses = JSON.parse(localStorage.getItem(futureExpensesKey) || '[]');
  futureExpenses.push(expense);
  localStorage.setItem(futureExpensesKey, JSON.stringify(futureExpenses));

  // Create list item
  const listItem = document.createElement('li');
  listItem.textContent = `${date} - ${name}: ₹${amount}`;
  document.getElementById('futureList').appendChild(listItem);

  this.reset();
});
}

// Clear all application data from both Firebase and localStorage
async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL your saved expense data? This cannot be undone.')) return;

  let totalDeleted = 0;
  
  // Clear from Firebase if available
  if (window.isFirebaseAvailable && window.isFirebaseAvailable()) {
    try {
      const userId = window.getCurrentUserId();
      const expenseTypes = ['household', 'travel', 'vacation', 'entertainment', 'emi', 'daily'];
      
      for (const type of expenseTypes) {
        const count = await window.ExpenseUtils.clearAll(type);
        totalDeleted += count;
      }
      
      console.log(`✓ Cleared ${totalDeleted} expenses from Firebase`);
    } catch (error) {
      console.error('Firebase clear error:', error);
    }
  }

  // Clear all expense-related localStorage keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('expense') ||
      key.includes('Expense') ||
      key.includes('Budget') ||
      key.includes('budget') ||
      key.includes('futureExpenses') ||
      key.startsWith('USER_') ||
      key.startsWith('household') ||
      key.startsWith('travel') ||
      key.startsWith('entertainment') ||
      key.startsWith('emi') ||
      key.startsWith('vacation') ||
      key.startsWith('EXPENSE_USER_') // daily budget storage keys
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear UI elements on the home page
  const ds = document.getElementById('dailySummary');
  if (ds) ds.innerHTML = '';

  const futureList = document.getElementById('futureList');
  if (futureList) futureList.innerHTML = '';

  // Clear the rendered daily budget table immediately
  const dailyTableContainer = document.getElementById('daily-budget-table-container');
  if (dailyTableContainer) dailyTableContainer.innerHTML = '';

  // Try to refresh any tables if functions exist
  if (typeof loadMonthlyData === 'function') {
    try { loadMonthlyData(); } catch (e) { /* ignore */ }
  }
  if (typeof updateTable === 'function') {
    try { updateTable(); } catch (e) { /* ignore */ }
  }
  
  // All Expenses section removed

  console.log(`Successfully cleared ${totalDeleted + keysToRemove.length} saved records from cloud and local storage.`);
}

// Delete a specific expense entry
async function deleteExpense(expenseType, monthKey) {
  if (!confirm(`Delete ${expenseType} expense for ${monthKey}?`)) return;
  
  try {
    const deleted = await window.ExpenseUtils.delete(expenseType, monthKey);
    if (deleted) {
      console.log(`Deleted ${expenseType} expense for ${monthKey}`);
      // Refresh the display
      if (typeof buildCombinedTable === 'function') {
        buildCombinedTable();
      }
    } else {
      console.log('Failed to delete expense');
    }
  } catch (error) {
    console.error('Delete error:', error);
    console.log('Error deleting expense');
  }
}

// Delete all expenses for a specific month
async function deleteMonthData(monthKey) {
  if (!confirm(`Delete ALL expenses for ${monthKey}? This will remove Household, Travel, EMI, Entertainment, and Vacation data for this month.`)) return;
  
  try {
    const expenseTypes = ['household', 'travel', 'emi', 'entertainment', 'vacation'];
    let deletedCount = 0;
    
    for (const type of expenseTypes) {
      const deleted = await window.ExpenseUtils.delete(type, monthKey);
      if (deleted) deletedCount++;
    }
    
    console.log(`Deleted ${deletedCount} expense categories for ${monthKey}`);
    // Rebuild and refresh the display
    if (typeof buildCombinedTable === 'function') {
      buildCombinedTable();
    }
    
    // All Expenses section removed
  } catch (error) {
    console.error('Delete month error:', error);
    console.log('Error deleting month data');
  }
}

// Expose globally for inline onclick
window.clearAllData = clearAllData;
window.deleteExpense = deleteExpense;
window.deleteMonthData = deleteMonthData;

// Show/Hide Clear Monthly Data Options
function showClearMonthOptions() {
  const section = document.getElementById('clearMonthSection');
  if (section) {
    section.style.display = 'block';
    // Set to current month by default
    const monthSelector = document.getElementById('clearMonthSelector');
    if (monthSelector) {
      const today = new Date();
      const month = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
      monthSelector.value = month;
    }
  }
}

function hideClearMonthOptions() {
  const section = document.getElementById('clearMonthSection');
  if (section) {
    section.style.display = 'none';
  }
}

// Clear all data for a specific month
async function clearMonthlyData() {
  const monthSelector = document.getElementById('clearMonthSelector');
  const selectedMonth = monthSelector.value;
  
  if (!selectedMonth) {
    console.log('Please select a month to clear');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    console.log('Please sign in to clear monthly data');
    return;
  }
  
  let deletedCount = 0;
  const keysToDelete = [];
  
  // Find all daily budget keys for this month
  // Daily budget keys look like: EXPENSE_USER_email_uid_2026-01-15
  const userPrefix = `EXPENSE_USER_${user.email}_${user.userId}`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Only target daily budget entries for this user and month
    if (key.startsWith(userPrefix) && key.includes(selectedMonth)) {
      keysToDelete.push(key);
    }
  }
  
  // Delete the keys
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
    deletedCount++;
  });
  
  // Hide the section
  hideClearMonthOptions();
  
  // Clear the daily budget table
  const dailyTableContainer = document.getElementById('daily-budget-table-container');
  if (dailyTableContainer) {
    dailyTableContainer.innerHTML = '';
  }
  
  // Refresh the monthly data table
  if (typeof loadMonthlyData === 'function') {
    try { loadMonthlyData(); } catch (e) { /* ignore */ }
  }
  
  console.log(`✓ Cleared ${deletedCount} daily budget records for ${selectedMonth}`);
}

// Expose to global scope
window.showClearMonthOptions = showClearMonthOptions;
window.hideClearMonthOptions = hideClearMonthOptions;
window.clearMonthlyData = clearMonthlyData;

// Load monthly budget data for a specific month
function loadMonthlyBudgetData() {
  const monthSelector = document.getElementById('monthSelector');
  const selectedMonth = monthSelector.value;
  
  if (!selectedMonth) {
    console.log('Please select a month');
    return;
  }
  
  // Check if viewing current month or historical month
  const today = new Date();
  const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const isCurrentMonth = (selectedMonth === currentMonth);
  window.isViewingSpecificMonth = !isCurrentMonth; // Only lock if NOT current month
  
  console.log(`Month: ${selectedMonth}, Current: ${currentMonth}, IsLocked: ${window.isViewingSpecificMonth}`);
  
  const user = getCurrentUser();
  if (!user) {
    console.log('Please sign in to view monthly data');
    return;
  }
  
  // Get budget for this month
  const budgetKey = `monthlyBudget_${user.userId}_${selectedMonth}`;
  const legacyBudgetKey = `monthlyBudget_${user.userId}`;
  const budgetValue = parseInt(localStorage.getItem(budgetKey) || localStorage.getItem(legacyBudgetKey) || '0', 10);
  
  // Calculate spent for this month
  let totalSpent = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (key.includes(user.userId) && key.includes(selectedMonth)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.total) {
          totalSpent += parseFloat(data.total) || 0;
        } else {
          const sum = (parseFloat(data.groceries) || 0) +
                     (parseFloat(data.householdSupplies) || 0) +
                     (parseFloat(data.personal) || 0) +
                     (parseFloat(data.drinks) || 0) +
                     (parseFloat(data.dining) || 0) +
                     (parseFloat(data.movies) || 0) +
                     (parseFloat(data.subscriptions) || 0) +
                     (parseFloat(data.miscellaneous) || 0) +
                     (parseFloat(data.fuel) || 0) +
                     (parseFloat(data.taxi) || 0) +
                     (parseFloat(data.bus) || 0) +
                     (parseFloat(data.accommodation) || 0) +
                     (parseFloat(data.flights) || 0) +
                     (parseFloat(data.activities) || 0) +
                     (parseFloat(data.carLoan) || 0) +
                     (parseFloat(data.homeLoan) || 0) +
                     (parseFloat(data.personalLoan) || 0) +
                     (parseFloat(data.otherLoans) || 0);
          if (sum > 0) totalSpent += sum;
        }
      } catch (e) {
        // Skip invalid data
      }
    }
  }
  
  // Update UI
  document.getElementById('budgetTotal').textContent = budgetValue;
  document.getElementById('budgetSpent').textContent = Math.round(totalSpent);
  
  const savings = Math.max(budgetValue - totalSpent, 0);
  const savingsPct = budgetValue > 0 ? Math.round((savings / budgetValue) * 100) : 0;
  document.getElementById('budgetSavings').textContent = Math.round(savings);
  document.getElementById('savingsPercent').textContent = `(${savingsPct}%)`;
  
  // Update progress ring
  const spent = Math.round(totalSpent);
  const pct = Math.min(spent / budgetValue, 1);
  const circumference = 2 * Math.PI * 50;
  const offset = circumference * (1 - pct);
  const progressCircle = document.querySelector('#budgetRing .progress');
  if (progressCircle) {
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = offset;
  }
  document.getElementById('budgetPercent').textContent = Math.round(pct * 100) + '%';
  
  const statusEl = document.getElementById('budgetStatus');
  if (statusEl) {
    if (isCurrentMonth) {
      statusEl.textContent = `${selectedMonth} (LIVE) - Saved: ₹${Math.round(savings)} | Spent: ₹${spent} of ₹${budgetValue}`;
    } else {
      statusEl.textContent = `${selectedMonth} (Historical) - Saved: ₹${Math.round(savings)} | Spent: ₹${spent} of ₹${budgetValue}`;
    }
  }
  
  console.log(`✓ Loaded ${selectedMonth} budget data - Budget: ₹${budgetValue}, Spent: ₹${spent}, Savings: ₹${savings}`);
}

// Expose to global scope
window.loadMonthlyBudgetData = loadMonthlyBudgetData;

// All Expenses section removed - feature not needed


// Build a combined monthly expenses table across all categories (called on demand)
function buildCombinedTable() {
  // Make sure UI exists
  const wrapper = ensureAllExpensesWrapper();
  let container = document.getElementById('all-expenses-container');
  
  // Get current user ID for filtering
  const currentUser = getCurrentUser();
  if (!currentUser) {
    container.innerHTML = '<p>Please sign in to view expenses</p>';
    return;
  }
  const currentUserId = currentUser.userId;
  
  console.log('🔍 Building expense table for user:', currentUserId);
  console.log('📊 Scanning localStorage for expense keys...');

  // Category prefixes to look for in localStorage
  const categoryPrefixes = {
    household: 'householdExpenses_',
    travel: 'travelExpenses_',
    emi: 'emiExpenses_',
    entertainment: 'entertainmentExpenses_',
    vacation: 'vacationExpenses_'
  };

  // Aggregate map: { 'YYYY-MM': {household:0,travel:0,emi:0,entertainment:0,vacation:0} }
  const monthly = {};

  const ensureMonth = (m) => {
    if (!monthly[m]) {
      monthly[m] = { household: 0, travel: 0, emi: 0, entertainment: 0, vacation: 0 };
    }
    return monthly[m];
  };

  const safeNum = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Scan localStorage for ALL expense keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Check if this key belongs to current user
    // Look for either old format or new user-specific format
    let isUserKey = false;
    let category = null;
    
    // Check each category prefix
    for (const c in categoryPrefixes) {
      const prefix = categoryPrefixes[c];
      if (key.startsWith(prefix)) {
        category = c;
        isUserKey = true;
        break;
      }
    }
    
    // Also check for user-namespaced keys (new format from expense-utils.js)
    if (!isUserKey) {
      // Check for keys like: USER_email_uid_EXPENSES_HOUSEHOLD_2026-01
      if (key.includes(currentUserId) || key.includes(`USER_`) && key.includes('_EXPENSES_')) {
        if (key.includes('_HOUSEHOLD_')) category = 'household';
        else if (key.includes('_TRAVEL_')) category = 'travel';
        else if (key.includes('_EMI_')) category = 'emi';
        else if (key.includes('_ENTERTAINMENT_')) category = 'entertainment';
        else if (key.includes('_VACATION_')) category = 'vacation';
        
        if (category) isUserKey = true;
      }
    }
    
    if (!category) continue;

    // Log found expense
    console.log(`✓ Found ${category} expense:`, key);

    // Parse data
    let data;
    try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch { data = null; }
    if (!data) continue;

    // Determine month key (supports legacy daily keys and new monthly keys)
    let monthKey = '';
    if (typeof data.date === 'string' && data.date.length >= 7) {
      monthKey = data.date.substring(0,7);
    } else {
      // Try to extract from key suffix
      const match = key.match(/(\d{4}-\d{2})/);
      if (match) {
        monthKey = match[1];
      }
    }
    if (!/^[0-9]{4}-[0-9]{2}$/.test(monthKey)) continue;

    const bucket = ensureMonth(monthKey);

    // Sum category totals by their fields
    switch (category) {
      case 'household': {
        const total = safeNum(data.groceries) + safeNum(data.householdSupplies) + safeNum(data.personal) + safeNum(data.total);
        bucket.household += total; break;
      }
      case 'travel': {
        const total = safeNum(data.auto) + safeNum(data.bus) + safeNum(data.metro) + safeNum(data.petrol) + safeNum(data.total);
        bucket.travel += total; break;
      }
      case 'emi': {
        const total = safeNum(data.home) + safeNum(data.car) + safeNum(data.edu) + safeNum(data.personal) + safeNum(data.total);
        bucket.emi += total; break;
      }
      case 'entertainment': {
        const total = safeNum(data.movies) + safeNum(data.parties) + safeNum(data.gatherings) + safeNum(data.total);
        bucket.entertainment += total; break;
      }
      case 'vacation': {
        const total = safeNum(data.tickets) + safeNum(data.hostel) + safeNum(data.food) + safeNum(data.traveling) + safeNum(data.total);
        bucket.vacation += total; break;
      }
    }
  }

  // Build table DOM into existing container

  // Create table markup
  const table = document.createElement('table');
  table.className = 'expense-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Month</th>
      <th>Household</th>
      <th>Travel</th>
      <th>EMI</th>
      <th>Entertainment</th>
      <th>Vacation</th>
      <th>Grand Total</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const months = Object.keys(monthly).sort().reverse(); // newest first

  let grandAll = { household:0, travel:0, emi:0, entertainment:0, vacation:0 };
  const rupee = (n) => `₹${n}`;

  for (const m of months) {
    const row = document.createElement('tr');
    const f = Math.round(monthly[m].household);
    const t = Math.round(monthly[m].travel);
    const e = Math.round(monthly[m].emi);
    const en = Math.round(monthly[m].entertainment);
    const v = Math.round(monthly[m].vacation);
    const total = f + t + e + en + v;

    grandAll.household += f; grandAll.travel += t; grandAll.emi += e; grandAll.entertainment += en; grandAll.vacation += v;

    row.innerHTML = `
      <td>${m}</td>
      <td>${rupee(f)}</td>
      <td>${rupee(t)}</td>
      <td>${rupee(e)}</td>
      <td>${rupee(en)}</td>
      <td>${rupee(v)}</td>
      <td>${rupee(total)}</td>
    `;
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  // Footer totals across all months
  const tfoot = document.createElement('tfoot');
  const allTotal = grandAll.household + grandAll.travel + grandAll.emi + grandAll.entertainment + grandAll.vacation;
  tfoot.innerHTML = `
    <tr>
      <td>All-time Total</td>
      <td>${rupee(grandAll.household)}</td>
      <td>${rupee(grandAll.travel)}</td>
      <td>${rupee(grandAll.emi)}</td>
      <td>${rupee(grandAll.entertainment)}</td>
      <td>${rupee(grandAll.vacation)}</td>
      <td>${rupee(allTotal)}</td>
      <td></td>
    </tr>
  `;
  table.appendChild(tfoot);

  // Render
  container.innerHTML = '';
  
  // Show summary
  const monthCount = Object.keys(monthly).length;
  console.log(`📈 Aggregated ${monthCount} months of data`);
  console.log('Monthly totals:', monthly);
  
  if (monthCount === 0) {
    container.innerHTML = '<p style="padding:20px; text-align:center; color:var(--muted);">No expense data found yet. Add expenses from Food, Travel, EMI, Entertainment, or Vacation pages!</p>';
    container.style.display = '';
    return;
  }
  
  container.appendChild(table);
  container.style.display = '';
}

// All Expenses section removed - feature no longer needed

// Budget Overview Ring Progress
(function(){
  // Global flag to control auto-updates
  window.isViewingSpecificMonth = false;
  let autoUpdateInterval = null;
  
  function initBudgetUI() {
    const circumference = 2 * Math.PI * 50; // r=50
    const progressCircle = document.querySelector('#budgetRing .progress');
    const percentLabel = document.getElementById('budgetPercent');
    const spentEl = document.getElementById('budgetSpent');
    const totalEl = document.getElementById('budgetTotal');
    const statusEl = document.getElementById('budgetStatus');

    // If budget UI is not on this page, skip init gracefully
    if (!progressCircle || !percentLabel || !spentEl || !totalEl || !statusEl) {
      return;
    }
    
    // Get user-specific budget key
    function getBudgetKey() {
      const user = getCurrentUser();
      return user ? `monthlyBudget_${user.userId}` : 'monthlyBudget_guest';
    }
    
    let total = parseInt(localStorage.getItem(getBudgetKey()) || '0', 10) || 0;
    totalEl.textContent = total;

    // Calculate actual spent amount from all expenses
    function calculateActualSpent() {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        statusEl.textContent = 'Please sign in to view expenses';
        return 0;
      }
      
      const currentUserId = currentUser.userId;
      let totalSpent = 0;
      let expenseCount = 0;
      
      // Get current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Scan all localStorage for current user's expenses
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Check if this key belongs to current user and current month
        const isUserKey = key.includes(currentUserId);
        const isCurrentMonth = key.includes(currentMonth);
        
        if (isUserKey && isCurrentMonth) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            
            // Handle different expense types
            if (data.total) {
              totalSpent += parseFloat(data.total) || 0;
              expenseCount++;
            } else {
              // Sum individual fields for category expenses
              const sum = (parseFloat(data.groceries) || 0) +
                         (parseFloat(data.householdSupplies) || 0) +
                         (parseFloat(data.personal) || 0) +
                         (parseFloat(data.drinks) || 0) +
                         (parseFloat(data.dining) || 0) +
                         (parseFloat(data.auto) || 0) +
                         (parseFloat(data.bus) || 0) +
                         (parseFloat(data.metro) || 0) +
                         (parseFloat(data.petrol) || 0) +
                         (parseFloat(data.home) || 0) +
                         (parseFloat(data.car) || 0) +
                         (parseFloat(data.edu) || 0) +
                         (parseFloat(data.movies) || 0) +
                         (parseFloat(data.parties) || 0) +
                         (parseFloat(data.gatherings) || 0) +
                         (parseFloat(data.tickets) || 0) +
                         (parseFloat(data.hostel) || 0) +
                         (parseFloat(data.food) || 0) +
                         (parseFloat(data.traveling) || 0);
              
              if (sum > 0) {
                totalSpent += sum;
                expenseCount++;
              }
            }
          } catch (e) {
            // Skip invalid data
          }
        }
      }
      
      // Update status message
      if (expenseCount === 0) {
        statusEl.textContent = 'No expenses recorded yet';
      } else {
        statusEl.textContent = `${expenseCount} expense${expenseCount > 1 ? 's' : ''} this month`;
      }
      
      return Math.round(totalSpent);
    }

    function updateRing(){
      // Don't auto-update if user is viewing a specific month
      if (window.isViewingSpecificMonth) {
        return;
      }
      
      const spent = calculateActualSpent();
      spentEl.textContent = spent;
      
      // Calculate savings
      const savings = Math.max(total - spent, 0);
      const savingsEl = document.getElementById('budgetSavings');
      const savingsPercentEl = document.getElementById('savingsPercent');
      if (savingsEl) {
        savingsEl.textContent = savings;
        const savingsPct = total > 0 ? Math.round((savings / total) * 100) : 0;
        if (savingsPercentEl) {
          savingsPercentEl.textContent = `(${savingsPct}%)`;
        }
      }
      
      const pct = Math.min(spent / total, 1);
      const offset = circumference * (1 - pct);
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = offset;
      percentLabel.textContent = Math.round(pct * 100) + '%';
    }

    // Show/Hide Monthly Budget section
    const budgetSection = document.getElementById('budgetSection');
    const showBtn = document.getElementById('showBudgetBtn');
    if (showBtn && budgetSection) {
      const showSection = () => {
        budgetSection.style.display = 'block';
        window.isViewingSpecificMonth = false; // Reset flag when showing budget
        updateRing();
        showBtn.textContent = 'Hide Monthly Budget';
        
        // Set month selector to current month
        const monthSelector = document.getElementById('monthSelector');
        if (monthSelector && !monthSelector.value) {
          const today = new Date();
          const month = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
          monthSelector.value = month;
        }
      };

      showBtn.addEventListener('click', () => {
        const isHidden = budgetSection.style.display === 'none' || budgetSection.style.display === '';
        if (isHidden) {
          showSection();
        } else {
          budgetSection.style.display = 'none';
          showBtn.textContent = 'Show Monthly Budget';
        }
      });
    }

    // Set Monthly Budget handler
    const setBtn = document.getElementById('setBudgetBtn');
    if (setBtn) {
      setBtn.addEventListener('click', () => {
        const current = total;
        const input = prompt('Enter monthly budget (₹):', String(current));
        if (input === null) return; // cancelled
        const val = Math.floor(Number(input));
        if (!isFinite(val) || val <= 0) {
          console.log('Please enter a valid positive number.');
          return;
        }
        total = val;
        localStorage.setItem(getBudgetKey(), String(total));
        totalEl.textContent = total;
        updateRing();
      });
    }

    // Initial update and auto-refresh every 2 seconds only if not viewing specific month
    updateRing();
    if (autoUpdateInterval) {
      clearInterval(autoUpdateInterval);
    }
    autoUpdateInterval = setInterval(() => {
      if (!window.isViewingSpecificMonth) {
        updateRing();
      }
    }, 2000);
  }

  // Ensure DOM is ready before init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBudgetUI);
  } else {
    initBudgetUI();
  }
})();

// Automatic Features - Authentication removed
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== EXPENSE MANAGER INITIALIZATION ===');
    
    // Initialize Firebase and check auth state
    if (window.initFirebaseAuth) {
      const user = await window.initFirebaseAuth();
      if (!user) {
        // No user signed in, show auth container
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
      } else {
        // User is signed in
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
      }
    }
});

// Continue as guest (skip login)
function continueAsGuest() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  console.log('✓ Continuing as guest');
}

// Theme toggle functionality
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const toggleBtn = document.querySelector('.theme-toggle');
  toggleBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Hamburger menu toggle functionality
function toggleHamburgerMenu() {
  const button = document.querySelector('.hamburger-button');
  const dropdown = document.getElementById('hamburgerDropdown');
  
  button.classList.toggle('active');
  dropdown.classList.toggle('show');
}

// Expose functions to global scope for inline event handlers
window.continueAsGuest = continueAsGuest;
window.toggleTheme = toggleTheme;
window.toggleHamburgerMenu = toggleHamburgerMenu;

// User menu toggle functionality
function toggleUserMenu() {
  const dropdown = document.getElementById('userMenuDropdown');
  dropdown.classList.toggle('show');
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
  const userMenuContainer = document.querySelector('.user-menu-container');
  const dropdown = document.getElementById('userMenuDropdown');
  
  if (!userMenuContainer.contains(event.target)) {
    dropdown.classList.remove('show');
  }
});

// Expose toggleUserMenu globally
window.toggleUserMenu = toggleUserMenu;
// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
const toggleBtn = document.querySelector('.theme-toggle');
if (toggleBtn) {
  toggleBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
