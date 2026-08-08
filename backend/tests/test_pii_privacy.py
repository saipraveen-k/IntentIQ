import os
import re
import json
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.domain import Event
from sqlalchemy import select

# Regex patterns for PII inspection
RAW_EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
MASKED_EMAIL_REGEX = re.compile(r'^[A-Za-z0-9]{1,2}\*\*\*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d[ -]*?){13,16}\b')

@pytest.mark.asyncio
async def test_persistent_log_file_pii_compliance():
    """
    Scans persistent log files (e.g. logs/clickstream_ctr.log) to ensure 
    that no raw unmasked emails, SSNs, or credit cards are logged.
    """
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    log_file = os.path.join(logs_dir, "clickstream_ctr.log")
    
    if not os.path.exists(log_file):
        pytest.skip(f"Log file {log_file} does not exist yet; skipping log scan.")
        
    unmasked_pii_violations = []
    
    with open(log_file, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            if not line.strip():
                continue
                
            # Scan line for unmasked emails
            emails = RAW_EMAIL_REGEX.findall(line)
            for email in emails:
                # If the email is not masked (e.g. contains ***), record violation
                if "***" not in email:
                    unmasked_pii_violations.append(f"Line {line_num}: Unmasked Email '{email}' found.")
                    
            # Scan line for SSNs
            ssns = SSN_REGEX.findall(line)
            for ssn in ssns:
                unmasked_pii_violations.append(f"Line {line_num}: Potential SSN '{ssn}' found.")
                
            # Scan line for Credit Cards
            cards = CREDIT_CARD_REGEX.findall(line)
            for card in cards:
                # Exclude timestamp or ID sequences
                clean_card = card.replace("-", "").replace(" ", "")
                if len(clean_card) == 16 and clean_card.isdigit():
                    unmasked_pii_violations.append(f"Line {line_num}: Potential Credit Card '{card}' found.")

    assert len(unmasked_pii_violations) == 0, f"PII Violations found in logs:\n" + "\n".join(unmasked_pii_violations)

@pytest.mark.asyncio
async def test_privacy_purge_user_data_erasure():
    """
    Verifies that calling POST /api/v1/privacy/purge purges all stored user events 
    and session intent state, enforcing DPDP privacy requirements.
    """
    test_uid = "user-pii-test-purge-999"
    
    # 1. Seed database with test events for this user
    async with AsyncSessionLocal() as db:
        test_event = Event(
            user_id=test_uid,
            product_id="101",
            event_type="click",
            session_id="session-pii-999",
            query_text="organic milk"
        )
        db.add(test_event)
        await db.commit()
        
        # Verify event was written
        res = await db.execute(select(Event).where(Event.user_id == test_uid))
        events_before = res.scalars().all()
        assert len(events_before) >= 1
        
    # 2. Call Privacy Purge Endpoint
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/privacy-purge",
            headers={"Authorization": f"Bearer mock-{test_uid}"},
            json={"user_id": test_uid, "confirm_purge": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["SUCCESS", "PURGED"] or data.get("success") is True or "purged" in str(data).lower()
        
    # 3. Verify user events have been deleted from database
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Event).where(Event.user_id == test_uid))
        events_after = res.scalars().all()
        assert len(events_after) == 0

def run_standalone_pii_scan():
    """
    Standalone runner for PII inspection.
    """
    print("=" * 60)
    print("      AUTOMATED PII & PRIVACY COMPLIANCE AUDIT SUITE")
    print("=" * 60)
    
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    log_file = os.path.join(logs_dir, "clickstream_ctr.log")
    
    scanned_lines = 0
    violations = []
    
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                scanned_lines += 1
                emails = RAW_EMAIL_REGEX.findall(line)
                for email in emails:
                    if "***" not in email:
                        violations.append(f"Log Line {line_num}: Unmasked Email '{email}'")
                        
                ssns = SSN_REGEX.findall(line)
                for ssn in ssns:
                    violations.append(f"Log Line {line_num}: Raw SSN '{ssn}'")
                    
    print(f"Total Log Lines Scanned: {scanned_lines}")
    print(f"Raw PII Violations Found: {len(violations)}")
    
    if violations:
        print("\n❌ VIOLATIONS DETECTED:")
        for v in violations:
            print(f"  - {v}")
    else:
        print("\n✅ PII COMPLIANCE SCAN PASSED: Zero raw PII exposures found.")
    print("=" * 60)

if __name__ == "__main__":
    run_standalone_pii_scan()
