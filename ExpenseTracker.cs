/*
 * =============================================
 * ExpenseTracker.cs — SpendSmart Backend Logic
 * Mini Capstone Project | First Year IT
 * 
 * This file contains the core C# logic for the
 * Student Expense Tracker system including:
 *  - Expense model (class/object)
 *  - Input validation methods
 *  - CRUD operations (Add, Delete, List)
 *  - Budget management
 *  - Summary/statistics computation
 * =============================================
 */

using System;
using System.Collections.Generic;
using System.Linq;

namespace SpendSmart
{
    // =============================================
    // MODEL CLASS: Expense
    // Represents a single expense entry (OOP)
    // =============================================

    /// <summary>
    /// Represents a single expense record.
    /// </summary>
    public class Expense
    {
        // Properties
        public int    Id          { get; set; }
        public string Date        { get; set; }
        public string Description { get; set; }
        public string Category    { get; set; }
        public double Amount      { get; set; }
        public string Notes       { get; set; }

        /// <summary>
        /// Constructor to create an Expense object.
        /// </summary>
        public Expense(int id, string date, string description, string category, double amount, string notes = "")
        {
            Id          = id;
            Date        = date;
            Description = description;
            Category    = category;
            Amount      = amount;
            Notes       = notes;
        }

        /// <summary>
        /// Returns a formatted string representation of this expense.
        /// </summary>
        public override string ToString()
        {
            return $"[{Id}] {Date} | {Category} | {Description} | ₱{Amount:F2} | {Notes}";
        }
    }

    // =============================================
    // MODEL CLASS: User
    // Represents a system user (OOP)
    // =============================================

    /// <summary>
    /// Represents a registered user.
    /// </summary>
    public class User
    {
        public string Username { get; set; }
        public string Email    { get; set; }
        public string Password { get; set; }

        public User(string username, string email, string password)
        {
            Username = username;
            Email    = email;
            Password = password;
        }
    }

    // =============================================
    // SERVICE CLASS: ValidationService
    // Handles all input validation logic
    // =============================================

    /// <summary>
    /// Contains static methods for validating user inputs.
    /// </summary>
    public static class ValidationService
    {
        // Valid expense categories
        private static readonly string[] ValidCategories = {
            "Food", "Transportation", "School Supplies", "Entertainment", "Health", "Others"
        };

        /// <summary>
        /// Validates that a string is not empty or whitespace.
        /// </summary>
        public static bool IsNotEmpty(string value)
        {
            return !string.IsNullOrWhiteSpace(value);
        }

        /// <summary>
        /// Validates that the description is at least 3 characters.
        /// </summary>
        public static bool IsValidDescription(string desc)
        {
            return IsNotEmpty(desc) && desc.Trim().Length >= 3;
        }

        /// <summary>
        /// Validates that a date string is in the correct format (YYYY-MM-DD).
        /// </summary>
        public static bool IsValidDate(string date)
        {
            return DateTime.TryParseExact(
                date,
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out _
            );
        }

        /// <summary>
        /// Validates that the amount is a positive number.
        /// </summary>
        public static bool IsValidAmount(double amount)
        {
            return amount > 0;
        }

        /// <summary>
        /// Validates that the category is one of the accepted values.
        /// </summary>
        public static bool IsValidCategory(string category)
        {
            return Array.Exists(ValidCategories, c => c.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Validates that the email is a Gmail address ending in @gmail.com.
        /// </summary>
        public static bool IsValidGmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return email.Trim().ToLower().EndsWith("@gmail.com");
        }

        /// <summary>
        /// Validates login credentials.
        /// </summary>
        public static bool IsValidCredentials(string username, string password)
        {
            return IsNotEmpty(username) && IsNotEmpty(password);
        }
    }

    // =============================================
    // SERVICE CLASS: ExpenseService
    // Handles all expense CRUD operations
    // =============================================

    /// <summary>
    /// Manages all expense operations: Add, Delete, List, Filter, Summary.
    /// </summary>
    public class ExpenseService
    {
        // Private list to store all expenses (encapsulation)
        private List<Expense> _expenses = new List<Expense>();
        private int _nextId = 1;
        private double _monthlyBudget = 0;

