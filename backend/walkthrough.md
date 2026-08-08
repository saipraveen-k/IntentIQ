# Walkthrough: Firebase Auth, Dataset Validation, and Production Engine Integration

This walkthrough details the implementation, validation, and integration of user authentication, dataset verification, modular agent routers, session intent intelligence, and test-suite execution for the IntentIQ recommendation system.

---

## Summary of Accomplished Work

### 1. Dataset Validation Engine
* **Validation Suite (`data_validation.py`)**: Implemented a high-performance stream-based dataset validator that processes large Instacart CSV files using minimal memory footprint.
* **Checks Executed**:
  * Schema column headers matching.
  * Line and row counts.
  * Null-value scans in primary identifiers.
  * Duplicate primary keys verification.
  * Foreign key constraints mapping (e.g., product IDs mapping to aisles and departments).
  * Data leakage verification between prior and train order sets.
* **Validation Report (`data_validation_report.md`)**: Automatically generated a markdown validation report showing 100% clean status:
  * Overlapping Order IDs: `0` (Zero Data Leakage).
  * Duplicate values: `0`.
  * Foreign key violations: `0` across all files.

### 2. Modular Router Integration
* Registered all 9 modular production routers in both root `main.py` and `app/main.py`:
  1. `recommendations` (GET `/recommendations/feed` using the 6-stage Hybrid Funnel).
  2. `search` (POST `/search/semantic` using Gemini intent/budget extraction and dense vector FAISS lookup).
  3. `bundle` (GET `/bundle/{product_id}`).
  4. `brain` (POST `/brain/analyze` sequencing all 7 AI agents and POST `/brain/persona`).
  5. `analytics` (GET `/analytics/dashboard`).
  6. `privacy` (POST `/privacy/purge` implementing user data purging).
  7. `guardrails` (POST `/guardrails/check`).
  8. `system` (GET `/system/health`).
  9. `telemetry` (POST `/telemetry/event`).
* Removed duplicate route definitions (such as direct `/search/semantic` POST definitions in main) to resolve route conflicts.

### 3. UI and Test Schema Compatibility
* **Product Schema Enhancement (`schemas.py`)**: Added legacy fields `product_id` and `name` to `ProductDTO` using a Pydantic `model_validator(mode="after")`. This automatically populates them based on `id` and `title` properties. This provides out-of-the-box compatibility with the Next.js frontend UI components (which expect `product_id`/`name`) and backend tests (which expect `id`/`title`).
* **Search Request Schema Enhancement**: Made `session_id` optional in `SemanticSearchRequest` and added `user_id`, matching both frontend page calls and backend pytest requests.

### 4. Real-Time Session Intelligence
* **EMA and Negative Signals (`intent_agent.py`)**: Implemented advanced intent learning. Positive signals update user session intent vectors using the Exponential Moving Average (EMA) formula:
  $$\text{new\_intent} = 0.8 \times \text{old\_intent} + 0.2 \times \text{event\_embedding}$$
  Negative signals (e.g. `DISMISS`, `REMOVE`, `DELETE`, `DISLIKE`) decrease affinity by subtracting a fraction of the negative item's embedding vectoric representation from the user's active session intent vector:
  $$\text{new\_intent} = \text{old\_intent} - 0.15 \times \text{event\_embedding}$$

### 5. Authentication, Real Credentials, Google OAuth & Forgot Password
* **Real Firebase Credentials (`.env.local`)**: Updated `frontend/.env.local` to parse active Firebase app credentials (`projectId: "intentiq-9fec2"`).
* **Google Direct Sign-In (`useAuth.js`)**: Implemented `loginWithGoogle` utilizing Firebase's `GoogleAuthProvider` and `signInWithPopup`. Integrated post-authentication redirection to automatically navigate users to `/` upon successful login.
* **Forgot Password Feature**:
  * Added `sendPasswordReset(email)` method to `useAuth.js` which triggers Firebase's `sendPasswordResetEmail(auth, email)` in production, or gracefully simulates link generation in mock mode.
  * Created `/forgot-password` route (`app/forgot-password/page.js`) with matching luxury aesthetic, email validation form, and confirmation state.
  * Linked "Forgot password?" directly from the `/login` view.

### 6. Persistent Clickstream, CTR File Logging & Centralized PII Sanitizer
* **Centralized PII Sanitizer (`app/core/pii_sanitizer.py`)**: Implemented a comprehensive PII masking and redaction utility. Automatically sanitizes text strings and recursively traverses payloads to:
  * Mask email addresses (e.g. `jo***@example.com`).
  * Mask phone numbers (`[REDACTED_PHONE]`).
  * Redact Social Security Numbers (`[REDACTED_SSN]`).
  * Redact Credit Card Numbers (`****-****-****-1234`).
  * Redact sensitive dictionary keys (`password`, `token`, `secret`, `ssn`, `cvv`).
* **Structured File Logger (`events.py` & `ctr.py`)**: Integrated `sanitize_text` into event batch writing and CTR calculation logs (`backend/logs/clickstream_ctr.log`), preventing raw email or sensitive query leaks.

### 7. Automated PII & Privacy Compliance Audit Suite
* **Standalone PII Scanner (`pii_test.py`)**: Executable PII scanner evaluating persistent logs and DB entities for unmasked emails, plaintext passwords, SSNs, and credit card numbers.
* **Pytest Privacy Suite (`tests/test_pii_privacy.py`)**: Verified zero unmasked PII log entries and tested the privacy data purge API (`POST /api/v1/privacy-purge`).

---

## Verification Results

### 1. Dataset Validation Summary
The validation suite successfully ran over all files:
- **`aisles.csv`**: 134 rows (PASSED).
- **`departments.csv`**: 21 rows (PASSED).
- **`products.csv`**: 49688 rows (PASSED).
- **`orders.csv`**: 3,421,083 rows (PASSED).
- **`order_products__prior.csv`**: 32,434,489 rows (PASSED).
- **`order_products__train.csv`**: 1,384,617 rows (PASSED).
- **Data Leakage**: `0` overlapping order IDs (CLEAN).

### 2. PII Compliance Audit
- **Command**: `python pii_test.py`
- **Result**: **PASS (0 raw PII exposures found)**

### 3. Backend Automated Test Suite
- **Command**: `pytest tests/`
- **Results**: **19 passed, 1 skipped, 0 failed** in 138.12 seconds.

### 4. Frontend Production Build
* **Command**: `npm run build`
* **Result**: **SUCCESS (Exit Code 0)**
* **Output**: Built all 9 static routes without any errors.
