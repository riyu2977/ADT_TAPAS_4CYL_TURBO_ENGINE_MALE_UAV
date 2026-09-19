import React from 'react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { FftBin } from '../types/twin';

interface FftChartProps {
  fft: FftBin[];
  frozen: boolean;
}

const binColor = (bin: FftBin): string => {
  if (bin.amp >= 70) return '#FF0000';
  if (bin.hz >= 4000 && bin.amp >= 25) return '#FFBF00';
  return '#00FF00';
};

export function FftChart({ fft, frozen }: FftChartProps) {
  const peak = fft.reduce((a, b) => b.amp > a.amp ? b : a, fft[0]);
  const alarm = peak.amp >= 70;

  return (
    <section className="flex h-full min-h-0 flex-col border border-[#2A2A2A] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-3 py-2">
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-neutral-400">
          MICRO-VIBRATION FFT · 50 Hz – 16 kHz
        </h3>
        <span
          className="font-mono text-[10px] tracking-widest"
          style={{ color: frozen ? '#6B7280' : alarm ? '#FF0000' : '#00FF00' }}>
          
          {frozen ? 'NO SIGNAL' : alarm ? `PEAK ${peak.freq}Hz · STRUCTURAL` : 'COMBUSTION HARMONICS OK'}
        </span>
      </div>
      <div className={`min-h-0 flex-1 p-1 transition-all duration-500 ${frozen ? 'opacity-40 grayscale' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fft} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
            <XAxis
              dataKey="freq"
              stroke="#3A3A3A"
              tick={{ fill: '#6B7280', fontSize: 8, fontFamily: 'Geist Mono' }}
              interval={0} />
            
            <YAxis
              domain={[0, 100]}
              stroke="#3A3A3A"
              tick={{ fill: '#6B7280', fontSize: 8, fontFamily: 'Geist Mono' }}
              width={40} />
            
            <ReferenceLine y={70} stroke="#FF0000" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Bar dataKey="amp" isAnimationActive={false}>
              {fft.map((bin) =>
              <Cell key={bin.freq} fill={binColor(bin)} fillOpacity={0.85} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>);

}