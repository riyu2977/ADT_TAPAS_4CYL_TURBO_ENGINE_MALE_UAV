export const manifest = {
  screens: {
    scr_jl5ezi: { name: "Nominal Cruise", route: "/", position: { "x": 160, "y": 220 } },
    scr_1qxfot: { name: "Hot Weather Stress", route: "/", state: { "hotWeather": true }, position: { "x": 160, "y": 2200 }, width: 1312, height: 945 },
    scr_saa1gz: { name: "Live Telemetry & Acoustics", route: "/", state: { "tab": "telemetry" }, position: { "x": 1560, "y": 4180 } },
    scr_jnot90: { name: "CHT Sensor Snap", route: "/", state: { "fault": "sensor_snap" }, position: { "x": 160, "y": 4180 } },
    scr_y9u7ov: { name: "Micro-Fracture", route: "/", state: { "fault": "micro_fracture" }, position: { "x": 160, "y": 6160 } },
    scr_hlyzf3: { name: "Heat Soak T+0", route: "/", state: { "fault": "heat_soak", "stage": 0 }, position: { "x": 1560, "y": 2200 } },
    scr_tnqryy: { name: "Heat Soak T+5", route: "/", state: { "fault": "heat_soak", "stage": 1 }, position: { "x": 2960, "y": 2200 } },
    scr_wtul87: { name: "Heat Soak T+10 Critical", route: "/", state: { "fault": "heat_soak", "stage": 2 }, position: { "x": 4360, "y": 2200 } },
    scr_w6h50o: { name: "Load-Shedding Protocol", route: "/", state: { "fault": "heat_soak", "stage": 2, "modal": true }, position: { "x": 1560, "y": 6160 } },
    scr_e1doba: { name: "Comms Jammed", route: "/", state: { "jammed": true }, position: { "x": 160, "y": 8140 } }
  },
  sections: {
    sec_d2tzya: { name: "Normal Operation", x: 0, y: 0, width: 1520, height: 1180 },
    sec_614oiw: { name: "Thermal Stress Progression", x: 0, y: 1980, width: 5720, height: 1180 },
    sec_2ujybt: { name: "Sensor Monitoring", x: 0, y: 3960, width: 2920, height: 1180 },
    sec_x4t4cd: { name: "Failure & Recovery", x: 0, y: 5940, width: 2920, height: 1180 },
    sec_rbk4bf: { name: "System Failures", x: 0, y: 7920, width: 1520, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_d2tzya", children: [
    { kind: "screen", id: "scr_jl5ezi" }]
  },
  { kind: "section", id: "sec_614oiw", children: [
    { kind: "screen", id: "scr_1qxfot" },
    { kind: "screen", id: "scr_hlyzf3" },
    { kind: "screen", id: "scr_tnqryy" },
    { kind: "screen", id: "scr_wtul87" }]
  },
  { kind: "section", id: "sec_2ujybt", children: [
    { kind: "screen", id: "scr_jnot90" },
    { kind: "screen", id: "scr_saa1gz" }]
  },
  { kind: "section", id: "sec_x4t4cd", children: [
    { kind: "screen", id: "scr_y9u7ov" },
    { kind: "screen", id: "scr_w6h50o" }]
  },
  { kind: "section", id: "sec_rbk4bf", children: [
    { kind: "screen", id: "scr_e1doba" }]
  }]

};