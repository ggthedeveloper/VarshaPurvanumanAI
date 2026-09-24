"""
Pydantic schemas for authentication and session management.
"""
from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Credentials submitted to login endpoint."""
    username: str = Field(description="Username or email address.")
    password: str = Field(description="User password.")


class UserProfile(BaseModel):
    """Authenticated user profile representation."""
    username: str
    name: str
    role: str
    is_demo: bool = True


class LoginResponse(BaseModel):
    """Authentication response with session token and user profile."""
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
    message: str
