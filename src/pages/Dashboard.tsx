import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useScreenInit } from '../useScreenInit.js';
import { useDigitalTwin } from '../hooks/useDigitalTwin';
import { predictionProfile } from '../data/predictionModel';
import { TopNav } from '../components/TopNav';
import { EngineVisual } from '../components/EngineVisual';
import { PredictionPanel } from '../components/PredictionPanel';
import { CausalDrivers } from '../components/CausalDrivers';
import { TelemetryCharts } from '../components/TelemetryCharts';
import { FftChart } from '../components/FftChart';
import { AdvisorConsole } from '../components/AdvisorConsole';
import { ControlDesk } from '../components/ControlDesk';
import { LoadSheddingModal } from '../components/LoadSheddingModal';

type Tab = 'prediction' | 'telemetry';

const tabs: {id: Tab;label: string;}[] = [
{ id: 'prediction', label: 'PREDICTION ANALYSIS' },
{ id: 'telemetry', label: 'LIVE TELEMETRY · ACOUSTICS' }];


export function Dashboard() {
  const screenInit = useScreenInit();
  const twin = useDigitalTwin(screenInit);
  const [tab, setTab] = useState<Tab>(screenInit.tab === 'telemetry' ? 'telemetry' : 'prediction');
  const severity = twin.jammed ? 'WARNING' : twin.target.ai_analysis.severity;
  const profile = predictionProfile(twin.fault, twin.stage);

  // Acoustic faults are only legible on the FFT, so surface that view automatically
  useEffect(() => {
    if (twin.fault === 'micro_fracture') setTab('telemetry');
  }, [twin.fault]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#0D0D0D] text-neutral-200">
      <TopNav
        rulHours={twin.displayedRul}
        severity={severity}
        network={twin.network}
        rpm={twin.live.telemetry.rpm}
        confidence={twin.jammed ? 0 : profile.confidence} />
      

      {severity === 'CRITICAL' && !twin.jammed &&
      <div
        className="pointer-events-none absolute inset-0 z-40 animate-pulse"
        style={{ boxShadow: 'inset 0 0 90px #FF000033', border: '1px solid #FF000055' }}
        aria-hidden="true" />

      }

      {twin.jammed &&
      <div className="flex items-center justify-center gap-3 border-b border-[#FF0000]/50 bg-[#FF0000]/10 px-4 py-2 font-mono text-[11px] tracking-[0.22em] text-[#FF0000]">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          LINK LOST: EDGE AI LOGGING · {twin.jamSeconds}s BUFFERED ONBOARD
        </div>
      }

      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:h-[calc(100vh-96px)] lg:flex-row">
        {/* LEFT 30% — X-ray twin visualization */}
        <section
          className="min-h-[460px] border border-[#2A2A2A] bg-[#151515] lg:min-h-0 lg:w-[30%]"
          aria-label="Engine digital twin visualization">
          
          <EngineVisual
            telemetry={twin.live.telemetry}
            fault={twin.fault}
            stage={twin.stage}
            frozen={twin.jammed} />
          
        </section>

        {/* MIDDLE 40% — Prediction analysis / live telemetry */}
        <section className="flex min-h-0 flex-col gap-2 lg:w-[41%]" aria-label="AI prediction and telemetry">
          <div className="flex shrink-0 gap-px border border-[#2A2A2A] bg-[#2A2A2A]">
            {tabs.map((t) =>
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className="flex-1 bg-[#151515] px-3 py-2 font-mono text-[10px] tracking-[0.2em] transition-colors"
              style={{
                color: tab === t.id ? '#00FF00' : '#6B7280',
                background: tab === t.id ? '#00FF000F' : '#151515'
              }}>
              
                {t.label}
              </button>
            )}
          </div>

          {tab === 'prediction' ?
          <>
              <PredictionPanel
              rulHours={twin.displayedRul}
              fault={twin.fault}
              stage={twin.stage}
              frozen={twin.jammed} />
            
              <CausalDrivers fault={twin.fault} stage={twin.stage} frozen={twin.jammed} />
            </> :

          <>
              <div className="min-h-[240px] flex-1 border border-[#2A2A2A] bg-[#151515]">
                <TelemetryCharts history={twin.history} frozen={twin.jammed} />
              </div>
              <div className="h-[200px] shrink-0">
                <FftChart fft={twin.fft} frozen={twin.jammed} />
              </div>
            </>
          }
        </section>

        {/* RIGHT 30% — Control desk over the tactical advisor */}
        <section
          className="flex min-h-0 flex-col gap-2 lg:w-[29%]"
          aria-label="Ground control station">
          
          <div className="shrink-0 border border-[#2A2A2A] bg-[#151515]">
            <ControlDesk
              fault={twin.fault}
              env={twin.env}
              jammed={twin.jammed}
              jamSeconds={twin.jamSeconds}
              onAltitude={twin.setHighAltitude}
              onHotWeather={twin.setHotWeather}
              onInject={twin.injectFault}
              onJam={twin.jam}
              onRestore={twin.restoreLink} />
            
          </div>
          <div className="flex min-h-[220px] flex-1 flex-col">
            <AdvisorConsole analysis={twin.target.ai_analysis} log={twin.log} frozen={twin.jammed} />
          </div>
        </section>
      </main>

      <LoadSheddingModal
        open={twin.modalOpen}
        rulMinutes={twin.rulMinutes}
        shed={twin.shed}
        onToggle={twin.toggleShed}
        onDismiss={twin.dismissModal} />
      
    </div>);

}