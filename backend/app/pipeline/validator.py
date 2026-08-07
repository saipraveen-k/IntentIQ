import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("intent_iq.validator")

class DataValidationEngine:
    """
    Module 4: Data Validation Engine
    Validates normalized records for missing values, corrupt fields, duplicate IDs, invalid prices, and missing metadata.
    """
    def __init__(self):
        self.seen_ids = set()

    def validate_product_record(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors = []
        p_id = record.get("id")
        
        if not p_id:
            errors.append("MISSING_PRODUCT_ID")
        elif p_id in self.seen_ids:
            errors.append("DUPLICATE_PRODUCT_ID")

        if not record.get("title"):
            errors.append("MISSING_TITLE")

        if not record.get("category"):
            errors.append("MISSING_CATEGORY")

        price = record.get("price")
        if price is None or not isinstance(price, (int, float)) or price < 0:
            errors.append("INVALID_PRICE")

        rating = record.get("rating", 4.5)
        if not (0.0 <= rating <= 5.0):
            errors.append("INVALID_RATING")

        is_valid = len(errors) == 0
        if is_valid and p_id:
            self.seen_ids.add(p_id)

        return is_valid, errors

    def validate_batch(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        valid_records = []
        corrupt_records = []
        error_summary: Dict[str, int] = {}

        for rec in records:
            valid, errs = self.validate_product_record(rec)
            if valid:
                valid_records.append(rec)
            else:
                corrupt_records.append({"record": rec, "errors": errs})
                for err in errs:
                    error_summary[err] = error_summary.get(err, 0) + 1

        report = {
            "total_processed": len(records),
            "valid_count": len(valid_records),
            "corrupt_count": len(corrupt_records),
            "error_distribution": error_summary
        }
        logger.info(f"Validation summary: {len(valid_records)} valid, {len(corrupt_records)} invalid.")
        return {"valid_records": valid_records, "corrupt_records": corrupt_records, "report": report}

from typing import Tuple
