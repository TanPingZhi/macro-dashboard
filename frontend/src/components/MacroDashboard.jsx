import React, { useEffect, useState, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';

export const MacroDashboard = () => {
  const [data, setData] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isReal, setIsReal] = useState(false);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const overlayTimeoutRef = useRef(null);

  useEffect(() => {
    // Determine the base URL dynamically or use the dev server
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    fetch(`${baseUrl}/api/macro/gdp`)
      .then(res => {
          if (!res.ok) throw new Error('Failed to fetch data');
          return res.json();
      })
      .then(json => setData(json.data))
      .catch(err => setError(err.message));

    fetch(`${baseUrl}/api/macro/gdp/breakdowns`)
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json) setBreakdownData(json.data); })
      .catch(err => console.error("Breakdown data error", err));
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !chartContainerRef.current) return;

    if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
    }
    
    chartContainerRef.current.innerHTML = '';
    
    const newChart = createChart(chartContainerRef.current, {
        layout: {
            background: { type: 'solid', color: '#111111' },
            textColor: '#FF8F00',
            fontFamily: '"Courier New", Courier, monospace'
        },
        grid: {
            vertLines: { color: '#222' },
            horzLines: { color: '#222' },
        },
        rightPriceScale: {
            borderColor: '#333',
        },
        timeScale: {
            borderColor: '#333',
            timeVisible: false,
        },
    });
    
    chartRef.current = newChart;

    const handleWheel = (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            e.stopPropagation();
            setShowOverlay(true);
            if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
            overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 1500);
        } else {
            setShowOverlay(false);
        }
    };
    
    if (chartContainerRef.current) {
        chartContainerRef.current.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    }

    const addLine = (key, color, name) => {
        const series = newChart.addSeries(LineSeries, {
            color,
            lineWidth: 2,
            title: name,
        });
        const seriesData = data.map(d => ({
            time: d.time,
            value: d[key]
        }));
        series.setData(seriesData);
    };

    if (isReal) {
        addLine('GDPC1', '#FF8F00', 'Real GDP');
        addLine('PCECC96', '#00E676', 'Real C');
        addLine('GPDIC1', '#2196F3', 'Real I');
        addLine('GCEC1', '#E91E63', 'Real G');
        addLine('NETEXPC1', '#9C27B0', 'Real NX');
    } else {
        addLine('GDP', '#FF8F00', 'Nominal GDP');
        addLine('PCE', '#00E676', 'Nominal C');
        addLine('GPDI', '#2196F3', 'Nominal I');
        addLine('GCE', '#E91E63', 'Nominal G');
        addLine('NETEXP', '#9C27B0', 'Nominal NX');
    }

    newChart.timeScale().fitContent();

    const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize to fit container properly
    handleResize();
    
    const container = chartContainerRef.current;
    
    return () => {
        window.removeEventListener('resize', handleResize);
        if (container) {
            container.removeEventListener('wheel', handleWheel, { capture: true });
        }
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }
        if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [data, isReal]);

  if (error) return <div style={{ color: 'red', fontFamily: 'monospace', padding: '20px' }}>Error loading data: {error}</div>;
  if (!data) return <div style={{ color: '#FF8F00', fontFamily: 'monospace', padding: '20px' }}>LOADING MACRO DATA...</div>;

  const latest = data[data.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h2 style={{ color: '#FF8F00', margin: 0, fontFamily: 'monospace' }}>MACROECONOMIC INDICATORS</h2>
        <div>
           <button 
             onClick={() => setIsReal(false)} 
             style={{ 
                 background: !isReal ? '#333' : '#111', 
                 color: !isReal ? '#FF8F00' : '#888', 
                 border: '1px solid #333', 
                 padding: '5px 15px', 
                 cursor: 'pointer',
                 fontFamily: 'monospace',
                 fontWeight: 'bold'
             }}>
             NOMINAL
           </button>
           <button 
             onClick={() => setIsReal(true)} 
             style={{ 
                 background: isReal ? '#333' : '#111', 
                 color: isReal ? '#FF8F00' : '#888', 
                 border: '1px solid #333', 
                 padding: '5px 15px',
                 cursor: 'pointer',
                 fontFamily: 'monospace',
                 marginLeft: '5px',
                 fontWeight: 'bold'
             }}>
             REAL
           </button>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: '400px', marginBottom: '20px', border: '1px solid #333' }}>
        {showOverlay && (
          <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, fontSize: '20px', pointerEvents: 'none',
              fontFamily: 'monospace', opacity: 0.9, transition: 'opacity 0.2s'
          }}>
             Use Ctrl + scroll to zoom the chart
          </div>
        )}
        <div ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
      </div>

      <div style={{ overflowX: 'auto', flexShrink: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#CCC', fontSize: '14px', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#FF8F00' }}>
                <th style={{ padding: '10px' }}>Component</th>
                <th>FRED Series Name</th>
                <th>Nominal ID</th>
                <th>Real (Quarterly) ID</th>
                <th style={{ textAlign: 'right', paddingRight: '10px' }}>Latest Val (Bil $)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px' }}><strong style={{ color: '#FF8F00' }}>GDP</strong> (Total)</td>
                <td>Gross Domestic Product</td>
                <td>GDP</td>
                <td>GDPC1</td>
                <td style={{ textAlign: 'right', paddingRight: '10px', color: '#00E676' }}>{isReal ? latest.GDPC1.toFixed(1) : latest.GDP.toFixed(1)}</td>
              </tr>
              <tr 
                style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selectedComponent === 'C' ? '#222' : 'transparent' }}
                onClick={() => setSelectedComponent('C')}
              >
                <td style={{ padding: '10px' }}><strong style={{ color: '#00E676' }}>C</strong> (Consumption)</td>
                <td>Personal Consumption Expenditures</td>
                <td>PCE</td>
                <td>PCECC96</td>
                <td style={{ textAlign: 'right', paddingRight: '10px', color: '#00E676' }}>{isReal ? latest.PCECC96.toFixed(1) : latest.PCE.toFixed(1)}</td>
              </tr>
              <tr 
                style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selectedComponent === 'I' ? '#222' : 'transparent' }}
                onClick={() => setSelectedComponent('I')}
              >
                <td style={{ padding: '10px' }}><strong style={{ color: '#2196F3' }}>I</strong> (Investment)</td>
                <td>Gross Private Domestic Investment</td>
                <td>GPDI</td>
                <td>GPDIC1</td>
                <td style={{ textAlign: 'right', paddingRight: '10px', color: '#00E676' }}>{isReal ? latest.GPDIC1.toFixed(1) : latest.GPDI.toFixed(1)}</td>
              </tr>
              <tr 
                style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selectedComponent === 'G' ? '#222' : 'transparent' }}
                onClick={() => setSelectedComponent('G')}
              >
                <td style={{ padding: '10px' }}><strong style={{ color: '#E91E63' }}>G</strong> (Government)</td>
                <td>Gov. Consumption & Gross Investment</td>
                <td>GCE</td>
                <td>GCEC1</td>
                <td style={{ textAlign: 'right', paddingRight: '10px', color: '#00E676' }}>{isReal ? latest.GCEC1.toFixed(1) : latest.GCE.toFixed(1)}</td>
              </tr>
              <tr 
                style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selectedComponent === 'NX' ? '#222' : 'transparent' }}
                onClick={() => setSelectedComponent('NX')}
              >
                <td style={{ padding: '10px' }}><strong style={{ color: '#9C27B0' }}>NX</strong> (Net Exports)</td>
                <td>Net Exports of Goods and Services</td>
                <td>NETEXP</td>
                <td>NETEXPC1</td>
                <td style={{ textAlign: 'right', paddingRight: '10px', color: '#00E676' }}>{isReal ? latest.NETEXPC1.toFixed(1) : latest.NETEXP.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
      </div>
      <div style={{ marginTop: '10px', color: '#666', fontSize: '12px', fontFamily: 'monospace', flexShrink: 0 }}>
          * GDP = C + I + G + NX. Data aligns to current quarter via forward-fill of last available data. Output is in Billions of Dollars. Click a component row to view further breakdowns.
      </div>
      
      {selectedComponent && breakdownData && (
          <BreakdownView component={selectedComponent} data={breakdownData} />
      )}
    </div>
  );
};

