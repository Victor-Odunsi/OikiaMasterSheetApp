# Email Authentication Migration Guide

## What Changed?

The authentication system has been updated from **username/password** to **email/password**.

---

## Changes Made

### 1. Database Model (`models/user.py`)
**Before:**
```python
username = Column(String(50), unique=True, index=True, nullable=False)
```

**After:**
```python
email = Column(String(255), unique=True, index=True, nullable=False)
```

### 2. Pydantic Schemas (`models/schemas.py`)

**UserBase:**
```python
# Before
username: str = Field(..., min_length=3, max_length=50)

# After
email: str = Field(..., pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
```

**UserLogin:**
```python
# Before
class UserLogin(BaseModel):
    username: str
    password: str

# After
class UserLogin(BaseModel):
    email: str = Field(..., pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str
```

**TokenResponse:**
```python
# Before
token: str
role: str
username: str

# After
token: str
role: str
email: str
```

### 3. Login Endpoint (`routes/auth.py`)
```python
# Before
user = db.query(User).filter(User.username == credentials.username).first()

# After
user = db.query(User).filter(User.email == credentials.email).first()
```

JWT token now includes `email` instead of `username`:
```python
# Before
token_data = {"username": user.username, "role": user.role, "user_id": user.id}

# After
token_data = {"email": user.email, "role": user.role, "user_id": user.id}
```

### 4. User Management (`routes/users.py`)
- Duplicate check now on `email` instead of `username`
- Email change validation added in update endpoint

### 5. Admin Panel (`admin_panel.py`)
- Search by email instead of username
- Form fields updated to show email

### 6. Init Script (`init_db.py`)
Default admin now created with:
- **Email:** `admin@church.com`
- **Password:** `admin123`

---

## Email Validation

The system now validates emails using regex pattern:
```python
pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
```

**Valid emails:**
- ✅ `user@church.com`
- ✅ `john.doe@example.org`
- ✅ `admin123@test.co.uk`

**Invalid emails:**
- ❌ `notanemail`
- ❌ `user@`
- ❌ `@domain.com`
- ❌ `user @church.com` (space)

---

## API Changes

### Login Request
**Before:**
```bash
curl -X POST /auth/login \
  -d '{"username":"admin","password":"admin123"}'
```

**After:**
```bash
curl -X POST /auth/login \
  -d '{"email":"admin@church.com","password":"admin123"}'
```

### Login Response
**Before:**
```json
{
  "token": "eyJ...",
  "role": "admin",
  "username": "admin"
}
```

**After:**
```json
{
  "token": "eyJ...",
  "role": "admin",
  "email": "admin@church.com"
}
```

### Create User Request
**Before:**
```json
{
  "username": "usher1",
  "password": "password123",
  "role": "usher"
}
```

**After:**
```json
{
  "email": "usher1@church.com",
  "password": "password123",
  "role": "usher"
}
```

---

## Frontend Changes Required

If you have a frontend, update:

### 1. Login Form
```javascript
// Before
const loginData = {
  username: formData.get('username'),
  password: formData.get('password')
}

// After
const loginData = {
  email: formData.get('email'),
  password: formData.get('password')
}
```

### 2. Store Token Response
```javascript
// Before
localStorage.setItem('username', response.username)

// After
localStorage.setItem('email', response.email)
```

### 3. Display User Info
```javascript
// Before
const username = currentUser.username

// After
const email = currentUser.email
```

---

## Database Migration (If Existing Database)

If you already have a `users.db` file with existing users:

**Option 1: Fresh Start (Recommended for Development)**
```bash
# Delete old database
rm users.db

# Recreate with new schema
python init_db.py
```

**Option 2: Migrate Existing Data**
```python
# migration_script.py
from models import SessionLocal, User

db = SessionLocal()

# Fetch all users
users = db.query(User).all()

for user in users:
    # Convert username to email format
    user.email = f"{user.username}@church.com"
    
db.commit()
print(f"Migrated {len(users)} users to email format")
```

---

## Testing the Changes

### 1. Initialize Database
```bash
python init_db.py
```

Expected output:
```
✓ Default admin user created successfully!
  Email: admin@church.com
  Password: admin123
```

### 2. Test Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbG...",
  "role": "admin",
  "email": "admin@church.com"
}
```

### 3. Test Token Verification
```bash
curl http://localhost:8000/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "valid": true,
  "email": "admin@church.com",
  "role": "admin"
}
```

### 4. Test Admin Panel
- Visit http://localhost:8000/admin
- Login with `admin@church.com` / `admin123`
- Create a new usher with email
- Verify it appears in the users list

---

## Benefits of Email Authentication

1. **Password Reset Ready** - Can now implement "forgot password" via email
2. **Standard Practice** - Most apps use email for login
3. **Better UX** - Users familiar with email login
4. **Unique Identifier** - Emails are naturally unique and verifiable
5. **Professional** - More appropriate for a production app

---

## Next Steps

With email authentication in place, you can now add:
1. **Email verification** - Send confirmation link on registration
2. **Password reset** - "Forgot password" flow via email
3. **Email notifications** - Attendance reminders, etc.
4. **Two-factor authentication** - For added security

---

## Rollback (If Needed)

If you need to revert to username authentication:
1. Restore backup of old files
2. Delete `users.db`
3. Restart the application

---

**All changes have been applied and tested. The system is ready to use with email authentication!** ✅
