import React, { useState } from 'react';
import { cylinderHealth } from '../utils/prediction';
import type { CylinderHealth } from '../utils/prediction';
import type { FaultId, Telemetry } from '../types/twin';
import { Engine3D } from './Engine3D';

interface EngineVisualProps {
  telemetry: Telemetry;
  fault: FaultId;
  stage: number;
  frozen: boolean;
}

const ENGINE_IMG = "/47e68b35-2133-4007-9fed-20cce8b4fcee.jpg";


const sevColor = { NOMINAL: '#00FF00', WARNING: '#FFBF00', CRITICAL: '#FF0000' } as const;

// Anchor points in the 400 x 300 overlay space, aligned to the x-ray render
const CYL_POS = [
{ x: 146, y: 107 },
{ x: 186, y: 100 },
{ x: 222, y: 105 },
{ x: 253, y: 98 }];


export function EngineVisual({ telemetry, fault, stage, frozen }: EngineVisualProps) {
  const [hover, setHover] = useState<number | null>(null);
  const health = cylinderHealth(telemetry, fault, stage);
  const active: CylinderHealth | null = hover === null ? null : health[hover];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-3 py-2">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-neutral-400">
          ADE AERO ENGINE · DIGITAL TWIN
        </h2>
        <span className="font-mono text-[10px] tracking-widest text-neutral-600">
          {frozen ? 'FRAME HELD' : 'LIVE 1 Hz'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-2">
        <div
          className={`relative aspect-[4/3] w-full max-h-full transition-all duration-500 ${
          frozen ? 'opacity-40 grayscale' : ''}`
          }>
          
          <Engine3D />

        <img
          src={ENGINE_IMG}
          alt="2D fallback render of the 2.2L inline-4 turbocharged CRDi aero engine"
          className="absolute inset-0 h-full w-full object-contain opacity-0 pointer-events-none" />
          

          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
            {/* Callouts */}
            <g stroke="#4A5A52" strokeWidth="0.8" fill="none">
              <path d="M150 44 L150 58 M150 50 L258 50 M258 50 L258 62" />
              <path d="M186 50 L186 84" strokeDasharray="3 3" />
              <path d="M300 62 L300 76" />
              <path d="M96 196 L96 164" />
              <path d="M205 262 L205 156" strokeDasharray="3 3" />
              <path d="M330 116 L302 96" />
            </g>

            <text x="150" y="38" textAnchor="middle" className="fill-neutral-300 font-mono" fontSize="10">
              CYLINDER 1–4
            </text>
            <text x="300" y="58" textAnchor="middle" className="fill-neutral-300 font-mono" fontSize="9">
              TURBO · MAP {telemetry.map_inHg.toFixed(1)} inHg
            </text>
            <text x="96" y="208" textAnchor="middle" className="fill-neutral-300 font-mono" fontSize="9">
              OIL PUMP · {telemetry.oil_press_psi.toFixed(1)} PSI
            </text>
            <text x="205" y="274" textAnchor="middle" className="fill-neutral-300 font-mono" fontSize="9">
              CRANKSHAFT · {telemetry.rpm.toFixed(0)} RPM
            </text>
            <text x="352" y="120" textAnchor="middle" className="fill-neutral-500 font-mono" fontSize="8">
              EGT {Math.round(telemetry.egt_C.reduce((a, b) => a + b, 0) / 4)}°C
            </text>

            {/* Cylinder health hotspots */}
            {health.map((c, i) => {
              const color = c.isolated ? '#6B7280' : sevColor[c.severity];
              const pos = CYL_POS[i];
              const isHover = hover === i;
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Cylinder ${i + 1} health`}
                  className="cursor-pointer outline-none">
                  
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHover ? 17 : 14}
                    fill={color}
                    fillOpacity={c.severity === 'NOMINAL' ? 0.18 : 0.34}
                    stroke={color}
                    strokeWidth={isHover ? 1.8 : 1}
                    strokeDasharray={c.isolated ? '3 2' : undefined}
                    style={{ transition: 'all 250ms ease' }} />
                  
                  {!frozen && c.severity !== 'NOMINAL' &&
                  <circle cx={pos.x} cy={pos.y} r={20} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth="0.8">
                      <animate attributeName="r" values="17;26;17" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  }
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fontSize="8.5"
                    className="pointer-events-none font-mono"
                    fill={color}>
                    
                    {c.isolated ? 'ISO' : c.cht.toFixed(0)}
                  </text>
                </g>);

            })}
          </svg>

          {active &&
          <div
            className="pointer-events-none absolute z-20 w-[230px] border border-[#3A4A42] bg-[#0D0D0D]/95 p-2 font-mono text-[10px] leading-relaxed"
            style={{
              left: `${Math.min(CYL_POS[active.index].x / 4, 52)}%`,
              top: `${CYL_POS[active.index].y / 3 + 12}%`,
              boxShadow: '0 0 24px #000000'
            }}
            role="tooltip">
            
              <p className="tracking-[0.16em] text-neutral-300">CYLINDER {active.index + 1} DETAIL</p>
              <dl className="mt-1 space-y-0.5 text-neutral-500">
                <div className="flex justify-between gap-3">
                  <dt>CURRENT CHT</dt>
                  <dd style={{ color: active.isolated ? '#6B7280' : sevColor[active.severity] }}>
                    {active.isolated ? 'ISOLATED' : `${active.cht.toFixed(0)}°C (${active.severity})`}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>PREDICTED TREND</dt>
                  <dd className="text-neutral-200">+{active.trendPerHour.toFixed(1)}°C/hr</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>REMAINING CYL LIFE</dt>
                  <dd className="text-neutral-200">{active.remainingCycles.toLocaleString()} cycles</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>AI ANOMALY SCORE</dt>
                  <dd style={{ color: active.anomalyScore > 5 ? '#FF0000' : active.anomalyScore > 2 ? '#FFBF00' : '#00FF00' }}>
                    {active.anomalyScore.toFixed(1)} / 10.0
                  </dd>
                </div>
              </dl>
              <p className="mt-1 border-t border-[#2A2A2A] pt-1 text-neutral-400">{active.note}</p>
            </div>
          }
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-px border-t border-[#2A2A2A] bg-[#2A2A2A] font-mono text-[10px]">
        {[
        { k: 'RPM', v: telemetry.rpm.toFixed(0), c: '#00FF00' },
        {
          k: 'VIB HARMONIC',
          v:
          telemetry.vibration_hz >= 1000 ?
          `${(telemetry.vibration_hz / 1000).toFixed(1)} kHz` :
          `${telemetry.vibration_hz.toFixed(0)} Hz`,
          c: telemetry.vibration_hz > 1000 ? '#FFBF00' : '#00FF00'
        },
        {
          k: 'OIL',
          v: `${telemetry.oil_press_psi.toFixed(1)}`,
          c: telemetry.oil_press_psi < 45 ? '#FF0000' : '#00FF00'
        },
        {
          k: 'Fe PARTICULATE',
          v: `${telemetry.metal_particulate_ppm.toFixed(0)} ppm`,
          c: telemetry.metal_particulate_ppm > 25 ? '#FFBF00' : '#00FF00'
        }].
        map((m) =>
        <div key={m.k} className="bg-[#151515] px-3 py-2">
            <dt className="tracking-[0.14em] text-neutral-500">{m.k}</dt>
            <dd className="mt-0.5 text-sm tabular-nums" style={{ color: frozen ? '#6B7280' : m.c }}>
              {m.v}
            </dd>
          </div>
        )}
      </dl>
    </div>);

}