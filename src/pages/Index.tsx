import Dashboard from '@/components/Dashboard';
import DemoDataProvider from '@/components/DemoDataProvider';
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <>
      <DemoDataProvider />
      <Dashboard />
    </>
  );
};

export default Index;
