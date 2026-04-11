/**
 * app.js — SpendSmart Student Expense Tracker
 * JavaScript Logic (simulates C# backend behavior)
 * 
 * Features:
 *  - Login with validation
 *  - Add / Delete / Clear expenses
 *  - Category filter & search
 *  - Budget tracker with visual bar
 *  - Dashboard summary + category chart
 *  - Input validation on all fields
 */

// =============================================
//  DATA STORE (simulates a backend database)
// =============================================

/** @type {{ date:string, desc:string, category:string, amount:number, notes:string }[]} */
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");

/** @type {number} */
let monthlyBudget = parseFloat(localStorage.getItem("budget") || "0");

/** @type {string} */
let currentUser = "";

// =============================================
//  UTILITY FUNCTIONS
// =============================================

/**
 * Formats a number as Philippine Peso currency.
 * @param {number} amount
 * @returns {string}
 */
function formatPeso(amount) {
  return "₱" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Saves the current expenses array to localStorage (per user).
 */
function saveExpenses() {
  localStorage.setItem('expenses_' + currentUser, JSON.stringify(expenses));
}

/**
 * Clears a specific error message field.
 * @param {string} id - Element ID of the error span
 */
function clearError(id) {
  document.getElementById(id).textContent = "";
}

/**
 * Displays an error message on a specific element.
 * @param {string} id - Element ID
 * @param {string} msg - Error message
 */
function showError(id, msg) {
  document.getElementById(id).textContent = msg;
}

// =============================================
//  AUTH TAB SWITCHER
// =============================================

/**
 * Switches between the Login and Register forms.
 * @param {'login'|'register'} tab
 */
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display    = isLogin ? 'block' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none'  : 'block';
  document.getElementById('tabLoginBtn').classList.toggle('active', isLogin);
  document.getElementById('tabRegisterBtn').classList.toggle('active', !isLogin);
  // Clear errors when switching
  ['errUsername','errPassword','errRegUsername','errRegEmail','errRegPassword','errRegConfirm'].forEach(clearError);
  document.getElementById('regSuccessMsg').classList.add('hidden');
}

// =============================================
//  REGISTRATION
// =============================================

/**
 * Validates and registers a new user account.
 * Stores users in localStorage so they persist between sessions.
 */
function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  // Clear all errors first
  ['errRegUsername','errRegEmail','errRegPassword','errRegConfirm'].forEach(clearError);

  let valid = true;

  // Validate: Username not empty and at least 3 characters
  if (username === '') {
    showError('errRegUsername', 'Username is required.');
    valid = false;
  } else if (username.length < 3) {
    showError('errRegUsername', 'Username must be at least 3 characters.');
    valid = false;
  }

  // Validate: Email must be a Gmail address
  if (email === '') {
    showError('errRegEmail', 'Gmail address is required.');
    valid = false;
  } else if (!email.toLowerCase().endsWith('@gmail.com')) {
    showError('errRegEmail', 'Only Gmail addresses are allowed (e.g. yourname@gmail.com).');
    valid = false;
  }

  // Validate: Password at least 6 characters
  if (password === '') {
    showError('errRegPassword', 'Password is required.');
    valid = false;
  } else if (password.length < 6) {
    showError('errRegPassword', 'Password must be at least 6 characters.');
    valid = false;
  }

  // Validate: Confirm password must match
  if (confirm === '') {
    showError('errRegConfirm', 'Please confirm your password.');
    valid = false;
  } else if (password !== confirm) {
    showError('errRegConfirm', 'Passwords do not match.');
    valid = false;
  }

  if (!valid) return;

  // Load existing users from localStorage
  const users = JSON.parse(localStorage.getItem('ss_users') || '[]');

  // Check if username already exists
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    showError('errRegUsername', 'Username already taken. Please choose another.');
    return;
  }

  // Check if Gmail is already registered
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    showError('errRegEmail', 'This Gmail is already registered.');
    return;
  }

  // Save new user
  users.push({ username, email, password });
  localStorage.setItem('ss_users', JSON.stringify(users));

  // Show success and switch to login
  document.getElementById('regSuccessMsg').classList.remove('hidden');
  document.getElementById('regUsername').value = '';
  document.getElementById('regEmail').value    = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regConfirm').value  = '';

  // Auto-switch to login after 1.5 seconds
  setTimeout(() => switchAuthTab('login'), 1500);
}

