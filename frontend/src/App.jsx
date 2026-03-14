import React, { useState } from 'react';
import { ChartWidget } from './components/ChartWidget';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';

function App() {
  // Using an array of objects to maintain grid state, position, and sizing
  const [charts, setCharts] = useState([
    { i: 'AAPL', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 2 },
    { i: 'TSLA', x: 2, y: 0, w: 2, h: 2, minW: 1, minH: 2 }
  ]);
  const [inputValue, setInputValue] = useState('');
  const { width, containerRef } = useContainerWidth();

  const handleAddChart = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const ticker = inputValue.trim().toUpperCase();
      if (!charts.find(c => c.i === ticker)) {
        // Find next available X position dynamically based on items (basic append)
        setCharts([...charts, { 
          i: ticker, 
          x: (charts.length * 2) % 6, 
          y: Infinity, // automatically drops to bottom if no space
          w: 2, 
          h: 2,
          minW: 1,
          minH: 2
        }]);
      }
      setInputValue('');
    }
  };

  const handleRemoveChart = (tickerToRemove) => {
    setCharts(charts.filter(c => c.i !== tickerToRemove));
  };

  const onLayoutChange = (layout) => {
    // Keep internal state synched with drag-and-drop / resize actions
    const newCharts = charts.map(chart => {
      const match = layout.find(l => l.i === chart.i);
      if(match) {
        return { ...chart, x: match.x, y: match.y, w: match.w, h: match.h };
      }
      return chart;
    });
    setCharts(newCharts);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">GLOBAL MARKETS TERMINAL // MACRO DASHBOARD</div>
        <form className="header-controls" onSubmit={handleAddChart}>
          <input
            type="text"
            className="terminal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ENTER TICKER (E.G. AAPL)"
          />
          <button type="submit" className="terminal-btn">ADD CHART</button>
        </form>
      </div>
      
      <div className="charts-grid-wrapper" ref={containerRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={{ lg: charts, md: charts, sm: charts }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={240}
          onLayoutChange={onLayoutChange}
          draggableHandle=".chart-header"
          margin={[15, 15]}
          resizeHandles={['se', 'sw', 'ne', 'nw']}
        >
          {charts.map(chart => (
            <ChartWidget 
              key={chart.i}
              data-grid={chart}
              id={chart.i}
              ticker={chart.i} 
              onRemove={() => handleRemoveChart(chart.i)} 
            />
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

export default App;
