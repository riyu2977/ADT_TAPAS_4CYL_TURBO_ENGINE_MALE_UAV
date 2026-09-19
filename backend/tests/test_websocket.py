"""
Verification Test Script for Step 4 (WebSocket Stream & Continuous Edge Buffer)
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

async def test_websocket_stream():
    ws_url = "ws://localhost:8000/ws/telemetry"
    rest_url = "http://localhost:8000/api"

    print("--- 1. Testing WebSocket Telemetry Stream Connection ---")
    async with websockets.connect(ws_url) as ws:
        # 1. Receive initial frame
        msg1 = await asyncio.wait_for(ws.recv(), timeout=3.0)
        data1 = json.loads(msg1)
        print("✓ Frame 1 Received:", data1["timestamp"], "RPM:", data1["telemetry"]["rpm"], "RUL:", data1["ai_analysis"]["rul_hours"])
        assert data1["ai_analysis"]["status"] == "NOMINAL"
        assert "telemetry" in data1 and "fft" in data1 and "rul_posterior" in data1

        # 2. Test Fault Injection via REST API
        print("\n--- 2. Testing REST Fault Injection Payload ---")
        res_fault = post_json(f"{rest_url}/fault", {"fault": "micro_fracture"})
        print("REST Response:", res_fault)
        assert res_fault["status"] == "success"

        # Receive frame after fault injection
        msg2 = await asyncio.wait_for(ws.recv(), timeout=3.0)
        data2 = json.loads(msg2)
        print("✓ Post-Fault Frame Received:", data2["ai_analysis"]["status"], "Peak Vib Hz:", data2["telemetry"]["vibration_hz"])
        assert data2["telemetry"]["vibration_hz"] == 10400.0, "Vibration should spike to 10.4 kHz"
        assert abs(data2["ai_analysis"]["rul_hours"] - 12.0) < 0.5, "RUL should adjust to 12.0h"

        # 3. Test Continuous Edge Simulation during Comms Jamming
        print("\n--- 3. Testing Comms Jamming & Continuous Edge Buffer ---")
        res_jam = post_json(f"{rest_url}/jamming", {"jammed": True})
        print("REST Jamming Response:", res_jam)
        assert res_jam["jammed"] == True

        # Wait 3 seconds while jammed: verify no new frames delivered to GCS WebSocket
        try:
            await asyncio.wait_for(ws.recv(), timeout=2.5)
            assert False, "WebSocket should NOT receive frames while LINK LOST"
        except asyncio.TimeoutError:
            print("✓ Live WebSocket stream correctly paused during LINK LOST")

        # Verify background simulation loop kept accumulating frames in edge buffer
        req_health = urllib.request.urlopen(f"{rest_url}/health")
        health_data = json.loads(req_health.read().decode("utf-8"))
        print("Health status during link loss:", health_data)
        assert health_data["jammed"] == True
        assert health_data["buffered_seconds"] >= 2, "Edge buffer should have accumulated frames"
        print(f"✓ Background Edge Buffer active: {health_data['buffered_seconds']}s frames accumulated")

        # 4. Test Link Restoration & Buffer Reconciliation
        print("\n--- 4. Testing Link Restoration & Buffer Reconciliation ---")
        res_restore = post_json(f"{rest_url}/jamming", {"jammed": False})
        print("REST Restore Response:", res_restore)
        assert res_restore["jammed"] == False
        assert res_restore["reconciled_seconds"] >= 2, "Should return reconciled edge buffer payload"
        print(f"✓ Link Restored: Reconciled {res_restore['reconciled_seconds']}s of edge telemetry")

        # Receive resumed stream frame
        msg3 = await asyncio.wait_for(ws.recv(), timeout=3.0)
        data3 = json.loads(msg3)
        print("✓ Resumed Frame Received:", data3["timestamp"], "Status:", data3["ai_analysis"]["status"])
        assert data3["jammed"] == False

        # 5. System Reset
        post_json(f"{rest_url}/reset", {})
        print("\n✓ System Re-baselined to Nominal Loiter")

    print("\n--- ALL STEP 4 WEBSOCKET & EDGE BUFFER TESTS PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(test_websocket_stream())
