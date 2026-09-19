"""
REST Router for Ground Control Station (GCS) Commands
Endpoints for fault injection, environmental stress, load-shedding, comms-jamming, and system reset.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.websocket import manager

router = APIRouter(prefix="/api", tags=["GCS Controls"])

class FaultPayload(BaseModel):
    fault: str

class EnvPayload(BaseModel):
    highAltitude: bool
    hotWeather: bool

class LoadShedPayload(BaseModel):
    sar: bool
    eoir: bool

class JammingPayload(BaseModel):
    jammed: bool

@router.post("/fault")
async def set_fault(payload: FaultPayload):
    if payload.fault not in ["nominal", "sensor_snap", "micro_fracture", "heat_soak"]:
        raise HTTPException(status_code=400, detail="Invalid fault type")
    manager.fsm.inject_fault(payload.fault)
    return {"status": "success", "active_fault": manager.fsm.fault}

@router.post("/environment")
async def set_environment(payload: EnvPayload):
    manager.fsm.set_environment(payload.highAltitude, payload.hotWeather)
    return {"status": "success", "highAltitude": payload.highAltitude, "hotWeather": payload.hotWeather}

@router.post("/load-shedding")
async def set_load_shedding(payload: LoadShedPayload):
    manager.fsm.set_load_shedding(payload.sar, payload.eoir)
    return {"status": "success", "load_shedding": manager.fsm.load_shedding}

@router.post("/jamming")
async def set_jamming(payload: JammingPayload):
    if payload.jammed:
        manager.fsm.set_jammed(True)
        return {"status": "success", "link": "LINK LOST", "jammed": True}
    else:
        buffered_frames = manager.restore_link()
        return {
            "status": "success",
            "link": "RESTORED",
            "jammed": False,
            "reconciled_seconds": len(buffered_frames),
            "buffered_frames": buffered_frames
        }

@router.post("/reset")
async def reset_system():
    manager.fsm.inject_fault("nominal")
    manager.fsm.set_environment(high_altitude=True, hot_weather=False)
    manager.fsm.set_load_shedding(sar=False, eoir=False)
    if manager.fsm.jammed:
        manager.restore_link()
    return {"status": "success", "message": "System re-baselined to nominal loiter"}
