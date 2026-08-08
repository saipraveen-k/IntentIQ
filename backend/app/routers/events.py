import logging
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Event
from app.crud.events import save_event_batch

router = APIRouter()
logger = logging.getLogger("events_router")

class EventCreate(BaseModel):
    product_id: Optional[str] = None
    event_type: str  # view, click, add_to_cart, purchase, search
    session_id: Optional[str] = None
    query_text: Optional[str] = None
    results_shown: Optional[List[str]] = None

# Global event queue for async batch processing
event_queue = asyncio.Queue()

@router.post("/event")
async def log_event(req: EventCreate, request: Request):
    """
    Log a clickstream event. Protected by FirebaseAuthMiddleware.
    """
    uid = getattr(request.state, "uid", "mock-default-user")
    
    event_obj = Event(
        user_id=uid,
        product_id=req.product_id,
        event_type=req.event_type,
        session_id=req.session_id or "default_session",
        timestamp=datetime.utcnow(),
        query_text=req.query_text,
        results_shown=req.results_shown
    )
    
    # Put event in queue for async batch processing
    await event_queue.put(event_obj)
    
    return {"status": "success", "message": "Event queued"}

async def event_batch_worker():
    """
    Background worker that fetches events from the queue and inserts them in batches.
    """
    logger.info("Starting Event batch worker...")
    from app.core.database import AsyncSessionLocal
    
    while True:
        try:
            events_to_insert = []
            
            # Wait for at least one event
            first_event = await event_queue.get()
            events_to_insert.append(first_event)
            event_queue.task_done()
            
            # Non-blocking check for more events up to batch size of 50
            while not event_queue.empty() and len(events_to_insert) < 50:
                try:
                    event = event_queue.get_nowait()
                    events_to_insert.append(event)
                    event_queue.task_done()
                except asyncio.QueueEmpty:
                    break
            
            if events_to_insert:
                async with AsyncSessionLocal() as db:
                    await save_event_batch(db, events_to_insert)
                    logger.info(f"Saved batch of {len(events_to_insert)} events to database.")
                    
        except asyncio.CancelledError:
            logger.info("Event batch worker cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in Event batch worker: {e}")
            await asyncio.sleep(2)
