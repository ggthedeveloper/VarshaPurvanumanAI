from fastapi import APIRouter, HTTPException, Query, status
from backend.app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    GoogleLoginRequest,
    UpdateProfileRequest,
    LoginResponse,
    UserProfile,
)
from backend.app.services.auth_service import AuthService
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse, summary="Sign in with credentials")
def login(request: LoginRequest):
    """
    Authenticates a user using credentials.
    Rejects invalid credentials with HTTP 401 Unauthorized.
    """
    resp = AuthService.authenticate(request)
    if not resp:
        logger.warning(f"Failed login attempt for username: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please verify your credentials or register a new account.",
        )
    logger.info(f"Successful authentication for user: {request.username}")
    return resp


@router.post("/register", response_model=LoginResponse, summary="Register new user account")
def register(request: RegisterRequest):
    """
    Registers a new operational meteorologist or stakeholder account.
    """
    if not request.username or not request.password or not request.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, display name, and password are required.",
        )
    resp = AuthService.register(request)
    logger.info(f"New user registered: {request.username}")
    return resp


@router.post("/google", response_model=LoginResponse, summary="Continue with Google SSO")
def google_login(request: GoogleLoginRequest):
    """
    Authenticates or creates a user account via Google OAuth token/credentials.
    """
    if not request.email or not request.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email and name are required.",
        )
    resp = AuthService.google_login(request)
    logger.info(f"Google login successful for: {request.email}")
    return resp


@router.put("/profile", response_model=UserProfile, summary="Update user profile and credentials")
def update_profile(
    request: UpdateProfileRequest,
    username: str = Query(..., description="Target username to update"),
):
    """
    Updates the authenticated user's name, email, role, or password.
    """
    updated = AuthService.update_profile(username, request)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    logger.info(f"Profile updated for user: {username}")
    return updated


@router.post("/demo-login", response_model=LoginResponse, summary="Executive preview login")
def demo_login():
    """
    Provides instant authenticated executive preview access.
    """
    logger.info("Executive preview login accessed")
    return AuthService.quick_demo_login()

