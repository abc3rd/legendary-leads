import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SplashScreen from '../components/ui/SplashScreen';
import { motion } from 'framer-motion';

const DRAGON_IMG = "https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/c30aff37b_Gemini_Generated_Image_kupphwkupphwkupp1.png";

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);
  const navigate = useNavigate();

  const handleSplashComplete = () => {
    setSplashDone(true);
    // Auto-redirect to Dashboard after splash
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Fallback landing in case navigation is delayed */}
      {splashDone && (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0d0d1a' }}>
          <motion.img
            src={DRAGON_IMG}
            alt="Omega Dragon"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 0 12px #ea00ea)' }}
          />
          <p style={{ color: '#c3c3c3', marginTop: 16 }}>Loading...</p>
        </div>
      )}
    </>
  );
}