"""
Member management routes
Handles member CRUD operations (Google Sheets)
"""
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
        "date": member_data.date,
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
    """
    Update a member's information
    
    Args:
        member_id: S/N of member to update
        updates: Fields to update
        _: Current user
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If member not found or update fails
    """
    # Get current member data
    current_member = member_cache.get_by_id(member_id)
    
    if not current_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Find the row in the sheet
    all_data = sheets_service.get_all_data()
    row_index = sheets_service.find_row_by_id(member_id, all_data)
    
    if row_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in sheet"
        )
    
    # Build updated row (merge current data with updates)
    updated_row = [
        member_id,  # A: S/N (never changes)
        updates.surname if updates.surname is not None else current_member["surname"],
        updates.first_name if updates.first_name is not None else current_member["first_name"],
        updates.phone if updates.phone is not None else current_member["phone"],
        current_member["date"],  # E: Date (typically unchanged)
        updates.role if updates.role is not None else current_member["role"],
        updates.email if updates.email is not None else current_member["email"],
        updates.address if updates.address is not None else current_member["address"],
        updates.location if updates.location is not None else current_member["location"],
        updates.unit if updates.unit is not None else current_member["unit"],
        updates.sex if updates.sex is not None else current_member["sex"]
    ]
    
    # Update in Google Sheets
    try:
        sheets_service.update_row(row_index, updated_row)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Google Sheets: {str(e)}"
        )
    
    # Update in cache
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
