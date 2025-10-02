from .db import getConnection

def updateProfile(username, fullName, newUsername, email, currency):
    conn = getConnection()
    cursor = conn.cursor()

    try:

        # Get user ID first
        cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
        user_result = cursor.fetchone()
        if not user_result:
            return "User not found"
        
        user_id = int(user_result[0])

        # Check if new username is already taken (only if it's different from current)
        if newUsername != username:
            cursor.execute('SELECT * FROM users WHERE Username=%s AND ID != %s', (newUsername, user_id))
            if cursor.fetchone():
                return 'Username is already taken'

        # Check if new email is already taken (only if it's different from current)
        cursor.execute('SELECT Email FROM users WHERE ID=%s', (user_id,))
        current_email = cursor.fetchone()[0]
        
        if email != current_email:
            cursor.execute('SELECT * FROM users WHERE Email=%s AND ID != %s', (email, user_id))
            if cursor.fetchone():
                return 'Email is already registered'

        # Update user profile
        cursor.execute('''
            UPDATE users 
            SET `Full Name`=%s, Username=%s, Email=%s, Currency=%s 
            WHERE ID=%s
        ''', (fullName, newUsername, email, currency, user_id))
        
        conn.commit()
        return "Profile updated successfully"
    
    except Exception as e:
        conn.rollback()
        print(f"Error in updateProfile: {str(e)}")
        return "Failed to update profile"
    
    finally:
        conn.close()

def getUserProfile(username):
    conn = getConnection()
    cursor = conn.cursor()

    try:

        cursor.execute('''
            SELECT `Full Name`, Username, `Mobile Number`, Email, Currency, `Date of Creation`
            FROM users 
            WHERE Username=%s
        ''', (username,))
        
        user_data = cursor.fetchone()
        
        if user_data:
            return {
                'fullName': user_data[0],
                'username': user_data[1],
                'mobileNumber': user_data[2],
                'email': user_data[3],
                'currency': user_data[4],
                'dateOfCreation': user_data[5]
            }
        else:
            return None
    
    except Exception as e:
        print(f"Error in getUserProfile: {str(e)}")
        return None
    
    finally:
        conn.close()

def showProfileInfo(username):
    """
    Function to show complete profile information for the logged-in user
    Returns user data in a structured format
    """
    conn = getConnection()
    cursor = conn.cursor()

    try:

        # Get complete user information
        cursor.execute('''
            SELECT ID, `Full Name`, Username, `Mobile Number`, Email, Currency, `Date of Creation`
            FROM users 
            WHERE Username=%s
        ''', (username,))
        
        user_data = cursor.fetchone()
        
        if user_data:
            # Format the date properly
            date_created = user_data[6]
            if date_created:
                # Convert datetime to string if needed
                date_created = str(date_created)
            
            return {
                'success': True,
                'userInfo': {
                    'id': user_data[0],
                    'fullName': user_data[1],
                    'username': user_data[2],
                    'mobileNumber': user_data[3],
                    'email': user_data[4],
                    'currency': user_data[5],
                    'dateOfCreation': date_created
                }
            }
        else:
            return {
                'success': False,
                'error': 'User not found'
            }
    
    except Exception as e:
        print(f"Error in showProfileInfo: {str(e)}")
        return {
            'success': False,
            'error': 'Failed to retrieve profile information'
        }
    
    finally:
        conn.close()