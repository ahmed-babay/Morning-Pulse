# Morning Pulse

Morning Pulse is an installable morning briefing that combines weather,
markets, currencies, curated news, holidays, natural events, space launches,
NASA imagery, a daily quote, and a developer tip. Provider responses are
normalized by a FastAPI backend so the React client never depends on upstream
payload shapes or credentials.

## Requirements

- Node.js 22 and npm
- Python 3.12
- Docker Desktop (optional)

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

The development server is available at <http://localhost:5173>.

Copy `.env.example` to `.env` at the repository root when you need local
overrides. The frontend defaults to `/api/v1`; Vite development can use
`VITE_API_URL=http://localhost:8000/api/v1`.

Run all frontend quality checks:

```powershell
npm run check
```

## Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

The API is available at <http://localhost:8000>. Health endpoints are exposed
at `/health` and `/api/v1/health`; OpenAPI docs are at `/docs`.

Run backend quality checks:

```powershell
ruff check .
ruff format --check .
mypy app tests
pytest
```

## Architecture

- `frontend/src/features`: typed API hooks and domain widgets.
- `frontend/src/stores`: persisted theme, location, and favorites state.
- `backend/app/briefing`: provider orchestration, validation, normalization,
  stale-on-error caching, and RSS hardening.
- `backend/app/weather`: Open-Meteo forecast and location search.
- `backend/app/api/v1`: versioned REST routes and response envelopes.

TanStack Query owns server state, retries, and a safe 24-hour local cache.
Zustand owns user preferences. The generated service worker precaches the app
shell, uses Network First for same-origin API GETs, and revalidates fonts.

## API

All successful responses use `{ "data": ..., "request_id": "..." }`; failures
use a stable error envelope without upstream response bodies.

- `GET /api/v1/weather` and `/api/v1/weather/search`
- `GET /api/v1/crypto` — BTC, ETH, gainers, and seven-day sparklines
- `GET /api/v1/currencies?base=USD&symbols=EUR,GBP&days=14`
- `GET /api/v1/news?category=world&limit=12`
- `GET /api/v1/holidays?country=US&year=2026`
- `GET /api/v1/world`, `/world/launches`, and `/world/apod`

## Providers and attribution

Morning Pulse uses public endpoints from Open-Meteo, CoinGecko, Frankfurter
(ECB reference data), Nager.Date, USGS, NASA EONET, Launch Library 2, and NASA
APOD. News comes from a fixed allowlist of publisher RSS feeds. RSS documents
are size-limited, reject doctypes, accept HTTPS links only, strip markup, and
deduplicate entries.

No private keys are required. NASA APOD uses the public `DEMO_KEY`; set
`DATA__NASA_API_KEY` to your own key only to raise NASA's rate limit. Provider
base URLs and cache windows can be overridden with the nested variables shown
in `.env.example`.

## Docker

```powershell
docker compose up --build
```

The containerized frontend is served at <http://localhost:5173> and the API at
<http://localhost:8000>. Nginx proxies `/api/` to FastAPI and adds browser
security headers. FastAPI enforces explicit CORS origins, request IDs, rate
limits, normalized errors, and API security headers.

For production, terminate TLS at your edge, set `CORS_ORIGINS` to exact trusted
origins, keep `DEBUG=false`, and configure provider/rate limits for expected
traffic. Containers run as non-root users where supported by their images.

## Offline and installation

Use the in-app Install action when the browser offers it. After the first
successful load, the app shell and successful query data remain available
offline. The network badge identifies stale/offline operation. Provider data
is informational and may be delayed; refresh after reconnecting. A toast
prompts before activating a newly downloaded application version.

## CI

GitHub Actions runs frontend formatting, lint, TypeScript, tests, and production
build plus backend Ruff, mypy, and pytest checks. Run `npm run check` and the
backend commands above before deployment.
