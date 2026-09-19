import type { FaultId } from '../types/twin';

export interface CausalDriver {
  metric: string;
  influence: number; // % attribution from the SHAP surrogate
  weightHours: number; // projected RUL loss attributed to this driver
  explainer: string;
}

export interface PredictionProfile {
  confidence: number; // model confidence %
  sigmaRatio: number; // spread of the RUL posterior as a fraction of the mean
  horizon: string;
  model: string;
  drivers: CausalDriver[];
}

const nominalProfile: PredictionProfile = {
  confidence: 98.4,
  sigmaRatio: 0.018,
  horizon: 'ROLLING 50 HR WINDOW',
  model: 'LSTM-PHM + THERMODYNAMIC RESIDUAL',
  drivers: [
  {
    metric: 'Oil Fe Particulate Trend',
    influence: 25,
    weightHours: 6.4,
    explainer: 'Ferrous wear rate 0.4 ppm/hr — consistent with normal big-end bearing bedding-in.'
  },
  {
    metric: 'Vibration Harmonic RMS',
    influence: 18,
    weightHours: 4.6,
    explainer: 'Combustion harmonics steady at 85 Hz; no sideband energy above the 4 kHz floor.'
  },
  {
    metric: 'MAP vs Fuel Flow Deviation',
    influence: 12,
    weightHours: 3.1,
    explainer: 'Turbo delivering commanded boost within 0.4 inHg of the compressor map.'
  },
  {
    metric: 'Inter-Cyl CHT Balance',
    influence: 8,
    weightHours: 2.1,
    explainer: 'Max spread 2°C across cylinders — injector trim balanced.'
  }]

};

const sensorSnapProfile: PredictionProfile = {
  confidence: 94.2,
  sigmaRatio: 0.03,
  horizon: 'ROLLING 50 HR WINDOW',
  model: 'VIRTUAL SENSOR (EGT/RPM OBSERVER)',
  drivers: [
  {
    metric: 'EGT / RPM Cross-Validation',
    influence: 98,
    weightHours: 0.4,
    explainer:
    'EGT 682°C and RPM 2540 remain nominal while CHT reads 0°C — thermodynamically impossible, so the channel, not the cylinder, is faulted.'
  },
  {
    metric: 'Channel Impedance Drift',
    influence: 2,
    weightHours: 0.1,
    explainer: 'Cyl 2 thermocouple loop open-circuit; harness chafe at the firewall grommet suspected.'
  }]

};

const microFractureProfile: PredictionProfile = {
  confidence: 91.7,
  sigmaRatio: 0.16,
  horizon: 'ROLLING 12 HR WINDOW',
  model: 'FFT ENVELOPE CNN + WEAR-DEBRIS FUSION',
  drivers: [
  {
    metric: 'Acoustic Harmonic 10.4 kHz',
    influence: 78,
    weightHours: 9.4,
    explainer:
    'Structural ring-down energy at 10.4 kHz with 260 Hz sidebands — classic incipient con-rod big-end micro-fracture signature.'
  },
  {
    metric: 'Metal Particulate Rise',
    influence: 22,
    weightHours: 2.6,
    explainer: 'Fe debris climbed 12 → 44 ppm in 40 min while every thermal channel stayed nominal.'
  }]

};

const heatSoakProfiles: PredictionProfile[] = [
{
  confidence: 96.1,
  sigmaRatio: 0.12,
  horizon: 'IMMEDIATE · T+0s',
  model: 'THERMAL LUMPED-MASS TWIN',
  drivers: [
  {
    metric: 'CHT Rise Rate',
    influence: 82,
    weightHours: 2.4,
    explainer: 'All four heads rising 9°C/min — coolant circulation loss, not a single-cylinder event.'
  },
  {
    metric: 'Coolant ΔT Collapse',
    influence: 18,
    weightHours: 0.6,
    explainer: 'Radiator in/out delta fell below 3°C: no mass flow through the core.'
  }]

},
{
  confidence: 97.3,
  sigmaRatio: 0.1,
  horizon: 'IMMEDIATE · T+5s',
  model: 'THERMAL LUMPED-MASS TWIN',
  drivers: [
  {
    metric: 'Oil Temp Gradient',
    influence: 58,
    weightHours: 0.9,
    explainer: 'Block heat conducting into the lubrication circuit with a 5 s lag — thermal inertia confirmed.'
  },
  {
    metric: 'CHT Variance',
    influence: 42,
    weightHours: 0.6,
    explainer: 'Cyl 4 running 7°C hotter than Cyl 1 — rear of the block losing cooling first.'
  }]

},
{
  confidence: 99.1,
  sigmaRatio: 0.09,
  horizon: 'IMMEDIATE · T+10s',
  model: 'THERMAL LUMPED-MASS TWIN',
  drivers: [
  {
    metric: 'CHT Variance',
    influence: 65,
    weightHours: 0.3,
    explainer: 'Sustained 230°C+ head temperature — piston crown and ring-land margin exhausted.'
  },
  {
    metric: 'Oil Press Drop',
    influence: 35,
    weightHours: 0.15,
    explainer: 'Viscosity breakdown at 140°C dropped gallery pressure to 35 PSI: bearing film at risk.'
  }]

}];


export function predictionProfile(fault: FaultId, stage: number): PredictionProfile {
  if (fault === 'heat_soak') return heatSoakProfiles[Math.min(stage, heatSoakProfiles.length - 1)];
  if (fault === 'sensor_snap') return sensorSnapProfile;
  if (fault === 'micro_fracture') return microFractureProfile;
  return nominalProfile;
}