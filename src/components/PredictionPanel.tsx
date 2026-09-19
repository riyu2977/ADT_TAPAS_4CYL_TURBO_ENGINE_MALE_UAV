import React from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis } from
'recharts';
import { BarChart3 } from 'lucide-react';
import { rulPosterior } from '../utils/prediction';
import { predictionProfile } from '../data/predictionModel';
import type { FaultId } from '../types/twin';

interface PredictionPanelProps {
  rulHours: number;
  fault: FaultId;
  stage: number;
  frozen: boolean;
}

export function PredictionPanel({ rulHours, fault, stage, frozen }: PredictionPanelProps) {
  const post = rulPosterior(rulHours, fault, stage);
  const profile = predictionProfile(fault, stage);
  const critical = post.unit === 'MIN' && post.mean < 60;
  const color = critical ? '#FF0000' : fault === 'nominal' ? '#00FF00' : '#FFBF00';

  return (
    <section className="flex min-h-0 flex-col border border-[#2A2A2A] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] px-3 py-2">
        <h3 className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-neutral-400">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          AI-DRIVEN ENGINE LIFE PREDICTION ANALYSIS
        </h3>
        <span className="font-mono text-[9px] tracking-widest text-neutral-600">{profile.model}</span>
      </div>

      <div className="flex items-center justify-between px-3 pt-2 font-mono text-[9px] tracking-[0.18em] text-neutral-500">
        <span>RUL ESTIMATE DISTRIBUTION · PROBABILITY DENSITY</span>
        <span style={{ color }}>
          95% CI: {post.ciLow}–{post.ciHigh} {post.unit}
        </span>
      </div>

      <div className={`h-[180px] shrink-0 p-1 transition-all duration-500 ${frozen ? 'opacity-40 grayscale' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={post.points} margin={{ top: 8, right: 14, bottom: 2, left: -18 }}>
            <CartesianGrid stroke="#222222" strokeDasharray="2 4" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke="#3A3A3A"
              tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'Geist Mono' }}
              tickFormatter={(v: number) => `${Math.round(v)}`} />
            
            <YAxis
              domain={[0, 1.2]}
              stroke="#3A3A3A"
              tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'Geist Mono' }}
              width={40} />
            
            <ReferenceArea x1={post.ciLow} x2={post.ciHigh} fill={color} fillOpacity={0.14} />
            <ReferenceLine
              x={+post.mean.toFixed(post.mean > 100 ? 0 : 1)}
              stroke={color}
              strokeDasharray="4 3"
              strokeOpacity={0.8} />
            
            <Bar dataKey="bar" fill={color} fillOpacity={0.35} isAnimationActive={false} />
            <Area dataKey="pdf" stroke="none" fill={color} fillOpacity={0.08} isAnimationActive={false} />
            <Line dataKey="pdf" stroke="#E5E5E5" strokeWidth={1.6} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <dl className="grid grid-cols-3 gap-px border-t border-[#2A2A2A] bg-[#2A2A2A] font-mono text-[9px]">
        {[
        { k: 'POINT ESTIMATE', v: `${post.mean >= 100 ? Math.round(post.mean) : post.mean.toFixed(1)} ${post.unit}` },
        { k: 'PREDICTION HORIZON', v: profile.horizon },
        { k: 'MODEL CONFIDENCE', v: `${profile.confidence.toFixed(1)}%` }].
        map((m) =>
        <div key={m.k} className="bg-[#151515] px-3 py-1.5">
            <dt className="tracking-[0.16em] text-neutral-500">{m.k}</dt>
            <dd className="mt-0.5 text-[11px]" style={{ color: frozen ? '#6B7280' : color }}>
              {m.v}
            </dd>
          </div>
        )}
      </dl>
    </section>);

}