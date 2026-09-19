import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { predictionProfile } from '../data/predictionModel';
import type { FaultId } from '../types/twin';

interface CausalDriversProps {
  fault: FaultId;
  stage: number;
  frozen: boolean;
}

export function CausalDrivers({ fault, stage, frozen }: CausalDriversProps) {
  const { drivers } = predictionProfile(fault, stage);
  const color = frozen ? '#6B7280' : fault === 'nominal' ? '#00FF00' : fault === 'heat_soak' ? '#FF0000' : '#FFBF00';

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-[#2A2A2A] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-3 py-2">
        <h3 className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-neutral-400">
          <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
          XAI · PREDICTIVE CAUSAL DRIVERS (SHAP)
        </h3>
        <span className="font-mono text-[9px] tracking-widest text-neutral-600">
          {drivers.length} FEATURES ABOVE THRESHOLD
        </span>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-[#1F1F1F] overflow-y-auto">
        {drivers.map((d) => {
          const segments = Math.max(1, Math.round(d.influence / 8));
          return (
            <li key={d.metric} className="flex items-start gap-3 px-3 py-2">
              <span
                className="mt-0.5 flex h-4 w-[70px] shrink-0 items-center gap-[2px] border px-[3px]"
                style={{ borderColor: `${color}66` }}
                aria-hidden="true">
                
                {Array.from({ length: 12 }).map((_, i) =>
                <span
                  key={i}
                  className="h-2.5 w-[3px]"
                  style={{ background: i < segments ? color : '#242424' }} />

                )}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] leading-tight text-neutral-200">
                  {d.metric}:{' '}
                  <span style={{ color }}>+{d.influence}% influence</span>{' '}
                  <span className="text-neutral-500">(Weight: {d.weightHours}h loss)</span>
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] leading-snug text-neutral-500">{d.explainer}</p>
              </div>
            </li>);

        })}
      </ul>
    </section>);

}