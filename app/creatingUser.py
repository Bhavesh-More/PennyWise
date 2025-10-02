from passlib.hash import bcrypt
from .db import getConnection

def createUser(fullName, userName, mobileNo, email, password, currency):
    hashed = bcrypt.hash(password)

    conn = getConnection()
    cursor = conn.cursor()


    result = checkForRegisteredUsers(cursor, userName, mobileNo, email)

    if result == True:
        cursor.execute("INSERT INTO users (`Full Name`, Username, `Mobile Number`, Email, Password, Currency) VALUES(%s, %s, %s, %s, %s, %s)", (fullName, userName, mobileNo, email, hashed, currency))
        conn.commit()
        return "Account Created"
    else:
        return result


def checkForRegisteredUsers(cursor, userName, mobileNo, email):
    cursor.execute('SELECT * FROM users WHERE Username=%s', (userName,))
    if cursor.fetchone():
        return 'Username is taken'

    cursor.execute('SELECT * FROM users WHERE `Mobile Number`=%s', (mobileNo,))
    if cursor.fetchone():
        return 'This mobile number is already registered.'

    cursor.execute('SELECT * FROM users WHERE Email=%s', (email,))
    if cursor.fetchone():
        return 'This email is already registered.'

    return True