        // ── ADD EXPENSE ──────────────────────────────

        /// <summary>
        /// Adds a new expense after full validation.
        /// Returns true if successful, false otherwise.
        /// </summary>
        public bool AddExpense(string date, string description, string category, double amount, string notes, out string errorMessage)
        {
            errorMessage = "";

            // Validate date
            if (!ValidationService.IsValidDate(date))
            {
                errorMessage = "Invalid date. Use format YYYY-MM-DD.";
                return false;
            }

            // Validate description
            if (!ValidationService.IsValidDescription(description))
            {
                errorMessage = "Description must be at least 3 characters and not empty.";
                return false;
            }

            // Validate category
            if (!ValidationService.IsValidCategory(category))
            {
                errorMessage = "Invalid category. Choose from: Food, Transportation, School Supplies, Entertainment, Health, Others.";
                return false;
            }

            // Validate amount
            if (!ValidationService.IsValidAmount(amount))
            {
                errorMessage = "Amount must be greater than zero.";
                return false;
            }

            // All validations passed — create and add the expense
            var expense = new Expense(_nextId++, date, description.Trim(), category, amount, notes.Trim());
            _expenses.Add(expense);

            Console.WriteLine($"[SUCCESS] Expense added: {expense}");
            return true;
        }

        // ── DELETE EXPENSE ───────────────────────────

        /// <summary>
        /// Deletes an expense by its ID.
        /// Returns true if found and deleted, false otherwise.
        /// </summary>
        public bool DeleteExpense(int id)
        {
            // Find the expense with the matching ID
            var expense = _expenses.FirstOrDefault(e => e.Id == id);

            if (expense == null)
            {
                Console.WriteLine($"[ERROR] Expense with ID {id} not found.");
                return false;
            }

            _expenses.Remove(expense);
            Console.WriteLine($"[SUCCESS] Expense ID {id} deleted.");
            return true;
        }

        // ── LIST EXPENSES ────────────────────────────

        /// <summary>
        /// Returns all expenses, sorted by date (newest first).
        /// </summary>
        public List<Expense> GetAllExpenses()
        {
            return _expenses.OrderByDescending(e => e.Date).ToList();
        }

        // ── FILTER EXPENSES ──────────────────────────

