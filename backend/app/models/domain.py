from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, ForeignKey, Boolean, Index, Table
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category_rel")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="brand_rel")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False, index=True)
    brand_id = Column(String, ForeignKey("brands.id"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True) # Direct string category for fast lookup
    brand = Column(String, nullable=False, index=True)
    sub_category = Column(String, nullable=True, index=True)
    price = Column(Float, nullable=False, index=True)
    original_price = Column(Float, nullable=True)
    rating = Column(Float, default=4.5, index=True)
    review_count = Column(Integer, default=120)
    image_url = Column(String, nullable=False)
    attributes = Column(JSON, nullable=True)
    in_stock = Column(Boolean, default=True, index=True)
    view_count = Column(Integer, default=0)
    purchase_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category_rel = relationship("Category", back_populates="products")
    brand_rel = relationship("Brand", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    embedding = relationship("ProductEmbedding", back_populates="product", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_product_cat_price", "category", "price"),
        Index("idx_product_in_stock_rating", "in_stock", "rating"),
    )

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)

    product = relationship("Product", back_populates="images")

class ProductEmbedding(Base):
    __tablename__ = "product_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False, unique=True, index=True)
    vector_json = Column(JSON, nullable=False)
    dimension = Column(Integer, default=384)
    model_version = Column(String, default="sentence-transformers/all-MiniLM-L6-v2")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="embedding")

class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    active_intent_label = Column(String, default="Neutral")
    intent_confidence = Column(Float, default=0.5)
    intent_vector_json = Column(JSON, nullable=True)
    intent_history_json = Column(JSON, nullable=True) # Historical vector shifts
    consent_given = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ClickstreamEvent(Base):
    __tablename__ = "clickstream_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True) # CLICK, HOVER, SEARCH, WISHLIST, ADD_TO_CART
    product_id = Column(String, nullable=True, index=True)
    dwell_time_ms = Column(Integer, default=0)
    query_text = Column(Text, nullable=True)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class RecommendationCache(Base):
    __tablename__ = "recommendation_caches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String, nullable=False, unique=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    results_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProductBundle(Base):
    __tablename__ = "product_bundles"

    id = Column(String, primary_key=True, index=True)
    base_product_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    bundle_type = Column(String, nullable=False) # COMPLETE_LOOK, FREQUENTLY_BOUGHT
    bundled_product_ids_json = Column(JSON, nullable=False)
    discount_pct = Column(Float, default=15.0)
    score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalyticsMetric(Base):
    __tablename__ = "analytics_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String, nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    context_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
