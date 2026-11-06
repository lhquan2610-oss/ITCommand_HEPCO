"""
SubnetGuard: Enforces strict network scanning boundaries for HICC V1.0.
Prevents scanning public Internet IPs, loopback/multicast ranges, oversized subnets,
or any subnet not explicitly approved (`is_approved = True`) in PostgreSQL.
"""

import ipaddress
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session


class SubnetSecurityError(PermissionError):
    """Raised when a scan target violates HICC security boundaries."""


# Maximum hosts allowed in a single scan job (/22 = 1022 usable hosts)
MAX_SUBNET_HOSTS = 1024


def validate_rfc1918_cidr(target_cidr: str) -> ipaddress.IPv4Network:
    """
    Validates that a CIDR string is a valid IPv4 network strictly within RFC1918 private space
    and does not exceed MAX_SUBNET_HOSTS.
    """
    try:
        network = ipaddress.ip_network(target_cidr.strip(), strict=False)
    except ValueError as exc:
        raise SubnetSecurityError(f"Invalid CIDR notation '{target_cidr}': {exc}") from exc

    if not isinstance(network, ipaddress.IPv4Network):
        raise SubnetSecurityError(f"Only IPv4 internal subnets are supported in HICC V1.0 (got {target_cidr}).")

    if network.is_loopback or network.is_multicast or network.is_link_local or network.is_unspecified:
        raise SubnetSecurityError(
            f"Target '{target_cidr}' is a reserved loopback/multicast/link-local address and cannot be scanned."
        )

    if not network.is_private:
        raise SubnetSecurityError(
            f"SECURITY VIOLATION: Target '{target_cidr}' is a public Internet address. "
            "HICC V1.0 strictly prohibits scanning outside internal RFC1918 LAN ranges."
        )

    if network.num_addresses > MAX_SUBNET_HOSTS:
        raise SubnetSecurityError(
            f"Target subnet '{target_cidr}' contains {network.num_addresses} addresses, "
            f"exceeding the safety limit of {MAX_SUBNET_HOSTS} addresses (/22) per scan job."
        )

    return network


def verify_approved_subnet_in_db(
    session: Session,
    target_cidr: str,
    NetworkSubnetModel: type,
) -> object:
    """
    Verifies that the target CIDR exists in `network_subnets` with `is_approved=True` and `is_active=True`.
    Returns the matching NetworkSubnet ORM instance or raises SubnetSecurityError.
    """
    network = validate_rfc1918_cidr(target_cidr)
    canonical_cidr = str(network)

    stmt = select(NetworkSubnetModel).where(
        NetworkSubnetModel.is_active.is_(True),
    )
    subnets = session.scalars(stmt).all()

    matched_subnet: Optional[object] = None
    for subnet in subnets:
        try:
            approved_net = ipaddress.ip_network(str(subnet.cidr), strict=False)
        except ValueError:
            continue

        # Target network must be equal to or a subnet of an registered network_subnet record
        if isinstance(approved_net, ipaddress.IPv4Network) and network.subnet_of(approved_net):
            matched_subnet = subnet
            break

    if matched_subnet is None:
        raise SubnetSecurityError(
            f"Target subnet '{canonical_cidr}' is not registered in HICC `network_subnets`. "
            "Please register and approve the subnet before scanning."
        )

    if not getattr(matched_subnet, "is_approved", False):
        raise SubnetSecurityError(
            f"Target subnet '{canonical_cidr}' (Subnet: {getattr(matched_subnet, 'name', '')}) "
            "has `is_approved = False`. An administrator must approve this subnet first."
        )

    return matched_subnet
