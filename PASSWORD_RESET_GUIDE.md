# Password Reset Implementation Guide

Complete guide for the forgot password and reset password functionality.

---

## Overview

Users can now reset their passwords via email if they forget them. The flow is:

1. User clicks "Forgot Password"
2. User enters their email
3. System sends reset link to email
4. User clicks link (valid for 1 hour)
5. User enters new password
6. Password is reset and confirmation email sent

---

## Architecture

### Database Schema

**Added to `users` table:**
```sql
reset_token VARCHAR(255)           -- Secure random token
reset_token_expires DATETIME       -- Token expiration timestamp
```

### New Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/password/forgot` | Request password reset | No |
| POST | `/password/reset` | Reset password with token | No |
| GET | `/password/verify-token/{token}` | Verify token validity | No |

---

## Setup Instructions

### 1. Email Configuration (Gmail Example)

**Enable 2-Factor Authentication:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

**Generate App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Church Usher App"
4. Copy the 16-character password

**Update .env file:**
```env
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # App password (no spaces in actual .env)
FROM_EMAIL="your-email@gmail.com"
FROM_NAME="Church Usher System"
FRONTEND_URL="http://localhost:3000"
```

### 2. Database Migration

**For existing databases:**
```bash
python migrate_reset_fields.py
```

**For fresh installs:**
```bash
python init_db.py  # Fields are already included
```

### 3. Test Email Sending

```bash
# Start server
uvicorn main:app --reload

# In another terminal, test forgot password
curl -X POST http://localhost:8000/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com"}'
```

Check your email for the reset link!

---

## API Documentation

### 1. Forgot Password

**Request:**
```bash
POST /password/forgot
Content-Type: application/json

{
  "email": "user@church.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, we've sent password reset instructions to it.",
  "email": "user@church.com"
}
```

**Notes:**
- Always returns success (prevents email enumeration attacks)
- Email sent only if account exists and is active
- Token expires after 1 hour (configurable)

---

### 2. Reset Password

**Request:**
```bash
POST /password/reset
Content-Type: application/json

{
  "token": "secure-random-token-from-email",
  "new_password": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**
```json
// Invalid/expired token
{
  "detail": "Invalid or expired reset token"
}

// Token expired
{
  "detail": "Reset token has expired. Please request a new one."
}

// Account deactivated
{
  "detail": "Account is deactivated. Contact administrator."
}
```

---

### 3. Verify Reset Token

**Request:**
```bash
GET /password/verify-token/{token}
```

**Response (Valid Token):**
```json
{
  "valid": true,
  "email": "user@church.com",
  "expires_at": "2026-03-04T12:30:00"
}
```

**Error Response:**
```json
{
  "detail": "Invalid reset token"
}
```

**Use Case:**
Frontend can verify token before showing reset form.

---

## Email Templates

### Password Reset Email

**Subject:** Password Reset - Church Usher System

**Content:**
- Professional HTML template
- Clear reset button
- Copy-paste link option
- Expiration warning (1 hour)
- Security note (ignore if you didn't request)

### Password Changed Confirmation

**Subject:** Password Changed - Church Usher System

**Content:**
- Success confirmation
- Security alert (contact admin if not you)

---

## Frontend Integration

### Forgot Password Page

```html
<form id="forgot-password-form">
  <input type="email" name="email" placeholder="Enter your email" required />
  <button type="submit">Send Reset Link</button>
</form>

<script>
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = e.target.email.value;
  
  const response = await fetch('http://localhost:8000/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  alert(data.message);
});
</script>
```

### Reset Password Page

```html
<!-- URL: /reset-password?token=xyz -->
<form id="reset-password-form">
  <input type="password" name="new_password" placeholder="New Password" required minlength="6" />
  <button type="submit">Reset Password</button>
</form>

<script>
// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Verify token on page load
async function verifyToken() {
  try {
    const response = await fetch(`http://localhost:8000/password/verify-token/${token}`);
    if (!response.ok) {
      alert('Invalid or expired reset link');
      window.location.href = '/login';
    }
  } catch (error) {
    alert('Error verifying token');
  }
}

