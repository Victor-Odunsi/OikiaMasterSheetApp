"""
Migration script to add password reset fields to existing users table
Run this if you have an existing database
"""
import sqlite3
from pathlib import Path


def migrate_add_reset_fields():
    """Add reset_token and reset_token_expires columns to users table"""
    
    db_path = Path("users.db")
    
    if not db_path.exists():
        print("✗ Database file 'users.db' not found.")
        print("  If this is a fresh install, just run 'python init_db.py' instead.")
        return
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "reset_token" in columns and "reset_token_expires" in columns:
            print("✓ Password reset fields already exist in database.")
            return
        
        # Add reset_token column
        if "reset_token" not in columns:
            print("Adding 'reset_token' column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255)
            """)
            print("✓ Added 'reset_token' column")
        
        # Add reset_token_expires column
        if "reset_token_expires" not in columns:
            print("Adding 'reset_token_expires' column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN reset_token_expires DATETIME
            """)
            print("✓ Added 'reset_token_expires' column")
        
        # Create index on reset_token for faster lookups
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_reset_token 
                ON users(reset_token)
            """)
            print("✓ Created index on 'reset_token'")
        except Exception as e:
            print(f"Note: Index creation skipped ({e})")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")
        print("  Password reset functionality is now available.")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Password Reset Migration")
    print("=" * 60)
    print("\nThis will add password reset fields to your existing database.")
    print("Make sure the server is stopped before running this.\n")
    
    response = input("Continue? (y/n): ")
    if response.lower() == 'y':
        migrate_add_reset_fields()
    else:
        print("Migration cancelled.")
