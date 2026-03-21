# Global Markets Macro Dashboard

A Bloomberg Terminal-inspired macro dashboard for monitoring global markets.

## Project Structure
- `frontend/`: Vite + React + Vanilla CSS. Using `lightweight-charts` for data visualization.
- `backend/`: FastAPI + `yfinance` for market data retrieval.

## How to Start the App

### Requirements
- Python 3.8+
- Node.js 18+

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend will run on `http://localhost:8000`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Design Aesthetics
- **Bloomberg Terminal** aesthetic (Black/Amber/Green).
- Monospace fonts.
- Real-time market data via Yahoo Finance.
