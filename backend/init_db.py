"""
Initialize database and create default admin user
Run this script once to set up the database
"""
from models import init_db, SessionLocal, User
from utils import hash_password


def create_default_admin():
    """Create a default admin user if none exists"""
    db = SessionLocal()
    
    try:
        # Check if any admin exists
        admin = db.query(User).filter(User.role == "admin").first()
        
        if admin:
            print("✓ Admin user already exists")
            print(f"  Email: {admin.email}")
            return
        
        # Create default admin
        default_admin = User(
            email="admin@church.com",
            hashed_password=hash_password("admin123"),  # CHANGE THIS PASSWORD!
            role="admin",
            is_active=True
        )
        
        db.add(default_admin)
        db.commit()
        
        print("✓ Default admin user created successfully!")
        print("  Email: admin@church.com")
        print("  Password: admin123")
        print("  ⚠️  WARNING: Change this password immediately in the admin panel!")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✓ Database initialized\n")
    
    print("Creating default admin user...")
    create_default_admin()
    
    print("\n✓ Setup complete!")
    print("\nNext steps:")
    print("1. Start the server: uvicorn main:app --reload")
    print("2. Visit http://localhost:8000/admin")
    print("3. Login with email 'admin@church.com' and password 'admin123'")
    print("4. Change the admin password immediately!")
