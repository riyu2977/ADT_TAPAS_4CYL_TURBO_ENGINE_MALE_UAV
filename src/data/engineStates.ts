import type { EngineState } from '../types/twin';

/**
 * TAPAS-BH-201 / Archer-NG — 2.2L 4-Cylinder Inline Turbocharged CRDi (Jet-A1)
 * Baseline thermodynamic envelope @ 15,000 ft loiter.
 */
export const limits = {
  rpm: { min: 2400, max: 2800 },
  map_inHg: { min: 32, max: 35 },
  cht_C: { min: 160, max: 180, caution: 195, critical: 215 },
  egt_C: { min: 650, max: 720, caution: 740, critical: 780 },
  oil_press_psi: { min: 50, max: 60, caution: 45, critical: 38 },
  oil_temp_c: { min: 95, max: 110, caution: 120, critical: 132 },
  particulate_ppm: { nominal: 12, caution: 25, critical: 40 }
};

export const engineStates: Record<string, EngineState> = {
  // 1. BASELINE: TAPAS-BH-201 loitering at 15,000 ft
  nominal: {
    telemetry: {
      rpm: 2540,
      map_inHg: 33.2,
      cht_C: [175, 176, 174, 175],
      egt_C: [680, 682, 679, 681],
      oil_press_psi: 55,
      oil_temp_c: 102,
      vibration_hz: 85,
      metal_particulate_ppm: 12
    },
    network: { mode: 'HEARTBEAT', bandwidth_kbps: 0.5 },
    ai_analysis: {
      status: 'NOMINAL',
      severity: 'NOMINAL',
      rul_hours: 1500,
      advisory: 'Proceed with mission parameters.',
      xai_contributors: null
    }
  },

  // 2. FAULT: Heat Soak Cascade — terminal stage (cooling system failure)
  heat_soak: {
    telemetry: {
      rpm: 2400,
      map_inHg: 33.2,
      cht_C: [230, 235, 232, 238],
      egt_C: [750, 760, 755, 765],
      oil_press_psi: 35,
      oil_temp_c: 140,
      vibration_hz: 90,
      metal_particulate_ppm: 15
    },
    network: { mode: 'DIAGNOSTIC BURST', bandwidth_kbps: 15.2 },
    ai_analysis: {
      status: 'CRITICAL: THERMAL CASCADE',
      severity: 'CRITICAL',
      rul_hours: 0.4,
      advisory:
      'ACTION REQUIRED: Execute Tactical Load-Shedding. Reduce throttle to 40% and abort to Waypoint Alpha.',
      xai_contributors: [
      { metric: 'CHT Variance', weight: '65%' },
      { metric: 'Oil Press Drop', weight: '35%' }]

    }
  },

  // 3. FAULT: Thermodynamic Anti-Spoofing (broken CHT sensor, Cyl 2)
  sensor_snap: {
    telemetry: {
      rpm: 2540,
      map_inHg: 33.2,
      cht_C: [175, 0, 174, 175],
      egt_C: [680, 682, 679, 681],
      oil_press_psi: 55,
      oil_temp_c: 102,
      vibration_hz: 85,
      metal_particulate_ppm: 12
    },
    network: { mode: 'HEARTBEAT', bandwidth_kbps: 0.6 },
    ai_analysis: {
      status: 'WARNING: SENSOR ISOLATED',
      severity: 'WARNING',
      rul_hours: 1499,
      advisory:
      'Virtual Sensor Fallback initiated. CHT sensor (Cyl 2) isolated. Engine health verified via EGT/RPM cross-validation — disregard Cyl 2 CHT.',
      xai_contributors: [{ metric: 'EGT/RPM Cross-Validation', weight: '98%' }]
    }
  },

  // 4. FAULT: Micro-Fracture — predictive acoustics, thermals fully nominal
  micro_fracture: {
    telemetry: {
      rpm: 2540,
      map_inHg: 33.2,
      cht_C: [175, 176, 175, 176],
      egt_C: [681, 680, 682, 679],
      oil_press_psi: 54,
      oil_temp_c: 103,
      vibration_hz: 10400,
      metal_particulate_ppm: 44
    },
    network: { mode: 'DIAGNOSTIC BURST', bandwidth_kbps: 15.0 },
    ai_analysis: {
      status: 'WARNING: MICRO-FRACTURE SIGNATURE',
      severity: 'WARNING',
      rul_hours: 12,
      advisory:
      'Abnormal high-frequency acoustic harmonic detected (10.4 kHz, Cyl 3 con-rod big-end). Thermal indicators still nominal. RUL adjusted to 12 hours — schedule teardown inspection at recovery.',
      xai_contributors: [
      { metric: 'Acoustic Harmonic 10.4 kHz', weight: '78%' },
      { metric: 'Metal Particulate Rise', weight: '22%' }]

    }
  }
};

/** Heat-soak cascade stages — proves heat transfer is not instantaneous. */
export const heatSoakStages: EngineState[] = [
// T+0s — CHT spikes first
{
  telemetry: {
    rpm: 2460,
    map_inHg: 33.2,
    cht_C: [218, 221, 220, 224],
    egt_C: [738, 744, 741, 748],
    oil_press_psi: 54,
    oil_temp_c: 105,
    vibration_hz: 88,
    metal_particulate_ppm: 13
  },
  network: { mode: 'DIAGNOSTIC BURST', bandwidth_kbps: 15.0 },
  ai_analysis: {
    status: 'CAUTION: CHT EXCEEDANCE',
    severity: 'WARNING',
    rul_hours: 3,
    advisory:
    'Coolant circulation loss suspected. CHT exceedance on all cylinders; oil circuit still within limits. Monitoring thermal inertia propagation.',
    xai_contributors: [
    { metric: 'CHT Rise Rate', weight: '82%' },
    { metric: 'Coolant ΔT Collapse', weight: '18%' }]

  }
},
// T+5s — heat transfers into the oil
{
  telemetry: {
    rpm: 2430,
    map_inHg: 33.2,
    cht_C: [226, 230, 228, 233],
    egt_C: [745, 752, 748, 757],
    oil_press_psi: 47,
    oil_temp_c: 130,
    vibration_hz: 89,
    metal_particulate_ppm: 14
  },
  network: { mode: 'DIAGNOSTIC BURST', bandwidth_kbps: 15.1 },
  ai_analysis: {
    status: 'WARNING: HEAT SOAK PROPAGATION',
    severity: 'WARNING',
    rul_hours: 1.2,
    advisory:
    'Block heat now soaking into lubrication circuit. Oil temp 130°C — viscosity margin eroding. Prepare for load-shedding.',
    xai_contributors: [
    { metric: 'Oil Temp Gradient', weight: '58%' },
    { metric: 'CHT Variance', weight: '42%' }]

  }
},
// T+10s — viscosity breakdown, pressure collapse
engineStates.heat_soak];