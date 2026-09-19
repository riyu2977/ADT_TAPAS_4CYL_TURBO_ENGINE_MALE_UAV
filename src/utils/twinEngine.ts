import { engineStates, heatSoakStages, limits } from '../data/engineStates';
import type { EngineState, EnvState, FaultId, FftBin, Severity } from '../types/twin';

const clone = (s: EngineState): EngineState => ({
  telemetry: { ...s.telemetry, cht_C: [...s.telemetry.cht_C], egt_C: [...s.telemetry.egt_C] },
  network: { ...s.network },
  ai_analysis: {
    ...s.ai_analysis,
    xai_contributors: s.ai_analysis.xai_contributors ?
    s.ai_analysis.xai_contributors.map((c) => ({ ...c })) :
    null
  }
});

/** Sensor channels reading a hard zero are treated as electrically isolated, not as real physics. */
export const isolatedChtIndices = (cht: number[]): number[] =>
cht.map((v, i) => v === 0 ? i : -1).filter((i) => i >= 0);

/** Resolve the commanded engine state, then apply meteorological stress. */
export function buildState(fault: FaultId, stage: number, env: EnvState): EngineState {
  const s =
  fault === 'heat_soak' ?
  clone(heatSoakStages[Math.min(stage, heatSoakStages.length - 1)]) :
  clone(engineStates[fault]);

  const t = s.telemetry;

  if (env.highAltitude) {
    // Thinner air: reduced charge density, turbo works harder, less convective cooling
    t.map_inHg = +(t.map_inHg - 1.1).toFixed(1);
    t.egt_C = t.egt_C.map((v) => v + 14);
    t.cht_C = t.cht_C.map((v) => v === 0 ? 0 : v + 3);
    t.oil_press_psi = +(t.oil_press_psi - 1.5).toFixed(1);
  } else {
    t.map_inHg = +(t.map_inHg + 1.4).toFixed(1);
    t.rpm = t.rpm + 40;
  }

  if (env.hotWeather) {
    // ISA +45°C ambient: cooling delta collapses
    t.cht_C = t.cht_C.map((v) => v === 0 ? 0 : v + 13);
    t.egt_C = t.egt_C.map((v) => v + 12);
    t.oil_temp_c = +(t.oil_temp_c + 9).toFixed(1);
    t.oil_press_psi = +(t.oil_press_psi - 2).toFixed(1);
  }

  return s;
}

export const jitter = (v: number, amt: number, dp = 1): number =>
v === 0 ? 0 : +(v + (Math.random() - 0.5) * amt).toFixed(dp);

export function applyJitter(state: EngineState): EngineState {
  const s = clone(state);
  const t = s.telemetry;
  t.rpm = Math.round(jitter(t.rpm, 26, 0));
  t.map_inHg = jitter(t.map_inHg, 0.5);
  t.cht_C = t.cht_C.map((v) => jitter(v, 2.4));
  t.egt_C = t.egt_C.map((v) => jitter(v, 7));
  t.oil_press_psi = jitter(t.oil_press_psi, 1.2);
  t.oil_temp_c = jitter(t.oil_temp_c, 1.2);
  t.metal_particulate_ppm = jitter(t.metal_particulate_ppm, 1.6);
  return s;
}

export const avg = (arr: number[]): number => {
  const valid = arr.filter((v) => v > 0);
  if (!valid.length) return 0;
  return +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
};

export function chtSeverity(v: number): Severity {
  if (v >= limits.cht_C.critical) return 'CRITICAL';
  if (v >= limits.cht_C.caution) return 'WARNING';
  return 'NOMINAL';
}

const FFT_BINS: {freq: string;hz: number;}[] = [
{ freq: '50', hz: 50 },
{ freq: '100', hz: 100 },
{ freq: '150', hz: 150 },
{ freq: '300', hz: 300 },
{ freq: '600', hz: 600 },
{ freq: '1.2k', hz: 1200 },
{ freq: '2k', hz: 2000 },
{ freq: '3k', hz: 3000 },
{ freq: '4.5k', hz: 4500 },
{ freq: '6k', hz: 6000 },
{ freq: '7.5k', hz: 7500 },
{ freq: '9k', hz: 9000 },
{ freq: '10.4k', hz: 10400 },
{ freq: '12k', hz: 12000 },
{ freq: '14k', hz: 14000 },
{ freq: '16k', hz: 16000 }];


/** Micro-vibration FFT profile. Combustion harmonics live at 50–150 Hz; structural cracks ring near 10 kHz. */
export function computeFft(fault: FaultId, frozen: boolean): FftBin[] {
  return FFT_BINS.map(({ freq, hz }) => {
    let amp: number;
    if (hz <= 150) amp = 34 + Math.random() * 10;else
    if (hz <= 2000) amp = 16 + Math.random() * 8;else
    amp = 6 + Math.random() * 6;

    if (fault === 'micro_fracture' && hz === 10400) amp = 88 + Math.random() * 9;
    if (fault === 'micro_fracture' && hz === 9000) amp = 31 + Math.random() * 8;
    if (fault === 'micro_fracture' && hz === 12000) amp = 27 + Math.random() * 8;
    if (fault === 'heat_soak' && hz <= 150) amp += 9;

    return { freq, hz, amp: frozen ? 0 : +amp.toFixed(1) };
  });
}

export function formatRul(hours: number): string {
  if (hours >= 100) return `${Math.round(hours)}:00`;
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}