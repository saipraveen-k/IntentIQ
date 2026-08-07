from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.brain_orchestrator import brain_orchestrator

router = APIRouter()

class BrainAnalyzeRequest(BaseModel):
    session_id: str = Field(..., description="Active user session ID")
    search_query: Optional[str] = Field(None, description="Natural language search query")
    clicked_products: Optional[List[str]] = Field(None, description="List of recently clicked product IDs")
    recent_events: Optional[List[Dict[str, Any]]] = Field(None, description="Recent telemetry events")

@router.post("/brain/analyze")
async def analyze_brain_request(
    req: BrainAnalyzeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /api/v1/brain/analyze
    Executes the AI Brain Agent Orchestrator to sequence all 7 AI Agents in parallel/series,
    merges results, measures per-agent latency SLAs, and returns a unified intelligence payload.
    """
    results = await brain_orchestrator.analyze(
        session_id=req.session_id,
        db=db,
        search_query=req.search_query,
        clicked_products=req.clicked_products,
        recent_events=req.recent_events
    )
    return results
