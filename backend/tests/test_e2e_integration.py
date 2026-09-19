"""
End-to-End System Integration Test Suite for ATDT (SIH26054)
Tests all 5 core demonstration scenarios between GCS REST/WebSocket commands and FastAPI simulation engine.
"""
import sys
import os
import json
import asyncio
import urllib.request
import websockets

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def post_json(url: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

async def run_e2e_verification():
    ws_url = "ws://localhost:8000/ws/telemetry"
    rest_url = "http://localhost:8000/api"

    print("==========================================================================")
    print("  ATDT (SIH26054) END-TO-END SYSTEM INTEGRATION VERIFICATION SUITE")
    print("==========================================================================")

    # 1. Health check
    req = urllib.request.urlopen(f"{rest_url}/health")
    health = json.loads(req.read().decode("utf-8"))
    assert health["status"] == "ok"
    print("\n✓ 1. Backend Server Health Check: OK")

    # Connect GCS WebSocket Client
    async with websockets.connect(ws_url) as ws:
        print("✓ GCS WebSocket Client Connected to /ws/telemetry")

        # --- SCENARIO 1: NOMINAL CRUISE LOITER ---
        print("\n--- SCENARIO 1: NOMINAL CRUISE LOITER ---")
        post_json(f"{rest_url}/reset", {})
        frame1 = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        print(f"  Telemetry: RPM={frame1['telemetry']['rpm']}, CHT={frame1['telemetry']['cht_C']}, Oil Press={frame1['telemetry']['oil_press_psi']} PSI")
        print(f"  AI Status: {frame1['ai_analysis']['status']} | RUL: {frame1['ai_analysis']['rul_hours']} hours | Mode: {frame1['network']['mode']}")
        assert frame1["ai_analysis"]["status"] == "NOMINAL"
        assert abs(frame1["ai_analysis"]["rul_hours"] - 1500.0) < 15.0
        print("✓ SCENARIO 1 VERIFICATION PASSED (Nominal RUL ≈ 1500h)")

        # --- SCENARIO 2: CHT SENSOR SNAP (ANTI-SPOOFING & VIRTUAL OBSERVER) ---
        print("\n--- SCENARIO 2: CHT SENSOR SNAP (VIRTUAL OBSERVER) ---")
        post_json(f"{rest_url}/fault", {"fault": "sensor_snap"})
        frame2 = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        print(f"  Telemetry: CHT={frame2['telemetry']['cht_C']} (Cyl 2 Isolated)")
        print(f"  AI Status: {frame2['ai_analysis']['status']} | RUL: {frame2['ai_analysis']['rul_hours']} hours")
        print(f"  Advisory: {frame2['ai_analysis']['advisory']}")
        assert frame2["telemetry"]["cht_C"][1] == 0, "Cyl 2 CHT must be 0"
        assert frame2["cylinder_health"][1]["isolated"] == True, "Cyl 2 must be flagged ISO"
        assert abs(frame2["ai_analysis"]["rul_hours"] - 1499.0) < 15.0
        print("✓ SCENARIO 2 VERIFICATION PASSED (Virtual Sensor Fallback Active, RUL ≈ 1499h)")

        # --- SCENARIO 3: MICRO-FRACTURE (ACOUSTIC VIBRATION HARMONIC) ---
        print("\n--- SCENARIO 3: MICRO-FRACTURE (ACOUSTIC SPECTRUM) ---")
        post_json(f"{rest_url}/fault", {"fault": "micro_fracture"})
        frame3 = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        peak_bin = [b for b in frame3["fft"] if b["hz"] == 10400][0]
        print(f"  Telemetry: Vibration={frame3['telemetry']['vibration_hz']} Hz | Fe Particulates={frame3['telemetry']['metal_particulate_ppm']} ppm")
        print(f"  FFT Peak @ 10.4 kHz: {peak_bin['amp']} dB | RUL: {frame3['ai_analysis']['rul_hours']} hours")
        assert frame3["telemetry"]["vibration_hz"] == 10400.0
        assert peak_bin["amp"] >= 80.0
        assert abs(frame3["ai_analysis"]["rul_hours"] - 12.0) < 0.5
        print("✓ SCENARIO 3 VERIFICATION PASSED (Peak @ 10.4 kHz, RUL = 12.0h)")

        # --- SCENARIO 4: COOLING FAILURE & HEAT SOAK CASCADE ---
        print("\n--- SCENARIO 4: COOLING FAILURE / HEAT SOAK CASCADE ---")
        post_json(f"{rest_url}/fault", {"fault": "heat_soak"})
        
        # Stage 0 (T+0s)
        frame4_s0 = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        print(f"  T+0s (Stage 0): CHT={frame4_s0['telemetry']['cht_C']} | Status: {frame4_s0['ai_analysis']['status']} | RUL: {frame4_s0['ai_analysis']['rul_hours']}h")
        assert frame4_s0["ai_analysis"]["status"] == "CAUTION: CHT EXCEEDANCE"

        # Wait 11.5s for heat soak thermal cascade progression to Stage 2
        print("  Waiting 11.5s for heat soak thermal cascade progression to Stage 2...")
        await asyncio.sleep(11.5)

        # Drain any buffered frames and get latest
        frame4_s2 = None
        while True:
            try:
                frame4_s2 = json.loads(await asyncio.wait_for(ws.recv(), timeout=0.5))
            except asyncio.TimeoutError:
                break

        print(f"  T+10s (Stage 2): CHT={frame4_s2['telemetry']['cht_C']} | Oil Press={frame4_s2['telemetry']['oil_press_psi']} PSI | Oil Temp={frame4_s2['telemetry']['oil_temp_c']}°C")
        print(f"  AI Status: {frame4_s2['ai_analysis']['status']} | RUL: {frame4_s2['ai_analysis']['rul_hours']} hours ({frame4_s2['rul_posterior']['mean']} min)")
        assert frame4_s2["ai_analysis"]["severity"] == "CRITICAL"
        assert abs(frame4_s2["ai_analysis"]["rul_hours"] - 0.4) < 0.05, "Stage 2 RUL should be 0.4h (24 min)"

        # Test Tactical Load-Shedding Relief
        print("  Testing Tactical Load-Shedding (+5 min per payload shed)...")
        post_json(f"{rest_url}/load-shedding", {"sar": True, "eoir": True})
        frame4_shed = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        print(f"  Post-Load-Shedding RUL: {frame4_shed['ai_analysis']['rul_hours']} hours")
        assert abs(frame4_shed["ai_analysis"]["rul_hours"] - (0.4 + 10/60)) < 0.05
        print("✓ SCENARIO 4 VERIFICATION PASSED (Thermal Cascade Critical RUL = 0.4h / 24 min + Load-Shed Relief)")

        # --- SCENARIO 5: COMMS JAMMING & CONTINUOUS EDGE BUFFER ---
        print("\n--- SCENARIO 5: COMMS JAMMING & CONTINUOUS EDGE BUFFER ---")
        post_json(f"{rest_url}/jamming", {"jammed": True})
        print("  Triggered SATCOM Link Loss: LINK LOST")
        
        # Verify stream is suppressed on WebSocket while backend keeps running
        try:
            await asyncio.wait_for(ws.recv(), timeout=2.5)
            assert False, "WebSocket stream should be paused during link loss"
        except asyncio.TimeoutError:
            print("  ✓ GCS WebSocket live stream correctly paused during LINK LOST")

        # Verify edge buffer accumulated frames in background
        req_h = urllib.request.urlopen(f"{rest_url}/health")
        h_info = json.loads(req_h.read().decode("utf-8"))
        print(f"  Edge Buffer Status: {h_info['buffered_seconds']}s frames accumulated in background")
        assert h_info["buffered_seconds"] >= 2

        # Restore link & reconcile frames
        res_restore = post_json(f"{rest_url}/jamming", {"jammed": False})
        print(f"  Link Restored: Reconciled {res_restore['reconciled_seconds']}s of edge telemetry frames")
        assert res_restore["reconciled_seconds"] >= 2

        frame5_resumed = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        print(f"  Resumed Stream Frame: Timestamp={frame5_resumed['timestamp']} | Status={frame5_resumed['ai_analysis']['status']}")
        assert frame5_resumed["jammed"] == False
        print("✓ SCENARIO 5 VERIFICATION PASSED (Continuous Edge Simulation & Reconciled Backfill)")

        # Clean up: Reset to nominal
        post_json(f"{rest_url}/reset", {})

    print("\n==========================================================================")
    print("  ALL 5 CORE ATDT SCENARIOS PASSED 100% END-TO-END VERIFICATION!")
    print("==========================================================================")

if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
