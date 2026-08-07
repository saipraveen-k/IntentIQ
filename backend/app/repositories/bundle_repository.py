from typing import Optional, List
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import ProductBundle

class BundleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_bundle_by_product(self, product_id: str, bundle_type: Optional[str] = None) -> Optional[ProductBundle]:
        stmt = select(ProductBundle).where(ProductBundle.base_product_id == product_id)
        if bundle_type:
            stmt = stmt.where(ProductBundle.bundle_type == bundle_type)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def save_bundle(self, bundle: ProductBundle) -> ProductBundle:
        self.db.add(bundle)
        await self.db.commit()
        await self.db.refresh(bundle)
        return bundle
