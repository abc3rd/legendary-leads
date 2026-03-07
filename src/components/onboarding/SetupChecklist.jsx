import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Circle, ChevronDown, ChevronUp, X, Upload, Database, Zap, Sparkles, Download, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    key: 'importLeads',
    icon: Upload,
    title: 'Import your first leads',
    desc: 'Upload a CSV file to get your lead database started.',
    cta: 'Go to Import',
    link: 'Import',
    color: '#54b0e7',
  },
  {
    key: 'viewLeads',
    icon: Database,
    title: 'Browse & filter leads',
    desc: 'Explore your leads, search by category, status, or follower count.',
    cta: 'View Leads',
    link: 'Leads',
    color: '#4acbbf',
  },
  {
    key: 'useAI',
    icon: Sparkles,
    title: 'Try AI Lead Generation',
    desc: 'Use the AI assistant to generate or enrich leads automatically.',
    cta: 'Try AI',
    link: 'Leads',
    color: '#f8d417',
  },
  {
    key: 'createSequence',
    icon: Zap,
    title: 'Set up a follow-up sequence',
    desc: 'Automate email or SMS outreach when leads change status.',
    cta: 'Create Sequence',
    link: 'Sequences',
    color: '#f66c25',
  },
  {
    key: 'exportCSV',
    icon: Download,
    title: 'Export your leads',
    desc: 'Download your filtered leads as a CSV file for external use.',
    cta: 'Export Now',
    link: 'Leads',
    color: '#a78bfa',
  },
];

export default function SetupChecklist({ checklist, completedCount, totalCount, onMarkChecked, onDismiss }) {
  const [open, setOpen] = useState(true);
  const allDone = completedCount === totalCount;

  return (
    <div className="mb-6 rounded-xl overflow-hidden" style={{ border: '2px solid #4acbbf', background: 'rgba(10,25,41,0.95)' }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {allDone
            ? <Trophy className="h-5 w-5" style={{ color: '#f8d417' }} />
            : <div className="relative h-8 w-8">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(74,203,191,0.2)" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="12" fill="none"
                    stroke="#4acbbf" strokeWidth="3"
                    strokeDasharray={`${(completedCount / totalCount) * 75.4} 75.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: '#4acbbf' }}>
                  {completedCount}/{totalCount}
                </span>
              </div>
          }
          <div className="text-left">
            <p className="font-bold text-sm" style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
              {allDone ? '🎉 Setup Complete!' : 'Getting Started'}
            </p>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>
              {allDone ? 'You\'re all set to find legendary leads.' : `${totalCount - completedCount} steps remaining`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="h-4 w-4" style={{ color: '#4acbbf' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#4acbbf' }} />}
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="p-1 rounded hover:bg-white/10"
            title="Dismiss checklist"
          >
            <X className="h-3.5 w-3.5" style={{ color: '#5e6a78' }} />
          </button>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(74,203,191,0.2)' }}>
              <div className="space-y-2">
                {STEPS.map((step) => {
                  const done = checklist[step.key];
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.key}
                      className="flex items-center gap-3 p-2.5 rounded-lg transition-all"
                      style={{
                        background: done ? 'rgba(74,203,191,0.06)' : 'transparent',
                        opacity: done ? 0.7 : 1,
                      }}
                    >
                      <div className="flex-shrink-0">
                        {done
                          ? <CheckCircle className="h-5 w-5" style={{ color: '#4acbbf' }} />
                          : <Circle className="h-5 w-5" style={{ color: '#5e6a78' }} />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: done ? '#9ea7b5' : '#fff', textDecoration: done ? 'line-through' : 'none' }}>
                          {step.title}
                        </p>
                        <p className="text-xs" style={{ color: '#5e6a78' }}>{step.desc}</p>
                      </div>
                      {!done && (
                        <Link
                          to={createPageUrl(step.link)}
                          onClick={() => onMarkChecked(step.key)}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                          style={{ background: `${step.color}22`, color: step.color, border: `1px solid ${step.color}44` }}
                        >
                          {step.cta}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}