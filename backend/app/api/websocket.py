"""
WebSocket Connection & Telemetry Streaming Manager
Handles 1 Hz downlink stream, diagnostic bursts, continuous edge buffer logging during comms jamming, and backfill reconciliation.
"""
import asyncio
import datetime
import logging
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

from app.simulation.engine import generate_telemetry_jitter
from app.simulation.faults import FaultStateMachine
from app.simulation.dsp import compute_fft_spectrum
from app.analytics.sensor_validator import evaluate_cylinder_health
from app.analytics.rul_engine import compute_calibrated_rul, calculate_rul_posterior
from app.analytics.xai_engine import compute_xai_attribution
from app.analytics.advisory import generate_tactical_advisory

logger = logging.getLogger("atdt.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.fsm = FaultStateMachine()
        self.clock: int = 0
        self.edge_buffer: List[Dict[str, Any]] = []
        self._stream_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"GCS client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"GCS client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                self.disconnect(connection)

    def start_stream_loop(self):
        if self._stream_task is None or self._stream_task.done():
            self._stream_task = asyncio.create_task(self._stream_loop())

    async def _stream_loop(self):
        logger.info("Starting background telemetry stream loop...")
        while True:
            try:
                await asyncio.sleep(1.0)
                self.clock += 1
                
                # Resolve current state
                state = self.fsm.get_resolved_state()
                raw_telem = state["telemetry"]
                live_telem = generate_telemetry_jitter(raw_telem)

                # Compute analytics
                fft = compute_fft_spectrum(self.fsm.fault, frozen=self.fsm.jammed)
                cyl_health = evaluate_cylinder_health(live_telem, self.fsm.fault, self.fsm.stage)
                
                rul_hours = compute_calibrated_rul(
                    live_telem,
                    self.fsm.fault,
                    self.fsm.stage,
                    shed_sar=self.fsm.load_shedding["sar"],
                    shed_eoir=self.fsm.load_shedding["eoir"]
                )
                rul_post = calculate_rul_posterior(rul_hours, self.fsm.fault, self.fsm.stage)
                xai_contribs = compute_xai_attribution(live_telem, self.fsm.fault, self.fsm.stage)
                advisory_info = generate_tactical_advisory(self.fsm.fault, self.fsm.stage, self.fsm.jammed)

                now_stamp = datetime.datetime.now().strftime("%H:%M:%S")

                frame_payload = {
                    "timestamp": now_stamp,
                    "clock": self.clock,
                    "telemetry": live_telem,
                    "fft": fft,
                    "network": state["network"],
                    "ai_analysis": {
                        "status": advisory_info["status"],
                        "severity": advisory_info["severity"],
                        "rul_hours": rul_hours,
                        "advisory": advisory_info["advisory"],
                        "xai_contributors": xai_contribs if not self.fsm.jammed else None
                    },
                    "rul_posterior": rul_post,
                    "cylinder_health": cyl_health,
                    "jammed": self.fsm.jammed,
                    "jamSeconds": len(self.edge_buffer) if self.fsm.jammed else 0
                }

                # Continuous Edge Simulation Requirement:
                # If jammed, store frame in edge_buffer and do NOT stream to GCS.
                if self.fsm.jammed:
                    frame_payload["recovered"] = True
                    self.edge_buffer.append(frame_payload)
                    logger.debug(f"LINK LOST: Frame t={self.clock} logged to edge buffer (Total: {len(self.edge_buffer)}s)")
                else:
                    # Normal streaming mode
                    await self.broadcast(frame_payload)

            except asyncio.CancelledError:
                logger.info("Stream loop cancelled.")
                break
            except Exception as e:
                logger.error(f"Error in stream loop: {e}", exc_info=True)

    def restore_link(self) -> List[Dict[str, Any]]:
        """Restores link and returns buffered edge telemetry frames for reconciliation."""
        buffered = list(self.edge_buffer)
        self.edge_buffer.clear()
        self.fsm.set_jammed(False)
        logger.info(f"LINK RESTORED: {len(buffered)}s of edge telemetry reconciled.")
        return buffered

manager = ConnectionManager()
