import re
from typing import Any, Dict, List, Union

# Regex patterns for PII detection & masking
EMAIL_REGEX = re.compile(r'\b([A-Za-z0-9._%+-]{1,2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d[ -]*?){13,16}\b')

SENSITIVE_KEYS = {
    "password", "pass", "secret", "token", "access_token", 
    "id_token", "credit_card", "card_number", "ssn", "cvv"
}

def sanitize_text(text: str) -> str:
    """
    Sanitizes raw text strings by masking emails, phone numbers, SSNs, and credit cards.
    """
    if not text or not isinstance(text, str):
        return text

    # Mask emails: john.doe@example.com -> jo***@example.com
    text = EMAIL_REGEX.sub(r'\1***@\2', text)
    
    # Mask SSNs
    text = SSN_REGEX.sub('[REDACTED_SSN]', text)
    
    # Mask Credit Cards
    def mask_card(match):
        digits = match.group(0).replace("-", "").replace(" ", "")
        if len(digits) == 16 and digits.isdigit():
            return f"****-****-****-{digits[-4:]}"
        return match.group(0)
        
    text = CREDIT_CARD_REGEX.sub(mask_card, text)
    
    # Mask Phone Numbers
    text = PHONE_REGEX.sub('[REDACTED_PHONE]', text)
    
    return text

def sanitize_payload(payload: Any) -> Any:
    """
    Recursively sanitizes dictionary payloads, lists, and primitives for PII compliance.
    """
    if isinstance(payload, dict):
        sanitized = {}
        for key, val in payload.items():
            key_lower = str(key).lower()
            if any(sens in key_lower for sens in SENSITIVE_KEYS):
                sanitized[key] = "[REDACTED_SENSITIVE_KEY]"
            else:
                sanitized[key] = sanitize_payload(val)
        return sanitized
    elif isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    elif isinstance(payload, str):
        return sanitize_text(payload)
    else:
        return payload
