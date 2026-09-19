import React from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, Terminal } from 'lucide-react';
import type { AiAnalysis, LogEntry } from '../types/twin';

interface AdvisorConsoleProps {
  analysis: AiAnalysis;
  log: LogEntry[];
  frozen: boolean;
}

const sev = {
  NOMINAL: { color: '#00FF00', Icon: CheckCircle2 },
  WARNING: { color: '#FFBF00', Icon: AlertTriangle },
  CRITICAL: { color: '#FF0000', Icon: AlertTriangle }
} as const;

const logColor = { info: '#00FF00', warn: '#FFBF00', crit: '#FF0000' } as const;

export function AdvisorConsole({ analysis, log, frozen }: AdvisorConsoleProps) {
  const { color, Icon } = sev[analysis.severity];
  const active = frozen ? '#6B7280' : color;

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-[#2A2A2A] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-3 py-2">
        <h3 className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-neutral-400">
          <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
          TACTICAL ADVISOR CONSOLE · XAI (SHAP)
        </h3>
        <span className="font-mono text-[9px] tracking-widest text-neutral-600">
          PHYSICS-INFORMED MODEL v2.4
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div
          className="flex items-start gap-2 border-l-2 px-3 py-2 transition-colors duration-300"
          style={{ borderColor: active, background: `${active}14` }}>
          
          <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: active }} aria-hidden="true" />
          <div>
            <p className="font-mono text-sm font-semibold tracking-wider" style={{ color: active }} aria-live="polite">
              {frozen ? 'LINK LOST: EDGE AI LOGGING' : analysis.status}
            </p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-neutral-300">
              {frozen ?
              'Airframe autonomy engaged. Diagnostics buffered onboard until SATCOM is restored.' :
              analysis.advisory}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="font-mono text-[9px] tracking-[0.22em] text-neutral-500">
            FAULT ISOLATION · FEATURE ATTRIBUTION
          </p>
          {analysis.xai_contributors && !frozen ?
          <ul className="mt-2 space-y-2">
              {analysis.xai_contributors.map((c) =>
            <li key={c.metric}>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-neutral-300">{c.metric}</span>
                    <span className="tabular-nums" style={{ color: active }}>
                      {c.weight}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-[#222222]">
                    <div
                  className="h-full transition-all duration-500"
                  style={{ width: c.weight, background: active }} />
                
                  </div>
                </li>
            )}
            </ul> :

          <p className="mt-2 font-mono text-[11px] text-neutral-600">
              No causal drivers above significance threshold. All residuals within physics-model tolerance.
            </p>
          }
        </div>
      </div>

      <div className="flex max-h-[34%] min-h-[96px] flex-col border-t border-[#2A2A2A]">
        <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] text-neutral-500">
          <Terminal className="h-3 w-3" aria-hidden="true" />
          EVENT LOG
        </div>
        <ol className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 font-mono text-[10px] leading-relaxed">
          {log.map((e) =>
          <li key={e.id} className="flex gap-2 py-0.5">
              <span className="shrink-0 text-neutral-600">{e.stamp}</span>
              <span style={{ color: logColor[e.level] }}>{e.text}</span>
            </li>
          )}
        </ol>
      </div>
    </section>);

}