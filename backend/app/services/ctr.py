import logging
import math
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Event
from app.crud.events import get_user_events, get_all_events

logger = logging.getLogger("ctr_service")

# Standard prior to smooth CTR calculations when clicks/views are sparse
DEFAULT_GLOBAL_CTR = 0.05

async def compute_user_ctr_stats(db: AsyncSession, user_id: str, product_details: dict) -> dict:
    """
    Computes department-level CTR for a user based on their clickstream history.
    Returns:
        dict: { department_name: ctr_score }
    """
    try:
        events = await get_user_events(db, user_id, limit=500)
        if not events:
            return {}
        
        dept_counts = {}
        for ev in events:
            if not ev.product_id:
                continue
            try:
                pid = int(ev.product_id)
            except ValueError:
                continue
            
            details = product_details.get(pid)
            if not details:
                continue
            
            dept = details.get("department")
            if not dept:
                continue
            
            if dept not in dept_counts:
                dept_counts[dept] = {"views": 0, "clicks": 0}
            
            if ev.event_type == "view":
                dept_counts[dept]["views"] += 1
            elif ev.event_type in ["click", "add_to_cart", "purchase"]:
                dept_counts[dept]["clicks"] += 1
        
        # Laplace smoothing parameters: alpha=1 (virtual click), beta=20 (virtual views)
        alpha = 1.0
        beta = 20.0
        user_ctr = {}
        for dept, counts in dept_counts.items():
            views = counts["views"]
            clicks = counts["clicks"]
            user_ctr[dept] = (clicks + alpha) / (views + beta)
            
        return user_ctr
    except Exception as e:
        logger.error(f"Error computing user CTR: {e}")
        return {}

async def compute_global_ctr_stats(db: AsyncSession, product_details: dict) -> dict:
    """
    Computes global department-level CTR across all users.
    Returns:
        dict: { department_name: ctr_score }
    """
    try:
        # Fetch last 1000 events to calculate recent global CTR
        events = await get_all_events(db, limit=1000)
        if not events:
            return {}
            
        dept_counts = {}
        for ev in events:
            if not ev.product_id:
                continue
            try:
                pid = int(ev.product_id)
            except ValueError:
                continue
                
            details = product_details.get(pid)
            if not details:
                continue
                
            dept = details.get("department")
            if not dept:
                continue
                
            if dept not in dept_counts:
                dept_counts[dept] = {"views": 0, "clicks": 0}
                
            if ev.event_type == "view":
                dept_counts[dept]["views"] += 1
            elif ev.event_type in ["click", "add_to_cart", "purchase"]:
                dept_counts[dept]["clicks"] += 1
                
        global_ctr = {}
        for dept, counts in dept_counts.items():
            views = counts["views"]
            clicks = counts["clicks"]
            global_ctr[dept] = clicks / views if views > 0 else DEFAULT_GLOBAL_CTR
            
        return global_ctr
    except Exception as e:
        logger.error(f"Error computing global CTR: {e}")
        return {}

async def get_ctr_boost_factors(db: AsyncSession, user_id: str, product_details: dict) -> dict:
    """
    Returns the CTR boost factors per department for a user, using global CTR as a prior.
    """
    user_ctr = await compute_user_ctr_stats(db, user_id, product_details)
    global_ctr = await compute_global_ctr_stats(db, product_details)
    
    boost_factors = {}
    
    # We combine user_ctr and global_ctr
    # If the user has interaction with a department, use user_ctr. Otherwise, use global_ctr.
    # Fallback to DEFAULT_GLOBAL_CTR if not present anywhere.
    all_depts = set(user_ctr.keys()) | set(global_ctr.keys()) | {
        "produce", "dairy eggs", "snacks", "beverages", "frozen", 
        "pantry", "bakery", "canned goods", "deli", "dry goods pasta",
        "household", "meat seafood", "international", "personal care",
        "babies", "breakfast", "pets", "missing", "other", "bulk", "alcohol"
    }
    
    for dept in all_depts:
        if dept in user_ctr:
            ctr = user_ctr[dept]
        elif dept in global_ctr:
            ctr = global_ctr[dept]
        else:
            ctr = DEFAULT_GLOBAL_CTR
            
        # Boost formula: boost = 1.0 + log(1.0 + CTR)
        boost_factors[dept] = 1.0 + math.log(1.0 + ctr)
        
    return {
        "boost_factors": boost_factors,
        "user_ctr": user_ctr,
        "global_ctr": global_ctr
    }
