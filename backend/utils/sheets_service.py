"""
Google Sheets API service
Handles all interactions with Google Sheets
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from config.settings import settings
from typing import List, Optional

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class GoogleSheetsService:
    """Service for interacting with Google Sheets API"""

    def __init__(self):
        self.sheet_id = settings.GOOGLE_SHEETS_ID
        self.sheet_name = settings.SHEET_NAME
        self.service = None
        self._initialize_service()

    def _initialize_service(self):
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
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{range_notation}"
            ).execute(num_retries=2)
            return result.get("values", [])
        except HttpError as e:
            print(f"Error fetching sheet data: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error fetching sheet data: {e}")
            return []

    def append_row(self, values: List[str], range_notation: str = "A:K"):
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
        try:
            # Accept full range directly (e.g. "A2:X2") or build it
            if range_notation and ':' in range_notation:
                full_range = range_notation
            elif range_notation:
                full_range = f"{range_notation}{row_index}"
            else:
                full_range = f"A{row_index}:K{row_index}"

            body = {"values": [values]}
            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{full_range}",
                valueInputOption="RAW",
                body=body
            ).execute()
        except HttpError as e:
            print(f"Error updating row: {e}")
            raise

    def update_cell(self, cell_notation: str, value: str):
        """Update a single cell e.g. 'X2' """
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

    def update_cell_as_text(self, cell_notation: str, value: str):
        """Force plain text — prevents Google Sheets from auto-converting dates"""
        try:
            body = {"values": [[f"'{value}"]]}
            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f"{self.sheet_name}!{cell_notation}",
                valueInputOption="USER_ENTERED",
                body=body
            ).execute()
        except HttpError as e:
            print(f"Error updating cell as text: {e}")
            raise

    def find_row_by_id(self, member_id: str, all_data: Optional[List[List[str]]] = None) -> Optional[int]:
        if all_data is None:
            all_data = self.get_all_data()
        for i, row in enumerate(all_data[1:], start=2):
            if row and row[0] == member_id:
                return i
        return None

    def column_index_to_letter(self, index: int) -> str:
        result = ""
        while index >= 0:
            result = chr(index % 26 + 65) + result
            index = index // 26 - 1
        return result


# Global sheets service instance
sheets_service = GoogleSheetsService()