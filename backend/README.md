# Church Usher System - Backend

FastAPI backend for managing church members and attendance tracking.

## Features

- **JWT Authentication** - Secure role-based access (Admin/Usher)
- **User Management** - SQLAdmin panel for managing ushers and admins
- **Member CRUD** - Register, search, and edit church members
- **Attendance Tracking** - Mark attendance with dynamic Sunday columns
- **Google Sheets Integration** - Uses Google Sheets as database for members
- **In-Memory Caching** - Fast search with 5-minute cache TTL
- **SQLite Database** - Stores user credentials securely

## Project Structure

```
backend/
├── config/
│   ├── __init__.py
│   └── settings.py          # App configuration
├── models/
│   ├── __init__.py
│   ├── database.py          # SQLAlchemy setup
│   ├── user.py              # User model
│   └── schemas.py           # Pydantic schemas
├── routes/
│   ├── __init__.py
│   ├── auth.py              # Login/JWT routes
│   ├── users.py             # User CRUD (admin only)
│   ├── members.py           # Member CRUD
│   └── attendance.py        # Attendance marking
├── utils/
│   ├── __init__.py
│   ├── password.py          # Password hashing
│   ├── jwt_handler.py       # JWT token creation/verification
│   ├── auth.py              # Auth dependencies
│   ├── sheets_service.py    # Google Sheets API wrapper
│   └── cache.py             # Member cache
├── admin_panel.py           # SQLAdmin configuration
├── main.py                  # FastAPI app entry point
├── requirements.txt
├── .env.example
└── .gitignore
```

## Setup Instructions

### 1. Prerequisites

- Python 3.9+
- Google Cloud account (for Sheets API)
- Google Sheet with member data

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API** and **Google Drive API**
4. Create a **Service Account**
5. Download the JSON key file and save as `credentials.json` in the backend folder
6. Share your Google Sheet with the service account email (found in credentials.json)
   - Give it "Editor" permissions

### 4. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

Required variables:
- `GOOGLE_SHEETS_ID` - Your Google Sheet ID (from URL)
- `JWT_SECRET_KEY` - Generate a secure random key
- `CORS_ORIGINS` - Your frontend URL(s)

### 5. Initialize Database

The database will be created automatically on first run. To create an initial admin user, use the admin panel after starting the server.

### 6. Run the Server

```bash
# Development mode (with auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server will be available at:
- API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Admin Panel: `http://localhost:8000/admin`

### 7. Create First Admin User

Visit `http://localhost:8000/admin` and create your first admin user:
- Username: `admin`
- Password: (your choice)
- Role: `admin`
- Active: ✓

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT token
- `GET /auth/verify` - Verify token validity

### Users (Admin Only)
- `GET /users/` - List all users
- `POST /users/` - Create new user
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Members
- `GET /members/` - Get all members (cached)
- `GET /members/search?q=query` - Search members
- `GET /members/{id}` - Get member by S/N
- `POST /members/` - Register new member
- `PUT /members/{id}` - Update member
- `POST /members/cache/refresh` - Force cache refresh

### Attendance
- `GET /attendance/current` - Get current Sunday attendance
- `POST /attendance/mark` - Mark attendance for a member
- `GET /attendance/history/{id}` - Get member's attendance history
- `POST /attendance/bulk-mark` - Mark multiple attendances

## Deployment

### Fly.io (Recommended)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (first time)
fly launch --region jnb --name church-usher-backend

# Deploy updates
fly deploy

# Set secrets
fly secrets set JWT_SECRET_KEY="your-secret-key"
fly secrets set GOOGLE_SHEETS_ID="your-sheet-id"
```

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy church-usher-backend \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET_KEY="your-secret-key" \
  --set-env-vars GOOGLE_SHEETS_ID="your-sheet-id"
```

## Security Notes

1. **Change JWT_SECRET_KEY** - Use a strong random key in production
2. **Enable HTTPS** - Always use HTTPS in production
3. **Restrict CORS** - Only allow your frontend domain
4. **Service Account** - Keep credentials.json secure, never commit to git
5. **Rate Limiting** - Consider adding rate limiting in production

## Troubleshooting

### "Error initializing Google Sheets service"
- Check that credentials.json exists
- Verify the service account has access to your sheet
- Ensure Google Sheets API is enabled

### "Invalid or expired token"
- Token expires after 8 hours (configurable)
- User needs to login again

### "Member not found"
- Cache might be stale - try `/members/cache/refresh`
- Check that S/N exists in Google Sheet

### "Failed to write to Google Sheets"
- Check service account permissions
- Verify sheet ID is correct
- Check API quotas (60 reads/min)

## License

MIT
