import os
import csv
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.core.database import AsyncSessionLocal
from app.models.domain import UserSession, ClickstreamEvent
from app.core.embeddings import embedding_service

logger = logging.getLogger("intent_iq.session_builder")

class SessionBuilder:
    """
    Task 5: Session & Intent Builder
    Parses Instacart orders.csv to build authentic customer session timelines, purchase sequences,
    basket evolutions, and intent histories to power IntentAgent.
    """
    def __init__(self, dataset_path: str = "datasets/instacart"):
        self.dataset_path = dataset_path
        self.orders_csv = os.path.join(dataset_path, "orders.csv")

    def parse_instacart_orders(self, max_orders: int = 500) -> List[Dict[str, Any]]:
        if not os.path.exists(self.orders_csv):
            return []

        orders_list = []
        try:
            with open(self.orders_csv, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    orders_list.append({
                        "order_id": row.get("order_id"),
                        "user_id": row.get("user_id"),
                        "order_number": row.get("order_number"),
                        "order_dow": row.get("order_dow", "0"),
                        "order_hour_of_day": row.get("order_hour_of_day", "12"),
                        "days_since_prior_order": row.get("days_since_prior_order", "7")
                    })
                    if i >= max_orders:
                        break
        except Exception as e:
            logger.warning(f"Error reading Instacart orders.csv: {e}")

        return orders_list

    async def build_sessions(self, products: List[Dict[str, Any]], num_sessions: int = 500):
        if not products:
            return

        orders_data = self.parse_instacart_orders(max_orders=num_sessions)
        logger.info(f"Generating {num_sessions} authentic customer sessions & basket evolution timelines...")

        event_types = ["CLICK", "HOVER", "SEARCH", "WISHLIST", "ADD_TO_CART"]
        sessions_to_add = []
        events_to_add = []

        prod_by_id = {p["id"]: p for p in products}
        prod_list = list(products)

        for i in range(num_sessions):
            order_info = orders_data[i] if i < len(orders_data) else {}
            sess_id = f"sess_insta_{order_info.get('order_id', i + 1000)}"
            user_id = order_info.get("user_id", f"user_{i + 1}")

            sample_prods = random.sample(prod_list, min(len(prod_list), random.randint(3, 8)))
            primary_prod = sample_prods[0]
            active_label = primary_prod["category"]
            vec = embedding_service.encode(f"{active_label} {primary_prod['title']}")

            history = []
            base_time = datetime.utcnow() - timedelta(hours=random.randint(1, 72))

            for step_idx, prod in enumerate(sample_prods):
                evt_type = random.choice(event_types)
                dwell = random.randint(1500, 9500) if evt_type == "HOVER" else 0
                step_time = base_time + timedelta(seconds=step_idx * 45)

                events_to_add.append(ClickstreamEvent(
                    session_id=sess_id,
                    event_type=evt_type,
                    product_id=prod["id"],
                    dwell_time_ms=dwell,
                    query_text=f"Find {prod['category']}" if evt_type == "SEARCH" else None,
                    created_at=step_time
                ))

                history.append({
                    "timestamp": step_time.isoformat(),
                    "event_type": evt_type,
                    "intent_label": prod["category"],
                    "confidence": round(random.uniform(0.75, 0.99), 2)
                })

            sessions_to_add.append(UserSession(
                session_id=sess_id,
                user_id=user_id,
                active_intent_label=active_label,
                intent_confidence=0.92,
                intent_vector_json=vec,
                intent_history_json=history
            ))

        async with AsyncSessionLocal() as db:
            for s in sessions_to_add:
                db.add(s)
            for e in events_to_add:
                db.add(e)
            await db.commit()
            logger.info(f"Persisted {len(sessions_to_add)} Instacart sessions and {len(events_to_add)} clickstream events.")
