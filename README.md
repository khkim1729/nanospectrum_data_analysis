# Hyperspectral Data Analysis & Comparison Tool

A professional-grade web application designed for the visualization and comparative analysis of hyperspectral data. This tool specifically integrates data from **Ozray Linescan Cameras** (3D RAW cubes) and **NanoLambda Sensors** (Point spectrum CSVs).

---

## 🌟 Key Features

The application features a premium, interactive tabbed navigation layout allowing researchers to switch seamlessly between two analysis modalities:

### 1. RAW ↔ CSV 비교 (RAW vs CSV Comparison)
- **Individual Analysis Mode**: Select a single Ozray linescan capture (`.png` preview matched automatically with `.raw` cube and `.hdr` metadata) alongside NanoLambda reference sensor files (`.csv`).
- **Interactive Multi-Point Selection**: Click on the linescan image preview to place precise coordinate points, dynamically tracked with persistent color codes.
- **Independent Scaling & Processing**:
  - **Min-Max Normalization**: Scale Ozray raw data and NanoLambda reference curves independently to resolve scale discrepancies.
  - **Moving Average Smoothing**: Apply a customizable moving average filter to reduce noise in RAW hyperspectral captures.
- **Unified Chart Comparison**: Overlays the pixel-level spectral curves directly with the references from the NanoLambda sensor with active tooltips and color matching.

### 2. RAW 겹쳐보기 (RAW Overlay / Multi-Image Comparison)
- **Multi-Image Comparative Gallery**: Select between **2 to 10** linescan captures from the Ozray dataset to analyze them side-by-side in a responsive, color-coded grid.
- **Color-Coded Visual Identity**: Each selected file is dynamically assigned a unique, vibrant color from a curated palette. Image viewer borders, color tags, and spectrum lines are perfectly synchronized to represent that specific file's data.
- **Full Filename Representation (Uncompressed)**: Displays full filenames in the comparison chart legend and the extracted points list, ensuring no loss of contextual information during comparisons.
- **Synchronized Click Coordinates**: 
  - **Coordinate Synchronization (ON)**: Click anywhere on any active linescan image to automatically place points at the exact same `(x, y)` coordinate across *all* active overlays, fetching and overlaying all spectra simultaneously.
  - **Independent Clicking (OFF)**: Deactivate synchronization to click and compare points at different coordinates across the active images.
- **Advanced Plot Overlay**: Supports min-max normalization and moving average smoothing for all active overlay spectrum curves in a single chart.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.9), NumPy, OpenCV, Spectral (ENVI processing).
- **Frontend**: React 18, Vite, Ant Design (Premium Dark Theme), Recharts, React-Split.
- **Infrastructure**: Docker, Docker Compose, Nginx (Reverse Proxy).

---

## 🚀 How to Start

### 📋 Prerequisites
- **Docker** and **Docker Compose** installed on your system.

### ⚡ Quick Start (Production Mode)

1.  **Clone or Navigate to the project directory**:
    ```bash
    git clone https://github.com/khkim1729/nanospectrum_data_analysis.git
    cd nanospectrum_data_analysis
    ```

2.  **Start the services**:
    > **Note**: It is highly recommended to use the modern `docker compose` command (v2) to avoid Python dependency issues found in older `docker-compose` versions.
    ```bash
    docker compose up -d --build
    ```

3.  **Access the Application**:
    - **Local**: [http://localhost:25025](http://localhost:25025)
    - **External**: [http://gnew-office.tplinkdns.com:25025](http://gnew-office.tplinkdns.com:25025)

---

## 📁 Data Organization

The application expects the following directory structure inside the `data/` folder:

- `1_photos_linescan/`: Contains Ozray datasets. Each dataset should have matching `.png`, `.raw`, and `.hdr` files.
- `2_nanolambda/`: Contains NanoLambda spectrum files in `.csv` format.
- `uploads/`: Default directory for files uploaded through the web UI.

---

## 🔧 Troubleshooting

### "http+docker" or URLSchemeUnknown Error
If you encounter a `urllib3.exceptions.URLSchemeUnknown: Not supported URL scheme http+docker` error when running `docker-compose`, it is likely due to a Python version mismatch on your host system.

**Solution**: Use the modern Go-based Docker Compose plugin:
```bash
# Use this instead of docker-compose
docker compose up -d --build
```
