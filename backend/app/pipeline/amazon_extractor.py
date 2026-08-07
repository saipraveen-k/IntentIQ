import os
import json
import logging
from typing import List, Dict, Any, Optional
from app.pipeline.schema_mapper import SchemaMapper
from app.pipeline.validator import DataValidationEngine
from app.pipeline.sampler import SamplingEngine

logger = logging.getLogger("intent_iq.amazon_extractor")

class AmazonExtractor:
    """
    ETL Extractor for Amazon Product Reviews & Multi-Category Metadata Dataset.
    Extracts also_bought, also_viewed, bought_together, ratings, metadata, product graph.
    """
    def __init__(self, dataset_path: str = "datasets/amazon"):
        self.dataset_path = dataset_path
        self.meta_json = os.path.join(dataset_path, "metadata.json")

    def process(
        self,
        sample_size: int = 1000,
        validator: Optional[DataValidationEngine] = None,
        sampler: Optional[SamplingEngine] = None
    ) -> List[Dict[str, Any]]:
        if not os.path.exists(self.meta_json):
            logger.error(f"Amazon metadata file not found: {self.meta_json}")
            return []

        logger.info(f"Extracting Amazon product graph from {self.meta_json}...")
        raw_records = []

        with open(self.meta_json, mode="r", encoding="utf-8", errors="replace") as f:
            for i, line in enumerate(f):
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    mapped = SchemaMapper.map_amazon_metadata(data)
                    raw_records.append(mapped)
                except Exception:
                    continue

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
