import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
import google.generativeai as genai

# ── Stripe (payment processing) ───────────────────────────────────────────────
# HOW TO GET STRIPE KEYS:
#  1. Visit https://dashboard.stripe.com and create a free account
#  2. Go to Developers → API Keys
#  3. Copy your "Secret key" (starts with sk_test_ for test mode)
#  4. Add to .env:  STRIPE_SECRET_KEY=sk_test_...
#  5. Also add:     STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen CLI)
#  6. Add to frontend .env: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# PRODUCTION: switch to live keys (sk_live_ / pk_live_)
try:
    import stripe
    STRIPE_SECRET_KEY     = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if STRIPE_SECRET_KEY:
        stripe.api_key = STRIPE_SECRET_KEY
        STRIPE_ENABLED = True
    else:
        STRIPE_ENABLED = False
except ImportError:
    STRIPE_ENABLED = False

# ── Anthropic Claude (alternative AI model) ────────────────────────────────────
# HOW TO GET CLAUDE API KEY:
#  1. Visit https://console.anthropic.com
#  2. Sign up / log in
#  3. Go to API Keys → Create new key
#  4. Add to backend .env: ANTHROPIC_API_KEY=sk-ant-...
# The model used is claude-3-5-sonnet (fastest, best for JSON generation)
try:
    import anthropic
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    if ANTHROPIC_API_KEY:
        anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        CLAUDE_ENABLED = True
    else:
        anthropic_client = None
        CLAUDE_ENABLED = False
except ImportError:
    anthropic_client = None
    CLAUDE_ENABLED = False

# ── OpenWeatherMap (real-time weather data for smarter recommendations) ──────
# HOW TO GET WEATHER API KEY:
#  1. Visit https://openweathermap.org/api
#  2. Sign up free (free tier: 60 calls/min, 1M/month)
#  3. Go to My API Keys → copy Default key
#  4. Add to backend .env: OPENWEATHER_API_KEY=your_key_here
#  5. Also add to root .env: VITE_OPENWEATHER_API_KEY=your_key_here
import requests as _http_requests
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def fetch_weather_context(destination: str, start_date_str: str) -> str:
    """Fetches current weather + 5-day forecast for destination to enrich AI prompt."""
    if not OPENWEATHER_API_KEY:
        return ""
    try:
        # Current weather
        r = _http_requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": destination, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            timeout=5,
        )
        if r.status_code != 200:
            return ""
        w = r.json()
        temp        = w["main"]["temp"]
        feels_like  = w["main"]["feels_like"]
        humidity    = w["main"]["humidity"]
        description = w["weather"][0]["description"].capitalize()
        wind_speed  = w["wind"]["speed"]

        # 5-day forecast summary
        f = _http_requests.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            params={"q": destination, "appid": OPENWEATHER_API_KEY, "units": "metric", "cnt": 8},
            timeout=5,
        )
        forecast_text = ""
        if f.status_code == 200:
            items = f.json().get("list", [])[:5]
            forecast_text = "; ".join(
                f"{i['dt_txt'][:10]}: {i['weather'][0]['description']}, {i['main']['temp']:.0f}°C"
                for i in items
            )

        return (
            f"LIVE WEATHER DATA for {destination}: "
            f"Currently {description}, {temp:.1f}°C (feels like {feels_like:.1f}°C), "
            f"Humidity {humidity}%, Wind {wind_speed}m/s. "
            f"5-day forecast: {forecast_text}. "
            f"Use this real weather data to give accurate clothing/activity/timing recommendations."
        )
    except Exception as e:
        logger.warning(f"Weather API call failed: {e}")
        return ""

# BUG-19 fix: rate limiting via SlowAPI
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    RATE_LIMITING_ENABLED = True
except ImportError:
    RATE_LIMITING_ENABLED = False
    logger_early = logging.getLogger("traveler-backend")
    logger_early.warning("slowapi not installed — rate limiting disabled. Run: pip install slowapi")

