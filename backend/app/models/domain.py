from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, index=True)
    sub_category = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=120)
    image_url = Column(String, nullable=False)
    attributes = Column(JSON, nullable=True) # e.g. {"color": "Nordic Wood", "vibe": "Minimalist"}
    in_stock = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id = Column(String, primary_key=True, index=True)
    active_intent_label = Column(String, default="Neutral")
    intent_vector_json = Column(JSON, nullable=True)
    consent_given = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False) # CLICK, HOVER, SEARCH, ADD_TO_CART
    product_id = Column(String, nullable=True)
    dwell_time_ms = Column(Integer, default=0)
    query_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