// =============================================
//  LOGIN / LOGOUT
// =============================================

/**
 * Handles the login process.
 * Checks credentials against registered users in localStorage.
 */
function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  let valid = true;

  clearError('errUsername');
  clearError('errPassword');

  if (username === '') {
    showError('errUsername', 'Username is required.');
    valid = false;
  }

  if (password === '') {
    showError('errPassword', 'Password is required.');
    valid = false;
  }

  if (!valid) return;

  // Load registered users from localStorage
  const users = JSON.parse(localStorage.getItem('ss_users') || '[]');

  // Find matching user
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    currentUser = user.username;
    document.getElementById('loggedUser').textContent = currentUser;
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');

    // Load this user's expenses from localStorage
    expenses = JSON.parse(localStorage.getItem('expenses_' + currentUser) || '[]');
    monthlyBudget = parseFloat(localStorage.getItem('budget_' + currentUser) || '0');
    if (monthlyBudget > 0) document.getElementById('budgetInput').value = monthlyBudget;

    refreshDashboard();
    renderHistoryTable(expenses);
    updateBudgetStatus();
  } else {
    showError('errPassword', 'Invalid username or password.');
  }
}

/**
 * Handles logout. Resets the view to the login screen.
 */
function handleLogout() {
  if (!confirm('Are you sure you want to log out?')) return;
  document.getElementById('dashboardScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  currentUser = '';
  expenses = [];
  monthlyBudget = 0;
}

// Allow pressing Enter to login
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && document.getElementById("loginScreen").classList.contains("active")) {
    handleLogin();
  }
});

// =============================================
//  TAB NAVIGATION
// =============================================

/**
 * Switches the visible tab in the dashboard.
 * @param {string} tabName - One of: dashboard, add, history, budget
 */
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  // Deactivate all nav items
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  // Activate selected tab
  document.getElementById("tab-" + tabName).classList.add("active");

  // Update tab title
  const titles = { dashboard: "Dashboard", add: "Add Expense", history: "History", budget: "Budget" };
  document.getElementById("tabTitle").textContent = titles[tabName] || tabName;

  // Highlight correct nav item (index-based match)
  const navItems = document.querySelectorAll(".nav-item");
  const map = { dashboard: 0, add: 1, history: 2, budget: 3 };
  if (map[tabName] !== undefined) navItems[map[tabName]].classList.add("active");

  // Refresh views when switching tabs
  if (tabName === "dashboard") refreshDashboard();
  if (tabName === "history") renderHistoryTable(expenses);
  if (tabName === "budget") updateBudgetStatus();
}

// =============================================
//  ADD EXPENSE
// =============================================

/**
 * Validates input fields and adds a new expense entry.
 * Implements the same validation logic as a C# backend method.
 */