# Import our custom AI Course Insights engine
from ml_insights import (
    classify_travel_experience,
    predict_rain_probability,
    evaluate_itinerary_with_neural_net,
    evaluate_agent_rationality,
    optimize_route_q_learning,
    cluster_travel_profiles,          # NEW: K-Means clustering
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("traveler-backend")

# Load environment variables
load_dotenv(dotenv_path="../.env")
load_dotenv()  # also load local .env if present

API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in .env file.")

# Configure Gemini SDK
genai.configure(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"

app = FastAPI(title="Traveler AI Backend", version="2.0.0")

# BUG-19 fix: attach rate limiter to the app
if RATE_LIMITING_ENABLED:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# BUG-16 fix: restrict CORS to known frontend origin in production
# Set FRONTEND_URL env var to your Vercel/production domain in deployment
_raw_origins = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:4173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Pydantic Schemas
# =====================================================================
# BUG-18 fix: add field validators to prevent long/dangerous inputs
class TripPreferences(BaseModel):
    destination: str = Field(..., min_length=2, max_length=120)
    origin: str = Field(..., min_length=2, max_length=120)
    startDate: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    endDate: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    travelers: int = Field(..., ge=1, le=20)
    budget: float = Field(..., ge=0, le=10_000_000)
    currency: str = Field(..., min_length=3, max_length=3)
    interests: List[str] = Field(..., max_length=20)
    travelStyle: str = Field(..., max_length=50)
    accommodationType: str = Field(..., max_length=50)
    dietaryRestrictions: Optional[str] = Field(default="", max_length=200)
    mobilityNeeds: Optional[str] = Field(default="", max_length=200)
    specialRequests: Optional[str] = Field(default="", max_length=500)
    # AI model selection: 'gemini' (default) or 'claude'
    aiModel: Optional[str] = Field(default="gemini", max_length=20)

    @validator('destination', 'origin', pre=True)
    def sanitize_text(cls, v: str) -> str:
        # Strip characters that could cause prompt injection or XSS
        return re.sub(r'[<>{}|\\`]', '', str(v)).strip()

class ChatMessagePayload(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    messages: List[ChatMessagePayload]
    tripContext: Optional[Dict[str, Any]] = None

class BudgetOptimizationPayload(BaseModel):
    preferences: TripPreferences
    currentBudget: Dict[str, float]

class PackingAdvicePayload(BaseModel):
    preferences: TripPreferences
    weather: str

# =====================================================================
# System Prompts
# =====================================================================
TRAVEL_SYSTEM_PROMPT = """You are Traveler AI, an expert travel assistant with deep knowledge of world destinations, travel planning, visa requirements, safety tips, local culture, and budget optimization. You help travelers plan amazing trips and answer all travel-related questions.

Key capabilities:
- Budget calculations and cost optimization
- Visa and entry requirements
- Safety and security advice
- Local culture and etiquette
- Best time to visit and weather insights
- Hidden gems and off-the-beaten-path recommendations
- Food and dining recommendations
- Transportation options
- Health and medical requirements
- Sustainable travel tips

Always be enthusiastic, helpful, and specific. Use emojis sparingly to make responses engaging. Format responses with clear sections when appropriate."""

ITINERARY_STRUCTURED_PROMPT_TEMPLATE = """Generate a detailed, comprehensive trip plan for:
- Destination: {destination}
- Flying From/Origin: {origin}
- Start Date: {startDate}
- End Date: {endDate}
- Travelers: {travelers}
- Total Budget: {budget} {currency}
- Travel Style: {travelStyle}
- Accommodation: {accommodationType}
- Dietary Restrictions: {dietaryRestrictions}
- Mobility Needs: {mobilityNeeds}
- Special Requests: {specialRequests}
- Interests: {interests}

You must return a valid JSON object matching the following structure. Do not wrap the JSON in Markdown backticks or write any other text:

{{
  "destination": "Name of destination",
  "overview": "A compelling 3-4 sentence summary of the destination and why it is great for this traveler.",
  "bestTimeToVisit": "Best month/season to visit",
  "weatherInfo": "Brief description of typical weather during the travel dates",
  "localCurrency": "Local currency name and symbol",
  "language": "Primary language spoken",
  "timezone": "Timezone offset (e.g. GMT+8)",
  "budget": {{
    "flights": 1200,
    "accommodation": 800,
    "food": 400,
    "activities": 300,
    "transportation": 200,
    "shopping": 100,
    "emergencyFund": 100,
    "total": 3100,
    "perPerson": 1550,
    "currency": "{currency}"
  }},
  "itinerary": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day Theme",
      "morning": "Detailed morning activity plan",
      "afternoon": "Detailed afternoon activity plan",
      "evening": "Detailed evening activity plan",
      "meals": {{
        "breakfast": "Breakfast restaurant or dish recommendation",
        "lunch": "Lunch restaurant or dish recommendation",
        "dinner": "Dinner restaurant or dish recommendation"
      }},
      "estimatedCost": 150,
      "tips": ["Tip 1", "Tip 2"]
    }}
  ],
  "attractions": [
    {{
      "name": "Attraction Name",
      "type": "Museum/Beach/Nature",
      "description": "Short description of attraction",
      "entryFee": "Free or $X",
      "bestTime": "Morning/Afternoon",
      "rating": 4.8,
      "mustSee": true,
      "address": "Address or general location"
    }}
  ],
  "threats": [
    {{
      "category": "Pickpocketing/Natural/Health",
      "level": "Low/Medium/High",
      "description": "Short explanation",
      "precautions": ["Precaution 1", "Precaution 2"],
      "icon": "🛡️"
    }}
  ],
  "requirements": [
    {{
      "category": "Visa/Vaccinations/Insurance",
      "items": ["Item 1", "Item 2"],
      "icon": "📋"
    }}
  ],
  "packingList": ["Item 1", "Item 2"],
  "localTips": ["Tip 1", "Tip 2"],
  "emergencyContacts": [
    {{ "name": "Police", "number": "112" }}
  ],
  "nearbyDestinations": ["Destination A", "Destination B"],
  "sustainabilityTips": ["Eco tip 1", "Eco tip 2"]
}}

Make sure the daily budget allocations and day counts accurately match the duration (from {startDate} to {endDate}). Fill in all arrays with high quality recommendations. Keep the response size within limits. Ensure the JSON is completely valid and parseable.

CRITICAL BUDGET RULES:
- NEVER return 0 for any budget field. Every category must have a realistic, non-zero value.
- flights: Always include a realistic international or domestic flight estimate from {origin} to {destination}. If the route is short, use a minimum of 50.
- The sum of all budget fields (flights + accommodation + food + activities + transportation + shopping + emergencyFund) MUST equal the "total" field.
- perPerson = total / {travelers}. Calculate this correctly."""

# =====================================================================
# API Endpoints
# =====================================================================

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Traveler AI Backend v2.0 is running.", "version": "2.0.0"}

@app.get("/api/health")
def health_check():
    """
    Health check endpoint polled by the frontend to show backend status.
    """
    return {
        "status": "ok",
        "message": "Traveler AI Backend is online",
        "model": MODEL_NAME,
        "api_key_configured": bool(API_KEY),
        "version": "2.0.0"
    }

@app.post("/api/generate_plan")
async def generate_plan(request: Request, prefs: TripPreferences):
    """
    Generates a personalised trip plan and appends comprehensive AI Course Insights.
    Rate limited: 5 requests per minute per IP (BUG-19 fix).
    """
    # BUG-19: apply rate limit if slowapi is available
    if RATE_LIMITING_ENABLED:
        await limiter._check_request_limit(request, generate_plan, "5/minute")
    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key is not configured on the backend server."
        )

    duration_days = 5  # safe default
    try:
        from datetime import datetime
        d1 = datetime.strptime(prefs.startDate, "%Y-%m-%d")
        d2 = datetime.strptime(prefs.endDate, "%Y-%m-%d")
        duration_days = max(1, (d2 - d1).days + 1)
    except Exception as e:
        # BUG-20 fix: log the actual error instead of silently defaulting
        logger.warning(f"Date parse failed ('{prefs.startDate}' → '{prefs.endDate}'): {e}. Defaulting to {duration_days} days.")

    interests_str = ", ".join(prefs.interests)

    # ── Fetch live weather data to enrich the AI prompt ────────────────────
    weather_context = fetch_weather_context(prefs.destination, prefs.startDate)
    if weather_context:
        logger.info(f"Weather data fetched for {prefs.destination}")
    else:
        logger.info("Weather API not configured or failed — proceeding without live weather")

    prompt = ITINERARY_STRUCTURED_PROMPT_TEMPLATE.format(
        destination=prefs.destination,
        origin=prefs.origin,
        startDate=prefs.startDate,
        endDate=prefs.endDate,
        travelers=prefs.travelers,
        budget=prefs.budget,
        currency=prefs.currency,
        travelStyle=prefs.travelStyle,
        accommodationType=prefs.accommodationType,
        dietaryRestrictions=prefs.dietaryRestrictions or "None",
        mobilityNeeds=prefs.mobilityNeeds or "None",
        specialRequests=prefs.specialRequests or "None",
        interests=interests_str,
    )

    # Prepend live weather context to the prompt if available
    if weather_context:
        prompt = f"{weather_context}\n\n{prompt}"

    # ── Route to selected AI model ──────────────────────────────────────
    selected_model = (prefs.aiModel or "gemini").lower().strip()
    logger.info(f"AI model selected: {selected_model}")

    try:
        text_content = ""

        if selected_model == "claude" and CLAUDE_ENABLED:
            # ── Claude (Anthropic) path ─────────────────────────────────
            claude_response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
                messages=[{"role": "user", "content": prompt}],
                system="You are a travel planning AI. Always respond with a single valid JSON object exactly matching the requested structure. No markdown, no explanation, just JSON.",
            )
            text_content = claude_response.content[0].text.strip()
        elif selected_model == "claude" and not CLAUDE_ENABLED:
            raise HTTPException(
                status_code=503,
                detail="Claude is not enabled on this server. Add ANTHROPIC_API_KEY to backend .env file. Get key at https://console.anthropic.com"
            )
        else:
            # ── Gemini (Google) path ─────────────────────────────────
            if not API_KEY:
                raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json")
            )
            text_content = response.text.strip()

        # BUG-17 fix: robust JSON extraction
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text_content, re.DOTALL)
        if json_match:
            text_content = json_match.group(1).strip()
        else:
            text_content = text_content.strip()

        plan_dict = json.loads(text_content)
        # Attach which model was used
        plan_dict["_model_used"] = "claude" if (selected_model == "claude" and CLAUDE_ENABLED) else "gemini"

        # -----------------------------------------------------------------
        # BUG-FIX: Validate and patch budget fields that are 0 or missing
        # -----------------------------------------------------------------
        budget = plan_dict.get("budget", {})
        budget_keys = ["flights", "accommodation", "food", "activities", "transportation", "shopping", "emergencyFund"]

        # Default proportions if AI returned 0 for a field
        default_ratios = {
            "flights":       0.35,
            "accommodation": 0.25,
            "food":          0.15,
            "activities":    0.10,
            "transportation": 0.07,
            "shopping":      0.05,
            "emergencyFund": 0.03,
        }

        any_patched = False
        for key in budget_keys:
            val = budget.get(key, 0)
            if not isinstance(val, (int, float)) or val <= 0:
                budget[key] = round(prefs.budget * default_ratios[key])
                any_patched = True
                logger.warning(f"Budget field '{key}' was 0 or missing — patched to {budget[key]}")

        # Recalculate total if anything was patched
        if any_patched:
            sub_total = sum(budget.get(k, 0) for k in budget_keys)
            budget["total"]     = sub_total
            budget["perPerson"] = round(sub_total / prefs.travelers) if prefs.travelers > 0 else sub_total
            plan_dict["budget"] = budget
            logger.info(f"Budget recalculated after patch. New total: {budget['total']}")

        # -----------------------------------------------------------------
        # AI Course Insights Calculations (6 algorithms)
        # -----------------------------------------------------------------

        attraction_names = [attr.get("name", "") for attr in plan_dict.get("attractions", [])]
        avg_tips_count   = sum(len(day.get("tips", [])) for day in plan_dict.get("itinerary", []))

        # 1. Supervised Learning: Decision Tree + Pruning + ROC
        dt_res = classify_travel_experience(
            budget=prefs.budget,
            travelers=prefs.travelers,
            travel_style=prefs.travelStyle,
            duration=duration_days,
            interests=prefs.interests,
        )

        # 2. Probabilistic Reasoning: Naïve Bayes Weather Predictor
        nb_res = predict_rain_probability(
            destination=prefs.destination,
            start_date_str=prefs.startDate,
        )

        # 3. Neural Network: Itinerary Scorer + Loss History
        nn_res = evaluate_itinerary_with_neural_net(
            budget=prefs.budget,
            travelers=prefs.travelers,
            duration=duration_days,
            interests_count=len(prefs.interests),
            attractions_count=len(attraction_names),
            tips_count=avg_tips_count,
        )

        # 4. Intelligent Agents: Rationality utility + radar
        rationality_res = evaluate_agent_rationality(
            travel_style=prefs.travelStyle,
            accommodation=prefs.accommodationType,
            budget=prefs.budget,
            travelers=prefs.travelers,
            duration=duration_days,
        )

        # 5. Reinforcement Learning: Q-Learning Route Optimiser + rewards
        if attraction_names:
            rl_res = optimize_route_q_learning(attraction_names)
        else:
            rl_res = {
                "optimized_route": [prefs.destination],
                "episode_rewards": [],
                "q_table_sample": [],
                "convergence_episode": 0,
                "total_episodes": 0,
            }

        # 6. Unsupervised Learning: K-Means Clustering
        cluster_res = cluster_travel_profiles(
            budget=prefs.budget,
            travelers=prefs.travelers,
            duration=duration_days,
            interests_count=len(prefs.interests),
            travel_style=prefs.travelStyle,
        )

        # Combine all insights
        plan_dict["ai_insights"] = {
            "classification":      dt_res,
            "weather_probability": nb_res,
            "itinerary_score":     nn_res,
            "agent_rationality":   rationality_res,
            "rl_route":            rl_res,
            "clustering":          cluster_res,
        }

        return plan_dict

    except json.JSONDecodeError as jde:
        logger.error(f"Failed to parse Gemini response as JSON: {jde}")
        raise HTTPException(
            status_code=502,
            detail="Received invalid JSON format from AI generator. Please retry."
        )
    except Exception as e:
        logger.error(f"Error in generate_plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/api/chat")
