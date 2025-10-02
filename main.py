from flask import jsonify, Flask, request, render_template, session
from app.creatingUser import createUser
from app.logingInUser import checkUserLogin
from app.addCredit import addCredits
from app.addGoal import setGoal
from app.addExpense import addExpense, showExpenseCategories
from app.dashboard import showBalance, showFiveRecords
from app.quickWithdraw import makeWithdrawal, getSpendRecord
from app.transaction import getAllTransactions, getTransactionsByType
from app.profile import showProfileInfo, updateProfile, getUserProfile




app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)
app.secret_key = 'this_is_my_secret_key_for_session'


@app.route('/')
def main():
    return render_template('main.html')


@app.route('/login')
def showLogin():
    return render_template('login.html')


@app.route('/register')
def showRegis():
    return render_template('register.html')


@app.route('/registration', methods=['POST'])
def registerUser():
    data = request.get_json()
    fullName = data.get('fullName')
    userName = data.get('username')
    mobile = data.get('mobile')
    email = data.get('email')
    password = data.get('password')
    currency = data.get('currency')

    result = createUser(fullName, userName, mobile, email, password, currency)

    session['username'] = userName
    session['currency'] = currency

    return jsonify({
        'result': result
    })


@app.route('/login-in', methods=['POST'])
def loginIn():
    data = request.get_json()
    userNEmail = data.get('usernameOrEmail')
    password = data.get("password")

    result = checkUserLogin(userNEmail, password)

    if result[0] != 'Invalid Credentials':
        session['username'] = result[0]
        session['currency'] = result[1]

    return jsonify({
        "result": result
    })


@app.route('/get-currency', methods=['POST'])
def get_currency():
    currency = session.get('currency', 'INR')
    cur = '₹'
    if currency == 'INR':
        cur = '₹'
    elif currency == 'USD':
        cur = '$'
    elif currency == 'EUR':
        cur = '€'
    elif currency == 'GBP':
        cur = '£'
    elif currency == 'JPY':
        cur = '¥'
    elif currency == 'AUD':
        cur = 'A$'
    elif currency == 'CAD':
        cur = 'C$'
    return jsonify({'currency': cur})


@app.route('/home')
def goToHome():
    name = session.get('username')
    currency = session.get('currency')

    cur = '₹'
    if currency == 'INR':
        cur = '₹'
    elif currency == 'USD':
        cur = '$'
    elif currency == 'EUR':
        cur = '€'
    elif currency == 'GBP':
        cur = '£'
    elif currency == 'JPY':
        cur = '¥'
    elif currency == 'AUD':
        cur = 'A$'
    elif currency == 'CAD':
        cur = 'C$'

    return render_template('home.html', username=name, currency=cur)


@app.route('/add-credit', methods=['POST'])
def add_credit():
    username = session['username']
    data = request.get_json()
    amount = data.get('amounts')
    source = data.get('source')
    note = data.get('note')
    date = data.get('date')

    result = addCredits(username, amount, source, note, date)

    return jsonify({
        'result': result
    })


@app.route('/set-goal', methods=['POST'])
def set_goal():
    username = session['username']
    data = request.get_json()
    amount = data.get('amount')
    minAmount = data.get('minAmount')
    savedFor = data.get('savedFor')
    note = data.get('note')

    result = setGoal(username, amount, minAmount, savedFor, note)

    return jsonify({
        'result': result
    })


@app.route('/add-expense', methods=['POST'])
def add_expense():
    username = session['username']
    data = request.get_json()
    amount = data.get('amount')
    source = data.get('source')
    note = data.get('note')
    budgetControl = data.get('budget_control')
    minDeposit = data.get('min_deposit_amount')

    result = addExpense(username, amount, source, note,
                        budgetControl, minDeposit)
    return jsonify(result)


@app.route('/show-cards', methods=['POST'])
def show_cards():
    username = session['username']
    data = showExpenseCategories(username)
    return jsonify(data)


