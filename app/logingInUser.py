from passlib.hash import bcrypt
from .db import getConnection

def checkUserLogin(usernameEmail, password):
    conn = getConnection()
    cursor = conn.cursor()

    # Search user by either username or email
    cursor.execute("SELECT Password FROM users WHERE Username=%s OR Email=%s", (usernameEmail, usernameEmail))
    
    row = cursor.fetchone()

    if row:
        stored_hashed_password = row[0]

        if bcrypt.verify(password, stored_hashed_password):
            cursor.execute("SELECT Username, Currency FROM users WHERE Username=%s OR Email=%s", (usernameEmail, usernameEmail))
            name = cursor.fetchone()
            return name
        else:
            return "Invalid Credentials"
    else:
        return "Invalid Credentials"
