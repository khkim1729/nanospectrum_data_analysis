import numpy as np
import os
import re

def parse_hdr(hdr_path):
    metadata = {}
    with open(hdr_path, 'r') as f:
        content = f.read()
        
    # Simple regex parser for ENVI HDR
    for key in ['samples', 'lines', 'bands', 'interleave', 'data type']:
        match = re.search(fr'{key}\s*=\s*(\w+)', content)
        if match:
            val = match.group(1)
            metadata[key] = int(val) if val.isdigit() else val
            
    # Parse wavelength if needed
    wavelength_match = re.search(r'Wavelength\s*=\s*\{(.*?)\}', content, re.DOTALL)
    if wavelength_match:
        wavelengths = [float(w.strip()) for w in wavelength_match.group(1).split(',') if w.strip()]
        metadata['wavelength'] = wavelengths
        
    return metadata

def read_raw(raw_path, metadata):
    samples = metadata['samples']
    lines = metadata['lines']
    bands = metadata['bands']
    interleave = metadata['interleave'].lower()
    
    # Data type 12 is uint16
    dtype = np.uint16
    
    data = np.fromfile(raw_path, dtype=dtype)
    
    if interleave == 'bil':
        # BIL: (line, band, sample)
        data = data.reshape((lines, bands, samples))
    elif interleave == 'bsq':
        # BSQ: (band, line, sample)
        data = data.reshape((bands, lines, samples))
    elif interleave == 'bip':
        # BIP: (line, sample, band)
        data = data.reshape((lines, samples, bands))
    else:
        raise ValueError(f"Unsupported interleave: {interleave}")
        
    return data

def get_rgb_preview(data, metadata, r_idx=100, g_idx=150, b_idx=200):
    # Normalize and create RGB
    # Usually hyperspectral data has high dynamic range, so we might need simple scaling
    def normalize(band):
        b_min, b_max = band.min(), band.max()
        if b_max > b_min:
            return ((band - b_min) / (b_max - b_min) * 255).astype(np.uint8)
        return np.zeros_like(band, dtype=np.uint8)

    r = normalize(data[:, r_idx, :])
    g = normalize(data[:, g_idx, :])
    b = normalize(data[:, b_idx, :])
    
    return np.stack([r, g, b], axis=-1)
