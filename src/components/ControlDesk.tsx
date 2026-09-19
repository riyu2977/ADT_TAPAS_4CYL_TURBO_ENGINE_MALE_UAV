import React from 'react';
import {
  Flame,
  Mountain,
  RotateCcw,
  Radio,
  Thermometer,
  Unplug,
  Waves,
  ZapOff } from
'lucide-react';
import type { FaultId } from '../types/twin';

interface ControlDeskProps {
  fault: FaultId;
  env: {highAltitude: boolean;hotWeather: boolean;};
  jammed: boolean;
  jamSeconds: number;
  onAltitude: (v: boolean) => void;
  onHotWeather: (v: boolean) => void;
  onInject: (f: FaultId) => void;
  onJam: () => void;
  onRestore: () => void;
}

const faults: {id: FaultId;label: string;sub: string;Icon: typeof Flame;tone: string;}[] = [
{
  id: 'sensor_snap',
  label: 'SNAP CHT SENSOR',
  sub: 'Anti-spoofing · virtual sensor fallback',
  Icon: Unplug,
  tone: '#FFBF00'
},
{
  id: 'heat_soak',
  label: 'FAIL COOLING',
  sub: 'Heat-soak cascade · T+0 / +5 / +10s',
  Icon: Thermometer,
  tone: '#FF0000'
},
{
  id: 'micro_fracture',
  label: 'INJECT MICRO-FRACTURE',
  sub: 'Predictive acoustics · 10.4 kHz harmonic',
  Icon: Waves,
  tone: '#FFBF00'
}];


function Toggle({
  active,
  label,
  sub,
  Icon,
  onClick






}: {active: boolean;label: string;sub: string;Icon: typeof Flame;onClick: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full items-center gap-3 border px-3 py-2 text-left font-mono transition-colors duration-200"
      style={{
        borderColor: active ? '#00FF0066' : '#2A2A2A',
        background: active ? '#00FF000F' : 'transparent'
      }}>
      
      <Icon className="h-4 w-4 shrink-0" style={{ color: active ? '#00FF00' : '#6B7280' }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] tracking-wider" style={{ color: active ? '#00FF00' : '#D4D4D4' }}>
          {label}
        </span>
        <span className="block truncate text-[9px] tracking-wider text-neutral-500">{sub}</span>
      </span>
      <span
        className="h-3 w-3 shrink-0 rounded-full border"
        style={{
          borderColor: active ? '#00FF00' : '#3A3A3A',
          background: active ? '#00FF00' : 'transparent',
          boxShadow: active ? '0 0 8px #00FF0088' : 'none'
        }} />
      
    </button>);

}

export function ControlDesk({
  fault,
  env,
  jammed,
  jamSeconds,
  onAltitude,
  onHotWeather,
  onInject,
  onJam,
  onRestore
}: ControlDeskProps) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-[#2A2A2A] px-3 py-2">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-neutral-400">
          GCS CONTROL DESK
        </h2>
        <p className="font-mono text-[9px] tracking-widest text-neutral-600">
          HIL FAULT INJECTION · OPERATOR ONLY
        </p>
      </div>

      <section className="border-b border-[#2A2A2A] p-3">
        <h3 className="mb-2 font-mono text-[9px] tracking-[0.22em] text-neutral-500">
          A · METEOROLOGICAL STRESS
        </h3>
        <div className="space-y-2">
          <Toggle
            active={env.highAltitude}
            label="HIGH ALTITUDE (15k FT)"
            sub="Reduced charge density · turbo load"
            Icon={Mountain}
            onClick={() => onAltitude(!env.highAltitude)} />
          
          <Toggle
            active={env.hotWeather}
            label="HOT WEATHER (+45°C)"
            sub="Cooling ΔT collapse · oil thinning"
            Icon={Flame}
            onClick={() => onHotWeather(!env.hotWeather)} />
          
        </div>
      </section>

      <section className="border-b border-[#2A2A2A] p-3">
        <h3 className="mb-2 font-mono text-[9px] tracking-[0.22em] text-neutral-500">
          B · FAULT INJECTION MATRIX
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {faults.map(({ id, label, sub, Icon, tone }) => {
            const active = fault === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onInject(id)}
                aria-pressed={active}
                className="flex w-full items-center gap-2 border px-2.5 py-2 text-left font-mono transition-colors duration-200"
                style={{
                  borderColor: active ? tone : '#2A2A2A',
                  background: active ? `${tone}18` : 'transparent'
                }}>
                
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? tone : '#6B7280' }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] tracking-wider" style={{ color: active ? tone : '#D4D4D4' }}>
                    {label}
                  </span>
                  <span className="block truncate text-[9px] tracking-wider text-neutral-500">{sub}</span>
                </span>
              </button>);

          })}

          <button
            type="button"
            onClick={jammed ? onRestore : onJam}
            className="col-span-2 flex w-full items-center gap-3 border px-3 py-2.5 text-left font-mono transition-colors duration-200"
            style={{
              borderColor: jammed ? '#FF0000' : '#2A2A2A',
              background: jammed ? '#FF000018' : 'transparent'
            }}>
            
            {jammed ?
            <Radio className="h-4 w-4 shrink-0 text-[#FF0000]" aria-hidden="true" /> :

            <ZapOff className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
            }
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] tracking-wider" style={{ color: jammed ? '#FF0000' : '#D4D4D4' }}>
                {jammed ? `RESTORE LINK (${jamSeconds}s BUFFERED)` : 'SIMULATE COMMS JAMMING'}
              </span>
              <span className="block truncate text-[9px] tracking-wider text-neutral-500">
                {jammed ? 'Back-fill edge ring buffer' : 'SATCOM denial · edge autonomy'}
              </span>
            </span>
          </button>
        </div>
      </section>

      <section className="px-3 py-2.5">
        <button
          type="button"
          onClick={() => onInject('nominal')}
          className="flex w-full items-center justify-center gap-2 border border-[#00FF0055] bg-[#00FF000F] px-3 py-2.5 font-mono text-[11px] tracking-[0.18em] text-[#00FF00] transition-colors hover:bg-[#00FF001F]">
          
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          RE-BASELINE TWIN
        </button>
        <p className="mt-2 font-mono text-[9px] leading-relaxed tracking-wider text-neutral-600">
          Edge inference runs on the airframe; the GCS receives a 0.5 kbps heartbeat until a residual
          breaches the physics model, promoting the link to a 15 kbps diagnostic burst.
        </p>
      </section>
    </div>);

}