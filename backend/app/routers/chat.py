from fastapi import APIRouter

from app.models import ChatAnswer, ChatQuestion
from app.services.explanation_service import answer_question

router = APIRouter(prefix="/api/v1/chat", tags=["assistant"])


@router.post("/ask", response_model=ChatAnswer)
def ask_question(payload: ChatQuestion) -> ChatAnswer:
    return ChatAnswer(answer=answer_question(payload.question))

