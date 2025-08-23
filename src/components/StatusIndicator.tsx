import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { SensorData, getLastSeenEstimate, parseTimestamp } from '@/lib/firebase';

interface StatusIndicatorProps {
  data: SensorData | null;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ data }) => {
  const isOnline = data && data.status === 'online';
  const lastSeen = data?.timestamp ? new Date(data.timestamp) : null;

  const getLastSeenText = () => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card/50 backdrop-blur-sm border border-card-border rounded-xl">
      {/* System Status */}
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="font-medium">
          System {isOnline ? 'Online' : 'Offline'}
        </span>
        {isOnline && (
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        )}
      </div>

      {/* Last Seen */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Last seen: {getLastSeenText()}</span>
      </div>

      {/* Real-time indicator */}
      {isOnline && (
        <div className="flex items-center gap-2 text-sm text-success">
          <div className="relative">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-success rounded-full animate-ping"></div>
          </div>
          <span>Live data</span>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;