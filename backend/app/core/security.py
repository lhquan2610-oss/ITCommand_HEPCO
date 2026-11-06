"""
Application Settings, Database Session Provider, and Security Utilities (Argon2id + JWT + Fernet)
for HEPCO IT COMMAND CENTER (HICC V1.0) Backend API.
"""

from datetime import datetime, timedelta, timezone
import os
from typing import Generator, Optional
import uuid

from cryptography.fernet import Fernet
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from ..models import User, UserRole

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://hicc_user:hicc_password@localhost:5432/hicc_db",
)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-in-production-64-hex-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
security_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Yields a SQLAlchemy database session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        from argon2 import PasswordHasher  # type: ignore

        ph = PasswordHasher()
        return ph.verify(password_hash, plain_password)
    except Exception:
        return False


def hash_password(plain_password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    from argon2 import PasswordHasher  # type: ignore

    ph = PasswordHasher(memory_cost=65536, time_cost=3, parallelism=4)
    return ph.hash(plain_password)


def encrypt_secret(plain_secret: str) -> str:
    """Encrypts sensitive SNMP/ONVIF secrets at rest using Fernet (AES-128-CBC + HMAC-SHA256)."""
    key = os.getenv("HICC_CREDENTIAL_MASTER_KEY")
    if not key:
        raise RuntimeError("HICC_CREDENTIAL_MASTER_KEY environment variable is required to encrypt secrets.")
    f = Fernet(key.encode("utf-8"))
    return f.encrypt(plain_secret.encode("utf-8")).decode("utf-8")


def decrypt_secret(encrypted_secret: str) -> str:
    """Decrypts an encrypted SNMP/ONVIF secret."""
    key = os.getenv("HICC_CREDENTIAL_MASTER_KEY")
    if not key:
        raise RuntimeError("HICC_CREDENTIAL_MASTER_KEY environment variable is required to decrypt secrets.")
    f = Fernet(key.encode("utf-8"))
    return f.decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")


def create_access_token(user_id: uuid.UUID, username: str, role: str) -> str:
    """Generates a signed JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validates Bearer JWT token and loads active User from PostgreSQL."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED", "message": "Missing Bearer authentication token."},
        )
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = uuid.UUID(payload["sub"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "INVALID_TOKEN", "message": "Invalid or expired token."},
        ) from exc

    user = db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "USER_INACTIVE", "message": "User account is inactive or not found."},
        )
    return user


def require_roles(*allowed_roles: UserRole):
    """Dependency factory enforcing RBAC role permissions."""

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        allowed_values = {r.value for r in allowed_roles}
        if current_user.role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "FORBIDDEN_ROLE",
                    "message": f"Role '{current_user.role}' does not have permission for this action.",
                },
            )
        return current_user

    return _checker
