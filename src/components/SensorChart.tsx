import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { HistoricalData, fetchHistoricalData } from '@/lib/firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface SensorChartProps {
  type: 'temperature' | 'humidity' | 'airpurity';
  isVisible: boolean;
}

const SensorChart: React.FC<SensorChartProps> = ({ type, isVisible }) => {
  const [selectedRange, setSelectedRange] = useState('24H');
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<ChartJS<'line'>>(null);

  const ranges = ['Live', '24H', '7D', '15D', '30D'];

  const getChartColor = () => {
    switch (type) {
      case 'temperature':
        return {
          primary: 'rgb(239, 68, 68)', // red
          secondary: 'rgba(239, 68, 68, 0.1)'
        };
      case 'humidity':
        return {
          primary: 'rgb(59, 130, 246)', // blue
          secondary: 'rgba(59, 130, 246, 0.1)'
        };
      case 'airpurity':
        return {
          primary: 'rgb(16, 185, 129)', // emerald
          secondary: 'rgba(16, 185, 129, 0.1)'
        };
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'temperature':
        return 'Temperature (°C)';
      case 'humidity':
        return 'Humidity (%)';
      case 'airpurity':
        return 'Air Purity (%)';
    }
  };

  const loadChartData = async (range: string) => {
    setLoading(true);
    try {
      const historicalData: HistoricalData = await fetchHistoricalData(range);
      
      const sortedEntries = Object.entries(historicalData)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

      const labels = sortedEntries.map(([timestamp]) => {
        const date = new Date(timestamp);
        if (range === 'Live' || range === '24H') {
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        } else {
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit'
          });
        }
      });

      const values = sortedEntries.map(([, data]) => data[type]);
      const colors = getChartColor();

      setChartData({
        labels,
        datasets: [
          {
            label: getLabel(),
            data: values,
            borderColor: colors.primary,
            backgroundColor: colors.secondary,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadChartData(selectedRange);
    }
  }, [isVisible, selectedRange, type]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: getChartColor().primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `Time: ${context[0].label}`;
          },
          label: (context) => {
            const unit = type === 'temperature' ? '°C' : '%';
            return `${getLabel()}: ${context.parsed.y}${unit}`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x'
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: 8
        }
      },
      y: {
        min: 0,
        max: type === 'temperature' ? 50 : 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            const unit = type === 'temperature' ? '°C' : '%';
            return `${value}${unit}`;
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: getChartColor().primary
      }
    }
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mt-6 space-y-4 animate-fade-in">
      {/* Range Selector */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`range-button ${selectedRange === range ? 'active' : ''}`}
            >
              {range}
            </button>
          ))}
        </div>
        <button
          onClick={resetZoom}
          className="range-button"
          title="Reset Zoom"
        >
          Reset Zoom
        </button>
      </div>

      {/* Chart Container */}
      <div className="chart-container">
        <div className="h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chartData ? (
            <Line 
              ref={chartRef}
              data={chartData} 
              options={chartOptions}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Chart Info */}
      <div className="text-xs text-muted-foreground text-center">
        Use mouse wheel to zoom • Drag to pan • Click "Reset Zoom" to reset
      </div>
    </div>
  );
};

export default SensorChart;