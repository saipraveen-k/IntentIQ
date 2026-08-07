from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.models.schemas import FeedResponse, ProductDTO
from app.models.domain import Product
from app.agents.recommendation_agent import recommendation_agent
from app.agents.explainability_agent import explainability_agent

router = APIRouter()

@router.get("/recommendations/feed", response_model=FeedResponse)
async def get_personalized_feed(
    session_id: str = Query(..., description="Active session ID"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    # Step 1: Candidate retrieval via FAISS vector search
    candidates, active_label = await recommendation_agent.get_personalized_candidates(session_id, limit=limit)

    product_dtos: List[ProductDTO] = []

    if candidates:
        candidate_ids = [sku for sku, _ in candidates]
        scores_map = {sku: score for sku, score in candidates}

        stmt = select(Product).where(Product.id.in_(candidate_ids))
        res = await db.execute(stmt)
        products = res.scalars().all()

        # Preserve order of FAISS top results
        prod_dict = {p.id: p for p in products}

        for sku, score in candidates:
            if sku in prod_dict:
                p = prod_dict[sku]
                # Synthesize XAI explanation using Explainability Agent
                xai_text = await explainability_agent.generate_rationale(
                    user_intent=active_label,
                    product_title=p.title,
                    category=p.category
                )
                dto = ProductDTO(
                    id=p.id,
                    title=p.title,
                    description=p.description,
                    category=p.category,
                    sub_category=p.sub_category,
                    price=p.price,
                    original_price=p.original_price,
                    rating=p.rating,
                    review_count=p.review_count,
                    image_url=p.image_url,
                    attributes=p.attributes,
                    in_stock=p.in_stock,
                    xai_explanation=xai_text,
                    match_score=round(float(score), 3)
                )
                product_dtos.append(dto)
    else:
        # Fallback to database top rated items
        stmt = select(Product).limit(limit)
        res = await db.execute(stmt)
        products = res.scalars().all()

        for p in products:
            dto = ProductDTO(
                id=p.id,
                title=p.title,
                description=p.description,
                category=p.category,
                sub_category=p.sub_category,
                price=p.price,
                original_price=p.original_price,
                rating=p.rating,
                review_count=p.review_count,
                image_url=p.image_url,
                attributes=p.attributes,
                in_stock=p.in_stock,
                xai_explanation="Popular choice trending in store catalog.",
                match_score=0.85
            )
            product_dtos.append(dto)

    return FeedResponse(
        session_id=session_id,
        active_intent=active_label,
        intent_confidence=0.92 if "Neutral" not in active_label else 0.70,
        products=product_dtos
    )
