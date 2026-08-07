from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.schemas import BundleResponse, ProductDTO
from app.repositories.product_repository import ProductRepository
from app.repositories.bundle_repository import BundleRepository
from app.agents.bundle_agent import bundle_agent
from app.models.domain import Product

router = APIRouter()

def get_product_repository(db: AsyncSession = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)

def get_bundle_repository(db: AsyncSession = Depends(get_db)) -> BundleRepository:
    return BundleRepository(db)

from app.pipeline.instacart_relationships import instacart_relationship_engine

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

    def to_dto(p: Product) -> ProductDTO:
        return ProductDTO(
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
            in_stock=p.in_stock
        )

    return BundleResponse(
        base_product_id=product_id,
        base_product=to_dto(base_prod),
        complete_the_look=[to_dto(p) for p in bundles["complete_the_look"]],
        frequently_bought_together=[to_dto(p) for p in bundles["frequently_bought_together"]],
        substitutes=[to_dto(p) for p in relationships.get("substitutes", [])],
        premium_alternatives=[to_dto(p) for p in relationships.get("premium_alternatives", [])],
        healthy_alternatives=[to_dto(p) for p in relationships.get("healthy_alternatives", [])],
        bundle_discount_pct=bundles["bundle_discount_pct"],
        original_total=bundles["original_total"],
        discounted_total=bundles["discounted_total"]
    )