function addExpense() {
  const date     = document.getElementById("expDate").value.trim();
  const desc     = document.getElementById("expDesc").value.trim();
  const category = document.getElementById("expCategory").value;
  const amount   = parseFloat(document.getElementById("expAmount").value);
  const notes    = document.getElementById("expNotes").value.trim();

  // Clear previous error messages
  ["errDate", "errDesc", "errCategory", "errAmount"].forEach(clearError);

  let valid = true;

  // Validate: Date must not be empty
  if (date === "") {
    showError("errDate", "Please select a date.");
    valid = false;
  }

  // Validate: Description must not be empty and must have at least 3 characters
  if (desc === "") {
    showError("errDesc", "Description is required.");
    valid = false;
  } else if (desc.length < 3) {
    showError("errDesc", "Description must be at least 3 characters.");
    valid = false;
  }

  // Validate: Category must be selected
  if (category === "") {
    showError("errCategory", "Please select a category.");
    valid = false;
  }

  // Validate: Amount must be a positive number
  if (isNaN(amount) || amount <= 0) {
    showError("errAmount", "Please enter a valid amount greater than 0.");
    valid = false;
  }

  if (!valid) return;

  // Create new expense object
  const newExpense = { date, desc, category, amount, notes };
  expenses.push(newExpense);
  saveExpenses();

  // Show success feedback
  const successEl = document.getElementById("successMsg");
  successEl.classList.remove("hidden");
  setTimeout(() => successEl.classList.add("hidden"), 2500);

  clearForm();
  refreshDashboard();
}

/**
 * Clears all input fields in the Add Expense form.
 */
