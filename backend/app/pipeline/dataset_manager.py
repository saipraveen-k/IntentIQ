import os
import csv
import time
import logging
from typing import Dict, Any, List

logger = logging.getLogger("intent_iq.dataset_manager")

class DatasetManager:
    """
    Task 1: Dataset Manager (Instacart Primary Provider)
    Discovers, validates, and reports statistics for local datasets.
    Instacart is the primary active MVP dataset provider. H&M and Amazon remain optional extensible providers.
    """
    def __init__(self, base_dir: str = "datasets", default_provider: str = "instacart"):
        self.base_dir = base_dir
        self.default_provider = default_provider
        self.dataset_paths = {
            "instacart": os.path.join(base_dir, "instacart"),
            "hm": os.path.join(base_dir, "hm"),
            "amazon": os.path.join(base_dir, "amazon"),
        }
        
        # Required file variations for Instacart
        self.required_files = {
            "instacart": [
                ["products.csv"],
                ["aisles.csv"],
                ["departments.csv"],
                ["orders.csv"],
                ["order_products__prior.csv", "order_products_prior.csv"],
                ["order_products__train.csv", "order_products_train.csv"]
            ],
            "hm": [["articles.csv"]],
            "amazon": [["metadata.json"]]
        }

    def find_existing_file(self, folder_path: str, candidates: List[str]) -> str:
        for c in candidates:
            p = os.path.join(folder_path, c)
            if os.path.exists(p):
                return c
        return candidates[0]

    def count_csv_rows(self, file_path: str) -> int:
        if not os.path.exists(file_path):
            return 0
        try:
            with open(file_path, mode="r", encoding="utf-8", errors="ignore") as f:
                return max(0, sum(1 for _ in f) - 1) # Subtract header
        except Exception:
            return 0

    def detect_datasets(self) -> Dict[str, Dict[str, Any]]:
        status = {}
        for name, path in self.dataset_paths.items():
            exists = os.path.exists(path) and os.path.isdir(path)
            found_files = []
            missing_files = []
            file_stats = {}

            if exists:
                t0 = time.time()
                req_groups = self.required_files.get(name, [])
                for group in req_groups:
                    found_name = None
                    for candidate in group:
                        full_p = os.path.join(path, candidate)
                        if os.path.exists(full_p):
                            found_name = candidate
                            found_files.append(candidate)
                            row_c = self.count_csv_rows(full_p)
                            file_stats[candidate] = row_c
                            break
                    if not found_name:
                        missing_files.append(group[0])

                scan_time = round(time.time() - t0, 3)
            else:
                scan_time = 0.0

            status[name] = {
                "is_default": name == self.default_provider,
                "detected": exists and len(missing_files) == 0,
                "dir_exists": exists,
                "path": path,
                "found_files": found_files,
                "missing_files": missing_files,
                "file_stats": file_stats,
                "scan_time_sec": scan_time
            }
        return status

    def validate_dataset(self, dataset_name: str = "instacart") -> bool:
        status = self.detect_datasets().get(dataset_name)
        if not status:
            logger.error(f"Unknown dataset name: '{dataset_name}'")
            return False

        if not status["dir_exists"]:
            logger.warning(
                f"\n[DATASET NOTICE] Direct folder '{status['path']}' not detected.\n"
                f"Place Kaggle dataset files in '{status['path']}/' for full real data powering.\n"
            )
            return False

        if status["missing_files"]:
            logger.warning(
                f"\n[DATASET NOTICE] Folder '{status['path']}' missing required file(s): {', '.join(status['missing_files'])}\n"
            )
            return False

        logger.info(f"✅ [{dataset_name.upper()} DATASET VALIDATED] Files present: {', '.join(status['found_files'])} (Scan: {status['scan_time_sec']}s)")
        return True
