"""
Email service for sending emails
Uses SMTP for simplicity (can be replaced with SendGrid, AWS SES, etc.)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import settings
from typing import Optional


class EmailService:
    """Service for sending emails"""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML version of email body
            text_content: Plain text version of email body (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text content
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML content
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Enable TLS
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            
            print(f"[Email] Sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"[Email] Failed to send to {to_email}: {e}")
            return False
    
    def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_role: str
    ) -> bool:
        """
        Send password reset email
        
        Args:
            to_email: User's email address
            reset_token: Password reset token
            user_role: User's role (admin/usher)
            
        Returns:
            True if email sent successfully
        """
        # Build reset link (frontend URL)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }}
                .warning {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 10px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset the password for your {user_role} account at <strong>{settings.APP_NAME}</strong>.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
                        {reset_link}
                    </p>
                    <div class="warning">
                        <strong>⚠️ Important:</strong> This link will expire in {settings.RESET_TOKEN_EXPIRATION_HOURS} hour(s) for security reasons.
                    </div>
                    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p>Best regards,<br>
                    Admin</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Password Reset Request
        
        Hello,
        
        We received a request to reset the password for your {user_role} account at {settings.APP_NAME}.
        
        Click this link to reset your password:
        {reset_link}
        
        This link will expire in {settings.RESET_TOKEN_EXPIRATION_HOURS} hour(s).
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        Admin
        """
        
        return self.send_email(
            to_email=to_email,
            subject=f"Password Reset - {settings.APP_NAME}",
            html_content=html_content,
            text_content=text_content
        )
    
    def send_password_changed_notification(self, to_email: str) -> bool:
        """
        Send notification that password was successfully changed
        
        Args:
            to_email: User's email address
            
        Returns:
            True if email sent successfully
        """
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .success {{
                    background-color: #d4edda;
                    border-left: 4px solid #28a745;
                    padding: 10px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed Successfully</h1>
                </div>
                <div class="content">
                    <div class="success">
                        <strong>✓ Success!</strong> Your password has been changed.
                    </div>
                    <p>Hello,</p>
                    <p>This is to confirm that your password for {settings.APP_NAME} has been successfully changed.</p>
                    <p>If you did not make this change, please contact your administrator immediately.</p>
                    <p>Best regards,<br>
                    Admin</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Changed Successfully
        
        Hello,
        
        This is to confirm that your password for {settings.APP_NAME} has been successfully changed.
        
        If you did not make this change, please contact your administrator immediately.
        
        Best regards,
        Admin
        """
        
        return self.send_email(
            to_email=to_email,
            subject=f"Password Changed - {settings.APP_NAME}",
            html_content=html_content,
            text_content=text_content
        )


# Global email service instance
email_service = EmailService()