const BreakdownView = ({ component, data }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const overlayTimeoutRef = useRef(null);
    
    useEffect(() => {
        if (!data || !chartContainerRef.current) return;
        
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }
        
        chartContainerRef.current.innerHTML = '';
        
        const newChart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: '#111111' },
                textColor: '#FF8F00',
                fontFamily: '"Courier New", Courier, monospace'
            },
            grid: {
                vertLines: { color: '#222' },
                horzLines: { color: '#222' },
            },
            rightPriceScale: { borderColor: '#333' },
            timeScale: { borderColor: '#333', timeVisible: false },
        });
        chartRef.current = newChart;

        const handleWheel = (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.stopPropagation();
                setShowOverlay(true);
                if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
                overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 1500);
            } else {
                setShowOverlay(false);
            }
        };
        
        if (chartContainerRef.current) {
            chartContainerRef.current.addEventListener('wheel', handleWheel, { capture: true, passive: false });
        }
        
        const addLine = (key, color, name) => {
            const series = newChart.addSeries(LineSeries, {
                color,
                lineWidth: 2,
                title: name,
            });
            const seriesData = data.map(d => ({
                time: d.time,
                value: d[key]
            })).filter(d => typeof d.value === 'number' && !isNaN(d.value));
            series.setData(seriesData);
        };
        
        if (component === 'C') {
            addLine('PCDG', '#00E676', 'Durable Goods');
            addLine('PCND', '#2196F3', 'Nondurables');
            addLine('PCESV', '#E91E63', 'Services');
        } else if (component === 'I') {
            addLine('PNFI', '#00E676', 'Business Fixed');
            addLine('PRFI', '#2196F3', 'Residential');
            addLine('CBI', '#E91E63', 'Inventory Change');
        } else if (component === 'G') {
            addLine('FGCE', '#00E676', 'Federal Total');
            addLine('FDEFX', '#2196F3', 'Fed Defense');
            addLine('FNDEFX', '#E91E63', 'Fed Non-Defense');
            addLine('SLCE', '#9C27B0', 'State & Local');
        } else if (component === 'NX') {
            addLine('EX_CONS', '#00E676', 'Exp Consumer');
            addLine('EX_IND', '#2196F3', 'Exp Industrial');
            addLine('EX_FOOD', '#E91E63', 'Exp Food');
            addLine('IM_CAP', '#9C27B0', 'Imp Capital (Ex Auto)');
            addLine('IM_IND', '#FF9800', 'Imp Industrial');
            addLine('IM_FOOD', '#00BCD4', 'Imp Food');
        }
        
        newChart.timeScale().fitContent();
        
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        
        const container = chartContainerRef.current;
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (container) {
                container.removeEventListener('wheel', handleWheel, { capture: true });
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        };
    }, [component, data]);
    
    return (
        <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '20px', flexShrink: 0 }}>
            <h3 style={{ color: '#FF8F00', margin: '0 0 10px 0', fontFamily: 'monospace' }}>
                {component} Breakdown (Nominal)
            </h3>
            <div style={{ position: 'relative', height: '300px', border: '1px solid #333' }}>
                {showOverlay && (
                  <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10, fontSize: '16px', pointerEvents: 'none',
                      fontFamily: 'monospace', opacity: 0.9, transition: 'opacity 0.2s'
                  }}>
                     Use Ctrl + scroll to zoom the chart
                  </div>
                )}
                <div ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    );
};
