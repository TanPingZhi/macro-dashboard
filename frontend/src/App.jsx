import React, { useState } from 'react';
import { ChartWidget } from './components/ChartWidget';
import { TickerSearch } from './components/TickerSearch';
import { MarketColours } from './components/MarketColours';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';

const ResponsiveGridLayout = WidthProvider(Responsive);

const PAGES = {
  DASHBOARD: 'DASHBOARD',
  MARKET_COLOURS: 'MARKET_COLOURS',
};

function App() {
  const [activePage, setActivePage] = useState(PAGES.DASHBOARD);
  const [charts, setCharts] = useState([
    { i: 'AAPL', ticker: 'AAPL', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 2 },
    { i: 'TSLA', ticker: 'TSLA', x: 6, y: 0, w: 6, h: 2, minW: 2, minH: 2 }
  ]);

  const addChart = (ticker) => {
    const id = ticker.replace(/[^A-Z0-9]/g, '_');
    if (!charts.find(c => c.ticker === ticker)) {
      setCharts(prev => [...prev, { 
        i: id,
        ticker,
        x: (charts.length * 6) % 12, 
        y: Infinity,
        w: 6, 
        h: 2,
        minW: 2,
        minH: 2
      }]);
    }
  };

  const handleRemoveChart = (tickerToRemove) => {
    setCharts(charts.filter(c => c.i !== tickerToRemove));
  };

  const onLayoutChange = (layout) => {
    const newCharts = charts.map(chart => {
      const match = layout.find(l => l.i === chart.i);
      if (match) {
        return { ...chart, x: match.x, y: match.y, w: match.w, h: match.h };
      }
      return chart;
    });
    setCharts(newCharts);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-title">GLOBAL MARKETS TERMINAL</div>
          <nav className="header-nav">
            <button
              className={`nav-tab ${activePage === PAGES.DASHBOARD ? 'active' : ''}`}
              onClick={() => setActivePage(PAGES.DASHBOARD)}
            >
              WATCHLIST
            </button>
            <button
              className={`nav-tab ${activePage === PAGES.MARKET_COLOURS ? 'active' : ''}`}
              onClick={() => setActivePage(PAGES.MARKET_COLOURS)}
            >
              MARKET COLOURS
            </button>
          </nav>
        </div>
        {activePage === PAGES.DASHBOARD && <TickerSearch onAdd={addChart} />}
      </div>

      {activePage === PAGES.DASHBOARD && (
        <div className="charts-grid-wrapper" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: charts, md: charts, sm: charts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={240}
            onLayoutChange={onLayoutChange}
            draggableHandle=".chart-header"
            margin={[15, 15]}
            isResizable={true}
            isDraggable={true}
            resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'n', 'e', 'w']}
          >
            {charts.map(chart => (
              <div key={chart.i} style={{ height: '100%' }}>
                <ChartWidget 
                  id={chart.i}
                  ticker={chart.ticker || chart.i} 
                  onRemove={() => handleRemoveChart(chart.i)} 
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {activePage === PAGES.MARKET_COLOURS && <MarketColours />}
    </div>
  );
}

export default App;
