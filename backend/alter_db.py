import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

SQL = """
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;
"""

def main():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        cur.close()
        conn.close()
        print("Successfully altered orders table")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
