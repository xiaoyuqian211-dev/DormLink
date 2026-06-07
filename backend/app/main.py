from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_database
from app.mqtt_bridge import start_mqtt_bridge, stop_mqtt_bridge
from app.models import HealthResponse
from app.routers import chat, feedback, prediction, telemetry, twin


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database()
    start_mqtt_bridge()
    try:
        yield
    finally:
        stop_mqtt_bridge()


app = FastAPI(
    title="DormLink API",
    version="0.1.0",
    description="AIoT dormitory environment intelligence prototype.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        project="DormLink",
        message="DormLink backend is running",
    )


app.include_router(telemetry.router)
app.include_router(telemetry.compat_router)
app.include_router(prediction.router)
app.include_router(twin.router)
app.include_router(feedback.router)
app.include_router(chat.router)
app.include_router(chat.assistant_router)
app.include_router(chat.assistant_v1_router)
