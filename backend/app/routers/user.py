import logging
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ctr import get_ctr_boost_factors
from app.crud.events import get_all_events

router = APIRouter()
logger = logging.getLogger("user_router")

@router.get("/user/stats")
async def get_user_stats(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Get the authenticated user's CTR statistics per department.
    """
    uid = getattr(request.state, "uid", None)
    if not uid:
        raise HTTPException(status_code=401, detail="User not authenticated")
        
    # Lazy import to avoid circular dependency
    from app.main import product_details
    stats = await get_ctr_boost_factors(db, uid, product_details)
    return {
        "user_id": uid,
        "user_ctr": stats["user_ctr"],
        "global_ctr": stats["global_ctr"],
        "boost_factors": stats["boost_factors"]
    }

@router.get("/admin/events")
async def get_admin_events(request: Request, db: AsyncSession = Depends(get_db), limit: int = 100):
    """
    Get event logs for debugging. Admin-only.
    """
    user_claims = getattr(request.state, "user", {})
    is_admin = user_claims.get("admin", False)
    uid = user_claims.get("uid", "")
    
    # Check if the user is admin
    if not is_admin and not uid.lower().endswith("admin") and uid != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
        
    events = await get_all_events(db, limit)
    return {
        "events": [
            {
                "id": ev.id,
                "user_id": ev.user_id,
                "product_id": ev.product_id,
                "event_type": ev.event_type,
                "session_id": ev.session_id,
                "timestamp": ev.timestamp,
                "query_text": ev.query_text,
                "results_shown": ev.results_shown
            }
            for ev in events
        ]
    }
