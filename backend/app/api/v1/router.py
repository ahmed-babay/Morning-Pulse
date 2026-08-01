from fastapi import APIRouter

from app.api.v1.briefing import router as briefing_router
from app.api.v1.github import router as github_router
from app.api.v1.health import router as health_router
from app.api.v1.weather import router as weather_router

router = APIRouter()
router.include_router(health_router)
router.include_router(weather_router)
router.include_router(briefing_router)
router.include_router(github_router)
