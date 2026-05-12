from fastapi import APIRouter

from app.models import FeedbackRequest, FeedbackResponse
from app.services.feedback_service import save_feedback

router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse)
def create_feedback(payload: FeedbackRequest) -> FeedbackResponse:
    save_feedback(payload)
    return FeedbackResponse(
        success=True,
        message="Feedback received. It will be used for future personalization.",
    )

