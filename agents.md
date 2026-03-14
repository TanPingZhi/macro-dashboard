# Agents Collaboration Guide

Multiple agents will work on this Global Markets Macro Dashboard project.

## Project Structure
- `frontend/`: Vite + React + Vanilla CSS. UI is based on TradingView's lightweight-charts and Bloomberg Terminal aesthetics (dark mode, dense data, vibrant colors).
- `backend/`: Python FastAPI. Fetches market data using `yfinance`.

## Agent Roles
- **Frontend Agent**: Focuses on UI/UX, charts, and layout. Make sure to adhere to Vanilla CSS and the dark mode / terminal aesthetic.
- **Backend Agent**: Focuses on data fetching and API optimization. Manages `yfinance` endpoints and any caching layer.
- **Fullstack Agent**: Handles integration between frontend and backend.

## Conventions
- Use absolute paths in tools.
- Discuss any major architectural changes in `agents.md` or `implementation_plan.md` (in the `.gemini` brain directory).

## Design Language
This project strictly follows a **Bloomberg Terminal** aesthetic:
- **Colors**: Deep black background (`#000000`), Dark grey panels (`#111111`).
- **Typography**: Monospace fonts (`Courier New` or similar) for all text.
- **Accents**: 
  - Primary text is Bloomberg Amber/Orange (`#FF8F00`).
  - Secondary text / Positive indicators are Vibrant Green (`#00E676`).
- **Styling**: Vanilla CSS only. No Tailwind or other utility frameworks. Use CSS variables defined in `:root` for consistency.

## Todo

### In Progress
- [ ] **Watchlist performance** — charts re-render on every tab switch. Fix by memoizing chart components (e.g. `React.memo`, `useMemo`) or keeping the watchlist tab mounted but hidden (`display: none`) so chart state is preserved.

### Upcoming
- [ ] **Macro data** — new page/section for macroeconomic indicators (e.g. CPI, GDP, unemployment, Fed rate). Needs new backend endpoints and a dedicated frontend view.

---

## Implemented Features
- **Backend (`FastAPI` + `yfinance`)**: Serves historical market data to the frontend via `/api/data/{ticker}`. Accepts `period` and `interval` parameters.
- **Frontend (`Vite React` + `SWC`)**:
  - Custom user dashboard allowing dynamic addition of charts via ticker symbol.
  - Interactive charts powered by `lightweight-charts` (Version 5.x, using `.addSeries(LineSeries)`).
  - Timeframe toggling controls for each chart (1M, 6M, 1Y, 5Y).
