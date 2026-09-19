"""
Cross-Channel Virtual Sensor Observer & Cylinder Health Evaluator
Isolates faulty sensors without false emergency aborts.
"""
from typing import List, Dict, Any

BASE_CYCLES = 18200

def get_isolated_cht_indices(cht_list: List[float]) -> List[int]:
    """Identifies indices of CHT sensors reading hard zero (open circuit)."""
    return [i for i, v in enumerate(cht_list) if v == 0]

def evaluate_cylinder_health(telemetry: Dict[str, Any], fault: str, stage: int) -> List[Dict[str, Any]]:
    """
    Evaluates individual cylinder health parameters, remaining cycles, anomaly scores, and notes.
    """
    cht_list = telemetry.get("cht_C", [175, 175, 175, 175])
    egt_list = telemetry.get("egt_C", [680, 680, 680, 680])
    isolated_indices = get_isolated_cht_indices(cht_list)

    cylinders = []
    for i, cht in enumerate(cht_list):
        is_iso = i in isolated_indices
        
        # Severity calculation
        if is_iso:
            severity = "WARNING"
        elif cht >= 215:
            severity = "CRITICAL"
        elif cht >= 195:
            severity = "WARNING"
        else:
            severity = "NOMINAL"

        trend_per_hour = 0.2
        remaining_cycles = BASE_CYCLES - i * 120
        anomaly_score = 0.1 + i * 0.05
        note = "Wear trajectory on-track."

        if fault == "heat_soak":
            stages_trend = [48.0, 96.0, 130.0]
            stages_cycles = [4200, 1450, 320]
            stages_anomaly = [6.2, 7.9, 9.4]
            st = min(stage, 2)
            
            trend_per_hour = stages_trend[st]
            remaining_cycles = round(stages_cycles[st] - i * 40)
            anomaly_score = stages_anomaly[st] + i * 0.1
            note = "Head temperature outside certified envelope."

        elif fault == "micro_fracture" and i == 2:
            trend_per_hour = 0.4
            remaining_cycles = 640
            anomaly_score = 7.8
            note = "Big-end ring-down at 10.4 kHz. Thermals still nominal."

        if is_iso:
            trend_per_hour = 0.0
            anomaly_score = 0.0
            note = "CHT channel isolated. Health inferred from EGT/RPM observer."

        cylinders.append({
            "index": i,
            "cht": cht,
            "egt": egt_list[i] if i < len(egt_list) else 680.0,
            "isolated": is_iso,
            "severity": severity,
            "trendPerHour": round(trend_per_hour, 1),
            "remainingCycles": int(remaining_cycles),
            "anomalyScore": round(anomaly_score, 1),
            "note": note
        })

    return cylinders
