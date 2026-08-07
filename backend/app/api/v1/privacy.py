from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.core.database import get_db
from app.models.schemas import PrivacyPurgeRequest, PrivacyPurgeResponse
from app.models.domain import ClickstreamEvent, UserSession
from app.core.redis_client import redis_manager

router = APIRouter()

@router.post("/user/privacy-purge", response_model=PrivacyPurgeResponse)
async def purge_user_privacy_data(
    req: PrivacyPurgeRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Flush Redis Intent Vector
    await redis_manager.delete_key(f"user_intent:{req.session_id}")

    # 2. Delete Clickstream Events from Database
    del_stmt = delete(ClickstreamEvent).where(ClickstreamEvent.session_id == req.session_id)
    res = await db.execute(del_stmt)
    purged_count = res.rowcount or 0

    # 3. Delete Session Record
    del_sess_stmt = delete(UserSession).where(UserSession.session_id == req.session_id)
    await db.execute(del_sess_stmt)

    await db.commit()

    return PrivacyPurgeResponse(
        session_id=req.session_id,
        status="PURGED",
        purged_records=purged_count
    )
