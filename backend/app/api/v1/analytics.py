from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import AnalyticsDashboardResponse
from app.repositories.analytics_repository import AnalyticsRepository

router = APIRouter()

def get_analytics_repository(db: AsyncSession = Depends(get_db)) -> AnalyticsRepository:
    return AnalyticsRepository(db)

@router.get("/analytics/dashboard", response_model=AnalyticsDashboardResponse)
async def get_analytics_metrics(
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository)
):
    metrics = await analytics_repo.get_metrics_summary()
    return AnalyticsDashboardResponse(**metrics)
