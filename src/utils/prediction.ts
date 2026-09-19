import { predictionProfile } from '../data/predictionModel';
import { chtSeverity, isolatedChtIndices } from './twinEngine';
import type { FaultId, Severity, Telemetry } from '../types/twin';

export interface DistributionPoint {
  x: number;
  pdf: number;
  bar: number;
}

export interface RulPosterior {
  unit: 'HR' | 'MIN';
  mean: number;
  ciLow: number;
  ciHigh: number;
  confidence: number;
  points: DistributionPoint[];
}

/** Gaussian posterior over remaining useful life, rendered as a histogram + density curve. */
export function rulPosterior(rulHours: number, fault: FaultId, stage: number): RulPosterior {
  const { confidence, sigmaRatio } = predictionProfile(fault, stage);
  const unit: 'HR' | 'MIN' = rulHours < 6 ? 'MIN' : 'HR';
  const mean = unit === 'MIN' ? rulHours * 60 : rulHours;
  const sigma = Math.max(mean * sigmaRatio, mean * 0.01, 0.5);
  const lo = mean - 4 * sigma;
  const hi = mean + 4 * sigma;
  const steps = 28;
  const points: DistributionPoint[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const x = lo + (hi - lo) * i / steps;
    const z = (x - mean) / sigma;
    const pdf = Math.exp(-0.5 * z * z);
    points.push({
      x: +x.toFixed(mean > 100 ? 0 : 1),
      pdf: +pdf.toFixed(4),
      bar: +Math.max(0, pdf * (0.86 + Math.random() * 0.2)).toFixed(4)
    });
  }

  return {
    unit,
    mean,
    ciLow: +(mean - 1.96 * sigma).toFixed(mean > 100 ? 0 : 1),
    ciHigh: +(mean + 1.96 * sigma).toFixed(mean > 100 ? 0 : 1),
    confidence,
    points
  };
}

export interface CylinderHealth {
  index: number;
  cht: number;
  egt: number;
  isolated: boolean;
  severity: Severity;
  trendPerHour: number;
  remainingCycles: number;
  anomalyScore: number;
  note: string;
}

const BASE_CYCLES = 18200;

/** Per-cylinder predictive health used by the interactive engine callouts. */
export function cylinderHealth(
telemetry: Telemetry,
fault: FaultId,
stage: number)
: CylinderHealth[] {
  const isolated = isolatedChtIndices(telemetry.cht_C);

  return telemetry.cht_C.map((cht, i) => {
    const iso = isolated.includes(i);
    const severity = iso ? 'WARNING' : chtSeverity(cht);
    let trendPerHour = 0.2;
    let remainingCycles = BASE_CYCLES - i * 120;
    let anomalyScore = 0.1 + i * 0.05;
    let note = 'Wear trajectory on-track.';

    if (fault === 'heat_soak') {
      trendPerHour = [48, 96, 130][Math.min(stage, 2)];
      remainingCycles = Math.round([4200, 1450, 320][Math.min(stage, 2)] - i * 40);
      anomalyScore = [6.2, 7.9, 9.4][Math.min(stage, 2)] + i * 0.1;
      note = 'Head temperature outside certified envelope.';
    }

    if (fault === 'micro_fracture' && i === 2) {
      trendPerHour = 0.4;
      remainingCycles = 640;
      anomalyScore = 7.8;
      note = 'Big-end ring-down at 10.4 kHz. Thermals still nominal.';
    }

    if (iso) {
      trendPerHour = 0;
      anomalyScore = 0;
      note = 'CHT channel isolated. Health inferred from EGT/RPM observer.';
    }

    return {
      index: i,
      cht,
      egt: telemetry.egt_C[i],
      isolated: iso,
      severity,
      trendPerHour,
      remainingCycles,
      anomalyScore: +anomalyScore.toFixed(1),
      note
    };
  });
}