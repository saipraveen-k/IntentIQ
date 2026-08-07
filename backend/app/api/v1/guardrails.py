from fastapi import APIRouter
from app.models.schemas import GuardrailValidationRequest, GuardrailValidationResponse
from app.agents.guardrail_agent import guardrail_agent

router = APIRouter()

@router.post("/guardrails/validate", response_model=GuardrailValidationResponse)
async def validate_guardrails(req: GuardrailValidationRequest):
    res = guardrail_agent.validate_and_sanitize(req.input_text)
    return GuardrailValidationResponse(**res)
