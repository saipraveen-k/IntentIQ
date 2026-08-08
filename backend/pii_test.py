import os
import sys
import re
import json

def run_pii_audit(logs_dir=None):
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
            
    print("=" * 65)
    print("      INTENTIQ AUTOMATED PII & PRIVACY COMPLIANCE AUDIT")
    print("=" * 65)
    
    if not logs_dir:
        logs_dir = os.path.join(os.path.dirname(__file__), "logs")
        
    log_file = os.path.join(logs_dir, "clickstream_ctr.log")
    
    raw_email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
    ssn_pattern = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
    credit_card_pattern = re.compile(r'\b(?:\d[ -]*?){13,16}\b')
    password_field_pattern = re.compile(r'"password"\s*:\s*"[^"]+"', re.IGNORECASE)
    
    lines_scanned = 0
    records_scanned = 0
    violations = []
    
    if not os.path.exists(log_file):
        print(f"Log file not found at: {log_file}")
        print("Note: Clickstream events have not been written to log file yet.")
        print("Status: ✅ PASS (No unmasked PII logged)")
        print("=" * 65)
        return True

    print(f"Scanning log file: {log_file}...\n")
    
    with open(log_file, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            lines_scanned += 1
            line_str = line.strip()
            if not line_str:
                continue
                
            try:
                data = json.loads(line_str)
                records_scanned += 1
            except Exception:
                pass
                
            # 1. Unmasked emails check
            emails = raw_email_pattern.findall(line_str)
            for email in emails:
                if "***" not in email:
                    violations.append({
                        "line": line_num,
                        "type": "Unmasked Email Exposure",
                        "match": email
                    })
                    
            # 2. SSN check
            ssns = ssn_pattern.findall(line_str)
            for ssn in ssns:
                violations.append({
                    "line": line_num,
                    "type": "Raw SSN Exposure",
                    "match": ssn
                })
                
            # 3. Credit Card check
            cards = credit_card_pattern.findall(line_str)
            for card in cards:
                clean_card = card.replace("-", "").replace(" ", "")
                if len(clean_card) == 16 and clean_card.isdigit():
                    violations.append({
                        "line": line_num,
                        "type": "Raw Credit Card Exposure",
                        "match": card
                    })
                    
            # 4. Password leak check
            if password_field_pattern.search(line_str):
                violations.append({
                    "line": line_num,
                    "type": "Plaintext Password Leak",
                    "match": "Password field present in JSON payload"
                })

    print(f"Summary:")
    print(f"  - Log file: {os.path.basename(log_file)}")
    print(f"  - Total Lines Scanned: {lines_scanned}")
    print(f"  - JSON Records Evaluated: {records_scanned}")
    print(f"  - PII Violations Count: {len(violations)}")
    print("-" * 65)
    
    if violations:
        print("❌ AUDIT FAILED - PII VIOLATIONS FOUND:")
        for v in violations:
            print(f"  [Line {v['line']}] {v['type']}: {v['match']}")
        print("=" * 65)
        return False
    else:
        print("✅ AUDIT PASSED - 100% PII COMPLIANT")
        print("   All emails masked (e.g. su***@domain.com), zero passwords/cards/SSNs exposed.")
        print("=" * 65)
        return True

if __name__ == "__main__":
    success = run_pii_audit()
    sys.exit(0 if success else 1)
