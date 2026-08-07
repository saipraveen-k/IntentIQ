from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.models.schemas import SemanticSearchRequest, SemanticSearchResponse, ProductDTO
from app.models.domain import Product
from app.agents.search_agent import search_agent
from app.agents.guardrail_agent import guardrail_agent
from app.agents.intent_agent import intent_agent

router = APIRouter()

@router.post("/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    req: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    # Guardrail Verification
    guard_res = guardrail_agent.validate_and_sanitize(req.query)
    if not guard_res["is_safe"]:
        raise HTTPException(
            status_code=400,
            detail=f"Query blocked by IntentIQ Guardrail Agent: {guard_res['flag']}"
        )

    clean_query = guard_res["sanitized_text"]

    # Execute Search via Search Agent
    candidates, intent_meta, latency = await search_agent.execute_search(clean_query, top_k=req.limit or 12)

    # Update User Intent Vector based on search query
    extracted_intents = intent_meta.get("extracted_intents", ["Discovery"])
    primary_intent = extracted_intents[0] if extracted_intents else "Search"
    await intent_agent.update_intent_vector(req.session_id, clean_query, primary_intent)

    product_dtos: List[ProductDTO] = []

    if candidates:
        candidate_ids = [sku for sku, _ in candidates]
        stmt = select(Product).where(Product.id.in_(candidate_ids))
        res = await db.execute(stmt)
        products = res.scalars().all()
        prod_dict = {p.id: p for p in products}

        budget_max = intent_meta.get("budget_max")

        for sku, score in candidates:
            if sku in prod_dict:
                p = prod_dict[sku]

                # Budget filter if extracted
                if budget_max and p.price > budget_max:
                    continue

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
                    xai_explanation=f"Strong vector match for query intents: {', '.join(extracted_intents)}",
                    match_score=round(float(score), 3)
                )
                product_dtos.append(dto)

    return SemanticSearchResponse(
        query=req.query,
        extracted_intents=extracted_intents,
        budget_max=intent_meta.get("budget_max"),
        results=product_dtos
    )