verifyToken();

// Handle form submission
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const new_password = e.target.new_password.value;
  
  const response = await fetch('http://localhost:8000/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    alert(data.message);
    window.location.href = '/login';
  } else {
    alert(data.detail);
  }
});
</script>
```

---

## Security Features

### 1. Token Security
- **Cryptographically secure:** Uses `secrets.token_urlsafe(32)` (64 characters)
- **One-time use:** Token is cleared after successful reset
- **Expiration:** Tokens expire after 1 hour
- **Indexed:** Fast token lookups in database

### 2. Email Enumeration Prevention
- Forgot password always returns success
- Doesn't reveal if email exists or not
- Prevents attackers from discovering valid emails

### 3. Rate Limiting (Recommended)
Add rate limiting to prevent abuse:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/password/forgot")
@limiter.limit("3/hour")  # Max 3 requests per hour
def forgot_password(...):
    ...
```

### 4. Password Validation
- Minimum 6 characters (configured in schema)
- Can be extended to require:
  - Uppercase letters
  - Numbers
  - Special characters

---

## Testing Checklist

- [ ] Email sends successfully
- [ ] Reset link works within 1 hour
- [ ] Reset link expires after 1 hour
- [ ] Token is one-time use (can't reuse)
- [ ] Confirmation email sent after reset
- [ ] Works for both admin and usher accounts
- [ ] Deactivated accounts can't reset
- [ ] Non-existent emails don't reveal errors

---

## Troubleshooting

### Email Not Sending

**Check logs:**
```bash
# Look for error messages
[Email] Failed to send to user@church.com: ...
```

**Common issues:**
1. **Wrong SMTP credentials**
   - Verify SMTP_USERNAME and SMTP_PASSWORD in .env
   - For Gmail, must use App Password (not regular password)

2. **SMTP server blocked**
   - Some networks block port 587
   - Try port 465 (SSL) instead of 587 (TLS)

3. **"Less secure app" error (Gmail)**
   - Enable 2FA
   - Use App Password

**Test SMTP connection:**
```python
import smtplib

try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('your-email@gmail.com', 'app-password')
    print("SMTP connection successful!")
    server.quit()
except Exception as e:
    print(f"SMTP error: {e}")
```

### Token Not Found

- Check that migration ran successfully
- Verify reset_token and reset_token_expires columns exist
- Check that token wasn't already used

### Frontend Link Not Working

- Verify FRONTEND_URL in .env matches your frontend URL
- Check that frontend is handling `/reset-password?token=xyz` route

---

## Alternative Email Providers

### SendGrid

```env
SMTP_SERVER="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USERNAME="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### AWS SES

```env
SMTP_SERVER="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_USERNAME="your-ses-access-key"
SMTP_PASSWORD="your-ses-secret-key"
```

### Mailgun

```env
SMTP_SERVER="smtp.mailgun.org"
SMTP_PORT=587
SMTP_USERNAME="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-smtp-password"
```

---

## Production Considerations

1. **Use environment-specific URLs:**
   ```env
   # Development
   FRONTEND_URL="http://localhost:3000"
   
   # Production
   FRONTEND_URL="https://usher-app.church.com"
   ```

2. **Monitor failed emails:**
   - Log failed email attempts
   - Set up alerts for high failure rates

3. **Add rate limiting:**
   - Prevent abuse (max 3-5 requests per hour)

4. **Consider email queue:**
   - For high volume, use Celery + Redis
   - Asynchronous email sending

5. **Track reset attempts:**
   - Log who requests resets
   - Monitor for suspicious activity

---

## Next Steps

With password reset in place, you can add:
1. **Email verification** on registration
2. **Two-factor authentication** (2FA)
3. **Login attempt tracking**
4. **Account lockout** after failed attempts
5. **Password strength meter** on frontend

---

**Password reset is now fully implemented and ready to use!** ✅
