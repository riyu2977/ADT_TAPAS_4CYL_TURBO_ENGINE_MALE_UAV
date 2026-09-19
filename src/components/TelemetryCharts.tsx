import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import type { TelemetrySample } from '../types/twin';

interface TelemetryChartsProps {
  history: TelemetrySample[];
  frozen: boolean;
}

const axis = { stroke: '#3A3A3A', tick: { fill: '#6B7280', fontSize: 9, fontFamily: 'Geist Mono' } };

const tooltipStyle = {
  background: '#0D0D0D',
  border: '1px solid #2A2A2A',
  borderRadius: 2,
  fontFamily: 'Geist Mono',
  fontSize: 11
};

function recoveredSpan(history: TelemetrySample[]): [number, number] | null {
  const rec = history.filter((h) => h.recovered);
  if (!rec.length) return null;
  return [rec[0].t, rec[rec.length - 1].t];
}

function ChartShell({
  title,
  unit,
  children




}: {title: string;unit: string;children: React.ReactNode;}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-neutral-400">{title}</h3>
        <span className="font-mono text-[9px] tracking-widest text-neutral-600">{unit}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>);

}

export function TelemetryCharts({ history, frozen }: TelemetryChartsProps) {
  const span = recoveredSpan(history);
  const gray = frozen ? 'grayscale opacity-45' : '';

  return (
    <div className={`flex h-full flex-col gap-1 transition-all duration-500 ${gray}`}>
      <ChartShell title="THERMAL · CHT / EGT" unit="°C">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#222222" strokeDasharray="2 4" />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} {...axis} tickFormatter={(v) => `${v}s`} />
            <YAxis yAxisId="cht" domain={[120, 260]} {...axis} width={44} />
            <YAxis yAxisId="egt" orientation="right" domain={[600, 820]} {...axis} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `T+${v}s`} />
            {span && <ReferenceArea yAxisId="cht" x1={span[0]} x2={span[1]} fill="#FFBF00" fillOpacity={0.12} />}
            <ReferenceLine yAxisId="cht" y={215} stroke="#FF0000" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine yAxisId="cht" y={180} stroke="#00FF00" strokeDasharray="4 4" strokeOpacity={0.3} />
            <Line yAxisId="cht" dataKey="chtAvg" name="CHT" stroke="#FFBF00" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            <Line yAxisId="egt" dataKey="egtAvg" name="EGT" stroke="#FF6B3D" strokeWidth={1.4} dot={false} isAnimationActive={false} />
            <Line yAxisId="cht" dataKey="oilTemp" name="OIL T" stroke="#00E5FF" strokeWidth={1.2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="PRESSURE · OIL / MAP" unit="PSI · inHg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#222222" strokeDasharray="2 4" />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} {...axis} tickFormatter={(v) => `${v}s`} />
            <YAxis yAxisId="psi" domain={[20, 70]} {...axis} width={44} />
            <YAxis yAxisId="map" orientation="right" domain={[26, 40]} {...axis} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `T+${v}s`} />
            {span && <ReferenceArea yAxisId="psi" x1={span[0]} x2={span[1]} fill="#FFBF00" fillOpacity={0.12} />}
            <ReferenceLine yAxisId="psi" y={38} stroke="#FF0000" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Line yAxisId="psi" dataKey="oilPress" name="OIL P" stroke="#00FF00" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            <Line yAxisId="map" dataKey="map" name="MAP" stroke="#9D7BFF" strokeWidth={1.4} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-1 font-mono text-[9px] tracking-widest text-neutral-500">
        {[
        ['CHT', '#FFBF00'],
        ['EGT', '#FF6B3D'],
        ['OIL TEMP', '#00E5FF'],
        ['OIL PRESS', '#00FF00'],
        ['MAP', '#9D7BFF']].
        map(([label, color]) =>
        <span key={label} className="flex items-center gap-1.5">
            <span className="h-[2px] w-4" style={{ background: color }} />
            {label}
          </span>
        )}
        {span &&
        <span className="flex items-center gap-1.5 text-[#FFBF00]">
            <span className="h-2.5 w-4 bg-[#FFBF00]/25" />
            BACK-FILLED (COMMS DENIED)
          </span>
        }
      </div>
    </div>);

}