import re
import logging

logger = logging.getLogger("intent_iq.guardrail_agent")

class GuardrailAgent:
    """
    Guardrail Agent:
    Scans incoming queries for prompt injection, malicious patterns, and toxic input.
    """
    def __init__(self):
        self.injection_patterns = [
            r"ignore\s+previous\s+instructions",
            r"system\s*:",
            r"show\s+secret\s+keys",
            r"drop\s+table",
            r"<script>",
            r"eval\(",
            r"override\s+system"
        ]

    def validate_and_sanitize(self, input_text: str) -> dict:
        if not input_text:
            return {"is_safe": True, "flag": "CLEAN", "sanitized_text": ""}

        lowered = input_text.lower()
        for pattern in self.injection_patterns:
            if re.search(pattern, lowered):
                logger.warning(f"Guardrail triggered for pattern '{pattern}' in text: {input_text}")
                return {
                    "is_safe": False,
                    "flag": "PROMPT_INJECTION_ATTACK",
                    "sanitized_text": ""
                }

        # Sanitize HTML tags
        sanitized = re.sub(r'<[^>]*>', '', input_text)
        return {
            "is_safe": True,
            "flag": "CLEAN",
            "sanitized_text": sanitized.strip()
        }

guardrail_agent = GuardrailAgent()
