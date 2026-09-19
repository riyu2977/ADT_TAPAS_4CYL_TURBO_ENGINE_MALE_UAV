export type FaultId = 'nominal' | 'sensor_snap' | 'heat_soak' | 'micro_fracture';

export interface Telemetry {
  rpm: number;
  map_inHg: number;
  cht_C: number[];
  egt_C: number[];
  oil_press_psi: number;
  oil_temp_c: number;
  vibration_hz: number;
  metal_particulate_ppm: number;
}

export interface NetworkState {
  mode: 'HEARTBEAT' | 'DIAGNOSTIC BURST' | 'LINK LOST';
  bandwidth_kbps: number;
}

export interface XaiContributor {
  metric: string;
  weight: string;
}

export type Severity = 'NOMINAL' | 'WARNING' | 'CRITICAL';

export interface AiAnalysis {
  status: string;
  severity: Severity;
  rul_hours: number;
  advisory: string;
  xai_contributors: XaiContributor[] | null;
}

export interface EngineState {
  telemetry: Telemetry;
  network: NetworkState;
  ai_analysis: AiAnalysis;
}

export interface EnvState {
  highAltitude: boolean;
  hotWeather: boolean;
}

export interface TelemetrySample {
  t: number;
  chtAvg: number;
  egtAvg: number;
  oilPress: number;
  map: number;
  oilTemp: number;
  recovered: boolean;
}

export interface FftBin {
  freq: string;
  hz: number;
  amp: number;
}

export type LogLevel = 'info' | 'warn' | 'crit';

export interface LogEntry {
  id: number;
  stamp: string;
  level: LogLevel;
  text: string;
}