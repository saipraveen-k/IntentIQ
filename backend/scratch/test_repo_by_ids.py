import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import init_db, AsyncSessionLocal
from app.repositories.product_repository import ProductRepository

async def test_by_ids():
    await init_db()
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        prods = await repo.get_by_ids(["24852", "5077", "prod_24852", "201"])
        print(f"Retrieved {len(prods)} products:")
        for p in prods:
            print(f"- [{p.id}] {p.title} ({p.category})")

if __name__ == "__main__":
    asyncio.run(test_by_ids())
