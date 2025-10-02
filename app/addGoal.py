from passlib.hash import bcrypt
from .db import getConnection

def setGoal(username, amount, minAmount, savedFor, note):
    conn = getConnection()
    cursor = conn.cursor()


    cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
    id = int(cursor.fetchone()[0])

    cursor.execute('INSERT INTO goals(User_ID, Amount, Minimum, Saved_For, Note) VALUES(%s, %s, %s, %s, %s)', (id, amount, minAmount, savedFor, note))
    conn.commit()

    return True