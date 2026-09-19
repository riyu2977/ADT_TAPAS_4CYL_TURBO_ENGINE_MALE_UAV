import React from 'react';
import { Activity, Radio, Satellite, WifiOff } from 'lucide-react';
import { formatRul } from '../utils/twinEngine';
import type { NetworkState, Severity } from '../types/twin';

interface TopNavProps {
  rulHours: number;
  severity: Severity;
  network: NetworkState;
  rpm: number;
  confidence: number;
}

const severityColor: Record<Severity, string> = {
  NOMINAL: '#00FF00',
  WARNING: '#FFBF00',
  CRITICAL: '#FF0000'
};

export function TopNav({ rulHours, severity, network, rpm, confidence }: TopNavProps) {
  const color = severityColor[severity];
  const lost = network.mode === 'LINK LOST';
  const burst = network.mode === 'DIAGNOSTIC BURST';
  const netColor = lost ? '#FF0000' : burst ? '#FFBF00' : '#00FF00';
  const barCount = lost ? 0 : burst ? 5 : 1;

  return (
    <header className="flex flex-col gap-3 border-b border-[#2A2A2A] bg-[#151515] px-4 py-3 lg:h-[96px] lg:flex-row lg:items-center lg:gap-6 lg:px-5 lg:py-0">
      <div className="min-w-0 lg:w-[27%]">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-[#00FF00]">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          ATDT · AUTONOMOUS TACTICAL DIGITAL TWIN
        </div>
        <h1 className="mt-1 truncate font-mono text-sm font-semibold tracking-wider text-neutral-100">
          UAV ID: TAPAS-BH-201 <span className="text-neutral-600">|</span> ENG: 2.2L CRDi
        </h1>
        <p className="font-mono text-[10px] tracking-[0.14em] text-neutral-500">
          DRDO · ADE · INLINE-4 TURBO · JET-A1 · {rpm} RPM
        </p>
      </div>

      <div className="flex flex-col items-center lg:w-[24%]">
        <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-500">
          REMAINING USEFUL LIFE
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-[42px] font-bold leading-none tabular-nums transition-colors duration-300 lg:text-[50px]"
            style={{ color, textShadow: `0 0 18px ${color}55` }}
            aria-live="polite">
            
            {formatRul(rulHours)}
          </span>
          <span className="font-mono text-xs tracking-widest text-neutral-500">HH:MM</span>
        </div>
      </div>

      <div className="lg:w-[29%]">
        <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.18em]">
          <span className="text-neutral-500">PREDICTION CONFIDENCE</span>
          <span className="tabular-nums" style={{ color }}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full bg-[#222222]" role="img" aria-label={`Model confidence ${confidence}%`}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${confidence}%`, background: color, boxShadow: `0 0 10px ${color}66` }} />
          
        </div>
        <p className="mt-1 font-mono text-[9px] tracking-[0.16em] text-neutral-600">
          PHYSICS-INFORMED ENSEMBLE · EDGE INFERENCE 40 ms
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 lg:w-[20%] lg:justify-end">
        <div className="text-right">
          <div
            className="flex items-center justify-end gap-2 font-mono text-[11px] tracking-[0.18em]"
            style={{ color: netColor }}>
            
            {lost ? <WifiOff className="h-3.5 w-3.5" /> : burst ? <Satellite className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
            UPLINK: {network.bandwidth_kbps.toFixed(1)} kbps
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
            {lost ? 'EDGE AI LOGGING' : burst ? 'DIAGNOSTIC BURST ACTIVE' : 'HEARTBEAT MODE'}
          </div>
        </div>
        <div className="flex h-9 items-end gap-1" role="img" aria-label={`Uplink ${network.mode}`}>
          {[0, 1, 2, 3, 4].map((i) =>
          <span
            key={i}
            className="w-2 rounded-sm transition-all duration-300"
            style={{
              height: `${8 + i * 6}px`,
              background: i < barCount ? netColor : '#2A2A2A',
              boxShadow: i < barCount ? `0 0 8px ${netColor}66` : 'none'
            }} />

          )}
        </div>
      </div>
    </header>);

}