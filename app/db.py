import mysql.connector

def getConnection():
    return mysql.connector.connect(
    host="omvarma4.mysql.pythonanywhere-services.com",
    user="omvarma4",
    password="sahilvarma@123",
    database="omvarma4$expensetracker"
)
