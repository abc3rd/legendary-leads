import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DRAGON_IMG = "https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/c30aff37b_Gemini_Generated_Image_kupphwkupphwkupp1.png";

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // enter → glow → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 800);
    const t2 = setTimeout(() => setPhase('exit'), 2400);
    const t3 = setTimeout(() => onComplete?.(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#0d0d1a' }}
        >
          {/* Ambient glow behind dragon */}
          <motion.div
            className="absolute rounded-full"
            style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(234,0,234,0.35) 0%, transparent 70%)' }}
            animate={phase === 'glow' ? { scale: [1, 1.3, 1.1], opacity: [0.5, 1, 0.7] } : {}}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Dragon logo */}
          <motion.img
            src={DRAGON_IMG}
            alt="Omega Dragon"
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={
              phase === 'enter' ? { scale: 1, opacity: 1, y: 0 } :
              phase === 'glow'  ? { scale: [1, 1.06, 1], opacity: 1, y: [0, -6, 0] } :
              { scale: 1.1, opacity: 0, y: -20 }
            }
            transition={{ duration: phase === 'enter' ? 0.7 : 1.2, ease: 'easeOut' }}
            style={{
              width: 200, height: 200, objectFit: 'contain', position: 'relative',
              filter: phase === 'glow'
                ? 'drop-shadow(0 0 20px #ea00ea) drop-shadow(0 0 40px #ea00eaaa)'
                : 'drop-shadow(0 0 8px #ea00ea66)'
            }}
          />

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase === 'exit' ? 0 : 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <h1 style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #ea00ea 0%, #c3c3c3 50%, #ea00ea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em'
            }}>
              Legendary Leads
            </h1>
            <p style={{ color: '#c3c3c3', fontSize: '0.8rem', marginTop: 4, letterSpacing: '0.2em', opacity: 0.7 }}>
              OMEGA UI LLC · SYNCLOUD CONNECT
            </p>
          </motion.div>

          {/* Animated ring */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{ width: 260, height: 260, borderColor: 'rgba(234,0,234,0.3)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{ width: 310, height: 310, borderColor: 'rgba(195,195,195,0.15)' }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />

          {/* Bottom loading bar */}
          <motion.div
            className="absolute bottom-12 rounded-full overflow-hidden"
            style={{ width: 160, height: 3, background: 'rgba(234,0,234,0.2)' }}
          >
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #ea00ea, #c3c3c3, #ea00ea)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}