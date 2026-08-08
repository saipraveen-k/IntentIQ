import os
import csv
import sys
import time

def validate_datasets(dataset_dir="datasets/instacart", report_path="data_validation_report.md"):
    if not os.path.exists(dataset_dir) and os.path.exists("../datasets/instacart"):
        dataset_dir = "../datasets/instacart"
    print(f"Starting data validation suite on directory: {dataset_dir}...")
    start_t = time.time()
    
    report_lines = [
        "# Instacart Dataset Validation Report",
        f"**Execution Time**: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Dataset Directory**: `{dataset_dir}`",
        "",
        "## Summary Table",
        "| File Name | Row Count | Schema Status | Duplicates | Nulls | Validation Status |",
        "| --- | --- | --- | --- | --- | --- |"
    ]
    
    file_stats = {}
    errors = []
    
    # Valid IDs collections for FK constraints
    valid_aisles = set()
    valid_departments = set()
    valid_products = set()
    prior_orders = set()
    train_orders = set()
    all_order_ids = set()
    
    schema_defs = {
        "aisles.csv": ["aisle_id", "aisle"],
        "departments.csv": ["department_id", "department"],
        "products.csv": ["product_id", "product_name", "aisle_id", "department_id"],
        "orders.csv": ["order_id", "user_id", "eval_set", "order_number", "order_dow", "order_hour_of_day", "days_since_prior_order"],
        "order_products__prior.csv": ["order_id", "product_id", "add_to_cart_order", "reordered"],
        "order_products__train.csv": ["order_id", "product_id", "add_to_cart_order", "reordered"]
    }

    # Helper to check headers
    def validate_schema(file_path, expected_cols):
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            headers_clean = [h.strip().lower() for h in headers]
            expected_clean = [col.lower() for col in expected_cols]
            return headers_clean == expected_clean, headers

    # 1. Validate aisles.csv
    file_name = "aisles.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        dups = 0
        seen_ids = set()
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                aid = r.get("aisle_id")
                name = r.get("aisle")
                if not aid or not name:
                    nulls += 1
                if aid:
                    if aid in seen_ids:
                        dups += 1
                    seen_ids.add(aid)
                    valid_aisles.add(aid)
                    
        status = "PASSED" if (schema_ok and nulls == 0 and dups == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | {dups} | {nulls} | {status} |")
        file_stats[file_name] = {"rows": rows, "status": status}
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # 2. Validate departments.csv
    file_name = "departments.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        dups = 0
        seen_ids = set()
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                did = r.get("department_id")
                name = r.get("department")
                if not did or not name:
                    nulls += 1
                if did:
                    if did in seen_ids:
                        dups += 1
                    seen_ids.add(did)
                    valid_departments.add(did)
                    
        status = "PASSED" if (schema_ok and nulls == 0 and dups == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | {dups} | {nulls} | {status} |")
        file_stats[file_name] = {"rows": rows, "status": status}
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # 3. Validate products.csv
    file_name = "products.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        dups = 0
        fk_violations = 0
        seen_ids = set()
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                pid = r.get("product_id")
                name = r.get("product_name")
                aid = r.get("aisle_id")
                did = r.get("department_id")
                if not pid or not name or not aid or not did:
                    nulls += 1
                if pid:
                    if pid in seen_ids:
                        dups += 1
                    seen_ids.add(pid)
                    valid_products.add(pid)
                if aid and aid not in valid_aisles:
                    fk_violations += 1
                if did and did not in valid_departments:
                    fk_violations += 1
                    
        status = "PASSED" if (schema_ok and nulls == 0 and dups == 0 and fk_violations == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | {dups} | {nulls} | {status} |")
        file_stats[file_name] = {"rows": rows, "status": status, "fk_violations": fk_violations}
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # 4. Validate orders.csv
    file_name = "orders.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        dups = 0
        seen_ids = set()
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                oid = r.get("order_id")
                uid = r.get("user_id")
                ev = r.get("eval_set")
                onum = r.get("order_number")
                if not oid or not uid or not ev or not onum:
                    nulls += 1
                if oid:
                    if oid in seen_ids:
                        dups += 1
                    seen_ids.add(oid)
                    all_order_ids.add(oid)
                    if ev == "prior":
                        prior_orders.add(oid)
                    elif ev == "train":
                        train_orders.add(oid)
                        
        status = "PASSED" if (schema_ok and nulls == 0 and dups == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | {dups} | {nulls} | {status} |")
        file_stats[file_name] = {"rows": rows, "status": status}
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # 5. Validate order_products__prior.csv (Large file, stream-based validation)
    file_name = "order_products__prior.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        fk_product_violations = 0
        fk_order_violations = 0
        
        # Read file in blocks
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                oid = r.get("order_id")
                pid = r.get("product_id")
                add_to_cart = r.get("add_to_cart_order")
                if not oid or not pid or not add_to_cart:
                    nulls += 1
                if pid and pid not in valid_products:
                    fk_product_violations += 1
                if oid and oid not in prior_orders:
                    fk_order_violations += 1
                    
        status = "PASSED" if (schema_ok and nulls == 0 and fk_product_violations == 0 and fk_order_violations == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | 0 | {nulls} | {status} |")
        file_stats[file_name] = {
            "rows": rows, 
            "status": status, 
            "fk_product_violations": fk_product_violations,
            "fk_order_violations": fk_order_violations
        }
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # 6. Validate order_products__train.csv
    file_name = "order_products__train.csv"
    path = os.path.join(dataset_dir, file_name)
    if os.path.exists(path):
        schema_ok, headers = validate_schema(path, schema_defs[file_name])
        rows = 0
        nulls = 0
        fk_product_violations = 0
        fk_order_violations = 0
        
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows += 1
                oid = r.get("order_id")
                pid = r.get("product_id")
                add_to_cart = r.get("add_to_cart_order")
                if not oid or not pid or not add_to_cart:
                    nulls += 1
                if pid and pid not in valid_products:
                    fk_product_violations += 1
                if oid and oid not in train_orders:
                    fk_order_violations += 1
                    
        status = "PASSED" if (schema_ok and nulls == 0 and fk_product_violations == 0 and fk_order_violations == 0) else "WARNING"
        report_lines.append(f"| {file_name} | {rows} | {'✅ Valid' if schema_ok else '❌ Invalid'} | 0 | {nulls} | {status} |")
        file_stats[file_name] = {
            "rows": rows, 
            "status": status, 
            "fk_product_violations": fk_product_violations,
            "fk_order_violations": fk_order_violations
        }
    else:
        errors.append(f"Missing file: {file_name}")
        report_lines.append(f"| {file_name} | N/A | N/A | N/A | N/A | ❌ MISSING |")

    # Data Leakage Check
    overlap = prior_orders.intersection(train_orders)
    data_leakage_detected = len(overlap) > 0
    
    report_lines.extend([
        "",
        "## Data Integrity & Leakage Analysis",
        f"- **Aisle IDs Loaded**: `{len(valid_aisles)}`",
        f"- **Department IDs Loaded**: `{len(valid_departments)}`",
        f"- **Product IDs Loaded**: `{len(valid_products)}`",
        f"- **Prior Orders Set Size**: `{len(prior_orders)}`",
        f"- **Train Orders Set Size**: `{len(train_orders)}`",
        f"- **Overlapping Order IDs**: `{len(overlap)}`",
        f"- **Data Leakage Status**: `{'❌ LEAKAGE DETECTED' if data_leakage_detected else '✅ CLEAN (No Overlap)'}`"
    ])
    
    if data_leakage_detected:
        report_lines.append(f"  * Warning: Overlapping order IDs found: {list(overlap)[:5]}...")

    # Product Foreign Key constraints violations summary
    report_lines.extend([
        "",
        "## Foreign Key Integrity Analysis"
    ])
    for fname, stats in file_stats.items():
        if "fk_product_violations" in stats or "fk_violations" in stats:
            violations_p = stats.get("fk_product_violations", 0) + stats.get("fk_violations", 0)
            violations_o = stats.get("fk_order_violations", 0)
            report_lines.append(f"- **{fname}**: Product FK violations: `{violations_p}`, Order FK violations: `{violations_o}`")

    elapsed = round(time.time() - start_t, 2)
    report_lines.extend([
        "",
        f"**Validation completed in {elapsed} seconds.**"
    ])

    # Write report to markdown file
    with open(report_path, "w", encoding="utf-8") as rf:
        rf.write("\n".join(report_lines))
        
    print(f"Validation report generated successfully: {report_path}")
    print(f"Data Leakage Status: {'❌ LEAKAGE DETECTED' if data_leakage_detected else '✅ CLEAN'}")
    return not data_leakage_detected

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    validate_datasets()
