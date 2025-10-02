from .db import getConnection


def makeWithdrawal(username, amount, medium, note):
    try:
        # Validate inputs
        if not username or not isinstance(username, str):
            return {"result": False, "message": "Invalid username"}
        if not amount or not isinstance(amount, (int, float, str)) or float(amount) <= 0:
            return {"result": False, "message": "Amount must be a positive number"}
        if not medium or medium not in [
            "Food", "Transportation", "Entertainment", "Shopping",
            "Bills", "Healthcare", "Education", "Travel"
        ]:
            return {"result": False, "message": "Invalid expense category"}
        if note and len(note) > 255:
            return {"result": False, "message": "Note cannot exceed 255 characters"}

        conn = getConnection()
        cursor = conn.cursor()

        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        result = cursor.fetchone()
        if not result:
            return {"result": False, "message": "User not found"}
        id = int(result[0])

        # Fetch total budget, min amount, and budget control for this category
        cursor.execute('''
            SELECT SUM(Amount), SUM(Min_Amount), MAX(Budget_Control)
            FROM expenses
            WHERE User_ID=%s AND Expense_For=%s
        ''', (id, medium))
        result = cursor.fetchone()
        total_expense = float(result[0] or 0)
        total_min = float(result[1] or 0)
        budget_control = int(result[2] or 0)

        # Fetch total withdrawn amount already made for this category
        cursor.execute('''
            SELECT SUM(Amount)
            FROM withdraw
            WHERE User_ID=%s AND Expense_From=%s
        ''', (id, medium))
        withdrawn = float(cursor.fetchone()[0] or 0)

        # Calculate the remaining balance
        remaining = total_expense - withdrawn

        if float(amount) > remaining:
            return {"result": False, "message": "Withdrawal denied: The requested amount exceeds your remaining budget for this category."}

        if budget_control == 1 and float(amount) > total_min:
            return {"result": False, "message": "Withdrawal denied: This amount exceeds the minimum threshold set under budget control."}

        # All checks passed, insert withdrawal
        cursor.execute('''
            INSERT INTO withdraw(User_ID, Amount, Expense_From, Note)
            VALUES(%s, %s, %s, %s)
        ''', (id, float(amount), medium, note or ' '))
        conn.commit()
        return {"result": True, "message": "Withdrawal successful"}
    except Exception as e:
        conn.rollback()
        return {"result": False, "message": f"Database error: {str(e)}"}
    finally:
        cursor.close()
        conn.close()


def getSpendRecord(username):
    try:
        conn = getConnection()
        cursor = conn.cursor()

        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        result = cursor.fetchone()
        if not result:
            return {}

        id = int(result[0])

        # Fetch total budget per category
        cursor.execute('''
            SELECT Expense_For, SUM(Amount)
            FROM expenses
            WHERE User_ID=%s
            GROUP BY Expense_For
        ''', (id,))
        total_budgets = {row[0]: float(row[1]) for row in cursor.fetchall()}

        # Fetch total withdrawals per category
        cursor.execute('''
            SELECT Expense_From, SUM(Amount)
            FROM withdraw
            WHERE User_ID=%s
            GROUP BY Expense_From
        ''', (id,))
        total_withdrawals = {row[0]: float(row[1]) for row in cursor.fetchall()}

        # Combine into one: remaining = budget - withdrawal
        category_balance = {}
        for category in total_budgets:
            spent = total_withdrawals.get(category, 0)
            remaining = total_budgets[category] - spent
            category_balance[category] = {
                "budget": total_budgets[category],
                "withdrawn": spent,
                "remaining": remaining
            }

        return category_balance
    finally:
        cursor.close()
        conn.close()