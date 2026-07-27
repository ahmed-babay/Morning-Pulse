# Morning Pulse

Morning Pulse is a morning briefing application. Milestone 1 provides a
production-ready React/Vite foundation and a FastAPI health service; data
integrations and the full product interface are intentionally deferred.

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
at `/health` and `/api/v1/health`; interactive docs are at `/docs`.

Run backend quality checks:

```powershell
ruff check .
ruff format --check .
mypy app tests
pytest
```

## Environment

Copy `.env.example` to `.env` for local overrides. Backend settings use
Pydantic Settings and can also be supplied directly as environment variables.

## Docker

```powershell
docker compose up --build
```

The containerized frontend is served at <http://localhost:5173> and the API at
<http://localhost:8000>.