        /// <summary>
        /// Filters expenses by category.
        /// </summary>
        public List<Expense> FilterByCategory(string category)
        {
            return _expenses
                .Where(e => e.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(e => e.Date)
                .ToList();
        }

        /// <summary>
        /// Searches expenses by keyword in description.
        /// </summary>
        public List<Expense> SearchByKeyword(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return GetAllExpenses();

            return _expenses
                .Where(e => e.Description.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(e => e.Date)
                .ToList();
        }

        // ── BUDGET ───────────────────────────────────

        /// <summary>
        /// Sets the monthly budget. Must be greater than zero.
        /// </summary>
        public bool SetBudget(double budget, out string errorMessage)
        {
            errorMessage = "";

            if (budget <= 0)
            {
                errorMessage = "Budget must be greater than zero.";
                return false;
            }

            _monthlyBudget = budget;
            Console.WriteLine($"[SUCCESS] Monthly budget set to ₱{budget:F2}");
            return true;
        }

        /// <summary>
        /// Returns the current monthly budget.
        /// </summary>
        public double GetBudget()
        {
            return _monthlyBudget;
        }

        // ── SUMMARY STATISTICS ───────────────────────

        /// <summary>
        /// Computes and returns a summary of all expenses.
        /// </summary>
        public void PrintSummary()
        {
            if (_expenses.Count == 0)
            {
                Console.WriteLine("[INFO] No expenses recorded.");
                return;
            }

            double total   = GetTotalExpenses();
            double highest = GetHighestExpense();
            double remaining = _monthlyBudget - total;

            Console.WriteLine("===== EXPENSE SUMMARY =====");
            Console.WriteLine($"Total Expenses  : ₱{total:F2}");
            Console.WriteLine($"No. of Entries  : {_expenses.Count}");
            Console.WriteLine($"Highest Expense : ₱{highest:F2}");
            Console.WriteLine($"Monthly Budget  : ₱{_monthlyBudget:F2}");
            Console.WriteLine($"Remaining       : ₱{remaining:F2}");

            // Budget warning using conditions (if-else)
            if (_monthlyBudget > 0)
            {
                if (remaining < 0)
                    Console.WriteLine("⚠️  STATUS: Over budget!");
                else if (remaining < _monthlyBudget * 0.2)
                    Console.WriteLine("⚠️  STATUS: Near budget limit.");
                else
                    Console.WriteLine("✅  STATUS: Within budget.");
            }

            // Category breakdown using loops
            Console.WriteLine("\n--- Spending by Category ---");
            var categories = _expenses.GroupBy(e => e.Category);
            foreach (var group in categories)
            {
                double catTotal = group.Sum(e => e.Amount);
                Console.WriteLine($"  {group.Key}: ₱{catTotal:F2}");
            }
        }

        /// <summary>
        /// Returns the sum of all expense amounts.
        /// </summary>
        public double GetTotalExpenses()
        {
            double total = 0;
            foreach (var expense in _expenses)
            {
                total += expense.Amount;
            }
            return total;
        }

        /// <summary>
        /// Returns the highest single expense amount.
        /// </summary>
        public double GetHighestExpense()
        {
            if (_expenses.Count == 0) return 0;

            double highest = _expenses[0].Amount;
            foreach (var expense in _expenses)
            {
                if (expense.Amount > highest)
                    highest = expense.Amount;
            }
            return highest;
        }
    }

    // =============================================
    // SERVICE CLASS: AuthService
    // Handles user login authentication
    // =============================================

    /// <summary>
    /// Handles user authentication (login/logout/registration).
    /// </summary>
    public class AuthService
    {
        // In-memory user store (in a real app, this would be a database)
        private readonly List<User> _users = new List<User>();

        private User _currentUser = null;

        /// <summary>
        /// Registers a new user with username, Gmail, and password.
        /// Returns true if registration is successful.
        /// </summary>
        public bool Register(string username, string email, string password, string confirmPassword, out string errorMessage)
        {
            errorMessage = "";

            // Validate: Username not empty and at least 3 characters
            if (!ValidationService.IsNotEmpty(username) || username.Trim().Length < 3)
            {
                errorMessage = "Username must be at least 3 characters.";
                return false;
            }

            // Validate: Email must be a Gmail address
            if (!ValidationService.IsValidGmail(email))
            {
                errorMessage = "Only Gmail addresses are allowed (e.g. yourname@gmail.com).";
                return false;
            }

            // Validate: Password at least 6 characters
            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            {
                errorMessage = "Password must be at least 6 characters.";
                return false;
            }

            // Validate: Passwords must match
            if (password != confirmPassword)
            {
                errorMessage = "Passwords do not match.";
                return false;
            }

            // Check: Username already taken
            if (_users.Any(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase)))
            {
                errorMessage = "Username already taken.";
                return false;
            }

            // Check: Gmail already registered
            if (_users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)))
            {
                errorMessage = "This Gmail is already registered.";
                return false;
            }

            // All validations passed — save the new user
            _users.Add(new User(username.Trim(), email.Trim(), password));
            Console.WriteLine($"[SUCCESS] Account created for: {username}");
            return true;
        }

        /// <summary>
        /// Attempts to log in with the given credentials.
        /// Returns true if login is successful.
        /// </summary>
        public bool Login(string username, string password, out string errorMessage)
        {
            errorMessage = "";

            if (!ValidationService.IsValidCredentials(username, password))
            {
                errorMessage = "Username and password are required.";
                return false;
            }

            // Search for matching user
            foreach (var user in _users)
            {
                if (user.Username == username && user.Password == password)
                {
                    _currentUser = user;
                    Console.WriteLine($"[SUCCESS] Welcome, {username}!");
                    return true;
                }
            }

            errorMessage = "Invalid username or password.";
            return false;
        }