@app.route('/quick-withdraw', methods=['POST'])
def quick_withdraw():
    username = session['username']
    data = request.get_json()
    amount = data.get('amount')
    source = data.get('source')
    note = data.get('note')

    result = makeWithdrawal(username, amount, source, note)
    return jsonify(result)


@app.route('/update-expense-cards', methods=['POST'])
def updateExpenseCard():
    username = session['username']
    result = getSpendRecord(username)
    return jsonify(result)


@app.route('/dash-balance', methods=['POST'])
def dash_balance():
    username = session['username']
    result = showBalance(username)
    return jsonify({
        'credit': result[0],
        'expense': result[1],
        'balance': result[2]
    })


@app.route('/dash-transactions', methods=['POST'])
def dash_transactions():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        username = session['username']
        transactions = showFiveRecords(username)
        
        # Convert transactions to a JSON-serializable format
        transaction_list = []
        for transaction in transactions:
            # Handle None values safely
            transaction_dict = {
                'id': transaction.get('id', 0),
                'amount': float(transaction.get('amount', 0) or 0),
                'type': transaction.get('type', 'Unknown'),
                'source': transaction.get('source', 'Unknown'),
                'note': transaction.get('note') or '',  # Handle None, empty string, or whitespace
                'date': transaction.get('date', '') if transaction.get('date') else ''
            }
            transaction_list.append(transaction_dict)
        
        return jsonify({
            'transactions': transaction_list,
            'success': True
        })
        
    except Exception as e:
        print(f"Error in dash_transactions: {str(e)}")  # For debugging
        return jsonify({
            'error': 'Failed to fetch transactions',
            'transactions': []
        }), 500

@app.route('/get-all-transactions', methods=['POST'])
def get_all_transactions():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        username = session['username']
        data = request.get_json()
        page = data.get('page', 1)
        per_page = data.get('per_page', 10)
        
        result = getAllTransactions(username, page, per_page)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_all_transactions: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch transactions',
            'transactions': [],
            'total': 0,
            'page': 1,
            'per_page': per_page,
            'total_pages': 0
        }), 500

@app.route('/get-transactions-by-type', methods=['POST'])
def get_transactions_by_type():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        username = session['username']
        data = request.get_json()
        transaction_type = data.get('type', 'all')
        page = data.get('page', 1)
        per_page = data.get('per_page', 10)
        
        result = getTransactionsByType(username, transaction_type, page, per_page)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_transactions_by_type: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch transactions',
            'transactions': [],
            'total': 0,
            'page': 1,
            'per_page': per_page,
            'total_pages': 0
        }), 500


@app.route('/update-profile', methods=['POST'])
def update_profile():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        username = session['username']
        data = request.get_json()
        
        fullName = data.get('fullName')
        newUsername = data.get('username')
        email = data.get('email')
        currency = data.get('currency')
        
        # Validate required fields
        if not all([fullName, newUsername, email, currency]):
            return jsonify({'error': 'All fields are required'}), 400
        
        result = updateProfile(username, fullName, newUsername, email, currency)
        
        if result == "Profile updated successfully":
            # Update session with new username and currency
            session['username'] = newUsername
            session['currency'] = currency
            
            return jsonify({
                'success': True,
                'message': result
            })
        else:
            return jsonify({
                'success': False,
                'error': result
            })
    
    except Exception as e:
        print(f"Error in update_profile route: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update profile'
        }), 500

@app.route('/get-user-profile', methods=['POST'])
def get_user_profile():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        username = session['username']
        profile_data = getUserProfile(username)
        
        if profile_data:
            return jsonify({
                'success': True,
                'profile': profile_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'User profile not found'
            })
    
    except Exception as e:
        print(f"Error in get_user_profile route: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch user profile'
        }), 500

@app.route('/show-profile-info', methods=['POST'])
def show_profile_info():
    """
    New route to show complete profile information using session
    """
    if 'username' not in session:
        return jsonify({
            'success': False,
            'error': 'Not logged in'
        }), 401
    
    try:
        username = session['username']
        result = showProfileInfo(username)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in show_profile_info route: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch profile information'
        }), 500



if __name__ == '__main__':
    app.run(debug=True)