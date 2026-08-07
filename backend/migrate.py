import sqlite3

def migrate():
    conn = sqlite3.connect('taskmanager.db')
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE tasks ADD COLUMN time_spent INTEGER DEFAULT 0;')
        print("Added time_spent to tasks")
    except Exception as e:
        print("tasks error:", e)
    
    try:
        cursor.execute('ALTER TABLE subtasks ADD COLUMN time_spent INTEGER DEFAULT 0;')
        print("Added time_spent to subtasks")
    except Exception as e:
        print("subtasks error:", e)
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    migrate()
