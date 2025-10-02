from passlib.hash import bcrypt
from .db import getConnection

def addCredits(username, amount, source, note, date):
    conn = getConnection()
    cursor = conn.cursor()


    cursor.execute('SELECT ID FROM users WHERE Username=%s', (username,))
    id = int(cursor.fetchone()[0])

    cursor.execute('INSERT INTO credit(User_ID, Amount, Source, Note, Date) VALUES(%s, %s, %s, %s, %s)', (id, amount, source, note, date))
    conn.commit()

    return True