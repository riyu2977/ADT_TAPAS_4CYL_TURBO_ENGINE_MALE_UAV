import type { FaultId } from '../types/twin';

const API_BASE_URL = 'http://localhost:8000/api';

export async function checkBackendHealthApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function injectFaultApi(fault: FaultId): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/fault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fault })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setEnvironmentApi(highAltitude: boolean, hotWeather: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/environment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highAltitude, hotWeather })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setLoadSheddingApi(sar: boolean, eoir: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/load-shedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sar, eoir })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setJammingApi(jammed: boolean): Promise<{ success: boolean; reconciledFrames?: any[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/jamming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jammed })
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return {
      success: true,
      reconciledFrames: data.buffered_frames
    };
  } catch {
    return { success: false };
  }
}

export async function resetSystemApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch {
    return false;
  }
}
