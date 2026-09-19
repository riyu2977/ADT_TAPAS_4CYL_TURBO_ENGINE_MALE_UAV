"""
TAPAS-BH-201 / Archer-NG — 2.2L 4-Cylinder Inline Turbocharged CRDi (Jet-A1)
Baseline thermodynamic envelope & operational limits @ 15,000 ft loiter.
"""
from typing import Dict, Any

ENGINE_NAME = "TAPAS-BH-201 2.2L CRDi Aero Engine"
UAV_ID = "TAPAS-BH-201"

ENGINE_LIMITS: Dict[str, Any] = {
    "rpm": {"min": 2400, "max": 2800, "nominal": 2540},
    "map_inHg": {"min": 32.0, "max": 35.0, "nominal": 33.2},
    "cht_C": {"min": 160, "max": 180, "caution": 195, "critical": 215, "nominal": [175, 176, 174, 175]},
    "egt_C": {"min": 650, "max": 720, "caution": 740, "critical": 780, "nominal": [680, 682, 679, 681]},
    "oil_press_psi": {"min": 50.0, "max": 60.0, "caution": 45.0, "critical": 38.0, "nominal": 55.0},
    "oil_temp_c": {"min": 95.0, "max": 110.0, "caution": 120.0, "critical": 132.0, "nominal": 102.0},
    "particulate_ppm": {"nominal": 12.0, "caution": 25.0, "critical": 40.0},
    "vibration_hz": {"nominal": 85.0, "micro_fracture": 10400.0}
}
