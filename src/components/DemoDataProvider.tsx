import React, { useEffect, useState } from 'react';
import { SensorData } from '@/lib/firebase';

// Demo data for testing when Firebase is not configured
const DemoDataProvider: React.FC = () => {
  const [demoRunning, setDemoRunning] = useState(false);

  useEffect(() => {
    // Check if Firebase is properly configured by checking the apiKey
    const isFirebaseConfigured = true; // Use real Firebase data now
    
    if (!isFirebaseConfigured && !demoRunning) {
      console.log('Starting demo mode - Firebase not configured');
      setDemoRunning(true);
      const cleanup = startDemoDataSimulation();
      
      // Return cleanup function
      return cleanup;
    } else {
      console.log('Using real Firebase data');
    }
  }, [demoRunning]);

  const startDemoDataSimulation = () => {
    let dataIndex = 0;
    const demoDataPoints: SensorData[] = [
      {
        temperature: 24.5,
        humidity: 68,
        airpurity: 85,
        timestamp: new Date().toISOString(),
        status: 'online'
      },
      {
        temperature: 26.2,
        humidity: 72,
        airpurity: 78,
        timestamp: new Date().toISOString(),
        status: 'online'
      },
      {
        temperature: 31.8, // High temperature - should trigger warning
        humidity: 58, // Low humidity - should trigger warning
        airpurity: 55, // Low air purity - should trigger danger
        timestamp: new Date().toISOString(),
        status: 'online'
      },
      {
        temperature: 23.1,
        humidity: 65,
        airpurity: 82,
        timestamp: new Date().toISOString(),
        status: 'online'
      },
      {
        temperature: 0,
        humidity: 0,
        airpurity: 0,
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        status: 'offline'
      }
    ];

    // Simulate real-time data updates
    const updateInterval = setInterval(() => {
      const currentData = { ...demoDataPoints[dataIndex % demoDataPoints.length] };
      currentData.timestamp = new Date().toISOString();
      
      // Cycle between online and offline status for demo
      if (dataIndex % 10 === 9) {
        // Every 10th update, show offline status
        currentData.status = 'offline';
        currentData.temperature = 0;
        currentData.humidity = 0;
        currentData.airpurity = 0;
      } else {
        currentData.status = 'online';
        
        // Add some random variation to make it feel more realistic
        currentData.temperature += (Math.random() - 0.5) * 2;
        currentData.humidity += (Math.random() - 0.5) * 5;
        currentData.airpurity += (Math.random() - 0.5) * 3;
        
        // Keep values in reasonable ranges
        currentData.temperature = Math.max(15, Math.min(40, currentData.temperature));
        currentData.humidity = Math.max(40, Math.min(90, currentData.humidity));
        currentData.airpurity = Math.max(40, Math.min(100, currentData.airpurity));
      }

      console.log('Demo data update:', currentData); // Debug log
      
      // Trigger custom event with demo data
      window.dispatchEvent(new CustomEvent('demo-sensor-data', {
        detail: currentData
      }));

      dataIndex++;
    }, 3000); // Update every 3 seconds for faster demo

    // Generate historical data
    const generateHistoricalData = () => {
      const historicalData: { [key: string]: SensorData } = {};
      const now = new Date();
      
      // Generate data for the last 30 days
      for (let i = 0; i < 30 * 24; i++) { // 30 days, hourly data
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const baseTemp = 25 + Math.sin(i * 0.2) * 5 + (Math.random() - 0.5) * 3;
        const baseHum = 65 + Math.sin(i * 0.15 + 1) * 15 + (Math.random() - 0.5) * 5;
        const baseAir = 80 + Math.sin(i * 0.1 + 2) * 10 + (Math.random() - 0.5) * 8;
        
        historicalData[timestamp.toISOString()] = {
          temperature: Math.max(15, Math.min(35, baseTemp)),
          humidity: Math.max(40, Math.min(90, baseHum)),
          airpurity: Math.max(50, Math.min(100, baseAir)),
          timestamp: timestamp.toISOString(),
          status: Math.random() > 0.95 ? 'offline' : 'online' // 5% chance of offline
        };
      }
      
      // Store in sessionStorage for demo charts
      sessionStorage.setItem('demo-historical-data', JSON.stringify(historicalData));
    };

    generateHistoricalData();

    // Cleanup function
    return () => {
      clearInterval(updateInterval);
    };
  };

  return null; // This component doesn't render anything
};

export default DemoDataProvider;
