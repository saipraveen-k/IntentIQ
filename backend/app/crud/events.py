from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.domain import Event
from typing import List

async def save_event_batch(db: AsyncSession, events: List[Event]) -> None:
    """
    Saves a batch of events to the database.
    """
    for event in events:
        db.add(event)
    await db.commit()

async def get_user_events(db: AsyncSession, user_id: str, limit: int = 100) -> List[Event]:
    """
    Fetches the latest events for a specific user.
    """
    stmt = select(Event).where(Event.user_id == user_id).order_by(Event.timestamp.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_all_events(db: AsyncSession, limit: int = 100) -> List[Event]:
    """
    Fetches all latest events in the database (admin only).
    """
    stmt = select(Event).order_by(Event.timestamp.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
