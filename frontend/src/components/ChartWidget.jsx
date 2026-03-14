import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

// Note: react-grid-layout automatically injects style, className, etc. into this component
// However, the draggableHandle prop in App.jsx means you need to add the `className="chart-header"` properly.
export const ChartWidget = React.forwardRef(({ id, ticker, onRemove, style, className, children, ...rest }, ref) => {
  return (
    <div ref={ref} style={{ ...style, cursor: 'default' }} className={`chart-panel ${className || ''}`} {...rest}>
      <div className="chart-header" style={{ cursor: 'grab' }}>
        <div className="chart-title">{ticker}</div>
        <div className="chart-close" onPointerDown={(e) => e.stopPropagation()} onClick={onRemove}>[X]</div>
      </div>
      <div className="chart-content">
        <AdvancedRealTimeChart 
          symbol={ticker}
          theme="dark"
          autosize
          allow_symbol_change={false}
          hide_side_toolbar={false}
          backgroundColor="#111111"
        />
      </div>
      {children}
    </div>
  );
});
