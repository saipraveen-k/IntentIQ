import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import AsyncSessionLocal
from app.repositories.product_repository import ProductRepository

async def main():
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        prods = await repo.get_by_ids(["1", "2", "3", "24852"])
        print(f"Retrieved {len(prods)} products: {[p.id for p in prods]}")

if __name__ == "__main__":
    asyncio.run(main())
