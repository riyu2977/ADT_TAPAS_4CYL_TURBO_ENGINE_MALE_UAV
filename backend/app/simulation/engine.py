"""
Aero Engine Physics & Telemetry State Generator
Models the baseline thermodynamic envelope and applies deterministic sensor jitter.
"""
import copy
import random
from typing import Dict, Any, List

def jitter(val: float, amount: float, dp: int = 1) -> float:
    """Applies small sensor noise jitter around a center value."""
    if val == 0:
        return 0.0
    val_j = val + (random.random() - 0.5) * amount
    return round(val_j, dp)

BASE_ENGINE_STATES: Dict[str, Dict[str, Any]] = {
    # 1. BASELINE: TAPAS-BH-201 loitering at 15,000 ft
    "nominal": {
        "telemetry": {
            "rpm": 2540,
            "map_inHg": 33.2,
            "cht_C": [175, 176, 174, 175],
            "egt_C": [680, 682, 679, 681],
            "oil_press_psi": 55.0,
            "oil_temp_c": 102.0,
            "vibration_hz": 85.0,
            "metal_particulate_ppm": 12.0
        },
        "network": {"mode": "HEARTBEAT", "bandwidth_kbps": 0.5},
        "ai_analysis": {
            "status": "NOMINAL",
            "severity": "NOMINAL",
            "rul_hours": 1500.0,
            "advisory": "Proceed with mission parameters.",
            "xai_contributors": None
        }
    },

    # 2. FAULT: Thermodynamic Anti-Spoofing (broken CHT sensor, Cyl 2)
    "sensor_snap": {
        "telemetry": {
            "rpm": 2540,
            "map_inHg": 33.2,
            "cht_C": [175, 0, 174, 175],
            "egt_C": [680, 682, 679, 681],
            "oil_press_psi": 55.0,
            "oil_temp_c": 102.0,
            "vibration_hz": 85.0,
            "metal_particulate_ppm": 12.0
        },
        "network": {"mode": "HEARTBEAT", "bandwidth_kbps": 0.6},
        "ai_analysis": {
            "status": "WARNING: SENSOR ISOLATED",
            "severity": "WARNING",
            "rul_hours": 1499.0,
            "advisory": "Virtual Sensor Fallback initiated. CHT sensor (Cyl 2) isolated. Engine health verified via EGT/RPM cross-validation — disregard Cyl 2 CHT.",
            "xai_contributors": [
                {"metric": "EGT/RPM Cross-Validation", "weight": "98%"}
            ]
        }
    },

    # 3. FAULT: Micro-Fracture — predictive acoustics, thermals fully nominal
    "micro_fracture": {
        "telemetry": {
            "rpm": 2540,
            "map_inHg": 33.2,
            "cht_C": [175, 176, 175, 176],
            "egt_C": [681, 680, 682, 679],
            "oil_press_psi": 54.0,
            "oil_temp_c": 103.0,
            "vibration_hz": 10400.0,
            "metal_particulate_ppm": 44.0
        },
        "network": {"mode": "DIAGNOSTIC BURST", "bandwidth_kbps": 15.0},
        "ai_analysis": {
            "status": "WARNING: MICRO-FRACTURE SIGNATURE",
            "severity": "WARNING",
            "rul_hours": 12.0,
            "advisory": "Abnormal high-frequency acoustic harmonic detected (10.4 kHz, Cyl 3 con-rod big-end). Thermal indicators still nominal. RUL adjusted to 12 hours — schedule teardown inspection at recovery.",
            "xai_contributors": [
                {"metric": "Acoustic Harmonic 10.4 kHz", "weight": "78%"},
                {"metric": "Metal Particulate Rise", "weight": "22%"}
            ]
        }
    },

    # 4. FAULT: Heat Soak Cascade — terminal stage (cooling system failure)
    "heat_soak": {
        "telemetry": {
            "rpm": 2400,
            "map_inHg": 33.2,
            "cht_C": [230, 235, 232, 238],
            "egt_C": [750, 760, 755, 765],
            "oil_press_psi": 35.0,
            "oil_temp_c": 140.0,
            "vibration_hz": 90.0,
            "metal_particulate_ppm": 15.0
        },
        "network": {"mode": "DIAGNOSTIC BURST", "bandwidth_kbps": 15.2},
        "ai_analysis": {
            "status": "CRITICAL: THERMAL CASCADE",
            "severity": "CRITICAL",
            "rul_hours": 0.4,
            "advisory": "ACTION REQUIRED: Execute Tactical Load-Shedding. Reduce throttle to 40% and abort to Waypoint Alpha.",
            "xai_contributors": [
                {"metric": "CHT Variance", "weight": "65%"},
                {"metric": "Oil Press Drop", "weight": "35%"}
            ]
        }
    }
}

