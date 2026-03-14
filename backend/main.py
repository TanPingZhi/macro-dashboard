from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

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
        # Expected format for daily: {"time": "yyyy-mm-dd", "value": x}
        # Expected format for intraday: {"time": unix_timestamp, "value": x}
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
