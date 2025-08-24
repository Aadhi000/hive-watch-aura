import React, { useState, useEffect } from 'react';
import { Activity, Settings, Bell, BellOff } from 'lucide-react';
import SensorCard from './SensorCard';
import SensorChart from './SensorChart';
import StatusIndicator from './StatusIndicator';
import ThemeToggle from './ThemeToggle';
import { SensorData, subscribeToSensorData, setupPushNotifications, getSensorStatus } from '@/lib/firebase';

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);

  useEffect(() => {
    // Subscribe to real-time sensor data
    const unsubscribe = subscribeToSensorData((data) => {
      setSensorData(data);
      
      // Check for alerts
      if (data && notificationsEnabled) {
        const status = getSensorStatus(data);
        const now = Date.now();
        
        // Only alert if it's been more than 5 minutes since last alert
        if (status === 'danger' && now - lastAlertTime > 5 * 60 * 1000) {
          playAlertSound();
          setLastAlertTime(now);
        }
      }
    });

    // Setup notifications
    const savedNotificationPref = localStorage.getItem('beehive-notifications');
    if (savedNotificationPref === 'true') {
      enableNotifications();
    }

    return unsubscribe;
  }, [notificationsEnabled, lastAlertTime]);

  const playAlertSound = () => {
    // Create audio context for alert sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  };

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await setupPushNotifications();
        setNotificationsEnabled(true);
        localStorage.setItem('beehive-notifications', 'true');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('beehive-notifications', 'false');
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      disableNotifications();
    } else {
      enableNotifications();
    }
  };

  const handleCardClick = (type: string) => {
    setExpandedChart(expandedChart === type ? null : type);
  };

  const getSystemHealth = () => {
    if (!sensorData) return 'offline';
    
    const status = getSensorStatus(sensorData);
    return status;
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-card-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Beehive Monitor</h1>
                <p className="text-sm text-muted-foreground">Real-time IoT Dashboard</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Notification Toggle */}
              <button
                onClick={toggleNotifications}
                className={`theme-toggle ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                title={`${notificationsEnabled ? 'Disable' : 'Enable'} notifications`}
              >
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Settings */}
              <button className="theme-toggle" title="Settings">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* System Status */}
        <section className="animate-slide-in">
          <StatusIndicator data={sensorData} />
        </section>

        {/* Alert Banner */}
        {systemHealth === 'danger' && sensorData && (
          <section className="animate-fade-in">
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
                <div>
                  <h3 className="text-danger font-semibold">Critical Alert</h3>
                  <p className="text-sm text-danger/80">
                    One or more sensors are reporting critical values. Please check your beehive immediately.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sensor Cards Grid */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Sensor Readings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <div className="space-y-4">
              <SensorCard
                type="temperature"
                data={sensorData}
                onClick={() => handleCardClick('temperature')}
              />
              <SensorChart
                type="temperature"
                isVisible={expandedChart === 'temperature'}
              />
            </div>

            {/* Humidity Card */}
            <div className="space-y-4">
              <SensorCard
                type="humidity"
                data={sensorData}
                onClick={() => handleCardClick('humidity')}
              />
              <SensorChart
                type="humidity"
                isVisible={expandedChart === 'humidity'}
              />
            </div>

            {/* Air Purity Card */}
            <div className="space-y-4">
              <SensorCard
                type="airpurity"
                data={sensorData}
                onClick={() => handleCardClick('airpurity')}
              />
              <SensorChart
                type="airpurity"
                isVisible={expandedChart === 'airpurity'}
              />
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="mt-12 p-6 bg-card/30 border border-card-border rounded-xl">
          <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Click on any sensor card to view historical data charts</p>
            <p>• Enable notifications to receive alerts for critical conditions</p>
            <p>• Use the theme toggle to switch between light and dark modes</p>
            <p>• Install this app on your phone by tapping "Add to Home Screen"</p>
          </div>
          
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning-foreground">
              <strong>Setup Required:</strong> Configure your Firebase project settings in 
              <code className="mx-1 px-2 py-1 bg-warning/20 rounded">src/lib/firebase.ts</code> 
              to connect to your real sensor data.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-card-border">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Beehive Monitor PWA - Real-time IoT Monitoring System</p>
            <p className="mt-1">Built with React, TypeScript, and Firebase</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;