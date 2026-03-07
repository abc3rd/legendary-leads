import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Upload, Database, Zap, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SLIDES = [
  {
    icon: Sparkles,
    color: '#f8d417',
    title: 'Welcome to Legendary Leads! 🎉',
    desc: 'Your all-in-one platform for finding, managing, and converting Instagram influencer leads. Let\'s take a quick tour.',
  },
  {
    icon: MessageSquare,
    color: '#4acbbf',
    title: 'Meet GLYTCH — Your AI Butler',
    desc: 'Ask GLYTCH anything in plain English. "Find fitness coaches with 50k+ followers" or "Show me leads with email addresses." It searches your entire database instantly.',
  },
  {
    icon: Upload,
    color: '#54b0e7',
    title: 'Import Leads in Seconds',
    desc: 'Upload a CSV file with your leads. The importer auto-detects columns and validates emails & phone numbers. Supports thousands of records at once.',
  },
  {
    icon: Database,
    color: '#f66c25',
    title: 'Manage & Enrich Your Pipeline',
    desc: 'Browse all leads, filter by category, status, or follower count. Use the AI Enrich button to automatically fill in missing emails, websites, and bios.',
  },
  {
    icon: Zap,
    color: '#a78bfa',
    title: 'Automate Follow-Ups',
    desc: 'Create sequences that automatically send emails or SMS messages when a lead changes status — from "New" to "Contacted" to "Converted."',
  },
];

export default function FeatureTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = SLIDES[step];
  const Icon = current.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,25,41,0.92)', backdropFilter: 'blur(6px)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 relative"
          style={{ background: 'linear-gradient(135deg, #0d2137 0%, #1a2e45 100%)', border: `2px solid ${current.color}` }}
        >
          {/* Close */}
          <button
            onClick={onComplete}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" style={{ color: '#5e6a78' }} />
          </button>

          {/* Icon */}
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{ background: `${current.color}18`, border: `2px solid ${current.color}40` }}>
            <Icon className="h-8 w-8" style={{ color: current.color }} />
          </div>

          {/* Content */}
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-3" style={{ fontFamily: 'Poppins, sans-serif', color: '#fff' }}>
            {current.title}
          </h2>
          <p className="text-center text-sm leading-relaxed mb-8" style={{ color: '#9ea7b5' }}>
            {current.desc}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 8,
                  height: 8,
                  background: i === step ? current.color : 'rgba(94,106,120,0.5)'
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                onClick={() => setStep(s => s - 1)}
                variant="ghost"
                className="flex-1"
                style={{ color: '#9ea7b5', border: '1px solid rgba(94,106,120,0.3)' }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button
              onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
              className="flex-1 font-semibold"
              style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`, color: '#0a1929' }}
            >
              {isLast ? '🚀 Get Started' : <>Next <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={onComplete}
              className="w-full text-center mt-3 text-xs"
              style={{ color: '#5e6a78' }}
            >
              Skip tour
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}