from typing import Dict, List

from app.services.file_parser import parse_pdf


def extract_text_from_pdf(file_path: str) -> List[Dict]:
    return parse_pdf(file_path)
