import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { get } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4M_ZOMqR9MtSkbgH2SQQvj2QSAFKLOhU",
  authDomain: "beehive-d31e3.firebaseapp.com",
  databaseURL: "https://beehive-d31e3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beehive-d31e3",
  storageBucket: "beehive-d31e3.firebasestorage.app",
  messagingSenderId: "412298384436",
  appId: "1:412298384436:web:469569b024f27482456661",
  measurementId: "G-P6FF4EJC3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const messaging = getMessaging(app);

// Sensor data types
export interface SensorData {
  temperature: number;
  humidity: number;
  airpurity: number;
  timestamp?: string | number;
  status?: 'online' | 'offline';
}

export interface HistoricalData {
  [timestamp: string]: SensorData;
}

// Sensor thresholds for alerts
export const SENSOR_THRESHOLDS = {
  temperature: { min: 18, max: 30 },
  humidity: { min: 60 },
  airpurity: { min: 60 }
};

// Real-time data listener
export const subscribeToSensorData = (callback: (data: SensorData | null) => void) => {
  // Real Firebase implementation
  const sensorRef = ref(database, 'beehive');
  onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Determine status based on timestamp
      const now = new Date();
      const lastUpdate = parseTimestamp(data.timestamp);
      const isOnline = lastUpdate && (now.getTime() - lastUpdate.getTime()) < 5 * 60 * 1000; // 5 minutes
      
      callback({
        ...data,
        status: isOnline ? 'online' : 'offline'
      });
    } else {
      callback(null);
    }
  });
  
  return () => off(sensorRef);
};

// Historical data fetcher
export const fetchHistoricalData = async (range: string): Promise<HistoricalData> => {
  
  return new Promise((resolve) => {
    const historyRef = ref(database, 'history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Filter data based on range
      const now = new Date();
      const filtered: HistoricalData = {};
      
      Object.entries(data).forEach(([timestamp, sensorData]) => {
        const dataTime = new Date(timestamp);
        const diffHours = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);
        
        let includeData = false;
        switch (range) {
          case 'Live':
            includeData = diffHours <= 1;
            break;
          case '24H':
            includeData = diffHours <= 24;
            break;
          case '7D':
            includeData = diffHours <= 168;
            break;
          case '15D':
            includeData = diffHours <= 360;
            break;
          case '30D':
            includeData = diffHours <= 720;
            break;
          default:
            includeData = true;
        }
        
        if (includeData) {
          filtered[timestamp] = sensorData as SensorData;
        }
      });
      
      resolve(filtered);
    }, { onlyOnce: true });
  });
};

// Push notifications setup
export const setupPushNotifications = async (): Promise<string | null> => {
  try {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
    }
    
    const token = await getToken(messaging, {
      vapidKey: 'BKxvZ-qX8yQz8tY5V6wX9uP0qR3sT4v5W6xY7z8A9bC0dE1fG2hI3jK4lM5nO6pQ7rS8tU9vW0xY1z2A3bC4dE5f' // Replace with your actual VAPID key
    });
    
    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      // Play alert sound
      const audio = new Audio('/alert.mp3');
      audio.play().catch(console.error);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Beehive Alert', {
          body: payload.notification?.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        });
      }
    });
    
    return token;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return null;
  }
};

// Check sensor status
export const getSensorStatus = (data: SensorData | null) => {
  if (!data || data.status === 'offline') {
    return 'offline';
  }
  
  const { temperature, humidity, airpurity } = data;
  const { temperature: tempThresh, humidity: humThresh, airpurity: airThresh } = SENSOR_THRESHOLDS;
  
  const tempDanger = temperature < tempThresh.min || temperature > tempThresh.max;
  const humDanger = humidity < humThresh.min;
  const airDanger = airpurity < airThresh.min;
  
  if (tempDanger || humDanger || airDanger) {
    return 'danger';
  }
  
  // Warning for values approaching thresholds (within 10% margin)
  const tempWarning = temperature < tempThresh.min * 1.1 || temperature > tempThresh.max * 0.9;
  const humWarning = humidity < humThresh.min * 1.1;
  const airWarning = airpurity < airThresh.min * 1.1;
  
  if (tempWarning || humWarning || airWarning) {
    return 'warning';
  }
  
  return 'normal';
};

// ---- Time parsing utilities ----
export function parseTimestamp(ts: string | number | undefined | null): Date | null {
  if (ts === undefined || ts === null) return null;
  if (typeof ts === 'number') {
    // Heuristic: seconds vs. milliseconds
    const ms = ts < 1e12 ? ts * 1000 : ts;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(ts).trim();
  // If format is "YYYY-MM-DD HH:MM:SS", normalize to ISO
  let normalized = s;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
    normalized = s.replace(' ', 'T') + 'Z';
  }
  // If it's ISO without timezone, assume UTC
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && !/[Zz]|[+-]\d{2}:\d{2}$/.test(s)) {
    normalized = s + 'Z';
  }
  let d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}


// Estimate last-seen from history if live timestamp is missing/invalid
export const getLastSeenEstimate = async (): Promise<Date | null> => {
  try {
    const historyRef = ref(database, 'history');
    const snap = await get(historyRef);
    const data = snap.val();
    if (!data) return null;
    // Keys are ISO timestamps; simple lexicographic max works
    const keys = Object.keys(data).sort();
    const lastKey = keys[keys.length - 1];
    return parseTimestamp(lastKey);
  } catch (e) {
    console.warn('getLastSeenEstimate failed:', e);
    return null;
  }
};