HEAT_SOAK_STAGES: List[Dict[str, Any]] = [
    # T+0s — CHT spikes first
    {
        "telemetry": {
            "rpm": 2460,
            "map_inHg": 33.2,
            "cht_C": [218, 221, 220, 224],
            "egt_C": [738, 744, 741, 748],
            "oil_press_psi": 54.0,
            "oil_temp_c": 105.0,
            "vibration_hz": 88.0,
            "metal_particulate_ppm": 13.0
        },
        "network": {"mode": "DIAGNOSTIC BURST", "bandwidth_kbps": 15.0},
        "ai_analysis": {
            "status": "CAUTION: CHT EXCEEDANCE",
            "severity": "WARNING",
            "rul_hours": 3.0,
            "advisory": "Coolant circulation loss suspected. CHT exceedance on all cylinders; oil circuit still within limits. Monitoring thermal inertia propagation.",
            "xai_contributors": [
                {"metric": "CHT Rise Rate", "weight": "82%"},
                {"metric": "Coolant ΔT Collapse", "weight": "18%"}
            ]
        }
    },
    # T+5s — heat transfers into the oil
    {
        "telemetry": {
            "rpm": 2430,
            "map_inHg": 33.2,
            "cht_C": [226, 230, 228, 233],
            "egt_C": [745, 752, 748, 757],
            "oil_press_psi": 47.0,
            "oil_temp_c": 130.0,
            "vibration_hz": 89.0,
            "metal_particulate_ppm": 14.0
        },
        "network": {"mode": "DIAGNOSTIC BURST", "bandwidth_kbps": 15.1},
        "ai_analysis": {
            "status": "WARNING: HEAT SOAK PROPAGATION",
            "severity": "WARNING",
            "rul_hours": 1.2,
            "advisory": "Block heat now soaking into lubrication circuit. Oil temp 130°C — viscosity margin eroding. Prepare for load-shedding.",
            "xai_contributors": [
                {"metric": "Oil Temp Gradient", "weight": "58%"},
                {"metric": "CHT Variance", "weight": "42%"}
            ]
        }
    },
    # T+10s — viscosity breakdown, pressure collapse
    BASE_ENGINE_STATES["heat_soak"]
]

def generate_telemetry_jitter(telemetry_dict: dict) -> dict:
    """Applies subtle realistic sensor noise to telemetry readings."""
    t = copy.deepcopy(telemetry_dict)
    t["rpm"] = int(round(jitter(t["rpm"], 26, 0)))
    t["map_inHg"] = jitter(t["map_inHg"], 0.5)
    t["cht_C"] = [jitter(v, 2.4) for v in t["cht_C"]]
    t["egt_C"] = [jitter(v, 7.0) for v in t["egt_C"]]
    t["oil_press_psi"] = jitter(t["oil_press_psi"], 1.2)
    t["oil_temp_c"] = jitter(t["oil_temp_c"], 1.2)
    t["metal_particulate_ppm"] = jitter(t["metal_particulate_ppm"], 1.6)
    return t