        /// <summary>
        /// Logs out the current user.
        /// </summary>
        public void Logout()
        {
            if (_currentUser != null)
            {
                Console.WriteLine($"[INFO] {_currentUser.Username} has logged out.");
                _currentUser = null;
            }
        }

        public bool IsLoggedIn() => _currentUser != null;
        public string GetCurrentUsername() => _currentUser?.Username ?? "Guest";
    }

    // =============================================
    // MAIN PROGRAM — Console Demo
    // =============================================

    /// <summary>
    /// Entry point: demonstrates the system logic via console.
    /// </summary>
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("  SpendSmart — Student Expense Tracker  ");
            Console.WriteLine("========================================\n");

            // Initialize services
            var auth    = new AuthService();
            var tracker = new ExpenseService();

            // --- REGISTER ---
            Console.WriteLine("=== REGISTER ===");
            if (auth.Register("student", "student@gmail.com", "mypass123", "mypass123", out string regError))
                Console.WriteLine("Registration successful!");
            else
                Console.WriteLine($"Registration failed: {regError}");

            // --- LOGIN ---
            Console.WriteLine("\n=== LOGIN ===");
            if (auth.Login("student", "mypass123", out string loginError))
            {
                Console.WriteLine($"Logged in as: {auth.GetCurrentUsername()}\n");
            }
            else
            {
                Console.WriteLine($"Login failed: {loginError}");
                return;
            }

            // --- SET BUDGET ---
            Console.WriteLine("=== SET BUDGET ===");
            tracker.SetBudget(3000, out string budgetError);

            // --- ADD EXPENSES ---
            Console.WriteLine("\n=== ADDING EXPENSES ===");
            tracker.AddExpense("2025-06-01", "Lunch at canteen",   "Food",             85.00,  "Rice + viand",             out _);
            tracker.AddExpense("2025-06-01", "Jeepney fare",        "Transportation",   25.00,  "Home to school",           out _);
            tracker.AddExpense("2025-06-02", "Notebook and pen",    "School Supplies",  150.00, "For Math class",           out _);
            tracker.AddExpense("2025-06-03", "Mobile Legends load", "Entertainment",    100.00, "Weekend gaming",           out _);
            tracker.AddExpense("2025-06-04", "Vitamins",            "Health",           75.00,  "Multivitamins for a week", out _);
            tracker.AddExpense("2025-06-05", "Snack from 7-Eleven", "Food",             55.00,  "",                         out _);

            // --- VALIDATION DEMO (should fail) ---
            Console.WriteLine("\n=== VALIDATION TEST (should fail) ===");
            bool result = tracker.AddExpense("", "", "Unknown", -999, "", out string errMsg);
            Console.WriteLine($"Result: {result} | Error: {errMsg}");

            // --- LIST ALL ---
            Console.WriteLine("\n=== ALL EXPENSES ===");
            foreach (var exp in tracker.GetAllExpenses())
            {
                Console.WriteLine(exp);
            }

            // --- FILTER BY CATEGORY ---
            Console.WriteLine("\n=== FILTER: Food ===");
            foreach (var exp in tracker.FilterByCategory("Food"))
            {
                Console.WriteLine(exp);
            }

            // --- SEARCH ---
            Console.WriteLine("\n=== SEARCH: 'lunch' ===");
            foreach (var exp in tracker.SearchByKeyword("lunch"))
            {
                Console.WriteLine(exp);
            }

            // --- SUMMARY ---
            Console.WriteLine("\n=== SUMMARY ===");
            tracker.PrintSummary();

            // --- DELETE ---
            Console.WriteLine("\n=== DELETE EXPENSE (ID 2) ===");
            tracker.DeleteExpense(2);

            // --- LOGOUT ---
            Console.WriteLine("\n=== LOGOUT ===");
            auth.Logout();

            Console.WriteLine("\nProgram ended. Press any key to exit...");
            Console.ReadKey();
        }
    }
}