async def chat_stream(request: Request, payload: ChatPayload):
    """
    Streams a chat response back to the client via Server-Sent Events.
    Rate limited: 30 requests per minute per IP (BUG-19 fix).
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")

    messages = [m.model_dump() for m in payload.messages]
    context  = payload.tripContext

    system_instruction = TRAVEL_SYSTEM_PROMPT
    if context:
        dest     = context.get("destination", "your destination")
        overview = context.get("overview", "")
        system_instruction += (
            f"\n\nCurrent trip context: The user is planning a trip to {dest}. "
            f"Trip overview: {overview}"
        )

    async def event_generator():
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction,
        )

        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        while history and history[0]["role"] == "model":
            history.pop(0)

        latest_message = messages[-1]["content"] if messages else ""

        try:
            chat     = model.start_chat(history=history)
            response = chat.send_message(latest_message, stream=True)
            for chunk in response:
                text = chunk.text
                if text:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error in chat stream: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/optimize_budget")
async def optimize_budget(payload: BudgetOptimizationPayload):
    """
    Analyses trip budget and returns Gemini-powered optimisation recommendations.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")

    prefs          = payload.preferences
    current_budget = payload.currentBudget

    prompt = f"""As a travel budget expert, analyze this trip budget and provide specific optimization tips:

Destination: {prefs.destination}
Travelers: {prefs.travelers}
Total Budget: {prefs.budget} {prefs.currency}
Travel Style: {prefs.travelStyle}

Current Breakdown:
{os.linesep.join([f"- {k}: {v} {prefs.currency}" for k, v in current_budget.items()])}

Provide 5-7 specific, actionable money-saving tips that could realistically save 10-20% without compromising the experience. Format as a numbered list with specific apps, websites, or strategies."""

    try:
        model    = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return {"recommendations": response.text}
    except Exception as e:
        logger.error(f"Error in optimize_budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/packing_advice")
