from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import TelemetryEventCreate
from app.models.domain import Product
from app.agents.intent_agent import intent_agent
from app.agents.analytics_agent import analytics_agent
from sqlalchemy.future import select

router = APIRouter()

@router.post("/telemetry/event", status_code=status.HTTP_202_ACCEPTED)
async def record_telemetry_event(
    event: TelemetryEventCreate,
    db: AsyncSession = Depends(get_db)
):
    # Record event in analytics DB
    await analytics_agent.record_event(db, event.dict())

    # If event has product_id, fetch product category to update intent vector
    if event.product_id:
        stmt = select(Product).where(Product.id == event.product_id)
        res = await db.execute(stmt)
        prod = res.scalar_one_or_none()
        if prod:
            await intent_agent.update_intent_vector(
                session_id=event.session_id,
                item_text=f"{prod.title} {prod.description or ''}",
                category=prod.category
            )

    return {"status": "ACCEPTED", "session_id": event.session_id}
