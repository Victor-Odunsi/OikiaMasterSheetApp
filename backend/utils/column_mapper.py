"""
Column mapping utility for dynamic sheet structure
Helps with reading/writing to Google Sheets with flexible column positions
"""
from typing import Dict, Optional
from utils.sheets_service import sheets_service


def get_sheet_column_map() -> Dict[str, int]:
    """
    Get column mapping from sheet headers
    Returns dict mapping field names to column indices
    
    Returns:
        Dictionary like {'s/n': 0, 'surname': 1, 'email': 6, ...}
    """
    raw_data = sheets_service.get_all_data()
    
    if not raw_data or len(raw_data) == 0:
        # Return default mapping if sheet is empty
        return {
            's/n': 0,
            'surname': 1,
            'first_name': 2,
            'phone': 3,
            'date': 4,
            'role': 5,
            'email': 6,
            'address': 7,
            'location': 8,
            'unit': 9,
            'sex': 10
        }
    
    headers = raw_data[0]
    
    # Create column mapping
    column_map = {}
    for idx, header in enumerate(headers):
        if header:
            normalized = header.strip().lower()
            column_map[normalized] = idx
    
    # Map to standard field names
    member_column_names = {
        's/n': ['s/n', 'sn', 'id', 'number'],
        'surname': ['surname', 'last name', 'lastname'],
        'first_name': ['first name', 'firstname'],
        'phone': ['phone number', 'phone', 'mobile'],
        'date': ['date', 'year'],
        'role': ['role', 'position'],
        'email': ['e-mail address', 'email', 'e-mail'],
        'address': ['address', 'home address'],
        'location': ['location', 'area'],
        'unit': ['unit', 'department'],
        'sex': ['sex', 'gender']
    }
    
    result = {}
    for field, possible_names in member_column_names.items():
        for name in possible_names:
            if name in column_map:
                result[field] = column_map[name]
                break
    
    return result


def build_member_row(member_data: dict, column_map: Optional[Dict[str, int]] = None) -> list:
    """
    Build a row for Google Sheets with correct column positions
    Handles dynamic column ordering
    
    Args:
        member_data: Dictionary with member fields
        column_map: Optional pre-fetched column map
        
    Returns:
        List of values in correct column order
    """
    if column_map is None:
        column_map = get_sheet_column_map()
    
    # Determine the maximum column index we need
    max_col = max(column_map.values()) if column_map else 10
    
    # Initialize row with empty strings
    row = [""] * (max_col + 1)
    
    # Fill in the values at correct positions
    field_mapping = {
        's/n': 'id',
        'surname': 'surname',
        'first_name': 'first_name',
        'phone': 'phone',
        'date': 'date',
        'role': 'role',
        'email': 'email',
        'address': 'address',
        'location': 'location',
        'unit': 'unit',
        'sex': 'sex'
    }
    
    for sheet_field, data_field in field_mapping.items():
        if sheet_field in column_map and data_field in member_data:
            col_idx = column_map[sheet_field]
            row[col_idx] = str(member_data[data_field]) if member_data[data_field] else ""
    
    return row
