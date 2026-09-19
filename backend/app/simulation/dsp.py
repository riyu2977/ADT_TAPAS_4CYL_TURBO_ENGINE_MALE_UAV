"""
Vibration Signal Processing & FFT Spectrum Generator
Synthesizes 16 discrete frequency spectrum bins from 50 Hz to 16 kHz.
"""
import random
from typing import List, Dict, Any

FFT_BINS_CONFIG = [
    {"freq": "50", "hz": 50},
    {"freq": "100", "hz": 100},
    {"freq": "150", "hz": 150},
    {"freq": "300", "hz": 300},
    {"freq": "600", "hz": 600},
    {"freq": "1.2k", "hz": 1200},
    {"freq": "2k", "hz": 2000},
    {"freq": "3k", "hz": 3000},
    {"freq": "4.5k", "hz": 4500},
    {"freq": "6k", "hz": 6000},
    {"freq": "7.5k", "hz": 7500},
    {"freq": "9k", "hz": 9000},
    {"freq": "10.4k", "hz": 10400},
    {"freq": "12k", "hz": 12000},
    {"freq": "14k", "hz": 14000},
    {"freq": "16k", "hz": 16000},
]

def compute_fft_spectrum(fault: str, frozen: bool = False) -> List[Dict[str, Any]]:
    """
    Computes 16 discrete vibration frequency amplitude bins.
    """
    spectrum = []
    for bin_info in FFT_BINS_CONFIG:
        freq_label = bin_info["freq"]
        hz = bin_info["hz"]

        if hz <= 150:
            amp = 34.0 + random.random() * 10.0
        elif hz <= 2000:
            amp = 16.0 + random.random() * 8.0
        else:
            amp = 6.0 + random.random() * 6.0

        if fault == "micro_fracture" and hz == 10400:
            amp = 88.0 + random.random() * 9.0
        elif fault == "micro_fracture" and hz == 9000:
            amp = 31.0 + random.random() * 8.0
        elif fault == "micro_fracture" and hz == 12000:
            amp = 27.0 + random.random() * 8.0
        elif fault == "heat_soak" and hz <= 150:
            amp += 9.0

        final_amp = 0.0 if frozen else round(amp, 1)
        spectrum.append({
            "freq": freq_label,
            "hz": hz,
            "amp": final_amp
        })

    return spectrum
