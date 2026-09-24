"""
Authentication route handlers for VarshaPurvanumanAI Backend.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.auth import LoginRequest, LoginResponse
from backend.app.services.auth_service import AuthService
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse, summary="Sign in with credentials")
def login(request: LoginRequest):
    """
    Authenticates a user/evaluator using environment-configured demo credentials.
    Rejects invalid credentials with HTTP 401 Unauthorized.
    """
    resp = AuthService.authenticate(request)
    if not resp:
        logger.warning(f"Failed login attempt for username: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Use demo credentials (sih_judge / Varsha@SIH2026) or Quick Demo Login.",
        )
    logger.info(f"Successful authentication for user: {request.username}")
    return resp


@router.post("/demo-login", response_model=LoginResponse, summary="One-click demo evaluation login")
def demo_login():
    """
    Provides instant authenticated demo access for SIH judges and evaluators.
    """
    logger.info("Quick Demo Login accessed")
    return AuthService.quick_demo_login()
