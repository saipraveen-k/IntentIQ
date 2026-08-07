import httpx
import json

def test_all():
    base_url = "http://localhost:8000"
    
    # 1. Health check
    print("Testing /health...")
    res = httpx.get(f"{base_url}/health")
    print(json.dumps(res.json(), indent=2))
    
    # 2. Feed check
    print("\nTesting /api/v1/recommendations/feed...")
    feed_payload = {
        "user_id": 123,
        "session_history": [1, 2, 3]
    }
    res = httpx.post(f"{base_url}/api/v1/recommendations/feed", json=feed_payload)
    print("Response Status:", res.status_code)
    # Print first 2 recommendations to save space
    resp_json = res.json()
    recs = resp_json.get("recommendations", [])
    print(f"Total Recs: {len(recs)}")
    print("First 2 Recs:")
    print(json.dumps(recs[:2], indent=2))
    
    # 3. Search check
    print("\nTesting /api/v1/search/semantic...")
    search_payload = {
        "query": "organic apples fruit",
        "user_id": 123
    }
    res = httpx.post(f"{base_url}/api/v1/search/semantic", json=search_payload)
    print("Response Status:", res.status_code)
    resp_json = res.json()
    results = resp_json.get("results", [])
    print(f"Total Search Results: {len(results)}")
    print("First 2 Results:")
    print(json.dumps(results[:2], indent=2))
    
    # 4. Bundle check
    print("\nTesting /api/v1/bundle...")
    bundle_payload = {
        "product_id": 1  # Chocolate Sandwich Cookies
    }
    res = httpx.post(f"{base_url}/api/v1/bundle", json=bundle_payload)
    print("Response Status:", res.status_code)
    print(json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    test_all()
