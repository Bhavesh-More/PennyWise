from .db import getConnection
from datetime import datetime
import math


def getAllTransactions(username, page=1, per_page=10):
    conn = getConnection()
    cursor = conn.cursor()

    try:

        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        user_result = cursor.fetchone()
        if not user_result:
            return {
                'transactions': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'total_pages': 0
            }

        user_id = int(user_result[0])

        # Get all transactions first to count total
        all_records = []

        # Fetch records from expenses table
        cursor.execute('''
            SELECT Expense_ID as ID, Amount, Expense_For as Source, Note, Date, 'Expense' as Type
            FROM expenses
            WHERE User_ID=%s
        ''', (user_id,))
        expense_records = cursor.fetchall()

        # Fetch records from credit table
        cursor.execute('''
            SELECT Transaction_ID as ID, Amount, Source, Note, Date, 'Credit' as Type
            FROM credit
            WHERE User_ID=%s
        ''', (user_id,))
        credit_records = cursor.fetchall()

        # Fetch records from withdraw table
        cursor.execute('''
            SELECT Transaction_ID as ID, Amount, Expense_From as Source, Note, Date, 'Withdraw' as Type
            FROM withdraw
            WHERE User_ID=%s
        ''', (user_id,))
        withdraw_records = cursor.fetchall()

        # Convert to list of dictionaries for easier handling
        for record in expense_records:
            note = record[3] if record[3] and record[3].strip() else '-'
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': note,
                'date': record[4],
                'type': record[5]
            })


        for record in credit_records:
            note = record[3] if record[3] and record[3].strip() else '-'
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': note,
                'date': record[4],
                'type': record[5]
            })

        for record in withdraw_records:
            note = record[3] if record[3] and record[3].strip() else '-'
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': note,
                'date': record[4],
                'type': record[5]
            })
       # Sort all records by date (latest first) - handle None dates
        def sort_key(record):
            date_value = record['date']
            if date_value is None:
                return datetime.min
            if isinstance(date_value, datetime):
                return date_value
            try:
                return datetime.strptime(str(date_value), '%Y-%m-%d')
            except:
                return datetime.min

        all_records.sort(key=sort_key, reverse=True)

        # Calculate pagination
        total_records = len(all_records)
        total_pages = math.ceil(total_records / per_page)

        # Ensure page is within valid range
        page = max(1, min(page, total_pages if total_pages > 0 else 1))

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records for current page
        paginated_records = all_records[offset:offset + per_page]

        return {
            'transactions': paginated_records,
            'total': total_records,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }

    except Exception as e:
        print(f"Error in getAllTransactions: {str(e)}")
        return {
            'transactions': [],
            'total': 0,
            'page': page,
            'per_page': per_page,
            'total_pages': 0
        }

    finally:
        conn.close()


def getTransactionsByType(username, transaction_type, page=1, per_page=10):
    """Get transactions filtered by type (Credit, Expense, or Withdraw)"""
    conn = getConnection()
    cursor = conn.cursor()

    try:

        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        user_result = cursor.fetchone()
        if not user_result:
            return {
                'transactions': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'total_pages': 0
            }

        user_id = int(user_result[0])
        records = []

        # Fetch records based on type
        if transaction_type.lower() == 'credit':
            cursor.execute('''
                SELECT Transaction_ID as ID, Amount, Source, Note, Date, 'Credit' as Type
                FROM credit 
                WHERE User_ID=%s
                ORDER BY Date DESC
            ''', (user_id,))
            records = cursor.fetchall()
        elif transaction_type.lower() == 'expense':
            cursor.execute('''
                SELECT Expense_ID as ID, Amount, Expense_For as Source, Note, Date, 'Expense' as Type
                FROM expenses 
                WHERE User_ID=%s
                ORDER BY Date DESC
            ''', (user_id,))
            records = cursor.fetchall()
        elif transaction_type.lower() == 'withdraw':
            cursor.execute('''
                SELECT Transaction_ID as ID, Amount, Expense_From as Source, Note, Date, 'Withdraw' as Type
                FROM withdraw 
                WHERE User_ID=%s
                ORDER BY Date DESC
            ''', (user_id,))
            records = cursor.fetchall()

        # Convert to list of dictionaries
        all_records = []
        # In getTransactionsByType function
        for record in records:
            note = record[3] if record[3] and record[3].strip() else '-'
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': note,
                'date': record[4],
                'type': record[5]
            })

        # Calculate pagination
        total_records = len(all_records)
        total_pages = math.ceil(total_records / per_page)

        # Ensure page is within valid range
        page = max(1, min(page, total_pages if total_pages > 0 else 1))

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records for current page
        paginated_records = all_records[offset:offset + per_page]

        return {
            'transactions': paginated_records,
            'total': total_records,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }

    except Exception as e:
        print(f"Error in getTransactionsByType: {str(e)}")
        return {
            'transactions': [],
            'total': 0,
            'page': page,
            'per_page': per_page,
            'total_pages': 0
        }

    finally:
        conn.close()
