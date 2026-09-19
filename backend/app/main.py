import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router as api_router
from app.api.websocket import manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("atdt_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ATDT Telemetry Stream Engine...")
    manager.start_stream_loop()
    yield
    logger.info("Shutting down ATDT Telemetry Stream Engine...")

app = FastAPI(
    title="ATDT Simulation Engine",
    description="AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines in MALE UAVs (TAPAS-BH-201)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain active connection and listen for client ping/messages
            data = await websocket.receive_text()
            logger.debug(f"Received client payload: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ATDT Simulation Engine",
        "system": "TAPAS-BH-201 2.2L CRDi Aero Engine Twin",
        "version": "1.0.0",
        "connections": len(manager.active_connections),
        "jammed": manager.fsm.jammed,
        "buffered_seconds": len(manager.edge_buffer)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
