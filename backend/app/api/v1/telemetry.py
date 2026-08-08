from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.schemas import TelemetryEventCreate
from app.repositories.session_repository import SessionRepository
from app.repositories.product_repository import ProductRepository
from app.agents.intent_agent import intent_agent

router = APIRouter()

def get_session_repository(db: AsyncSession = Depends(get_db)) -> SessionRepository:
    return SessionRepository(db)

def get_product_repository(db: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

@router.post("/telemetry/event", status_code=status.HTTP_202_ACCEPTED)
async def record_telemetry_event(
    event: TelemetryEventCreate,
    session_repo: SessionRepository = Depends(get_session_repository),
    product_repo: ProductRepository = Depends(get_product_repository)
):
    # 1. Record event log in database repository
    await session_repo.add_event({
        "session_id": event.session_id,
        "event_type": event.event_type,
        "product_id": event.product_id,
        "dwell_time_ms": event.dwell_time_ms or 0,
        "query_text": event.query_text
    })

    # 2. Update session intent vector if product_id is provided
    if event.product_id:
        prod = await product_repo.get_by_id(event.product_id)
        item_text = f"{prod.title} {prod.description or ''}" if prod else f"Product {event.product_id}"
        category = prod.category if prod else ""
        await intent_agent.update_session_intent(
            session_id=event.session_id,
            event_type=event.event_type,
            product_id=event.product_id,
            item_text=item_text,
            category=category,
            dwell_time_ms=event.dwell_time_ms or 0,
            session_repo=session_repo
        )

    return {"status": "ACCEPTED", "session_id": event.session_id}
