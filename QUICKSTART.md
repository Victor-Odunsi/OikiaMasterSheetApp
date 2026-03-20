# Church Usher System - Quick Start Guide

## What You Have

A complete FastAPI backend with:
- ✅ JWT Authentication
- ✅ User Management (Admin Panel)
- ✅ Member CRUD Operations
- ✅ Attendance Tracking
- ✅ Google Sheets Integration
- ✅ In-Memory Cache
- ✅ SQLite Database for users

## File Structure Overview

```
backend/
├── config/          # Application settings
├── models/          # Database models & schemas
├── routes/          # API endpoints
├── utils/           # Helper functions
├── main.py          # FastAPI app
├── admin_panel.py   # Admin interface
└── init_db.py       # Database setup script
```

## Setup (5 Minutes)

### Step 1: Install Python Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Google Sheets Setup

1. Go to https://console.cloud.google.com
2. Create a project (or use existing)
3. Enable "Google Sheets API" and "Google Drive API"
4. Create Service Account → Download JSON key
5. Rename to `credentials.json` and place in backend folder
6. Share your Google Sheet with the service account email
   (Find email in credentials.json file)

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
GOOGLE_SHEETS_ID="your-sheet-id-from-url"
JWT_SECRET_KEY="generate-random-key-here"
```

To generate a secure JWT key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Initialize Database

```bash
python init_db.py
```

This creates:
- SQLite database (`users.db`)
- Default admin user (email: `admin@church.com`, password: `admin123`)

### Step 5: Start Server

```bash
uvicorn main:app --reload
```

Server runs at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Admin: http://localhost:8000/admin

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com","password":"admin123"}'
```

Response:
```json
{
  "token": "eyJ...",
  "role": "admin",
  "email": "admin@church.com"
}
```

### 2. Get All Members (requires token)

```bash
curl http://localhost:8000/members/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Search Members

```bash
curl http://localhost:8000/members/search?q=John \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Register New Member

```bash
curl -X POST http://localhost:8000/members/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "surname": "Doe",
    "first_name": "John",
    "phone": "08012345678",
    "date": "2026",
    "role": "2-Worker",
    "location": "Lekki",
    "unit": "BAC",
    "sex": "Male"
  }'
```

### 5. Mark Attendance

```bash
curl -X POST http://localhost:8000/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "1",
    "date": "01/03/2026",
    "present": true
  }'
```

## API Documentation

Visit http://localhost:8000/docs for:
- Interactive API documentation
- Try out endpoints
- See request/response schemas

## Admin Panel

Visit http://localhost:8000/admin to:
- Create new ushers/admins
- Edit user credentials
- Deactivate accounts
- View user activity

**Default login:**
- Email: `admin@church.com`
- Password: `admin123` (⚠️ Change immediately!)

## Key Features Explained

### Authentication Flow
1. User logs in with email/password
2. Backend validates against SQLite database
3. Returns JWT token (expires after 8 hours)
4. Frontend includes token in Authorization header
5. Backend verifies token on each request

### Member Management
1. Members stored in Google Sheets (columns A-K)
2. Backend caches all members in memory (5 min TTL)
3. Search runs on cached data (very fast)
4. Writes go to both Sheet and cache
5. Cache auto-refreshes every 5 minutes

### Attendance Tracking
1. System detects current/next Sunday
2. Creates date column in Sheet if doesn't exist
3. Marks "P" for present, empty for absent
4. Each Sunday gets its own column (L, M, N, ...)

## Common Issues

### "Error initializing Google Sheets service"
**Fix:** 
- Ensure `credentials.json` exists
- Check service account has Sheet access
- Verify APIs are enabled

### "Invalid or expired token"
**Fix:**
- Token lasts 8 hours, login again
- Check JWT_SECRET_KEY is set

### "Member not found"
**Fix:**
- Try `/members/cache/refresh` endpoint
- Verify S/N exists in Sheet

## Next Steps

1. **Change Admin Password**
   - Login to admin panel
   - Edit admin user
   - Set secure password

2. **Create Ushers**
   - Use admin panel to add ushers
   - Give them email/password
   - Set role to "usher"

3. **Test Member Registration**
   - Login as usher
   - Register a test member
   - Check Google Sheet for new row

4. **Deploy to Production**
   - See README.md for Fly.io/Cloud Run instructions
   - Set production environment variables
   - Use HTTPS in production

## Module Breakdown

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **config** | App settings | settings.py |
| **models** | DB models & schemas | user.py, schemas.py |
| **utils** | Helper functions | auth.py, cache.py, sheets_service.py |
| **routes** | API endpoints | auth.py, members.py, attendance.py |
| **main.py** | App entry point | FastAPI app setup |
| **admin_panel.py** | Admin UI | SQLAdmin configuration |

## Support

If you encounter issues:
1. Check logs in terminal
2. Visit `/docs` for API documentation
3. Verify environment variables in `.env`
4. Check Google Sheets permissions

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET_KEY
- [ ] credentials.json not in git
- [ ] CORS restricted to frontend domain
- [ ] Using HTTPS in production
- [ ] Database backed up regularly

---

**You're all set!** Start the server and begin testing. 🚀
