from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.schemas import SemanticSearchRequest, SemanticSearchResponse, ProductDTO
from app.repositories.product_repository import ProductRepository
from app.agents.search_agent import search_agent
from app.agents.guardrail_agent import guardrail_agent
from app.agents.intent_agent import intent_agent

router = APIRouter()

def get_product_repository(db: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

@router.post("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    req: SemanticSearchRequest,
    product_repo: ProductRepository = Depends(get_product_repository)
):
    # Step 1: Guardrail Inspection
    guard_res = guardrail_agent.validate_and_sanitize(req.query)
    if not guard_res["is_safe"]:
        raise HTTPException(
            status_code=400,
            detail=f"Query blocked by IntentIQ Guardrail Agent: {guard_res['flag']}"
        )

    clean_query = guard_res["sanitized_text"]

    # Step 2: Execute Semantic Search Agent
    search_results, intent_meta, latency_ms, retrieval_mode = await search_agent.search(
        query=clean_query,
        product_repo=product_repo,
        top_k=req.limit or 12
    )

    # Step 3: Update Intent Vector
    extracted_intents = intent_meta.get("extracted_intents", ["Discovery"])
    primary_intent = extracted_intents[0] if extracted_intents else "Search"
    await intent_agent.update_session_intent(
        session_id=req.session_id or req.user_id or "default_session",
        event_type="SEARCH",
        item_text=clean_query,
        category=primary_intent
    )

    product_dtos: List[ProductDTO] = []
    seen_ids = set()
    for item in search_results:
        p = item["product"]
        if p.id in seen_ids:
            continue
        seen_ids.add(p.id)
        score = item["score"]
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
            xai_explanation=f"Matches search sub-intents: {', '.join(extracted_intents)}",
            match_score=score
        )
        product_dtos.append(dto)

    return SemanticSearchResponse(
        query=req.query,
        extracted_intents=extracted_intents,
        budget_max=intent_meta.get("budget_max"),
        results=product_dtos
    )
