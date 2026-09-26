from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Credentials submitted to login endpoint."""
    username: str = Field(description="Username or email address.")
    password: str = Field(description="User password.")


class RegisterRequest(BaseModel):
    """Information submitted to register a new user account."""
    username: str = Field(description="Desired username.")
    name: str = Field(description="Full display name.")
    password: str = Field(description="Password.")
    email: Optional[str] = Field(default=None, description="Contact email.")
    role: Optional[str] = Field(default="Meteorological Analyst", description="User role.")


class GoogleLoginRequest(BaseModel):
    """Google OAuth login token and account details."""
    token: Optional[str] = Field(default=None, description="Google OAuth id_token or credential.")
    email: str = Field(description="Google account email.")
    name: str = Field(description="Google account display name.")
    avatar_url: Optional[str] = Field(default=None, description="Profile picture URL.")


class UpdateProfileRequest(BaseModel):
    """Request to update user profile information and credentials."""
    name: Optional[str] = Field(default=None, description="Updated display name.")
    email: Optional[str] = Field(default=None, description="Updated email.")
    role: Optional[str] = Field(default=None, description="Updated role.")
    password: Optional[str] = Field(default=None, description="Updated password.")


class UserProfile(BaseModel):
    """Authenticated user profile representation."""
    username: str
    name: str
    role: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_demo: bool = False


class LoginResponse(BaseModel):
    """Authentication response with session token and user profile."""
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
    message: str

