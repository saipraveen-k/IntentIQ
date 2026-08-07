import os
import csv
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.pipeline.schema_mapper import SchemaMapper
from app.pipeline.validator import DataValidationEngine
from app.pipeline.sampler import SamplingEngine

logger = logging.getLogger("intent_iq.instacart_extractor")

class InstacartExtractor:
    """
    Task 2 & Task 11: Instacart Dataset Extractor
    Streams products, aisles, departments, orders, and order item CSVs in memory-efficient chunks.
    """
    def __init__(self, dataset_path: str = "datasets/instacart"):
        self.dataset_path = dataset_path
        self.products_csv = os.path.join(dataset_path, "products.csv")
        self.aisles_csv = os.path.join(dataset_path, "aisles.csv")
        self.dept_csv = os.path.join(dataset_path, "departments.csv")
        self.orders_csv = os.path.join(dataset_path, "orders.csv")
        
        # Support file naming variations
        self.prior_csv = self._resolve_file(["order_products__prior.csv", "order_products_prior.csv"])
        self.train_csv = self._resolve_file(["order_products__train.csv", "order_products_train.csv"])

    def _resolve_file(self, candidates: List[str]) -> str:
        for fname in candidates:
            full_p = os.path.join(self.dataset_path, fname)
            if os.path.exists(full_p):
                return full_p
        return os.path.join(self.dataset_path, candidates[0])

    def load_lookup_maps(self) -> Tuple[Dict[str, str], Dict[str, str]]:
        aisle_map = {}
        if os.path.exists(self.aisles_csv):
            with open(self.aisles_csv, mode="r", encoding="utf-8", errors="ignore") as f:
                for row in csv.DictReader(f):
                    aisle_map[row["aisle_id"]] = row["aisle"]

        dept_map = {}
        if os.path.exists(self.dept_csv):
            with open(self.dept_csv, mode="r", encoding="utf-8", errors="ignore") as f:
                for row in csv.DictReader(f):
                    dept_map[row["department_id"]] = row["department"]

        return aisle_map, dept_map

    def process(
        self,
        sample_size: int = 1000,
        validator: Optional[DataValidationEngine] = None,
        sampler: Optional[SamplingEngine] = None
    ) -> List[Dict[str, Any]]:
        if not os.path.exists(self.products_csv):
            logger.error(f"Instacart products file not found: {self.products_csv}")
            return []

        aisle_map, dept_map = self.load_lookup_maps()
        logger.info(f"Extracting Instacart products from {self.products_csv} (Loaded {len(aisle_map)} aisles, {len(dept_map)} departments)...")
        raw_records = []

        with open(self.products_csv, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                aisle_name = aisle_map.get(row.get("aisle_id"), "Grocery")
                dept_name = dept_map.get(row.get("department_id"), "Pantry")
                mapped = SchemaMapper.map_instacart_product(row, aisle_name, dept_name)
                raw_records.append(mapped)

                if i >= sample_size * 5:
                    break

        if sampler:
            raw_records = sampler.sample_records(raw_records, sample_size=sample_size)
        else:
            raw_records = raw_records[:sample_size]

        if validator:
            val_res = validator.validate_batch(raw_records)
            return val_res["valid_records"]

        return raw_records
