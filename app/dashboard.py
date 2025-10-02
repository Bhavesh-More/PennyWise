from .db import getConnection
from datetime import datetime

def showBalance(username):
    conn = getConnection()
    cursor = conn.cursor()

    try:

        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        id = int(cursor.fetchone()[0])

        cursor.execute('SELECT Amount from credit WHERE User_ID=%s', (id,))
        rows = cursor.fetchall()
        creditAmount = 0
        for row in rows:
            creditAmount += int(row[0])

        
        cursor.execute('SELECT Amount from withdraw WHERE User_ID=%s', (id,))
        rows = cursor.fetchall()
        debitAmount = 0
        for row in rows:
            debitAmount += int(row[0])

        balance = creditAmount - debitAmount

        return creditAmount, debitAmount, balance
    
    finally:
        conn.close()

def showFiveRecords(username):
    conn = getConnection()
    cursor = conn.cursor()

    try:

        # Get user ID
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        user_result = cursor.fetchone()
        if not user_result:
            return []
        
        user_id = int(user_result[0])

        # Fetch records from expenses table
        cursor.execute('''
            SELECT Expense_ID as ID, Amount, Expense_For as Source, Note, Date, 'Expense' as Type
            FROM expenses 
            WHERE User_ID=%s
            ORDER BY Date DESC
        ''', (user_id,))
        expense_records = cursor.fetchall()

        # Fetch records from credit table
        cursor.execute('''
            SELECT Transaction_ID as ID, Amount, Source, Note, Date, 'Credit' as Type
            FROM credit 
            WHERE User_ID=%s
            ORDER BY Date DESC
        ''', (user_id,))
        credit_records = cursor.fetchall()

        # Fetch records from withdraw table
        cursor.execute('''
            SELECT Transaction_ID as ID, Amount, Expense_From as Source, Note, Date, 'Withdraw' as Type
            FROM withdraw 
            WHERE User_ID=%s
            ORDER BY Date DESC
        ''', (user_id,))
        withdraw_records = cursor.fetchall()

        # Combine all records
        all_records = []
        
        # Convert to list of dictionaries for easier handling
        for record in expense_records:
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': record[3],
                'date': record[4],
                'type': record[5]
            })
        
        for record in credit_records:
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': record[3],
                'date': record[4],
                'type': record[5]
            })
        
        for record in withdraw_records:
            all_records.append({
                'id': record[0],
                'amount': record[1],
                'source': record[2],
                'note': record[3],
                'date': record[4],
                'type': record[5]
            })

        # Sort all records by date (latest first) - handle None dates
        def sort_key(record):
            date_value = record['date']
            if date_value is None:
                # Use a very old date for None values so they appear last
                return datetime.min
            # If date_value is already a datetime object, return it
            if isinstance(date_value, datetime):
                return date_value
            # If it's a string, try to parse it
            try:
                return datetime.strptime(str(date_value), '%Y-%m-%d')
            except:
                return datetime.min

        all_records.sort(key=sort_key, reverse=True)

        # Return top 5 records
        return all_records[:5]
    
    except Exception as e:
        print(f"Error in showFiveRecords: {str(e)}")
        return []
    
    finally:
        conn.close()