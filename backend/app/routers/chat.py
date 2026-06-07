from fastapi import APIRouter, Query

from app.models import (
    AssistantAskRequest,
    AssistantAskResponse,
    AssistantContextResponse,
    ChatAnswer,
    ChatQuestion,
)
from app.services.explanation_service import answer_question
from app.services.assistant_service import answer_assistant_question, get_assistant_context

router = APIRouter(prefix="/api/v1/chat", tags=["assistant"])
assistant_router = APIRouter(prefix="/api/assistant", tags=["assistant"])
assistant_v1_router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


@router.post("/ask", response_model=ChatAnswer)
def ask_question(payload: ChatQuestion) -> ChatAnswer:
    result = answer_question(
        payload.question,
        room_id=payload.room_id,
        window=payload.window,
    )
    return ChatAnswer(**result)


@assistant_router.get("/context", response_model=AssistantContextResponse)
@assistant_v1_router.get("/context", response_model=AssistantContextResponse)
def assistant_context(
    room_id: str = Query(default="Dorm-A101"),
    window: str = Query(default="1h"),
) -> AssistantContextResponse:
    return AssistantContextResponse(**get_assistant_context(room_id=room_id, window=window))


@assistant_router.post("/ask", response_model=AssistantAskResponse)
@assistant_v1_router.post("/ask", response_model=AssistantAskResponse)
def assistant_ask(payload: AssistantAskRequest) -> AssistantAskResponse:
    return AssistantAskResponse(
        **answer_assistant_question(
            room_id=payload.room_id,
            question=payload.question,
            window=payload.window,
        )
    )
