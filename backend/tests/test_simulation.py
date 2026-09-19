"""
Verification Test Script for Step 2 (Deterministic Simulation Logic)
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.simulation.engine import generate_telemetry_jitter
from app.simulation.environment import EnvState, apply_environmental_stress
from app.simulation.faults import FaultStateMachine

async def test_simulation():
    print("--- Testing Environmental Stress Modifiers ---")
    base_telem = {
        "rpm": 2540,
        "map_inHg": 33.2,
        "cht_C": [175, 176, 174, 175],
        "egt_C": [680, 682, 679, 681],
        "oil_press_psi": 55.0,
        "oil_temp_c": 102.0,
        "vibration_hz": 85.0,
        "metal_particulate_ppm": 12.0
    }
    
    env_nominal = EnvState(highAltitude=False, hotWeather=False)
    env_stress = EnvState(highAltitude=True, hotWeather=True)
    
    telem_nominal = apply_environmental_stress(base_telem, env_nominal)
    telem_stress = apply_environmental_stress(base_telem, env_stress)
    
    print("Nominal Env Telemetry:", telem_nominal)
    print("High Alt + Hot Weather Telemetry:", telem_stress)
    
    assert telem_stress["egt_C"][0] > telem_nominal["egt_C"][0], "EGT should increase under environmental stress"
    assert telem_stress["oil_temp_c"] > telem_nominal["oil_temp_c"], "Oil temp should increase under hot weather"
    print("✓ Environmental Stress Verification PASSED")
    
    print("\n--- Testing Fault State Machine ---")
    fsm = FaultStateMachine()
    
    # 1. Nominal
    st_nominal = fsm.get_resolved_state()
    assert st_nominal["ai_analysis"]["status"] == "NOMINAL", "Initial state should be NOMINAL"
    print("Nominal Status:", st_nominal["ai_analysis"]["status"])
    
    # 2. CHT Sensor Snap
    fsm.inject_fault("sensor_snap")
    st_snap = fsm.get_resolved_state()
    assert st_snap["telemetry"]["cht_C"][1] == 0, "Cyl 2 CHT should be 0 (open circuit)"
    print("Sensor Snap CHT:", st_snap["telemetry"]["cht_C"])
    
    # 3. Micro-Fracture
    fsm.inject_fault("micro_fracture")
    st_micro = fsm.get_resolved_state()
    assert st_micro["telemetry"]["vibration_hz"] == 10400.0, "Vibration should spike to 10.4 kHz"
    print("Micro-Fracture Vibration Hz:", st_micro["telemetry"]["vibration_hz"])
    
    # 4. Heat Soak Cascade Progression
    print("\nTesting Heat Soak Cascade Async Progression (T+0s -> T+5s -> T+10s)...")
    fsm.inject_fault("heat_soak")
    st_h0 = fsm.get_resolved_state()
    print("Stage 0 (T+0s) Status:", st_h0["ai_analysis"]["status"], "CHT:", st_h0["telemetry"]["cht_C"])
    assert fsm.stage == 0, "Stage should be 0 at T+0s"
    
    await asyncio.sleep(5.1)
    st_h1 = fsm.get_resolved_state()
    print("Stage 1 (T+5s) Status:", st_h1["ai_analysis"]["status"], "Oil Temp:", st_h1["telemetry"]["oil_temp_c"])
    assert fsm.stage == 1, "Stage should be 1 at T+5s"
    
    await asyncio.sleep(5.1)
    st_h2 = fsm.get_resolved_state()
    print("Stage 2 (T+10s) Status:", st_h2["ai_analysis"]["status"], "Oil Press:", st_h2["telemetry"]["oil_press_psi"])
    assert fsm.stage == 2, "Stage should be 2 at T+10s"
    
    print("\n✓ Fault State Machine Verification PASSED")
    print("--- ALL STEP 2 SIMULATION TESTS PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(test_simulation())
