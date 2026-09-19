import React from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldAlert } from 'lucide-react';
import type { LoadShedding } from '../hooks/useDigitalTwin';

interface LoadSheddingModalProps {
  open: boolean;
  rulMinutes: number;
  shed: LoadShedding;
  onToggle: (key: keyof LoadShedding) => void;
  onDismiss: () => void;
}

const payloads: {key: keyof LoadShedding;label: string;sub: string;}[] = [
{ key: 'sar', label: 'Disable SAR Radar', sub: '−1.8 kW alternator draw · +5 min RUL' },
{ key: 'eoir', label: 'Stow EO/IR Optics', sub: '−0.9 kW gimbal + heater load · +5 min RUL' }];


export function LoadSheddingModal({
  open,
  rulMinutes,
  shed,
  onToggle,
  onDismiss
}: LoadSheddingModalProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="shed-title">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg border-2 border-[#FF0000] bg-[#151515]"
        style={{ boxShadow: '0 0 60px #FF000040' }}>
        
        <div className="flex items-center gap-3 border-b border-[#FF0000]/50 bg-[#FF0000]/10 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-[#FF0000]" aria-hidden="true" />
          <div>
            <h2 id="shed-title" className="font-mono text-sm font-bold tracking-[0.18em] text-[#FF0000]">
              TACTICAL LOAD-SHEDDING PROTOCOL
            </h2>
            <p className="font-mono text-[10px] tracking-widest text-neutral-400">
              RUL BELOW 30 MIN · MISSION RELIABILITY AT RISK
            </p>
          </div>
        </div>

        <div className="p-4">
          <p className="font-mono text-[11px] leading-relaxed text-neutral-300">
            The physics model projects engine loss in{' '}
            <span className="font-bold text-[#FF0000]">{Math.max(0, Math.round(rulMinutes))} minutes</span>. Shedding
            non-essential electrical payloads relieves alternator drag on the failing engine and extends
            available endurance to reach recovery.
          </p>

          <ul className="mt-4 space-y-2">
            {payloads.map(({ key, label, sub }) => {
              const checked = shed[key];
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => onToggle(key)}
                    className="flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors"
                    style={{
                      borderColor: checked ? '#00FF0088' : '#3A3A3A',
                      background: checked ? '#00FF000F' : 'transparent'
                    }}>
                    
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center border"
                      style={{
                        borderColor: checked ? '#00FF00' : '#6B7280',
                        background: checked ? '#00FF00' : 'transparent'
                      }}>
                      
                      {checked && <Check className="h-3.5 w-3.5 text-black" aria-hidden="true" />}
                    </span>
                    <span>
                      <span
                        className="block font-mono text-[12px] tracking-wider"
                        style={{ color: checked ? '#00FF00' : '#E5E5E5' }}>
                        
                        {label}
                      </span>
                      <span className="block font-mono text-[9px] tracking-wider text-neutral-500">{sub}</span>
                    </span>
                  </button>
                </li>);

            })}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#2A2A2A] pt-3">
            <p className="font-mono text-[10px] tracking-wider text-neutral-500">
              RECOVERED ENDURANCE:{' '}
              <span className="text-[#00FF00]">
                +{(shed.sar ? 5 : 0) + (shed.eoir ? 5 : 0)} MIN
              </span>
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="border border-[#FFBF00] px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#FFBF00] transition-colors hover:bg-[#FFBF00]/15">
              
              ACKNOWLEDGE &amp; RETURN TO GCS
            </button>
          </div>
        </div>
      </motion.div>
    </div>);

}