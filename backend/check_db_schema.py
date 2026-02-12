import asyncio
from sqlalchemy import text
from database import async_session_maker

async def check_schema():
    async with async_session_maker() as session:
        try:
            print("Checking products table schema...")
            # For SQLite, use PRAGMA table_info
            result = await session.execute(text("PRAGMA table_info(products)"))
            columns = result.all()
            for col in columns:
                # col is (cid, name, type, notnull, dflt_value, pk)
                print(f"Column: {col[1]}, Type: {col[2]}")
            
            print("\nChecking if students table exists...")
            result = await session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='students'"))
            table = result.scalar()
            if table:
                print("Table 'students' exists.")
            else:
                print("Table 'students' DOES NOT EXIST.")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_schema())
