import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DRAGON_IMG = "https://media.base44.com/images/public/691ccbe8057765b3fc1fdb65/c30aff37b_Gemini_Generated_Image_kupphwkupphwkupp1.png";

export default function AnimatedHorse({ isThinking = false, className = "" }) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isThinking]);

  const animations = [
    { rotate: [0, -6, 6, -4, 0], y: [0, -4, 0], transition: { duration: 0.8 } },
    { y: [0, -10, -6, -10, 0], rotate: [0, 3, -3, 0], transition: { duration: 0.9 } },
    { x: [0, 3, -3, 3, 0], y: [0, -3, 0, -3, 0], transition: { duration: 0.7 } },
    { rotate: [0, 5, -5, 3, -3, 0], transition: { duration: 1 } },
    { scale: [1, 1.08, 0.97, 1.05, 1], y: [0, -6, 0], transition: { duration: 0.9 } },
  ];

  const currentAnimation = animations[animationKey % animations.length];

  return (
    <motion.div
      key={animationKey}
      className={`relative ${className}`}
      animate={isThinking ? currentAnimation : {}}
      initial={{ rotate: 0, x: 0, y: 0, scale: 1 }}
      style={{ filter: isThinking ? 'drop-shadow(0 0 12px #ea00ea) drop-shadow(0 0 24px #ea00ea88)' : 'drop-shadow(0 0 6px #ea00ea55)' }}
    >
      <img
        src={DRAGON_IMG}
        alt="Omega Dragon"
        className="w-full h-full object-contain"
      />
      {isThinking && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(234,0,234,0.25) 0%, transparent 70%)' }}
        />
      )}
    </motion.div>
  );
}