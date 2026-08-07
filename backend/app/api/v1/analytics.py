from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import AnalyticsDashboardResponse
from app.agents.analytics_agent import analytics_agent

router = APIRouter()

@router.get("/analytics/dashboard", response_model=AnalyticsDashboardResponse)
async def get_analytics_metrics(db: AsyncSession = Depends(get_db)):
    metrics = await analytics_agent.get_dashboard_metrics(db)
    return AnalyticsDashboardResponse(**metrics)
