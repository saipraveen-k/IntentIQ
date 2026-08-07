import hashlib
import logging
from typing import Dict, Any, List

logger = logging.getLogger("intent_iq.schema_mapper")

class SchemaMapper:
    """
    Task 2: Schema Mapper
    Normalizes Instacart products, departments, aisles, and order records into IntentIQ domain objects.
    """
    @staticmethod
    def map_instacart_product(row: Dict[str, Any], aisle_name: str = "Grocery", dept_name: str = "Pantry") -> Dict[str, Any]:
        p_id = str(row.get("product_id", ""))
        prod_id = f"insta_{p_id}" if p_id else f"insta_{hashlib.md5(str(row).encode()).hexdigest()[:8]}"
        raw_name = row.get("product_name") or f"Instacart Item {p_id}"
        clean_title = raw_name.title().strip()

        # Deterministic price calculation based on product hash for realism ($2.99 - $29.99)
        base_hash = abs(hash(clean_title))
        price_dollars = round(((base_hash % 2700) / 100.0) + 2.99, 2)
        rating_score = round(4.0 + ((base_hash % 10) / 10.0), 1)

        return {
            "id": prod_id,
            "title": clean_title,
            "description": f"Fresh {clean_title} sourced from top {dept_name.title()} department in aisle {aisle_name.title()}.",
            "category": dept_name.title(),
            "brand": "Instacart Fresh",
            "sub_category": aisle_name.title(),
            "price": price_dollars,
            "original_price": round(price_dollars * 1.15, 2),
            "rating": rating_score,
            "review_count": 120 + (base_hash % 850),
            "image_url": SchemaMapper._get_image_for_category(dept_name),
            "attributes": {
                "instacart_product_id": p_id,
                "aisle": aisle_name.title(),
                "department": dept_name.title(),
                "aisle_id": row.get("aisle_id"),
                "department_id": row.get("department_id")
            },
            "in_stock": True
        }

    @staticmethod
    def _get_image_for_category(department: str) -> str:
        dept_lower = department.lower()
        if "produce" in dept_lower or "fruit" in dept_lower:
            return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600"
        elif "dairy" in dept_lower or "egg" in dept_lower:
            return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600"
        elif "beverages" in dept_lower or "drink" in dept_lower:
            return "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600"
        elif "bakery" in dept_lower or "bread" in dept_lower:
            return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600"
        elif "frozen" in dept_lower:
            return "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"
        elif "snacks" in dept_lower:
            return "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600"
        elif "personal" in dept_lower or "care" in dept_lower:
            return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"
        else:
            return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"

    @staticmethod
    def map_hm_article(row: Dict[str, Any]) -> Dict[str, Any]:
        art_id = str(row.get("article_id", ""))
        prod_id = f"hm_{art_id}" if art_id else f"hm_{hashlib.md5(str(row).encode()).hexdigest()[:8]}"
        title = row.get("prod_name") or f"H&M Article {art_id}"
        category = row.get("index_group_name") or "Fashion"
        return {
            "id": prod_id,
            "title": title.title(),
            "description": row.get("detail_desc") or f"H&M {title}",
            "category": category.title(),
            "brand": "H&M",
            "sub_category": row.get("product_type_name", "Apparel").title(),
            "price": 2499.0,
            "rating": 4.6,
            "review_count": 140,
            "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
            "attributes": {"colour": row.get("colour_group_name", "Default")},
            "in_stock": True
        }

    @staticmethod
    def map_amazon_metadata(row: Dict[str, Any]) -> Dict[str, Any]:
        asin = str(row.get("asin") or row.get("id", ""))
        prod_id = f"amz_{asin}" if asin else f"amz_{hashlib.md5(str(row).encode()).hexdigest()[:8]}"
        title = row.get("title") or f"Amazon Product {asin}"
        return {
            "id": prod_id,
            "title": title,
            "description": row.get("description") or f"High-quality {title}.",
            "category": "Electronics",
            "brand": row.get("brand") or "Amazon Choice",
            "sub_category": "Tech",
            "price": 1999.0,
            "rating": 4.7,
            "review_count": 320,
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
            "attributes": {},
            "in_stock": True
        }
