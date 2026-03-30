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
        Uses DYNAMIC header detection to handle column changes gracefully
        
        Args:
            raw_data: Raw data from Google Sheets
            
        Returns:
            List of member dictionaries
        """
        if not raw_data or len(raw_data) < 2:
            return []
        
        headers = raw_data[0]
        rows = raw_data[1:]
        
        # Create column mapping: header name (lowercase) -> column index
        column_map = {}
        for idx, header in enumerate(headers):
            if header:  # Skip empty headers
                normalized_header = header.strip().lower()
                column_map[normalized_header] = idx
        
        # Define expected member columns (in order of preference for matching)
        member_column_names = {
            's/n': ['s/n', 'sn', 'id', 'number'],
            'surname': ['surname', 'last name', 'lastname'],
            'first_name': ['first name', 'firstname', 'given name'],
            'phone': ['phone number', 'phone', 'mobile', 'telephone', 'tel'],
            'date': ['date', 'year', 'joined'],
            'role': ['role', 'position', 'designation'],
            'email': ['e-mail address', 'email', 'e-mail', 'mail'],
            'address': ['address', 'home address', 'residence'],
            'location': ['location', 'area', 'region'],
            'unit': ['unit', 'department', 'group'],
            'sex': ['sex', 'gender']
        }
        
        # Find the column index for each member field
        member_field_indices = {}
        for field, possible_names in member_column_names.items():
            for name in possible_names:
                if name in column_map:
                    member_field_indices[field] = column_map[name]
                    break
        
        # Log any missing required fields
        missing_fields = [field for field in member_column_names.keys() 
                         if field not in member_field_indices]
        if missing_fields:
            print(f"[Cache] Warning: Could not find columns for: {', '.join(missing_fields)}")
        
        # Detect where attendance columns start
        # Attendance columns are those NOT in member_field_indices
        member_column_indices = set(member_field_indices.values())
        
        # Find the highest index of member columns
        if member_column_indices:
            last_member_col_idx = max(member_column_indices)
            attendance_start_idx = last_member_col_idx + 1
        else:
            # Fallback if no member columns found
            attendance_start_idx = 0
        
        # Get attendance date headers
        attendance_dates = []
        for idx, header in enumerate(headers):
            if idx >= attendance_start_idx and header and header.strip():
                # Skip if this column is used by member data
                if idx not in member_column_indices:
                    attendance_dates.append((idx, header.strip()))
        
        print(f"[Cache] Detected {len(member_field_indices)} member fields, "
              f"{len(attendance_dates)} attendance columns")
        
        # Parse each row
        members = []
        for row in rows:
            if not row or len(row) == 0:
                continue
            
            # Extract member data using dynamic indices
            def get_value(field_name: str) -> str:
                """Safely get value from row by field name"""
                idx = member_field_indices.get(field_name)
                if idx is not None and idx < len(row):
                    return row[idx].strip() if row[idx] else ""
                return ""
            
            member = {
                "id": get_value('s/n'),
                "surname": get_value('surname'),
                "first_name": get_value('first_name'),
                "phone": get_value('phone'),
                "date": get_value('date'),
                "role": get_value('role'),
                "email": get_value('email'),
                "address": get_value('address'),
                "location": get_value('location'),
                "unit": get_value('unit'),
                "sex": get_value('sex'),
                "attendance": {}
            }
            
            # Extract attendance data using dynamic column positions
            for col_idx, date_header in attendance_dates:
                if col_idx < len(row):
                    member["attendance"][date_header] = row[col_idx].strip() if row[col_idx] else ""
                else:
                    member["attendance"][date_header] = ""
            
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
