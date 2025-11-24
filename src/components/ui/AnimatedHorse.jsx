import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedHorse({ isThinking = false, className = "" }) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!isThinking) return;
    
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 3000); // New gesture every 3 seconds

    return () => clearInterval(interval);
  }, [isThinking]);

  const animations = [
    { rotate: [0, -5, 5, -3, 0], y: [0, -3, 0], transition: { duration: 0.8 } }, // Head shake
    { y: [0, -8, -5, -8, 0], rotate: [0, 2, -2, 0], transition: { duration: 0.9 } }, // Buck
    { x: [0, 2, -2, 2, 0], y: [0, -2, 0, -2, 0], transition: { duration: 0.7 } }, // Prance
    { rotate: [0, 3, -3, 2, -2, 0], transition: { duration: 1 } }, // Toss head
    { scale: [1, 1.03, 0.98, 1.02, 1], y: [0, -4, 0], transition: { duration: 0.8 } } // Rear up
  ];

  const currentAnimation = animations[animationKey % animations.length];

  return (
    <motion.img
      key={animationKey}
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691ccbe8057765b3fc1fdb65/dd282f7ea_LL-Logo1024x1024.png"
      alt="Glytch"
      className={className}
      animate={isThinking ? currentAnimation : {}}
      initial={{ rotate: 0, x: 0, y: 0, scale: 1 }}
    />
  );
}