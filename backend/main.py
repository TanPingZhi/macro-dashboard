from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd

app = FastAPI(title="Macro Dashboard API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Macro Dashboard API"}

@app.get("/api/data/{ticker}")
def get_ticker_data(ticker: str, period: str = "1mo", interval: str = "1d"):
    try:
        data = yf.Ticker(ticker)
        df = data.history(period=period, interval=interval)
        if df.empty:
            raise HTTPException(status_code=404, detail="Ticker data not found")
        
        # Format data for TradingView lightweight charts
        formatted_data = []
        is_intraday = interval in ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h']
        
        for index, row in df.iterrows():
            if is_intraday:
                time_val = int(index.timestamp())
            else:
                time_val = index.strftime('%Y-%m-%d')
                
            formatted_data.append({
                "time": time_val,
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "value": row["Close"]
            })
            
        return {"ticker": ticker, "data": formatted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market-colours")
def get_market_colours():
    """
    Returns current price, daily change, and % change for a curated set of
    assets across major indices, sector ETFs, country ETFs, currencies, rates, and commodities.
    """

    assets = {
        "Major Indices": [
            {"ticker": "^GSPC",  "label": "S&P 500"},
            {"ticker": "^NDX",   "label": "Nasdaq 100"},
            {"ticker": "^DJI",   "label": "Dow Jones"},
            {"ticker": "^RUT",   "label": "Russell 2000"},
            {"ticker": "^STOXX50E", "label": "Euro Stoxx 50"},
            {"ticker": "^FTSE",  "label": "FTSE 100"},
            {"ticker": "^N225",  "label": "Nikkei 225"},
            {"ticker": "000001.SS", "label": "Shanghai Comp"},
            {"ticker": "^HSI",   "label": "Hang Seng"},
        ],
        "Sector Indices": [
            {"ticker": "XLK",  "label": "Technology"},
            {"ticker": "XLF",  "label": "Financials"},
            {"ticker": "XLE",  "label": "Energy"},
            {"ticker": "XLV",  "label": "Healthcare"},
            {"ticker": "XLI",  "label": "Industrials"},
            {"ticker": "XLP",  "label": "Cons Staples"},
            {"ticker": "XLY",  "label": "Cons Discret"},
            {"ticker": "XLB",  "label": "Materials"},
            {"ticker": "XLRE", "label": "Real Estate"},
            {"ticker": "XLU",  "label": "Utilities"},
            {"ticker": "XLC",  "label": "Comm Svcs"},
        ],
        "Countries": [
            {"ticker": "EWJ",  "label": "Japan"},
            {"ticker": "EWG",  "label": "Germany"},
            {"ticker": "EWU",  "label": "UK"},
            {"ticker": "EWC",  "label": "Canada"},
            {"ticker": "EWA",  "label": "Australia"},
            {"ticker": "EWZ",  "label": "Brazil"},
            {"ticker": "EWY",  "label": "Korea"},
            {"ticker": "INDA", "label": "India"},
            {"ticker": "FXI",  "label": "China"},
            {"ticker": "EWW",  "label": "Mexico"},
            {"ticker": "EWT",  "label": "Taiwan"},
        ],
        "Currencies": [
            {"ticker": "EURUSD=X",  "label": "EUR/USD"},
            {"ticker": "GBPUSD=X",  "label": "GBP/USD"},
            {"ticker": "JPY=X",     "label": "USD/JPY"},
            {"ticker": "AUDUSD=X",  "label": "AUD/USD"},
            {"ticker": "USDCAD=X",  "label": "USD/CAD"},
            {"ticker": "USDCNH=X",  "label": "USD/CNH"},
            {"ticker": "DX-Y.NYB",  "label": "DXY"},
            {"ticker": "BTC-USD",   "label": "BTC/USD"},
            {"ticker": "ETH-USD",   "label": "ETH/USD"},
        ],
        "Rates": [
            {"ticker": "^TNX",  "label": "US 10Y Yield"},
            {"ticker": "^FVX",  "label": "US 5Y Yield"},
            {"ticker": "^IRX",  "label": "US 3M Yield"},
            {"ticker": "^TYX",  "label": "US 30Y Yield"},
            {"ticker": "TLT",   "label": "US 20Y Bond"},
            {"ticker": "HYG",   "label": "High Yield"},
            {"ticker": "LQD",   "label": "Inv Grade"},
        ],
        "Commodities": [
            {"ticker": "GC=F",  "label": "Gold"},
            {"ticker": "SI=F",  "label": "Silver"},
            {"ticker": "CL=F",  "label": "Crude Oil WTI"},
            {"ticker": "BZ=F",  "label": "Brent Crude"},
            {"ticker": "NG=F",  "label": "Nat Gas"},
            {"ticker": "HG=F",  "label": "Copper"},
            {"ticker": "ZC=F",  "label": "Corn"},
            {"ticker": "ZW=F",  "label": "Wheat"},
            {"ticker": "ZS=F",  "label": "Soybeans"},
        ],
    }

    # Collect all tickers
    all_tickers = []
    for group in assets.values():
        for item in group:
            all_tickers.append(item["ticker"])

    # Fetch last 5 days for all tickers in one call
    try:
        raw = yf.download(all_tickers, period="5d", interval="1d", group_by="ticker", auto_adjust=True, progress=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    def get_change(ticker: str):
        try:
            if len(all_tickers) == 1:
                df = raw
            else:
                df = raw[ticker] if ticker in raw.columns.get_level_values(0) else pd.DataFrame()

            if df is None or df.empty or "Close" not in df.columns:
                return None

            df = df.dropna(subset=["Close"])
            if len(df) < 2:
                return None

            prev_close = float(df["Close"].iloc[-2])
            last_close = float(df["Close"].iloc[-1])
            change = last_close - prev_close
            pct_change = (change / prev_close) * 100 if prev_close != 0 else 0

            return {
                "price": round(last_close, 4),
                "change": round(change, 4),
                "pct_change": round(pct_change, 2),
            }
        except Exception:
            return None

    result = {}
    for group_name, items in assets.items():
        result[group_name] = []
        for item in items:
            data = get_change(item["ticker"])
            result[group_name].append({
                "ticker": item["ticker"],
                "label": item["label"],
                "price": data["price"] if data else None,
                "change": data["change"] if data else None,
                "pct_change": data["pct_change"] if data else None,
            })

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
