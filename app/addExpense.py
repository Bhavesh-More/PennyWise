from .db import getConnection
import calendar
from datetime import datetime


def addExpense(username, amount, source, note, budgetControl, minDeposit):
    try:
        # Validate inputs
        if not username or not isinstance(username, str):
            return {"result": False, "message": "Invalid username"}
        if not amount or not isinstance(amount, (int, float, str)) or float(amount) <= 0:
            return {"result": False, "message": "Amount must be a positive number"}
        if not source or source not in [
            "Food", "Transportation", "Entertainment", "Shopping",
            "Bills", "Healthcare", "Education", "Travel"
        ]:
            return {"result": False, "message": "Invalid expense category"}
        if note and len(note) > 255:
            return {"result": False, "message": "Note cannot exceed 255 characters"}
        if budgetControl and (not minDeposit or float(minDeposit) < 0):
            return {"result": False, "message": "Minimum deposit amount must be non-negative when budget control is enabled"}
        if budgetControl and float(minDeposit) > float(amount):
            return {"result": False, "message": "Minimum deposit amount cannot exceed the allocated amount"}

        conn = getConnection()
        cursor = conn.cursor()


        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        result = cursor.fetchone()
        if not result:
            return {"result": False, "message": "User not found"}
        id = int(result[0])

        today = datetime.today()
        year = today.year
        month = today.month

        # Get last day of the month
        last_day = calendar.monthrange(year, month)[1]

        # Create date object for last day
        expiry_date = datetime(year, month, last_day)

        cursor.execute(
            'INSERT INTO expenses(User_ID, Amount, Expense_For, Note, Budget_Control, Min_Amount, Expiry_Date) '
            'VALUES(%s, %s, %s, %s, %s, %s, %s)',
            (id, float(amount), source, note or ' ', int(budgetControl), float(minDeposit or 0), expiry_date)
        )
        conn.commit()
        return {"result": True, "message": "Expense added successfully"}
    except Exception as e:
        conn.rollback()
        return {"result": False, "message": f"Database error: {str(e)}"}
    finally:
        cursor.close()
        conn.close()


def showExpenseCategories(username):
    try:
        conn = getConnection()
        cursor = conn.cursor()


        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        result = cursor.fetchone()
        if not result:
            return {}

        id = int(result[0])

        # Fetch total amount for each category
        cursor.execute('''
            SELECT Expense_for, SUM(Amount)
            FROM expenses
            WHERE User_ID=%s
            GROUP BY Expense_for
        ''', (id,))

        # Create a dictionary {category: total_amount}
        category_totals = {row[0]: float(row[1]) for row in cursor.fetchall()}

        return category_totals
    finally:
        cursor.close()
        conn.close()