"""
In-memory cache for member data
Reduces Google Sheets API calls
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from config.settings import settings
from utils.sheets_service import sheets_service
import threading


class MemberCache:
    """In-memory cache for member data"""
    
    def __init__(self):
        self.cache: List[Dict] = []
        self.cache_timestamp: Optional[datetime] = None
        self.cache_ttl = timedelta(minutes=settings.CACHE_TTL_MINUTES)
        self.lock = threading.Lock()  # Thread safety for concurrent requests
    
    def is_stale(self) -> bool:
        """Check if cache needs refresh"""
        if self.cache_timestamp is None:
            return True
        return datetime.now() - self.cache_timestamp > self.cache_ttl
    
    def parse_sheet_data(self, raw_data: List[List[str]]) -> List[Dict]:
        """
        Parse raw sheet data into structured member objects
        
        Args:
            raw_data: Raw data from Google Sheets
            
        Returns:
            List of member dictionaries
        """
        if not raw_data or len(raw_data) < 2:
            return []
        
        headers = raw_data[0]
        rows = raw_data[1:]
        
        # Identify where attendance columns start (after column K = index 10)
        static_column_count = 11  # A-K (0-10)
        attendance_dates = headers[static_column_count:] if len(headers) > static_column_count else []
        
        members = []
        for row in rows:
            if not row or len(row) == 0:
                continue
            
            # Pad row with empty strings if needed
            while len(row) < static_column_count:
                row.append("")
            
            # Extract static member data (columns A-K)
            member = {
                "id": row[0] if len(row) > 0 else "",
                "surname": row[1] if len(row) > 1 else "",
                "first_name": row[2] if len(row) > 2 else "",
                "phone": row[3] if len(row) > 3 else "",
                "date": row[4] if len(row) > 4 else "",
                "role": row[5] if len(row) > 5 else "",
                "email": row[6] if len(row) > 6 else "",
                "address": row[7] if len(row) > 7 else "",
                "location": row[8] if len(row) > 8 else "",
                "unit": row[9] if len(row) > 9 else "",
                "sex": row[10] if len(row) > 10 else "",
                "attendance": {}
            }
            
            # Extract attendance data (columns L+)
            attendance_values = row[static_column_count:] if len(row) > static_column_count else []
            for i, date in enumerate(attendance_dates):
                if i < len(attendance_values):
                    member["attendance"][date] = attendance_values[i]
                else:
                    member["attendance"][date] = ""
            
            members.append(member)
        
        return members
    
    def refresh(self) -> List[Dict]:
        """
        Force refresh the cache from Google Sheets
        
        Returns:
            List of member dictionaries
        """
        with self.lock:
            print(f"[Cache] Refreshing member cache at {datetime.now()}")
            raw_data = sheets_service.get_all_data()
            self.cache = self.parse_sheet_data(raw_data)
            self.cache_timestamp = datetime.now()
            print(f"[Cache] Loaded {len(self.cache)} members")
            return self.cache
    
    def get_members(self) -> List[Dict]:
        """
        Get all members (from cache or refresh if stale)
        
        Returns:
            List of member dictionaries
        """
        if self.is_stale():
            return self.refresh()
        return self.cache
    
    def search(self, query: str) -> List[Dict]:
        """
        Search members by name or phone
        
        Args:
            query: Search query string
            
        Returns:
            Filtered list of members
        """
        members = self.get_members()
        query = query.lower()
        
        return [
            m for m in members
            if query in m.get("surname", "").lower()
            or query in m.get("first_name", "").lower()
            or query in m.get("phone", "")
        ]
    
    def get_by_id(self, member_id: str) -> Optional[Dict]:
        """
        Get a specific member by S/N
        
        Args:
            member_id: Member S/N
            
        Returns:
            Member dictionary or None if not found
        """
        members = self.get_members()
        for member in members:
            if member.get("id") == member_id:
                return member
        return None
    
    def add_member(self, member: Dict):
        """
        Optimistically add member to cache (after successful sheet write)
        
        Args:
            member: Member dictionary to add
        """
        with self.lock:
            self.cache.append(member)
    
    def update_member(self, member_id: str, updates: Dict):
        """
        Optimistically update member in cache (after successful sheet write)
        
        Args:
            member_id: S/N of member to update
            updates: Dictionary of fields to update
        """
        with self.lock:
            for i, member in enumerate(self.cache):
                if member.get("id") == member_id:
                    self.cache[i].update(updates)
                    break
    
    def invalidate(self):
        """Force cache invalidation (will refresh on next get_members call)"""
        with self.lock:
            self.cache_timestamp = None


# Global cache instance
member_cache = MemberCache()
