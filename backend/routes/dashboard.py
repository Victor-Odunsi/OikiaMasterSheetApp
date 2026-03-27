"""
Dashboard routes
Provides statistics and recent activity for the dashboard
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from typing import List, Dict

from utils import get_current_user, member_cache
from utils.sheets_service import sheets_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(_: dict = Depends(get_current_user)):
    """
    Get dashboard statistics
    
    Returns:
        Dashboard stats including total members, attendance, etc.
    """
    # Get all members from cache
    members = member_cache.get_members()
    total_members = len(members)
    
    # Get today's date in DD/MM/YYYY format (matches sheet format)
    today = datetime.now()
    today_str = today.strftime("%d/%m/%Y")
    
    # Count today's attendance
    todays_attendance = 0
    if members and len(members) > 0:
        # Check if any members have attendance for today
        for member in members:
            attendance = member.get("attendance", {})
            if today_str in attendance and attendance[today_str] == "P":
                todays_attendance += 1
    
    # Calculate attendance rate (average over all dates)
    total_attendance_records = 0
    total_possible_attendance = 0
    
    for member in members:
        attendance = member.get("attendance", {})
        attendance_dates = len(attendance)
        if attendance_dates > 0:
            total_possible_attendance += attendance_dates
            # Count "P" (present) marks
            present_count = sum(1 for status in attendance.values() if status == "P")
            total_attendance_records += present_count
    
    # Calculate attendance rate
    if total_possible_attendance > 0:
        attendance_rate = round((total_attendance_records / total_possible_attendance) * 100, 1)
    else:
        attendance_rate = 0.0
    
    # Count recent registrations (this month)
    # Note: Since we don't have created_at field, we'll use members with date = current year
    current_year = str(today.year)
    recent_registrations = sum(
        1 for member in members 
        if member.get("date", "") == current_year
    )
    
    return {
        "total_members": total_members,
        "todays_attendance": todays_attendance,
        "attendance_rate": attendance_rate,
        "recent_registrations": recent_registrations,
    }


@router.get("/recent-members")
def get_recent_members(
    limit: int = 5,
    _: dict = Depends(get_current_user)
) -> List[Dict]:
    """
    Get recently registered members
    
    Args:
        limit: Number of recent members to return
        
    Returns:
        List of recent members
    """
    members = member_cache.get_members()
    
    # Since we don't have a created_at timestamp, we'll return the last N members
    # (assuming higher S/N = more recent)
    # Sort by ID (S/N) in descending order
    sorted_members = sorted(
        members,
        key=lambda m: int(m.get("id", "0")) if m.get("id", "").isdigit() else 0,
        reverse=True
    )
    
    # Return the most recent ones
    return sorted_members[:limit]


@router.get("/recent-attendance")
def get_recent_attendance(
    limit: int = 5,
    _: dict = Depends(get_current_user)
) -> List[Dict]:
    """
    Get recent attendance records for today
    
    Args:
        limit: Number of recent attendance records to return
        
    Returns:
        List of recent attendance records with member info
    """
    members = member_cache.get_members()
    
    # Get today's date
    today = datetime.now()
    today_str = today.strftime("%d/%m/%Y")
    
    # Find members who are present today
    recent_attendance = []
    for member in members:
        attendance = member.get("attendance", {})
        if today_str in attendance and attendance[today_str] == "P":
            recent_attendance.append({
                "id": f"att_{member.get('id')}_{today_str}",  # Unique ID
                "member_id": member.get("id"),
                "check_in_time": None,  # We don't track time yet
                "date": today_str,
                "member": {
                    "id": member.get("id"),
                    "first_name": member.get("first_name"),
                    "surname": member.get("surname"),
                    "unit": member.get("unit"),
                    "location": member.get("location"),
                }
            })
    
    # Return most recent (limit)
    # Since we don't have timestamps, just return first N
    return recent_attendance[:limit]


@router.get("/attendance-trend")
def get_attendance_trend(
    days: int = 7,
    _: dict = Depends(get_current_user)
) -> List[Dict]:
    """
    Get attendance trend for the last N days
    
    Args:
        days: Number of days to get trend for
        
    Returns:
        List of daily attendance counts
    """
    members = member_cache.get_members()
    
    # Get last N days
    trend_data = []
    today = datetime.now()
    
    for i in range(days):
        date = today - timedelta(days=i)
        date_str = date.strftime("%d/%m/%Y")
        
        # Count attendance for this date
        present_count = 0
        for member in members:
            attendance = member.get("attendance", {})
            if date_str in attendance and attendance[date_str] == "P":
                present_count += 1
        
        trend_data.append({
            "date": date_str,
            "count": present_count,
            "day": date.strftime("%A")  # Day name (Monday, Tuesday, etc.)
        })
    
    # Reverse to show oldest to newest
    trend_data.reverse()
    
    return trend_data