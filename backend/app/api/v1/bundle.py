from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.models.schemas import BundleResponse, ProductDTO
from app.models.domain import Product
from app.agents.bundle_agent import bundle_agent

router = APIRouter()

@router.get("/bundle/{product_id}", response_model=BundleResponse)
async def get_product_bundle(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    base_prod = res.scalar_one_or_none()

    if not base_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    bundles = await bundle_agent.generate_bundles(db, base_prod)

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

    base_dto = to_dto(base_prod)
    look_dtos = [to_dto(p) for p in bundles["complete_the_look"]]
    fbt_dtos = [to_dto(p) for p in bundles["frequently_bought_together"]]

    orig_total = base_prod.price + sum(p.price for p in bundles["complete_the_look"])
    disc_total = round(orig_total * 0.85, 2) # 15% Bundle Savings

    return BundleResponse(
        base_product_id=product_id,
        base_product=base_dto,
        complete_the_look=look_dtos,
        frequently_bought_together=fbt_dtos,
        bundle_discount_pct=15.0,
        original_total=orig_total,
        discounted_total=disc_total
    )
