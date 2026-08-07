from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Set
from app.core.database import get_db
from app.models.schemas import FeedResponse, ProductDTO
from app.repositories.product_repository import ProductRepository
from app.agents.recommendation_agent import recommendation_agent
from app.agents.explainability_agent import explainability_agent

router = APIRouter()

def get_product_repository(db: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

@router.get("/recommendations/feed", response_model=FeedResponse)
async def get_personalized_feed(
    session_id: str = Query(..., description="Active user session ID"),
    limit: int = Query(10, ge=1, le=50),
    product_repo: ProductRepository = Depends(get_product_repository)
):
    # Execute Hybrid Multi-Stage Recommendation Funnel
    recommendations, active_label, confidence = await recommendation_agent.get_hybrid_recommendations(
        session_id=session_id,
        product_repo=product_repo,
        limit=limit
    )

    product_dtos: List[ProductDTO] = []
    seen_ids: Set[str] = set()

    for item in recommendations:
        p = item["product"]
        if p.id in seen_ids:
            continue
        seen_ids.add(p.id)

        score = item["score"]
        
        # Generate XAI explanation
        xai_text = await explainability_agent.explain(
            user_intent=active_label,
            product_title=p.title,
            category=p.category,
            brand=p.brand
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
            match_score=score
        )
        product_dtos.append(dto)

    return FeedResponse(
        session_id=session_id,
        active_intent=active_label,
        intent_confidence=confidence,
        products=product_dtos
    )
