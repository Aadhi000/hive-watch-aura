import React from 'react';
import { Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';
import { SensorData, SENSOR_THRESHOLDS } from '@/lib/firebase';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'airpurity';
  data: SensorData | null;
  onClick: () => void;
}

const SensorCard: React.FC<SensorCardProps> = ({ type, data, onClick }) => {
  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-8 h-8" />;
      case 'humidity':
        return <Droplets className="w-8 h-8" />;
      case 'airpurity':
        return <Wind className="w-8 h-8" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'temperature':
        return 'Temperature';
      case 'humidity':
        return 'Humidity';
      case 'airpurity':
        return 'Air Purity';
    }
  };

  const getValue = () => {
    if (!data) return '--';
    return data[type];
  };

  const getUnit = () => {
    switch (type) {
      case 'temperature':
        return '°C';
      case 'humidity':
      case 'airpurity':
        return '%';
    }
  };

  const getStatus = () => {
    if (!data || data.status === 'offline') return 'offline';
    
    const value = data[type];
    const thresholds = SENSOR_THRESHOLDS[type];
    
    if (type === 'temperature') {
      const tempThresh = thresholds as { min: number; max: number };
      if (value < tempThresh.min || value > tempThresh.max) return 'danger';
      if (value < tempThresh.min * 1.1 || value > tempThresh.max * 0.9) return 'warning';
    } else {
      if (value < thresholds.min) return 'danger';
      if (value < thresholds.min * 1.1) return 'warning';
    }
    
    return 'normal';
  };

  const getStatusIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-sensor-offline" />;
    }
  };

  const status = getStatus();

  return (
    <div
      className={`sensor-card status-${status} cursor-pointer animate-fade-in`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {getIcon()}
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {getLabel()}
          </h3>
        </div>
        {getStatusIcon()}
      </div>

      {/* Value Display */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-card-foreground">
            {getValue()}
          </span>
          <span className="text-xl text-muted-foreground">
            {getUnit()}
          </span>
        </div>
        
        {/* Status Text */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            status === 'normal' ? 'bg-success' :
            status === 'warning' ? 'bg-warning' :
            status === 'danger' ? 'bg-danger' : 'bg-sensor-offline'
          }`} />
          <span className="capitalize text-muted-foreground">
            {status === 'normal' ? 'Optimal' : 
             status === 'warning' ? 'Caution' :
             status === 'danger' ? 'Critical' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Threshold Indicators */}
      {data && status !== 'offline' && (
        <div className="mt-4 pt-4 border-t border-card-border/50">
          <div className="text-xs text-muted-foreground">
            {type === 'temperature' ? (
              `Optimal: ${SENSOR_THRESHOLDS.temperature.min}°C - ${SENSOR_THRESHOLDS.temperature.max}°C`
            ) : (
              `Minimum: ${SENSOR_THRESHOLDS[type].min}%`
            )}
          </div>
        </div>
      )}

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
    </div>
  );
};

export default SensorCard;