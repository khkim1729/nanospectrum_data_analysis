import pandas as pd
import io

def parse_nanolambda_csv(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    entries = []
    current_entry = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_entry:
                entries.append(current_entry)
                current_entry = {}
            continue
            
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 2:
            continue
            
        key = parts[0]
        values = parts[1:]
        
        if key == 'Wavelength':
            current_entry['wavelength'] = [float(v) for v in values if v]
        elif key == 'Spectrum':
            current_entry['spectrum'] = [float(v) for v in values if v]
        elif key == 'File Name':
            current_entry['name'] = values[0]
        else:
            # Store other metadata if needed
            current_entry[key.lower().replace(' ', '_')] = values[0] if len(values) == 1 else values
            
    if current_entry:
        entries.append(current_entry)
        
    return entries
