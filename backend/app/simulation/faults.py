"""
Fault State Machine & Heat Soak Cascade Manager
Manages fault mode transitions and automatic stage progression.
"""
import asyncio
import copy
import logging
from typing import Dict, Any
from app.simulation.engine import BASE_ENGINE_STATES, HEAT_SOAK_STAGES
from app.simulation.environment import EnvState, apply_environmental_stress

logger = logging.getLogger("atdt.faults")

class FaultStateMachine:
    def __init__(self):
        self.fault: str = "nominal"
        self.stage: int = 0
        self.env: EnvState = EnvState(highAltitude=True, hotWeather=False)
        self.jammed: bool = False
        self.load_shedding = {"sar": False, "eoir": False}
        self._heat_soak_task: asyncio.Task | None = None

    def set_environment(self, high_altitude: bool, hot_weather: bool):
        self.env.highAltitude = high_altitude
        self.env.hotWeather = hot_weather

    def set_load_shedding(self, sar: bool, eoir: bool):
        self.load_shedding["sar"] = sar
        self.load_shedding["eoir"] = eoir

    def set_jammed(self, jammed: bool):
        self.jammed = jammed

    def inject_fault(self, fault_name: str):
        if self._heat_soak_task and not self._heat_soak_task.done():
            self._heat_soak_task.cancel()
            self._heat_soak_task = None

        if fault_name not in ["nominal", "sensor_snap", "micro_fracture", "heat_soak"]:
            fault_name = "nominal"

        self.fault = fault_name
        self.stage = 0

        if fault_name == "heat_soak":
            # Launch async stage progression (T+0s stage 0, T+5s stage 1, T+10s stage 2)
            self._heat_soak_task = asyncio.create_task(self._run_heat_soak_progression())

    async def _run_heat_soak_progression(self):
        try:
            self.stage = 0
            logger.info("Heat soak T+0s: Coolant circulation loss.")
            await asyncio.sleep(5)
            self.stage = 1
            logger.info("Heat soak T+5s: Oil heat absorption.")
            await asyncio.sleep(5)
            self.stage = 2
            logger.info("Heat soak T+10s: Thermal cascade critical.")
        except asyncio.CancelledError:
            logger.info("Heat soak progression cancelled.")

    def get_resolved_state(self) -> Dict[str, Any]:
        """Resolves current state and applies environmental stress."""
        if self.fault == "heat_soak":
            raw_state = copy.deepcopy(HEAT_SOAK_STAGES[min(self.stage, len(HEAT_SOAK_STAGES) - 1)])
        else:
            raw_state = copy.deepcopy(BASE_ENGINE_STATES.get(self.fault, BASE_ENGINE_STATES["nominal"]))

        # Apply environmental stress
        raw_state["telemetry"] = apply_environmental_stress(raw_state["telemetry"], self.env)

        # Apply network jamming state if active
        if self.jammed:
            raw_state["network"] = {"mode": "LINK LOST", "bandwidth_kbps": 0.0}

        return raw_state
