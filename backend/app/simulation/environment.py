"""
Environmental & Meteorological Stress Model
Applies ISA barometric pressure lapse and ambient temperature stress offsets.
"""
from pydantic import BaseModel

class EnvState(BaseModel):
    highAltitude: bool = True
    hotWeather: bool = False

def apply_environmental_stress(telemetry_dict: dict, env: EnvState) -> dict:
    """
    Applies deterministic atmospheric offsets to telemetry dictionary.
    """
    t = {
        "rpm": telemetry_dict["rpm"],
        "map_inHg": telemetry_dict["map_inHg"],
        "cht_C": list(telemetry_dict["cht_C"]),
        "egt_C": list(telemetry_dict["egt_C"]),
        "oil_press_psi": telemetry_dict["oil_press_psi"],
        "oil_temp_c": telemetry_dict["oil_temp_c"],
        "vibration_hz": telemetry_dict["vibration_hz"],
        "metal_particulate_ppm": telemetry_dict["metal_particulate_ppm"]
    }

    if env.highAltitude:
        # Thinner air @ 15,000 ft: reduced charge density, turbo works harder (+backpressure), less convective cooling
        t["map_inHg"] = round(t["map_inHg"] - 1.1, 1)
        t["egt_C"] = [v + 14 for v in t["egt_C"]]
        t["cht_C"] = [0 if v == 0 else v + 3 for v in t["cht_C"]]
        t["oil_press_psi"] = round(t["oil_press_psi"] - 1.5, 1)
    else:
        t["map_inHg"] = round(t["map_inHg"] + 1.4, 1)
        t["rpm"] = t["rpm"] + 40

    if env.hotWeather:
        # ISA +45°C ambient: radiator cooling delta T collapses
        t["cht_C"] = [0 if v == 0 else v + 13 for v in t["cht_C"]]
        t["egt_C"] = [v + 12 for v in t["egt_C"]]
        t["oil_temp_c"] = round(t["oil_temp_c"] + 9, 1)
        t["oil_press_psi"] = round(t["oil_press_psi"] - 2.0, 1)

    return t
