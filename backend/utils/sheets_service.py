"""
Google Sheets API service
Handles all interactions with Google Sheets
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from config.settings import settings
from typing import List, Optional
import os

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class GoogleSheetsService:
    """Service for interacting with Google Sheets API"""
    
    def __init__(self):
        """Initialize Google Sheets service with credentials"""
        self.sheet_id = settings.GOOGLE_SHEETS_ID
        self.sheet_name = settings.SHEET_NAME
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the Google Sheets API service"""
        try:
            creds = service_account.Credentials.from_service_account_file(
                settings.GOOGLE_CREDENTIALS_FILE,
                scopes=SCOPES
            )
            self.service = build("sheets", "v4", credentials=creds)
        except Exception as e:
            print(f"Error initializing Google Sheets service: {e}")
            raise
    
    def get_all_data(self, range_notation: str = "A1:ZZ") -> List[List[str]]:
        """
        Fetch all data from the sheet
        
        Args:
            range_notation: A1 notation range (default: A1:ZZ for all columns)
            
        Returns:
            List of rows, each row is a list of cell values
        """
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{range_notation}"
            ).execute()
            
            return result.get("values", [])
        except HttpError as e:
            print(f"Error fetching sheet data: {e}")
            return []
    
    def append_row(self, values: List[str], range_notation: str = "A:K"):
        """
        Append a new row to the sheet
        
        Args:
            values: List of values for the new row
            range_notation: Range to append to (default: A:K for member data)
        """
        try:
            body = {"values": [values]}
            self.service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{range_notation}",
                valueInputOption="RAW",
                body=body
            ).execute()
        except HttpError as e:
            print(f"Error appending row: {e}")
            raise
    
    def update_row(self, row_index: int, values: List[str], range_notation: Optional[str] = None):
        """
        Update a specific row in the sheet
        
        Args:
            row_index: Row number (1-indexed, row 1 is header)
            values: List of new values for the row
            range_notation: Optional specific range (default: A{row}:K{row})
        """
        try:
            if range_notation is None:
                range_notation = f"A{row_index}:K{row_index}"
            else:
                range_notation = f"{range_notation}{row_index}"
            
            body = {"values": [values]}
            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{range_notation}",
                valueInputOption="RAW",
                body=body
            ).execute()
        except HttpError as e:
            print(f"Error updating row: {e}")
            raise
    
    def update_cell(self, cell_notation: str, value: str):
        """
        Update a single cell
        
        Args:
            cell_notation: Cell in A1 notation (e.g., "H2")
            value: New value for the cell
        """
        try:
            body = {"values": [[value]]}
            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{cell_notation}",
                valueInputOption="RAW",
                body=body
            ).execute()
        except HttpError as e:
            print(f"Error updating cell: {e}")
            raise
    
    def find_row_by_id(self, member_id: str, all_data: Optional[List[List[str]]] = None) -> Optional[int]:
        """
        Find row index by member S/N
        
        Args:
            member_id: S/N to search for
            all_data: Optional pre-fetched data to avoid extra API call
            
        Returns:
            Row index (1-indexed) or None if not found
        """
        if all_data is None:
            all_data = self.get_all_data()
        
        for i, row in enumerate(all_data[1:], start=2):  # Skip header, start at row 2
            if row and row[0] == member_id:
                return i
        
        return None
    
    def column_index_to_letter(self, index: int) -> str:
        """
        Convert column index to letter (0->A, 25->Z, 26->AA)
        
        Args:
            index: 0-based column index
            
        Returns:
            Column letter(s)
        """
        result = ""
        while index >= 0:
            result = chr(index % 26 + 65) + result
            index = index // 26 - 1
        return result


# Global sheets service instance
sheets_service = GoogleSheetsService()
