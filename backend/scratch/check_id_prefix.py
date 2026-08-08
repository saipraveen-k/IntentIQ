import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "intentiq.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, title FROM products WHERE id IN ('24852', 'prod_24852', '201', 'prod_201', '34050', 'prod_34050')")
print("Results:", c.fetchall())

c.execute("SELECT id FROM products LIMIT 10")
print("Sample IDs in DB:", [r[0] for r in c.fetchall()])
