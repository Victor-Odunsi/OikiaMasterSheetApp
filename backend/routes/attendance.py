"""
Attendance management routes
Handles marking attendance for Sunday services
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta

from models import schemas
from utils import get_current_user, sheets_service, member_cache

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_current_sunday() -> str:
    """
    Get the current or next Sunday date
    
    Returns:
        Date string in DD/MM/YYYY format
    """
    today = datetime.now()
    
    # Calculate days until Sunday (0=Monday, 6=Sunday)
    days_until_sunday = (6 - today.weekday()) % 7
    
    # If it's Sunday but late (after 6 PM), get next Sunday
    if days_until_sunday == 0 and today.hour >= 18:
        days_until_sunday = 7
    
    # If today is Sunday and it's not late, use today
    if days_until_sunday == 0:
        next_sunday = today
    else:
        next_sunday = today + timedelta(days=days_until_sunday)
    
    return next_sunday.strftime("%d/%m/%Y")


def ensure_attendance_column(date: str) -> tuple[str, int]:
    """
    Ensure attendance column exists for the given date
    Creates the column if it doesn't exist
    
    Args:
        date: Date string in DD/MM/YYYY format
        
    Returns:
        Tuple of (column_letter, column_index)
    """
    # Get all data to check headers
    all_data = sheets_service.get_all_data()
    
    if not all_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read sheet data"
        )
    
    headers = all_data[0]
    
    # Check if date column already exists
    if date in headers:
        col_index = headers.index(date)
        col_letter = sheets_service.column_index_to_letter(col_index)
        return col_letter, col_index
    
    # Column doesn't exist, create it
    new_col_index = len(headers)
    col_letter = sheets_service.column_index_to_letter(new_col_index)
    
    # Add the date as header in the new column
    sheets_service.update_cell(f"{col_letter}1", date)
    
    return col_letter, new_col_index


@router.get("/current", response_model=schemas.AttendanceResponse)
def get_current_attendance(_: dict = Depends(get_current_user)):
    """
    Get attendance data for current Sunday
    
    Args:
        _: Current user
        
    Returns:
        Current Sunday date and all members with their attendance status
    """
    current_sunday = get_current_sunday()
    members = member_cache.get_members()
    
    # Add current attendance status to each member
    members_with_status = []
    for member in members:
        attendance_status = member.get("attendance", {}).get(current_sunday, "")
        members_with_status.append({
            "id": member.get("id"),
            "surname": member.get("surname"),
            "first_name": member.get("first_name"),
            "location": member.get("location"),
            "unit": member.get("unit"),
            "is_present": attendance_status == "P"
        })
    
    return {
        "current_sunday": current_sunday,
        "members": members_with_status
    }


@router.post("/mark")
def mark_attendance(
    attendance_data: schemas.AttendanceMarkRequest,
    _: dict = Depends(get_current_user)
):
    """
    Mark attendance for a member on a specific date
    
    Args:
        attendance_data: Member ID, date, and present status
        _: Current user
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If member not found or update fails
    """
    member_id = attendance_data.member_id
    date = attendance_data.date
    present = attendance_data.present
    
    # Ensure the attendance column exists
    try:
        col_letter, col_index = ensure_attendance_column(date)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ensure attendance column: {str(e)}"
        )
    
    # Find the member's row
    all_data = sheets_service.get_all_data()
    row_index = sheets_service.find_row_by_id(member_id, all_data)
    
    if row_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Update the attendance cell
    cell_value = "P" if present else ""
    cell_notation = f"{col_letter}{row_index}"
    
    try:
        sheets_service.update_cell(cell_notation, cell_value)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark attendance: {str(e)}"
        )
    
    return {
        "message": "Attendance marked successfully",
        "member_id": member_id,
        "date": date,
        "present": present
    }


@router.get("/history/{member_id}")
def get_attendance_history(
    member_id: str,
    _: dict = Depends(get_current_user)
):
    """
    Get attendance history for a specific member
    
    Args:
        member_id: Member S/N
        _: Current user
        
    Returns:
        Member's attendance record
        
    Raises:
        HTTPException: If member not found
    """
    member = member_cache.get_by_id(member_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    return {
        "member_id": member_id,
        "name": f"{member.get('first_name')} {member.get('surname')}",
        "attendance": member.get("attendance", {})
    }


@router.post("/bulk-mark")
def bulk_mark_attendance(
    attendance_list: list[schemas.AttendanceMarkRequest],
    _: dict = Depends(get_current_user)
):
    """
    Mark attendance for multiple members at once
    Useful for batch operations
    
    Args:
        attendance_list: List of attendance records
        _: Current user
        
    Returns:
        Summary of marked attendance
    """
    success_count = 0
    failed = []
    
    for attendance_data in attendance_list:
        try:
            mark_attendance(attendance_data, _)
            success_count += 1
        except Exception as e:
            failed.append({
                "member_id": attendance_data.member_id,
                "error": str(e)
            })
    
    return {
        "message": f"Marked {success_count} out of {len(attendance_list)} records",
        "success_count": success_count,
        "failed_count": len(failed),
        "failed_records": failed
    }
