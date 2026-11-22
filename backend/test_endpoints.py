import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    print("Testing ROOT Endpoint...")
    r = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 200
    print("ROOT Endpoint: PASS\n")

def test_generate_plan():
    print("Testing /api/generate_plan Endpoint (structured trip generation and ML insights)...")
    payload = {
        "destination": "Tokyo, Japan",
        "origin": "New York, USA",
        "startDate": "2026-06-10",
        "endDate": "2026-06-15",
        "travelers": 2,
        "budget": 4000.0,
        "currency": "USD",
        "interests": ["🏖️ Beach & Water", "🏔️ Mountains & Hiking", "🏛️ History & Heritage", "🍜 Food & Cuisine"],
        "travelStyle": "mid-range",
        "accommodationType": "mid-range-hotel",
        "dietaryRestrictions": "None",
        "mobilityNeeds": "None",
        "specialRequests": "Prefer quiet rooms"
    }
    
    start_time = time.time()
    r = requests.post(f"{BASE_URL}/api/generate_plan", json=payload)
    duration = time.time() - start_time
    
    print(f"Status Code: {r.status_code}")
    print(f"Time Taken: {duration:.2f} seconds")
    
    if r.status_code == 200:
        data = r.json()
        print(f"Destination: {data.get('destination')}")
        print(f"Timezone: {data.get('timezone')}")
        print("AI Course Insights Recieved:")
        print(json.dumps(data.get("ai_insights"), indent=2, ensure_ascii=False))
        
        # Validate schema keys
        assert "destination" in data
        assert "itinerary" in data
        assert "ai_insights" in data
        print("/api/generate_plan: PASS\n")
    else:
        print(f"FAILED: {r.text}")
        assert False

def test_chat_stream():
    print("Testing /api/chat Endpoint (streaming response)...")
    payload = {
        "messages": [
            {"role": "user", "content": "Tell me two best places to visit in Tokyo"}
        ]
    }
    r = requests.post(f"{BASE_URL}/api/chat", json=payload, stream=True)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200
    
    print("Streaming content response:")
    for line in r.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith("data: "):
                data_str = decoded[6:]
                if data_str == "[DONE]":
                    print("\n[STREAM COMPLETE]")
                    break
                try:
                    data_json = json.loads(data_str)
                    if "text" in data_json:
                        print(data_json["text"], end="", flush=True)
                except Exception:
                    print(data_str, end="", flush=True)
    print("\n/api/chat Streaming: PASS\n")

def test_optimize_budget():
    print("Testing /api/optimize_budget Endpoint...")
    payload = {
        "preferences": {
            "destination": "Tokyo, Japan",
            "origin": "New York, USA",
            "startDate": "2026-06-10",
            "endDate": "2026-06-15",
            "travelers": 2,
            "budget": 4000.0,
            "currency": "USD",
            "interests": ["🍜 Food & Cuisine"],
            "travelStyle": "mid-range",
            "accommodationType": "mid-range-hotel"
        },
        "currentBudget": {
            "flights": 1500,
            "accommodation": 1200,
            "food": 600,
            "activities": 400,
            "transportation": 300
        }
    }
    r = requests.post(f"{BASE_URL}/api/optimize_budget", json=payload)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200
    print("Recommendations Summary:")
    print(r.json().get("recommendations")[:200] + "...")
    print("/api/optimize_budget: PASS\n")

def test_packing_advice():
    print("Testing /api/packing_advice Endpoint...")
    payload = {
        "preferences": {
            "destination": "Tokyo, Japan",
            "origin": "New York, USA",
            "startDate": "2026-06-10",
            "endDate": "2026-06-15",
            "travelers": 2,
            "budget": 4000.0,
            "currency": "USD",
            "interests": ["🏔️ Mountains & Hiking"],
            "travelStyle": "mid-range",
            "accommodationType": "mid-range-hotel"
        },
        "weather": "Sunny with light evening showers, around 22°C"
    }
    r = requests.post(f"{BASE_URL}/api/packing_advice", json=payload)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200
    print("Packing Advice Summary:")
    print(r.json().get("advice")[:200] + "...")
    print("/api/packing_advice: PASS\n")

if __name__ == "__main__":
    print("==================================================")
    print("STARTING FASTAPI BACKEND TEST SUITE")
    print("==================================================")
    try:
        test_root()
        test_generate_plan()
        test_chat_stream()
        test_optimize_budget()
        test_packing_advice()
        print("ALL TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"TEST RUN FAILED: {str(e)}")
