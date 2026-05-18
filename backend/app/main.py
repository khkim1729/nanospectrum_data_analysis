from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import glob
import cv2
import numpy as np
from typing import List
from .utils.hyperspectral import parse_hdr, read_raw, get_rgb_preview
from .utils.nanolambda import parse_nanolambda_csv

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_ROOT = os.getenv("DATA_PATH", "/data/hsi_fm_bench_123/more_projects/all_nano_data_analysis/nano_data_analysis/data")
OZRAY_DIR = os.path.join(DATA_ROOT, "1_photos_linescan")
NANOLAMBDA_DIR = os.path.join(DATA_ROOT, "2_nanolambda")
UPLOAD_DIR = os.path.join(DATA_ROOT, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/api/files/ozray")
async def list_ozray_files():
    # Recursively find PNG files
    pattern = os.path.join(OZRAY_DIR, "**", "*.png")
    files = glob.glob(pattern, recursive=True)
    # Filter out _ffc if needed, or keep all
    return [{"path": f, "name": os.path.basename(f), "rel_path": os.path.relpath(f, OZRAY_DIR)} for f in files]

@app.get("/api/files/nanolambda")
async def list_nanolambda_files():
    pattern = os.path.join(NANOLAMBDA_DIR, "*.csv")
    files = glob.glob(pattern)
    return [{"path": f, "name": os.path.basename(f)} for f in files]

@app.get("/api/ozray/load")
async def load_ozray(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
        
    # Match RAW and HDR
    base = os.path.splitext(path)[0]
    raw_path = base + ".raw"
    hdr_path = base + ".hdr"
    
    if not os.path.exists(raw_path) or not os.path.exists(hdr_path):
        raise HTTPException(status_code=400, detail="Matching .raw or .hdr not found")
        
    metadata = parse_hdr(hdr_path)
    data = read_raw(raw_path, metadata)
    
    # Generate preview
    preview = get_rgb_preview(data, metadata)
    preview_path = os.path.join(UPLOAD_DIR, f"preview_{os.path.basename(base)}.jpg")
    cv2.imwrite(preview_path, cv2.cvtColor(preview, cv2.COLOR_RGB2BGR))
    
    return {
        "metadata": {
            "samples": metadata['samples'],
            "lines": metadata['lines'],
            "bands": metadata['bands'],
            "wavelength": metadata.get('wavelength', [])
        },
        "preview_url": f"/api/preview/{os.path.basename(preview_path)}",
        "raw_path": raw_path,
        "hdr_path": hdr_path
    }

@app.get("/api/preview/{filename}")
async def get_preview(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404)
    return FileResponse(path)

@app.get("/api/ozray/spectrum")
async def get_ozray_spectrum(raw_path: str, hdr_path: str, x: int, y: int):
    metadata = parse_hdr(hdr_path)
    data = read_raw(raw_path, metadata)
    
    # x is sample, y is line
    # data is (line, band, sample)
    if y >= data.shape[0] or x >= data.shape[2]:
        raise HTTPException(status_code=400, detail="Coordinates out of bounds")
        
    spectrum = data[y, :, x].tolist()
    return {
        "wavelength": metadata.get('wavelength', []),
        "spectrum": spectrum
    }

@app.get("/api/nanolambda/load")
async def load_nanolambda(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404)
    entries = parse_nanolambda_csv(path)
    return entries

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), folder: str = "uploads"):
    target_dir = os.path.join(DATA_ROOT, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    path = os.path.join(target_dir, file.filename)
    with open(path, "wb") as buffer:
        buffer.write(await file.read())
        
    return {"filename": file.filename, "path": path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
