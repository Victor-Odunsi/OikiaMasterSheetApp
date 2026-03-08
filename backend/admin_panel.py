"""
SQLAdmin panel configuration
Admin interface for managing users (ushers/admins)
"""
from sqladmin import ModelView
from models import User
from utils import hash_password
from wtforms import PasswordField
from wtforms.validators import Optional as WTFormsOptional


class UserAdmin(ModelView, model=User):
    """Admin view for User model"""
    
    # Metadata
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"
    
    # List view configuration
    column_list = [User.id, User.email, User.role, User.is_active, User.created_at, User.last_login]
    column_searchable_list = [User.email]
    column_sortable_list = [User.id, User.email, User.role, User.created_at]
    column_default_sort = [(User.created_at, True)]  # Sort by created_at descending
    
    # Filters
    column_filters = [User.role, User.is_active]
    
    # Detail view
    column_details_list = [
        User.id,
        User.email,
        User.role,
        User.is_active,
        User.created_at,
        User.last_login
    ]
    
    # Form configuration
    form_columns = [User.email, "password", User.role, User.is_active]
    
    # Custom form fields
    form_extra_fields = {
        "password": PasswordField(
            "Password",
            validators=[WTFormsOptional()],
            description="Leave blank to keep existing password"
        )
    }
    
    # Hide hashed_password from forms
    form_excluded_columns = [User.hashed_password, User.created_at, User.last_login]
    
    # Labels
    column_labels = {
        User.id: "ID",
        User.email: "Email",
        User.role: "Role",
        User.is_active: "Active",
        User.created_at: "Created At",
        User.last_login: "Last Login",
    }
    
    # Display formatters
    column_formatters = {
        User.is_active: lambda m, a: "✓" if m.is_active else "✗",
        User.role: lambda m, a: m.role.upper()
    }
    
    def on_model_change(self, data, model, is_created, request):
        """
        Hook called before saving model
        Hash password if provided
        """
        # Get password from form data
        password = data.get("password")
        
        if password:
            # Hash the password
            model.hashed_password = hash_password(password)
        
        # Remove password from data (we've already processed it)
        if "password" in data:
            del data["password"]
    
    def on_model_delete(self, model, request):
        """
        Hook called before deleting model
        Add any cleanup logic here if needed
        """
        pass
    
    # Permissions (can be customized)
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True
    can_export = False
    
    # Page size
    page_size = 25
    page_size_options = [25, 50, 100]