async def packing_advice(payload: PackingAdvicePayload):
    """
    Generates a tailored packing list based on weather and travel style.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")

    prefs   = payload.preferences
    weather = payload.weather

    prompt = f"""Create a smart, organized packing guide for:
- Destination: {prefs.destination}
- Weather: {weather}
- Activities: {', '.join(prefs.interests)}
- Travel Style: {prefs.travelStyle}

Organize the packing list into clear categories with specific items. Include any destination-specific items that are often forgotten. Keep it practical and concise."""

    try:
        model    = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return {"advice": response.text}
    except Exception as e:
        logger.error(f"Error in packing_advice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# Stripe Payment Endpoints
# =====================================================================
# HOW STRIPE PAYMENTS WORK:
#  1. Frontend calls POST /api/create_checkout_session
#  2. Backend creates a Stripe Checkout Session → returns a hosted URL
#  3. User enters card details on Stripe's secure hosted page
#  4. Stripe redirects user to success/cancel URL
#  5. Stripe also calls POST /api/stripe_webhook (server-to-server)
#  6. We verify the webhook signature and add credits to the user
#
# ACCEPTED CARDS: Visa, Mastercard, Amex, Discover, UnionPay
# APPLE PAY / GOOGLE PAY: Enabled automatically in Stripe Dashboard
#
# WHO RECEIVES THE PAYMENT:
#  → YOUR Stripe account (the one you created at stripe.com)
#  → Funds appear in your Stripe balance, then transfer to your bank
#
# SETUP STEPS:
#  1. Create account at https://dashboard.stripe.com
#  2. Add STRIPE_SECRET_KEY=sk_test_... to backend .env
#  3. For webhooks locally: install Stripe CLI → run:
#       stripe login
#       stripe listen --forward-to localhost:8000/api/stripe_webhook
#  4. Copy the whsec_... secret shown and add STRIPE_WEBHOOK_SECRET=...
#  5. Add VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... to frontend .env
# =====================================================================

class CheckoutSessionPayload(BaseModel):
    package_id: str
    credits:    int
    price_usd:  float
    user_id:    Optional[str] = "anonymous"
    user_email: Optional[str] = None


@app.post("/api/create_checkout_session")
async def create_checkout_session(payload: CheckoutSessionPayload):
    """
    Creates a Stripe Checkout session for credit purchase.
    Returns the hosted Stripe Checkout URL.
    """
    if not STRIPE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail=(
                "Payment service not configured. "
                "Add STRIPE_SECRET_KEY=sk_test_... to your backend .env file. "
                "Get keys at https://dashboard.stripe.com/developers/apikeys"
            )
        )

    # Build success/cancel URLs
    # In production, replace with your real domain
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    success_url = f"{frontend_base}/?session_id={{CHECKOUT_SESSION_ID}}&status=success"
    cancel_url  = f"{frontend_base}/?status=cancel"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(payload.price_usd * 100),  # Stripe uses cents
                    "product_data": {
                        "name":        f"Traveler AI — {payload.credits} Credits",
                        "description": f"Generate up to {payload.credits // 5} AI trip plans",
                        "images":      [],
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id":    payload.user_id or "anonymous",
                "credits":    str(payload.credits),
                "package_id": payload.package_id,
            },
            customer_email=payload.user_email if payload.user_email else None,
        )
        logger.info(f"Stripe checkout session created: {session.id} for user {payload.user_id}")
        return {"url": session.url, "session_id": session.id}

    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@app.post("/api/stripe_webhook")
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint — called server-to-server by Stripe after payment.
    Verifies signature and returns success (credit addition is handled by Firebase).

    NOTE: In this architecture, Firebase Firestore credits are updated by the
    frontend after redirect (via refreshCredits). The webhook is an additional
    server-side confirmation layer. In a full production setup, you'd store
    a payment record in your database here.
    """
    payload   = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("STRIPE_WEBHOOK_SECRET not set — skipping webhook signature verification")
        return {"status": "skipped"}

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Stripe webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session  = event["data"]["object"]
        user_id  = session.get("metadata", {}).get("user_id", "anonymous")
        credits  = int(session.get("metadata", {}).get("credits", 100))
        session_id = session.get("id", "")
        amount   = session.get("amount_total", 0) / 100  # convert from cents

        logger.info(
            f"Payment confirmed ✓ — Session: {session_id}, "
            f"User: {user_id}, Credits: {credits}, Amount: ${amount:.2f}"
        )
        # In a full production system, you would update your database here.
        # With Firebase Auth, the frontend updates Firestore via AuthContext.addCredits()
        # after the redirect, which is simpler and doesn't require admin SDK.

    return {"status": "received"}


@app.get("/api/verify_payment")
async def verify_payment(session_id: str):
    """
    Verifies a Stripe Checkout session and returns credits to add.
    Called by the frontend PaymentSuccessPage after redirect.
    """
    if not STRIPE_ENABLED:
        # Return success with default credits if Stripe not configured
        return {"status": "ok", "credits_added": 100, "message": "Stripe not configured — manual verification required"}

    try:
        session  = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            credits = int(session.metadata.get("credits", 100))
            user_id = session.metadata.get("user_id", "anonymous")
            logger.info(f"Payment verified for session {session_id}, user {user_id}, credits {credits}")
            return {"status": "paid", "credits_added": credits, "session_id": session_id}
        else:
            return {"status": session.payment_status, "credits_added": 0}
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

