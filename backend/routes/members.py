"""
Member management routes
Handles member CRUD operations (Google Sheets)
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import threading

from models import schemas
from utils import get_current_user, sheets_service, member_cache

router = APIRouter(prefix="/members", tags=["Members"])

# Lock for S/N generation to prevent race conditions
sn_lock = threading.Lock()


def generate_next_sn() -> int:
    """
    Generate the next sequential S/N
    Thread-safe to prevent duplicate IDs
    
    Returns:
        Next S/N as integer
    """
    with sn_lock:
        members = member_cache.get_members()
        
        if not members or len(members) == 0:
            return 1
        
        # Get the last member's S/N
        last_member = members[-1]
        try:
            last_sn = int(last_member.get("id", "0"))
            return last_sn + 1
        except ValueError:
            # If S/N is not a number, use count + 1
            return len(members) + 1


@router.get("/", response_model=List[dict])
def get_all_members(_: dict = Depends(get_current_user)):
    """
    Get all members from cache
    
    Args:
        _: Current user (for authentication)
        
    Returns:
        List of all members with attendance data
    """
    return member_cache.get_members()


@router.get("/search")
def search_members(
    q: str,
    _: dict = Depends(get_current_user)
):
    """
    Search members by name or phone
    
    Args:
        q: Search query string
        _: Current user
        
    Returns:
        Filtered list of members
    """
    if not q or len(q) < 2:
        return []
    
    return member_cache.search(q)


@router.get("/{member_id}")
def get_member(
    member_id: str,
    _: dict = Depends(get_current_user)
):
    """
    Get a specific member by S/N
    
    Args:
        member_id: Member S/N
        _: Current user
        
    Returns:
        Member object
        
    Raises:
        HTTPException: If member not found
    """
    member = member_cache.get_by_id(member_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    return member

def _reformat_date(date_str: str | None) -> str:
    """Convert YYYY-MM-DD to DD/MM/YYYY"""
    if not date_str:
        return ""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return date_str


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_member(
    member_data: schemas.MemberCreate,
    _: dict = Depends(get_current_user)
):
    """
    Register a new member
    Uses dynamic column detection to handle sheet structure changes
    
    Args:
        member_data: Member creation data
        _: Current user
        
    Returns:
        Created member object with assigned S/N
    """
    from utils.column_mapper import build_member_row
    
    # Generate next S/N
    new_sn = generate_next_sn()
    
    # Prepare member data dictionary
    member_dict = {
        "id": str(new_sn),
        "surname": member_data.surname,
        "first_name": member_data.first_name,
        "phone": member_data.phone,
        "date": _reformat_date(member_data.date),
        "role": member_data.role,
        "email": member_data.email or "",
        "address": member_data.address or "",
        "location": member_data.location,
        "unit": member_data.unit,
        "sex": member_data.sex
    }
    
    # Build row data with dynamic column mapping
    row_data = build_member_row(member_dict)
    
    # Write to Google Sheets
    try:
        sheets_service.append_row(row_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write to Google Sheets: {str(e)}"
        )
    
    # Create member object for response
    new_member = {
        **member_dict,
        "attendance": {}
    }
    
    # Optimistically add to cache
    member_cache.add_member(new_member)
    
    return {
        "message": "Member created successfully",
        "member": new_member
    }


@router.put("/{member_id}")
def update_member(
    member_id: str,
    updates: schemas.MemberUpdate,
    _: dict = Depends(get_current_user)
):
    from utils.column_mapper import build_member_row, get_sheet_column_map

    current_member = member_cache.get_by_id(member_id)
    if not current_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    all_data = sheets_service.get_all_data()
    row_index = sheets_service.find_row_by_id(member_id, all_data)
    if row_index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in sheet")

    # Merge current data with updates
    merged = {
        "id": member_id,
        "surname": updates.surname if updates.surname is not None else current_member["surname"],
        "first_name": updates.first_name if updates.first_name is not None else current_member["first_name"],
        "phone": updates.phone if updates.phone is not None else current_member["phone"],
        "date": current_member.get("date", ""),
        "role": updates.role if updates.role is not None else current_member["role"],
        "email": updates.email if updates.email is not None else current_member.get("email", ""),
        "address": updates.address if updates.address is not None else current_member.get("address", ""),
        "location": updates.location if updates.location is not None else current_member.get("location", ""),
        "unit": updates.unit if updates.unit is not None else current_member.get("unit", ""),
        "sex": updates.sex if updates.sex is not None else current_member["sex"],
    }

    # Use dynamic column mapper — same as create
    column_map = get_sheet_column_map()
    updated_row = build_member_row(merged, column_map)

    try:
        # Update only up to the last member column, not attendance columns
        end_col = sheets_service.column_index_to_letter(len(updated_row) - 1)
        sheets_service.update_row(row_index, updated_row, range_notation=f"A{row_index}:{end_col}{row_index}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update: {str(e)}")

    update_dict = updates.dict(exclude_unset=True)
    member_cache.update_member(member_id, update_dict)

    return {"message": "Member updated successfully"}


@router.post("/cache/refresh")
def refresh_cache(_: dict = Depends(get_current_user)):
    """
    Force refresh the member cache from Google Sheets
    
    Args:
        _: Current user
        
    Returns:
        Cache status
    """
    members = member_cache.refresh()
    
    return {
        "message": "Cache refreshed successfully",
        "member_count": len(members)
    }
