# Instacart Dataset Validation Report
**Execution Time**: 2026-08-08 11:16:59
**Dataset Directory**: `../datasets/instacart`

## Summary Table
| File Name | Row Count | Schema Status | Duplicates | Nulls | Validation Status |
| --- | --- | --- | --- | --- | --- |
| aisles.csv | 134 | ✅ Valid | 0 | 0 | PASSED |
| departments.csv | 21 | ✅ Valid | 0 | 0 | PASSED |
| products.csv | 49688 | ✅ Valid | 0 | 0 | PASSED |
| orders.csv | 3421083 | ✅ Valid | 0 | 0 | PASSED |
| order_products__prior.csv | 32434489 | ✅ Valid | 0 | 0 | PASSED |
| order_products__train.csv | 1384617 | ✅ Valid | 0 | 0 | PASSED |

## Data Integrity & Leakage Analysis
- **Aisle IDs Loaded**: `134`
- **Department IDs Loaded**: `21`
- **Product IDs Loaded**: `49688`
- **Prior Orders Set Size**: `3214874`
- **Train Orders Set Size**: `131209`
- **Overlapping Order IDs**: `0`
- **Data Leakage Status**: `✅ CLEAN (No Overlap)`

## Foreign Key Integrity Analysis
- **products.csv**: Product FK violations: `0`, Order FK violations: `0`
- **order_products__prior.csv**: Product FK violations: `0`, Order FK violations: `0`
- **order_products__train.csv**: Product FK violations: `0`, Order FK violations: `0`

**Validation completed in 64.63 seconds.**