from typing import Optional, List, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import UserSession, ClickstreamEvent

class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_session(self, session_id: str) -> Optional[UserSession]:
        stmt = select(UserSession).where(UserSession.session_id == session_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def upsert_session(
        self,
        session_id: str,
        active_intent: str,
        confidence: float,
        vector_json: List[float],
        history_json: Optional[List[Dict[str, Any]]] = None
    ) -> UserSession:
        sess = await self.get_session(session_id)
        if not sess:
            sess = UserSession(
                session_id=session_id,
                active_intent_label=active_intent,
                intent_confidence=confidence,
                intent_vector_json=vector_json,
                intent_history_json=history_json or []
            )
            self.db.add(sess)
        else:
            sess.active_intent_label = active_intent
            sess.intent_confidence = confidence
            sess.intent_vector_json = vector_json
            if history_json:
                sess.intent_history_json = history_json
        await self.db.commit()
        await self.db.refresh(sess)
        return sess

    async def add_event(self, event_data: Dict[str, Any]) -> ClickstreamEvent:
        event = ClickstreamEvent(**event_data)
        self.db.add(event)
        await self.db.commit()
        return event

    async def get_recent_events(self, session_id: str, limit: int = 10) -> List[ClickstreamEvent]:
        stmt = (
            select(ClickstreamEvent)
            .where(ClickstreamEvent.session_id == session_id)
            .order_by(ClickstreamEvent.created_at.desc())
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
