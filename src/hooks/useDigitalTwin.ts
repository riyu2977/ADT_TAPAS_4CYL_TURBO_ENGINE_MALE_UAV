import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyJitter, avg, buildState, computeFft } from '../utils/twinEngine';
import type {
  EngineState,
  FaultId,
  FftBin,
  LogEntry,
  LogLevel,
  TelemetrySample } from
'../types/twin';

const HISTORY_LEN = 45;
const TICK_MS = 1000;

const stamp = () => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].
  map((n) => String(n).padStart(2, '0')).
  join(':');
};

const sampleOf = (t: number, s: EngineState, recovered: boolean): TelemetrySample => ({
  t,
  chtAvg: avg(s.telemetry.cht_C),
  egtAvg: avg(s.telemetry.egt_C),
  oilPress: s.telemetry.oil_press_psi,
  map: s.telemetry.map_inHg,
  oilTemp: s.telemetry.oil_temp_c,
  recovered
});

export interface LoadShedding {
  sar: boolean;
  eoir: boolean;
}

export interface TwinInit {
  fault?: FaultId;
  stage?: number;
  highAltitude?: boolean;
  hotWeather?: boolean;
  jammed?: boolean;
  modal?: boolean;
}

export function useDigitalTwin(init: TwinInit = {}) {
  const [fault, setFault] = useState<FaultId>(init.fault ?? 'nominal');
  const [stage, setStage] = useState(init.stage ?? 0);
  const [highAltitude, setHighAltitude] = useState(init.highAltitude ?? true);
  const [hotWeather, setHotWeather] = useState(init.hotWeather ?? false);
  const [jammed, setJammed] = useState(Boolean(init.jammed));
  const [jamSeconds, setJamSeconds] = useState(0);
  const [live, setLive] = useState<EngineState>(() =>
  buildState(init.fault ?? 'nominal', init.stage ?? 0, {
    highAltitude: init.highAltitude ?? true,
    hotWeather: init.hotWeather ?? false
  })
  );
  const [history, setHistory] = useState<TelemetrySample[]>([]);
  const [fft, setFft] = useState<FftBin[]>(() => computeFft('nominal', false));
  const [rulHours, setRulHours] = useState(1500);
  const [shed, setShed] = useState<LoadShedding>({ sar: false, eoir: false });
  // Seeded screens opt into the load-shedding interrupt explicitly
  const [modalDismissed, setModalDismissed] = useState(
    init.modal ? false : Boolean(init.fault)
  );
  const [log, setLog] = useState<LogEntry[]>([
  { id: 0, stamp: stamp(), level: 'info', text: 'Edge twin synchronised. Heartbeat uplink 0.5 kbps.' }]
  );

  const clockRef = useRef(0);
  const bufferRef = useRef<TelemetrySample[]>([]);
  const logIdRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  const pushLog = useCallback((text: string, level: LogLevel = 'info') => {
    setLog((prev) => [{ id: logIdRef.current++, stamp: stamp(), level, text }, ...prev].slice(0, 30));
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Prefill the scrolling charts with nominal cruise history
  useEffect(() => {
    const seed: TelemetrySample[] = [];
    const base = buildState('nominal', 0, { highAltitude: true, hotWeather: false });
    for (let i = HISTORY_LEN; i > 0; i -= 1) {
      seed.push(sampleOf(-i, applyJitter(base), false));
    }
    clockRef.current = 0;
    setHistory(seed);
  }, []);

  const target = useMemo(
    () => buildState(fault, stage, { highAltitude, hotWeather }),
    [fault, stage, highAltitude, hotWeather]
  );

  // Commanded RUL follows the resolved state
  useEffect(() => {
    setRulHours(target.ai_analysis.rul_hours);
  }, [target.ai_analysis.rul_hours]);

  // Telemetry stream — frozen frames are buffered on the airframe while jammed
  useEffect(() => {
    const id = window.setInterval(() => {
      clockRef.current += 1;
      const frame = applyJitter(target);
      const sample = sampleOf(clockRef.current, frame, jammed);
      if (jammed) {
        bufferRef.current = [...bufferRef.current, sample];
        setJamSeconds(bufferRef.current.length);
        return;
      }
      setLive(frame);
      setFft(computeFft(fault, false));
      setHistory((prev) => [...prev, sample].slice(-HISTORY_LEN));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [target, jammed, fault]);

  // Real-time RUL decay once the twin is inside the critical window
  useEffect(() => {
    if (jammed || rulHours > 2) return;
    const id = window.setInterval(() => {
      setRulHours((prev) => Math.max(0, prev - 1 / 360));
    }, 1000);
    return () => window.clearInterval(id);
  }, [jammed, rulHours > 2]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const shedBonusHours = ((shed.sar ? 5 : 0) + (shed.eoir ? 5 : 0)) / 60;
  const displayedRul = rulHours + shedBonusHours;
  const rulMinutes = displayedRul * 60;

  const injectFault = useCallback(
    (next: FaultId) => {
      clearTimers();
      setJammed(false);
      setModalDismissed(false);
      setStage(0);
      setFault(next);
      bufferRef.current = [];
      setJamSeconds(0);

      if (next === 'nominal') {
        setShed({ sar: false, eoir: false });
        pushLog('Fault matrix cleared. Twin re-baselined to nominal cruise.', 'info');
        return;
      }
      if (next === 'sensor_snap') {
        pushLog(
          'CHT Cyl 2 channel open-circuit. Virtual Sensor Fallback initiated — health verified via EGT/RPM cross-validation.',
          'warn'
        );
        return;
      }
      if (next === 'micro_fracture') {
        pushLog(
          'High-frequency acoustic harmonic 10.4 kHz detected with nominal thermals. RUL adjusted to 12 hours.',
          'warn'
        );
        return;
      }
      if (next === 'heat_soak') {
        pushLog('T+0s — Coolant circulation loss. CHT exceedance across all cylinders.', 'warn');
        timersRef.current.push(
          window.setTimeout(() => {
            setStage(1);
            pushLog('T+5s — Thermal inertia: block heat soaking into oil circuit (130°C).', 'warn');
          }, 5000),
          window.setTimeout(() => {
            setStage(2);
            pushLog(
              'T+10s — Viscosity breakdown. Oil pressure collapse to 35 PSI. THERMAL CASCADE CRITICAL.',
              'crit'
            );
          }, 10000)
        );
      }
    },
    [clearTimers, pushLog]
  );

  const jam = useCallback(() => {
    bufferRef.current = [];
    setJamSeconds(0);
    setJammed(true);
    setFft((prev) => prev.map((b) => ({ ...b, amp: 0 })));
    pushLog('LINK LOST — SATCOM denied. Edge AI logging to onboard ring buffer.', 'crit');
  }, [pushLog]);

  const restoreLink = useCallback(() => {
    const buffered = bufferRef.current;
    bufferRef.current = [];
    setJammed(false);
    setHistory((prev) => [...prev, ...buffered].slice(-HISTORY_LEN));
    pushLog(
      `Link restored. ${buffered.length}s of buffered edge telemetry back-filled and reconciled.`,
      'info'
    );
    setJamSeconds(0);
  }, [pushLog]);

  const toggleShed = useCallback(
    (key: keyof LoadShedding) => {
      setShed((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const label = key === 'sar' ? 'SAR Radar' : 'EO/IR Optics';
        pushLog(
          next[key] ?
          `${label} shed. Alternator drag reduced — RUL +5 min.` :
          `${label} re-energised. Alternator drag restored — RUL -5 min.`,
          next[key] ? 'info' : 'warn'
        );
        return next;
      });
    },
    [pushLog]
  );

  const network = jammed ?
  { mode: 'LINK LOST' as const, bandwidth_kbps: 0 } :
  target.network;

  const modalOpen = fault !== 'nominal' && !jammed && !modalDismissed && rulMinutes < 30;

  return {
    fault,
    stage,
    live,
    target,
    history,
    fft,
    network,
    jammed,
    jamSeconds,
    log,
    displayedRul,
    rulMinutes,
    shed,
    modalOpen,
    env: { highAltitude, hotWeather },
    setHighAltitude,
    setHotWeather,
    injectFault,
    jam,
    restoreLink,
    toggleShed,
    dismissModal: () => setModalDismissed(true)
  };
}