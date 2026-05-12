from fastapi import APIRouter, Query

from app.models import PredictionResponse
from app.services.prediction_service import get_short_term_prediction

router = APIRouter(prefix="/api/v1/prediction", tags=["prediction"])


@router.get("/short-term", response_model=PredictionResponse)
def short_term_prediction(
    horizon: str = Query(default="30min"),
) -> PredictionResponse:
    return get_short_term_prediction(horizon)