function clearForm() {
  ["expDate", "expDesc", "expAmount", "expNotes"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("expCategory").value = "";
  ["errDate", "errDesc", "errCategory", "errAmount"].forEach(clearError);
}

// =============================================
//  DELETE EXPENSE
// =============================================

/**
 * Deletes an expense by its index in the array.
 * @param {number} index
 */
function deleteExpense(index) {
  if (!confirm("Delete this expense?")) return;
  expenses.splice(index, 1);
  saveExpenses();
  filterExpenses();      // Re-render with current filters
  refreshDashboard();
}

/**
 * Clears all expense entries after confirmation.
 */
function clearAllExpenses() {
  if (expenses.length === 0) { alert("No expenses to clear."); return; }
  if (!confirm("This will delete ALL expenses. Continue?")) return;
  expenses = [];
  saveExpenses();
  renderHistoryTable([]);
  refreshDashboard();
}

// =============================================
//  HISTORY TABLE
// =============================================

/**
 * Renders the expense history table with a given list.
 * @param {{ date:string, desc:string, category:string, amount:number, notes:string }[]} list
 */
function renderHistoryTable(list) {
  const tbody    = document.getElementById("historyTable");
  const noMsg    = document.getElementById("noExpenses");
  tbody.innerHTML = "";

  if (list.length === 0) {
    noMsg.style.display = "block";
    return;
  }

  noMsg.style.display = "none";

  // Sort by date descending
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((exp, i) => {
    // Find actual index in the original expenses array
    const realIndex = expenses.findIndex(
      e => e.date === exp.date && e.desc === exp.desc && e.amount === exp.amount
    );
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.desc}</td>
      <td><span class="badge">${exp.category}</span></td>
      <td><strong>${formatPeso(exp.amount)}</strong></td>
      <td style="color:var(--text-muted); font-size:0.82rem">${exp.notes || "—"}</td>
      <td><button class="btn-del" onclick="deleteExpense(${realIndex})">🗑 Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// =============================================
//  SEARCH & FILTER
// =============================================

/**
 * Filters expenses by search keyword and/or category.
 * Called on every keystroke in the search bar or category change.
 */
function filterExpenses() {
  const keyword  = (document.getElementById("searchBar").value || "").toLowerCase();
  const category = document.getElementById("filterCategory").value;

  const filtered = expenses.filter(exp => {
    const matchSearch   = keyword === "" ||
      exp.desc.toLowerCase().includes(keyword) ||
      exp.category.toLowerCase().includes(keyword) ||
      exp.amount.toString().includes(keyword);
    const matchCategory = category === "" || exp.category === category;
    return matchSearch && matchCategory;
  });

  renderHistoryTable(filtered);
}

// =============================================
//  DASHBOARD SUMMARY
// =============================================

/**
 * Refreshes all dashboard statistics and charts.
 */
function refreshDashboard() {
  const total   = expenses.reduce((sum, e) => sum + e.amount, 0);
  const highest = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
  const remaining = monthlyBudget - total;

  document.getElementById("totalExpenses").textContent  = formatPeso(total);
  document.getElementById("entryCount").textContent     = expenses.length;
  document.getElementById("highestExpense").textContent = formatPeso(highest);
  document.getElementById("budgetRemaining").textContent = formatPeso(remaining >= 0 ? remaining : 0);

  renderRecentExpenses();
  renderCategoryChart();
}

/**
 * Renders the 5 most recent expenses in the dashboard table.
 */
function renderRecentExpenses() {
  const tbody = document.getElementById("recentExpenses");
  tbody.innerHTML = "";

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No expenses yet.</td></tr>`;
    return;
  }

  recent.forEach(exp => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.desc}</td>
      <td><span class="badge">${exp.category}</span></td>
      <td><strong>${formatPeso(exp.amount)}</strong></td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Renders a horizontal bar chart showing spending per category.
 */
function renderCategoryChart() {
  const container = document.getElementById("categoryChart");
  container.innerHTML = "";

  const categories = ["Food", "Transportation", "School Supplies", "Entertainment", "Health", "Others"];
  const totals = {};

  categories.forEach(cat => {
    totals[cat] = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  });

  const maxVal = Math.max(...Object.values(totals), 1);

  categories.forEach(cat => {
    if (totals[cat] === 0) return; // Only show categories with data
    const pct = (totals[cat] / maxVal) * 100;
    const row = document.createElement("div");
    row.className = "cat-row";
    row.innerHTML = `
      <span class="cat-label">${cat}</span>
      <div class="cat-bar-bg">
        <div class="cat-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="cat-amount">${formatPeso(totals[cat])}</span>
    `;
    container.appendChild(row);
  });

  if (container.innerHTML === "") {
    container.innerHTML = `<p class="empty-state">Add expenses to see your spending breakdown.</p>`;
  }
}

// =============================================
//  BUDGET MANAGER
// =============================================

/**
 * Validates and saves the monthly budget value.
 */
function setBudget() {
  clearError("errBudget");
  const val = parseFloat(document.getElementById("budgetInput").value);

  // Validate: Budget must be a positive number
  if (isNaN(val) || val <= 0) {
    showError("errBudget", "Please enter a valid budget greater than 0.");
    return;
  }

  monthlyBudget = val;
  localStorage.setItem('budget_' + currentUser, val.toString());

  const successEl = document.getElementById("budgetSuccess");
  successEl.classList.remove("hidden");
  setTimeout(() => successEl.classList.add("hidden"), 2000);

  updateBudgetStatus();
  refreshDashboard();
}

/**
 * Updates the budget progress bar and status text.
 */
function updateBudgetStatus() {
  const box    = document.getElementById("budgetStatusBox");
  const bar    = document.getElementById("budgetBarFill");
  const text   = document.getElementById("budgetStatusText");
  const total  = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (monthlyBudget === 0) {
    bar.style.width = "0%";
    text.textContent = "No budget set yet.";
    return;
  }

  const pct  = Math.min((total / monthlyBudget) * 100, 100);
  const left = monthlyBudget - total;

  bar.style.width = pct.toFixed(1) + "%";
  bar.classList.remove("over", "near");

  if (pct >= 100) {
    bar.classList.add("over");
    text.textContent = `⚠️ Over budget by ${formatPeso(Math.abs(left))}!`;
    text.style.color = "var(--danger)";
  } else if (pct >= 80) {
    bar.classList.add("near");
    text.textContent = `⚠️ ${pct.toFixed(0)}% used — Only ${formatPeso(left)} remaining.`;
    text.style.color = "var(--warning)";
  } else {
    text.textContent = `✅ ${pct.toFixed(0)}% used — ${formatPeso(left)} remaining of ${formatPeso(monthlyBudget)}.`;
    text.style.color = "var(--success)";
  }
}


