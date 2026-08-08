from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.core.database import get_db
from app.models.schemas import PrivacyPurgeRequest, PrivacyPurgeResponse
from app.models.domain import ClickstreamEvent, UserSession, Event
from app.core.redis_client import redis_manager

router = APIRouter()

@router.post("/privacy-purge", response_model=PrivacyPurgeResponse)
@router.post("/user/privacy-purge", response_model=PrivacyPurgeResponse)
async def purge_user_privacy_data(
    req: PrivacyPurgeRequest,
    db: AsyncSession = Depends(get_db)
):
    target_session = req.session_id or f"sess-{req.user_id}"
    target_user = req.user_id or target_session

    # 1. Flush Redis Intent Vector
    if req.session_id:
        await redis_manager.delete_key(f"user_intent:{req.session_id}")
    if req.user_id:
        await redis_manager.delete_key(f"user_intent:{req.user_id}")

    # 2. Delete Clickstream Events & Events from Database
    del_stmt = delete(ClickstreamEvent).where(ClickstreamEvent.session_id == target_session)
    res = await db.execute(del_stmt)
    purged_count = res.rowcount or 0

    del_ev_stmt = delete(Event).where(
        (Event.session_id == target_session) | (Event.user_id == target_user)
    )
    res_ev = await db.execute(del_ev_stmt)
    purged_count += (res_ev.rowcount or 0)

    # 3. Delete Session Record
    del_sess_stmt = delete(UserSession).where(
        (UserSession.session_id == target_session) | (UserSession.user_id == target_user)
    )
    await db.execute(del_sess_stmt)

    await db.commit()

    return PrivacyPurgeResponse(
        session_id=target_session,
        status="PURGED",
        purged_records=purged_count
    )
