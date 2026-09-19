"""
Verification Test Script for Step 3 (Analytics & Calibrated RUL Engine)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.simulation.dsp import compute_fft_spectrum
from app.analytics.sensor_validator import evaluate_cylinder_health, get_isolated_cht_indices
from app.analytics.rul_engine import compute_calibrated_rul, calculate_rul_posterior
from app.analytics.xai_engine import compute_xai_attribution
from app.analytics.advisory import generate_tactical_advisory

def test_analytics():
    print("--- 1. Testing FFT Vibration Signal Processing ---")
    fft_nom = compute_fft_spectrum("nominal")
    fft_mf = compute_fft_spectrum("micro_fracture")
    
    assert len(fft_nom) == 16, "FFT spectrum must have 16 frequency bins"
    peak_mf = [b for b in fft_mf if b["hz"] == 10400][0]
    assert peak_mf["amp"] >= 85.0, "10.4 kHz bin must spike >= 85 dB under micro-fracture"
    print(f"✓ FFT Spectrum Verification PASSED (Peak @ 10.4 kHz: {peak_mf['amp']} dB)")

    print("\n--- 2. Testing Virtual Sensor Fallback Observer ---")
    telem_snap = {
        "cht_C": [175, 0, 174, 175],
        "egt_C": [680, 682, 679, 681]
    }
    cyl_health = evaluate_cylinder_health(telem_snap, "sensor_snap", 0)
    assert cyl_health[1]["isolated"] == True, "Cylinder 2 must be isolated"
    assert cyl_health[1]["cht"] == 0, "Cylinder 2 CHT should be 0"
    print("✓ Virtual Sensor Isolation PASSED (Cyl 2 Isolated: ISO)")

    print("\n--- 3. Testing RUL Deterministic Calibration Benchmarks ---")
    telem_nom = {"cht_C": [175, 176, 174, 175], "oil_press_psi": 55.0, "oil_temp_c": 102.0, "vibration_hz": 85.0, "metal_particulate_ppm": 12.0}
    telem_snap_bg = {"cht_C": [175, 0, 174, 175], "oil_press_psi": 55.0, "oil_temp_c": 102.0, "vibration_hz": 85.0, "metal_particulate_ppm": 12.0}
    telem_mf = {"cht_C": [175, 176, 175, 176], "oil_press_psi": 54.0, "oil_temp_c": 103.0, "vibration_hz": 10400.0, "metal_particulate_ppm": 44.0}
    telem_hs_crit = {"cht_C": [230, 235, 232, 238], "oil_press_psi": 35.0, "oil_temp_c": 140.0, "vibration_hz": 90.0, "metal_particulate_ppm": 15.0}

    rul_nom = compute_calibrated_rul(telem_nom, "nominal", 0)
    rul_snap = compute_calibrated_rul(telem_snap_bg, "sensor_snap", 0)
    rul_mf = compute_calibrated_rul(telem_mf, "micro_fracture", 0)
    rul_hs_crit = compute_calibrated_rul(telem_hs_crit, "heat_soak", 2)
    rul_hs_shed = compute_calibrated_rul(telem_hs_crit, "heat_soak", 2, shed_sar=True, shed_eoir=True)

    print(f"Nominal RUL Output: {rul_nom} h (Target ≈ 1500h)")
    print(f"Sensor Snap RUL Output: {rul_snap} h (Target ≈ 1499h)")
    print(f"Micro-Fracture RUL Output: {rul_mf} h (Target = 12.0h)")
    print(f"Cooling Failure Final Stage RUL Output: {rul_hs_crit} h (Target = 0.4h / 24 min)")
    print(f"Cooling Failure + Load-Shedding RUL Output: {rul_hs_shed} h (Target = 0.5667h / 34 min)")

    assert abs(rul_nom - 1500.0) < 5.0, "Nominal RUL should be approx 1500h"
    assert abs(rul_snap - 1499.0) < 5.0, "Sensor Snap RUL should be approx 1499h"
    assert abs(rul_mf - 12.0) < 0.5, "Micro-fracture RUL should be 12.0h"
    assert abs(rul_hs_crit - 0.4) < 0.05, "Cooling failure final stage RUL should be 0.4h"
    assert abs(rul_hs_shed - (0.4 + 10/60)) < 0.05, "Load shedding should add +10 min RUL"
    print("✓ RUL Calibration Verification PASSED")

    print("\n--- 4. Testing Gaussian RUL Posterior Distribution ---")
    post_nom = calculate_rul_posterior(rul_nom, "nominal", 0)
    post_hs = calculate_rul_posterior(rul_hs_crit, "heat_soak", 2)

    assert post_nom["unit"] == "HR", "Nominal RUL unit should be HR"
    assert post_hs["unit"] == "MIN", "Critical RUL unit (< 6h) should be MIN"
    assert len(post_nom["points"]) == 29, "Posterior distribution should contain 29 points"
    print(f"✓ Gaussian Posterior PASSED (Nominal: {post_nom['mean']} {post_nom['unit']}, Critical: {post_hs['mean']} {post_hs['unit']})")

    print("\n--- 5. Testing Physics Residual SHAP Surrogate ---")
    xai = compute_xai_attribution(telem_hs_crit, "heat_soak", 2)
    assert len(xai) > 0, "XAI must return causal drivers"
    print(f"✓ Physics Residual SHAP Surrogate PASSED (Primary driver: {xai[0]['metric']} {xai[0]['influence']}%)")

    print("\n--- ALL STEP 3 ANALYTICS TESTS PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_analytics()
