# VarshaPurvanumanAI — System Deployment Guide
**SIH26080: Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts**  
**Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)**

---

## 1. System Requirements & Prerequisites

### 1.1 Hardware Specifications
- **CPU**: Minimum 2 cores (4+ cores recommended for concurrent API requests).
- **RAM**: Minimum 4 GB (8 GB recommended for in-memory model registry and GeoJSON serving).
- **Disk**: 2 GB free disk space (repository, virtual environment, and model artifacts).

### 1.2 Software Prerequisites
- **Python**: Version 3.10 to 3.13 (verified on Python 3.13.3).
- **Node.js**: Version 18.0+ (verified on Node.js v25.6.1 with npm 11.9.0).
- **Operating System**: Linux (Ubuntu 22.04 LTS / RHEL 9), macOS (macOS 14+), or Windows with WSL2.

---

## 2. Environment Setup

### 2.1 Backend Environment Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/organization/VarhsaPurvanumanAI.git
   cd VarhsaPurvanumanAI
   ```

2. **Create and Activate Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Inspect configuration parameters:
   ```ini
   BACKEND_HOST=127.0.0.1
   BACKEND_PORT=8000
   APP_ENV=production
   DATA_STATUS=HISTORICAL_BENCHMARK
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

   # Optional Frontend Configuration
   VITE_API_BASE_URL=
   # Optional Google Maps Key; if unset, the map automatically falls back to OpenStreetMap / CartoDB tiles
   VITE_GOOGLE_MAPS_API_KEY=
   ```

### 2.2 Frontend Environment Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build Configuration**:
   The frontend is configured via `frontend/vite.config.ts` to proxy `/api` requests to `http://127.0.0.1:8000` during development.

---

## 3. Running the Integrated System in Development

### 3.1 Start the FastAPI Backend
In the project root with the virtual environment activated:
```bash
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API root: `http://127.0.0.1:8000/`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`
- Redoc documentation: `http://127.0.0.1:8000/redoc`

### 3.2 Start the React Frontend Dashboard
In a separate terminal:
```bash
cd frontend
npm run dev
```
- The Vite development server will start at `http://localhost:3000` (or `http://localhost:5173`).
- Open your browser to view the interactive dashboard.

---

## 4. Production Deployment

### 4.1 Production Frontend Build
Compile TypeScript and bundle assets:
```bash
cd frontend
npm run build
```
This produces optimized production assets in `frontend/dist/` (`index.html`, minified JavaScript, and CSS).

### 4.2 Production ASGI Server (Gunicorn + Uvicorn Workers)
For production deployments under Linux, run Uvicorn with Gunicorn process management:
```bash
gunicorn backend.app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --timeout 120
```

### 4.3 Nginx Reverse Proxy Configuration
Sample Nginx server block to serve the React frontend and proxy API requests:
```nginx
server {
    listen 80;
    server_name varsha.imd.gov.in;

    root /var/www/VarhsaPurvanumanAI/frontend/dist;
    index index.html;

    # Frontend Single Page App Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Verification & Health Monitoring

### 5.1 Automated Test Execution
Run the complete automated test suite to ensure system integrity:
```bash
# Backend & integration test suite (84 tests)
pytest tests/ -v

# Frontend component & UI suite (9 tests)
cd frontend && npx vitest run
```

### 5.2 API Health Endpoint Check
```bash
curl -s http://127.0.0.1:8000/api/health | jq .
```
Expected output:
```json
{
  "status": "ok",
  "service": "VarshaPurvanumanAI Backend",
  "version": "1.0.0",
  "model_status": {
    "regime_classifier": "loaded",
    "global_postprocessor": "loaded",
    "regime_postprocessor": "loaded",
    "probability_suite": "loaded",
    "feature_provenance": "loaded"
  },
  "data_status": "REAL_DATA",
  "environment": "production"
}
```

---

## 6. Security & Operational Safety

1. **Model Immutability**: All model files in `models/` must have read-only filesystem permissions (`chmod 444 models/*.pkl`) to prevent unintended mutation during runtime.
2. **CORS Governance**: Restrict `CORS_ALLOWED_ORIGINS` to trusted official MoES/IMD hostnames in production.
3. **No Private Secrets**: The application requires no cloud database passwords or third-party proprietary API keys.
4. **Data Isolation**: The Pune benchmark station (`18.50°N, 73.80°E`) must never be modified to serve as a blanket district-level forecast for unmonitored regions.
