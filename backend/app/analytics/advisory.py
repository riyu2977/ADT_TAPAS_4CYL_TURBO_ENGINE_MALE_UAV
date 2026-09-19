"""
Tactical Advisory Engine
Generates operator decision recommendations based on engine state and risk severity.
"""
from typing import Dict, Any

def generate_tactical_advisory(fault: str, stage: int, is_jammed: bool = False) -> Dict[str, Any]:
    """
    Generates status string, severity level, advisory text, and recommended actions.
    """
    if is_jammed:
        return {
            "status": "LINK LOST: EDGE AI LOGGING",
            "severity": "WARNING",
            "advisory": "Airframe autonomy engaged. Diagnostics buffered onboard until SATCOM is restored."
        }

    if fault == "heat_soak":
        if stage == 0:
            return {
                "status": "CAUTION: CHT EXCEEDANCE",
                "severity": "WARNING",
                "advisory": "Coolant circulation loss suspected. CHT exceedance on all cylinders; oil circuit still within limits. Monitoring thermal inertia propagation."
            }
        elif stage == 1:
            return {
                "status": "WARNING: HEAT SOAK PROPAGATION",
                "severity": "WARNING",
                "advisory": "Block heat now soaking into lubrication circuit. Oil temp 130°C — viscosity margin eroding. Prepare for load-shedding."
            }
        else:
            return {
                "status": "CRITICAL: THERMAL CASCADE",
                "severity": "CRITICAL",
                "advisory": "ACTION REQUIRED: Execute Tactical Load-Shedding. Reduce throttle to 40% and abort to Waypoint Alpha."
            }
    elif fault == "sensor_snap":
        return {
            "status": "WARNING: SENSOR ISOLATED",
            "severity": "WARNING",
            "advisory": "Virtual Sensor Fallback initiated. CHT sensor (Cyl 2) isolated. Engine health verified via EGT/RPM cross-validation — disregard Cyl 2 CHT."
        }
    elif fault == "micro_fracture":
        return {
            "status": "WARNING: MICRO-FRACTURE SIGNATURE",
            "severity": "WARNING",
            "advisory": "Abnormal high-frequency acoustic harmonic detected (10.4 kHz, Cyl 3 con-rod big-end). Thermal indicators still nominal. RUL adjusted to 12 hours — schedule teardown inspection at recovery."
        }
    else:
        return {
            "status": "NOMINAL",
            "severity": "NOMINAL",
            "advisory": "Proceed with mission parameters."
        }
