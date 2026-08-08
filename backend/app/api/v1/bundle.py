from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union, Any
from app.core.database import get_db
from app.models.schemas import BundleResponse, ProductDTO
from app.repositories.product_repository import ProductRepository
from app.repositories.bundle_repository import BundleRepository
from app.agents.bundle_agent import bundle_agent
from app.pipeline.instacart_relationships import instacart_relationship_engine
from app.models.domain import Product

router = APIRouter()

def get_product_repository(db: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

def get_bundle_repository(db: AsyncSession = Depends(get_db)) -> BundleRepository:
    return BundleRepository(db)

from pydantic import BaseModel

class BundleRequest(BaseModel):
    product_id: str

@router.post("/bundle", response_model=BundleResponse)
async def post_product_bundle(
    req: BundleRequest,
    product_repo: ProductRepository = Depends(get_product_repository),
    bundle_repo: BundleRepository = Depends(get_bundle_repository),
    db: AsyncSession = Depends(get_db)
):
    return await get_product_bundle(
        product_id=req.product_id,
        product_repo=product_repo,
        bundle_repo=bundle_repo,
        db=db
    )

@router.get("/bundle/{product_id}", response_model=BundleResponse)
async def get_product_bundle(
    product_id: str,
    product_repo: ProductRepository = Depends(get_product_repository),
    bundle_repo: BundleRepository = Depends(get_bundle_repository),
    db: AsyncSession = Depends(get_db)
):
    base_prod = await product_repo.get_by_id(product_id)
    if not base_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    bundles = await bundle_agent.get_or_create_bundles(
        base_product=base_prod,
        product_repo=product_repo,
        bundle_repo=bundle_repo
    )

    relationships = await instacart_relationship_engine.get_product_relationships(base_prod, db)

    def to_dto(item: Any) -> ProductDTO:
        p = item["product"] if isinstance(item, dict) and "product" in item else item
        return ProductDTO(
            id=str(p.id),
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
            in_stock=p.in_stock
        )

    subs = [to_dto(x) for x in relationships.get("substitutes", []) if isinstance(x, (dict, Product))]
    prem = [to_dto(x) for x in relationships.get("premium_alternatives", []) if isinstance(x, (dict, Product))]
    
    raw_healthy = relationships.get("healthy_alternatives", [])
    healthy_list = [to_dto(x) for x in raw_healthy if isinstance(x, (dict, Product))] if isinstance(raw_healthy, list) else []

    fbt_dtos = [to_dto(p) for p in bundles.get("frequently_bought_together", [])]
    ctl_dtos = [to_dto(p) for p in bundles.get("complete_the_look", [])]
    combined_items = fbt_dtos + ctl_dtos
    if not combined_items and subs:
        combined_items = subs[:3]

    return BundleResponse(
        base_product_id=product_id,
        base_product=to_dto(base_prod),
        bundle_items=combined_items,
        complete_the_look=ctl_dtos,
        frequently_bought_together=fbt_dtos,
        substitutes=subs,
        premium_alternatives=prem,
        healthy_alternatives=healthy_list,
        bundle_discount_pct=bundles.get("bundle_discount_pct", 15.0),
        original_total=bundles.get("original_total", round(base_prod.price * 1.15, 2)),
        discounted_total=bundles.get("discounted_total", round(base_prod.price * 0.95, 2))
    )
