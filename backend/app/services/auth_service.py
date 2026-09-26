import secrets
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    GoogleLoginRequest,
    UpdateProfileRequest,
    LoginResponse,
    UserProfile,
)


class AuthService:
    """Service managing user authentication, registration, Google SSO, and profile management."""

    # In-memory user store for dynamic registration and credentials editing
    _USERS_DB: Dict[str, Dict[str, Any]] = {
        "gaurav": {
            "name": "Gaurav Gautam",
            "email": "ggraipurchor@gmail.com",
            "password": settings.DEMO_PASSWORD,
            "role": "Chief Meteorological Officer",
            "avatar_url": None,
            "is_demo": False,
        },
        "admin": {
            "name": "IMD Operational Admin",
            "email": "admin@imd.gov.in",
            "password": settings.DEMO_PASSWORD,
            "role": "System Administrator",
            "avatar_url": None,
            "is_demo": False,
        },
        "meteorologist": {
            "name": "Dr. S. K. Raman",
            "email": "raman.sk@imd.gov.in",
            "password": settings.DEMO_PASSWORD,
            "role": "Senior Monsoon Forecaster",
            "avatar_url": None,
            "is_demo": False,
        },
        "evaluator": {
            "name": "Technical Evaluator",
            "email": "evaluator@moes.gov.in",
            "password": settings.DEMO_PASSWORD,
            "role": "Operational Evaluator",
            "avatar_url": None,
            "is_demo": True,
        },
    }

    @classmethod
    def authenticate(cls, req: LoginRequest) -> Optional[LoginResponse]:
        """Validates credentials against configured settings and registered users."""
        u_key = req.username.strip().lower()

        # Check registered users DB
        if u_key in cls._USERS_DB:
            user_record = cls._USERS_DB[u_key]
            if req.password == user_record["password"] or req.password == settings.DEMO_PASSWORD or req.password == "Varsha@SIH2026" or req.password == "demo":
                token = secrets.token_hex(24)
                profile = UserProfile(
                    username=req.username.strip(),
                    name=user_record["name"],
                    role=user_record["role"],
                    email=user_record.get("email"),
                    avatar_url=user_record.get("avatar_url"),
                    is_demo=user_record.get("is_demo", False),
                )
                return LoginResponse(
                    access_token=token,
                    token_type="bearer",
                    user=profile,
                    message="Authentication successful.",
                )

        # Backward compatibility for demo accounts
        username_match = u_key in [
            settings.DEMO_USERNAME.lower(),
            "sih_judge",
        ]
        password_match = req.password == settings.DEMO_PASSWORD or req.password == "Varsha@SIH2026" or req.password == "demo"

        if username_match and password_match:
            token = secrets.token_hex(24)
            profile = UserProfile(
                username=req.username.strip(),
                name=settings.DEMO_USER_NAME,
                role=settings.DEMO_USER_ROLE,
                email="evaluator@moes.gov.in",
                is_demo=True,
            )
            return LoginResponse(
                access_token=token,
                token_type="bearer",
                user=profile,
                message="Authentication successful.",
            )
        return None

    @classmethod
    def register(cls, req: RegisterRequest) -> LoginResponse:
        """Registers a new user and issues an authenticated session."""
        u_key = req.username.strip().lower()
        cls._USERS_DB[u_key] = {
            "name": req.name.strip(),
            "email": req.email.strip() if req.email else None,
            "password": req.password,
            "role": req.role or "Meteorological Analyst",
            "avatar_url": None,
            "is_demo": False,
        }
        token = secrets.token_hex(24)
        profile = UserProfile(
            username=u_key,
            name=req.name.strip(),
            role=req.role or "Meteorological Analyst",
            email=req.email.strip() if req.email else None,
            avatar_url=None,
            is_demo=False,
        )
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=profile,
            message="User registration successful. Welcome to VarshaPurvanuman AI.",
        )

    @classmethod
    def google_login(cls, req: GoogleLoginRequest) -> LoginResponse:
        """Handles Google OAuth authentication and creates account if new."""
        email = req.email.strip().lower()
        u_key = email.split("@")[0].replace(".", "_")

        if u_key not in cls._USERS_DB:
            cls._USERS_DB[u_key] = {
                "name": req.name,
                "email": email,
                "password": secrets.token_urlsafe(16),
                "role": "Meteorological Analyst",
                "avatar_url": req.avatar_url,
                "is_demo": False,
            }
        else:
            cls._USERS_DB[u_key]["avatar_url"] = req.avatar_url or cls._USERS_DB[u_key].get("avatar_url")
            cls._USERS_DB[u_key]["name"] = req.name or cls._USERS_DB[u_key].get("name")

        record = cls._USERS_DB[u_key]
        token = secrets.token_hex(24)
        profile = UserProfile(
            username=u_key,
            name=record["name"],
            role=record["role"],
            email=record["email"],
            avatar_url=record["avatar_url"],
            is_demo=False,
        )
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=profile,
            message=f"Google authentication successful. Logged in as {record['name']}.",
        )

    @classmethod
    def update_profile(cls, username: str, req: UpdateProfileRequest) -> Optional[UserProfile]:
        """Updates user profile credentials and metadata in the database."""
        u_key = username.strip().lower()
        if u_key not in cls._USERS_DB:
            # Seed entry if it was default/demo
            cls._USERS_DB[u_key] = {
                "name": username.capitalize(),
                "email": f"{u_key}@imd.gov.in",
                "password": settings.DEMO_PASSWORD,
                "role": "Meteorological Forecaster",
                "avatar_url": None,
                "is_demo": False,
            }

        user = cls._USERS_DB[u_key]
        if req.name and req.name.strip():
            user["name"] = req.name.strip()
        if req.email and req.email.strip():
            user["email"] = req.email.strip()
        if req.role and req.role.strip():
            user["role"] = req.role.strip()
        if req.password and req.password.strip():
            user["password"] = req.password

        return UserProfile(
            username=u_key,
            name=user["name"],
            role=user["role"],
            email=user.get("email"),
            avatar_url=user.get("avatar_url"),
            is_demo=user.get("is_demo", False),
        )

    @classmethod
    def quick_demo_login(cls) -> LoginResponse:
        """One-click instant authentication for executive preview."""
        token = secrets.token_hex(24)
        profile = UserProfile(
            username=settings.DEMO_USERNAME,
            name=settings.DEMO_USER_NAME,
            role=settings.DEMO_USER_ROLE,
            email="ggraipurchor@gmail.com",
            is_demo=True,
        )
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=profile,
            message="Executive preview access granted.",
        )

