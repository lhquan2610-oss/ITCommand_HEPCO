"""
SQLAlchemy 2.0 Declarative Base and Timestamp Mixin for HICC V1.0.
All code comments and docstrings are written in English.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, MetaData
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Naming convention for PostgreSQL constraints and indexes to ensure clean Alembic migrations
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base declarative class for all HICC PostgreSQL models."""

    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)


class UUIDPrimaryKeyMixin:
    """Mixin providing a stable UUID v4 primary key."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class TimestampMixin:
    """Mixin providing timezone-aware created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
