import os
import csv
import logging
from typing import List, Dict, Any, Optional
from app.pipeline.schema_mapper import SchemaMapper
from app.pipeline.validator import DataValidationEngine
from app.pipeline.sampler import SamplingEngine

logger = logging.getLogger("intent_iq.hm_extractor")

class HMExtractor:
    """
    ETL Extractor for H&M Personalized Fashion Recommendations Dataset.
    Extracts articles, product metadata, categories, attributes from articles.csv.
    """
    def __init__(self, dataset_path: str = "datasets/hm"):
        self.dataset_path = dataset_path
        self.articles_csv = os.path.join(dataset_path, "articles.csv")

    def process(
        self,
        sample_size: int = 1000,
        validator: Optional[DataValidationEngine] = None,
        sampler: Optional[SamplingEngine] = None
    ) -> List[Dict[str, Any]]:
        if not os.path.exists(self.articles_csv):
            logger.error(f"H&M file not found: {self.articles_csv}")
            return []

        logger.info(f"Extracting H&M catalog from {self.articles_csv}...")
        raw_records = []
        
        with open(self.articles_csv, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                mapped = SchemaMapper.map_hm_article(row)
                raw_records.append(mapped)
                if i >= sample_size * 5: # Load small chunk before sampling
                    break

        if sampler:
            raw_records = sampler.sample_records(raw_records, sample_size=sample_size)
        else:
            raw_records = raw_records[:sample_size]

        if validator:
            val_res = validator.validate_batch(raw_records)
            return val_res["valid_records"]

        return raw_records
