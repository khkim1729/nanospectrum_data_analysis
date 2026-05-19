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

### 3. 다목적 파일 탐색 뷰 및 정렬 (Advanced File Selector Layouts)
- **리스트 뷰 (List View)**: 파일의 긴 상대 경로를 텍스트 래핑을 통해 축약 없이 한눈에 정돈되게 보여주는 기본 방식.
- **썸네일 그리드 뷰 (Grid/Thumbnail View)**:
  - **Ozray Linescan**: 안전하고 효율적인 파일 전송 API (`/api/files/view`)와 연동하여 2D 이미지 썸네일을 반응형 그리드 카드 형태로 실시간 렌더링. 원하는 캡처 데이터를 시각적으로 빠르게 파악하고 선택할 수 있어 분석 피드백 향상.
  - **NanoLambda CSV**: 문장 형식의 파일 아이콘 카드 형태로 정갈하게 배치하여 스펙트럼 파일 탐색 속도 향상.
- **폴더별 묶어보기 (Folders View)**:
  - 파일들이 저장되어 있는 하위 디렉토리 구조(예: `20260416/16`)를 자동으로 분석하여 professional 폴더 트리로 그룹화.
  - 폴더 단위 접기/펼치기 기능(`Collapse` 인터페이스)을 탑재하여 대용량 연구 폴더 구조도 깔끔하고 쾌적하게 필터링.
- **A-Z/Z-A 가나다 정렬 (Sorting)**: 오름차순 및 내림차순 정렬 토글 버튼을 활용해 파일 목록을 정밀 정돈하여 파일 탐색 효율을 극대화.

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
