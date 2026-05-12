from fastapi import APIRouter

from app.models import TwinState
from app.services.twin_service import get_twin_state

router = APIRouter(prefix="/api/v1/twin", tags=["digital-twin"])


@router.get("/state", response_model=TwinState)
def twin_state() -> TwinState:
    return get_twin_state()

