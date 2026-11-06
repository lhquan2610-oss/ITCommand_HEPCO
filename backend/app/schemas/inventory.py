"""
Pydantic v2 Request & Response Schemas for HICC V1.0 API (Phases 3 & 4: Inventory, Lookup, Subnets, Alerts).
"""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, Field


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int


class DeviceManagementUpdateRequest(BaseModel):
    """
    Payload for manual IT asset updates (`PATCH /api/v1/devices/{id}/management`).
    Updates ONLY the Management Plane and never gets overwritten by the Scanner Engine.
    """

    device_code: Optional[str] = Field(default=None, max_length=64)
    display_name: Optional[str] = Field(default=None, max_length=255)
    device_type_code: Optional[str] = Field(default=None, max_length=50)
    lock_device_type: bool = Field(default=True)
    department_id: Optional[uuid.UUID] = None
    assigned_user: Optional[str] = Field(default=None, max_length=150)
    location: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    is_authorized: Optional[bool] = None
    mark_reviewed: bool = Field(default=True, description="When True, sets is_new = False")


class SubnetCreateRequest(BaseModel):
    name: str = Field(..., max_length=150)
    cidr: str = Field(..., description="Internal RFC1918 CIDR e.g. 192.168.10.0/24")
    gateway_ip: Optional[str] = None
    vlan_id: Optional[int] = Field(default=None, ge=1, le=4094)
    scan_mode: str = Field(default="LOCAL_L2", pattern="^(LOCAL_L2|ROUTED_L3)$")
    description: Optional[str] = None


class SubnetApproveRequest(BaseModel):
    is_approved: bool


class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_note: str = Field(..., min_length=3)


class DeviceSummaryResponse(BaseModel):
    id: uuid.UUID
    device_code: Optional[str]
    hostname: Optional[str]
    discovered_hostname: Optional[str]
    display_name: Optional[str]
    device_type_code: str
    device_type_name: str
    is_type_locked: bool
    confidence_score: int
    manufacturer: Optional[str]
    model: Optional[str]
    department_id: Optional[uuid.UUID]
    department_name: Optional[str]
    assigned_user: Optional[str]
    location: Optional[str]
    notes: Optional[str]
    status: str
    is_new: bool
    is_authorized: bool
    icmp_blocked: bool
    last_ip_address: Optional[str]
    last_mac_address: Optional[str]
    first_seen: datetime
    last_seen: Optional[datetime]
    custom_metadata: dict[str, Any] = Field(default_factory=dict)
