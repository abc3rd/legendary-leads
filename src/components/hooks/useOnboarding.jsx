import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'll_onboarding_v1';

const DEFAULT_STATE = {
  completed: false,
  tourSeen: false,
  checklist: {
    importLeads: false,
    viewLeads: false,
    createSequence: false,
    useAI: false,
    exportCSV: false,
  }
};

export function useOnboarding() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const save = (next) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const markTourSeen = () => save({ ...state, tourSeen: true });

  const markChecked = (key) => {
    const checklist = { ...state.checklist, [key]: true };
    const completed = Object.values(checklist).every(Boolean);
    save({ ...state, checklist, completed });
  };

  const dismiss = () => save({ ...state, completed: true });

  const reset = () => save(DEFAULT_STATE);

  const completedCount = Object.values(state.checklist).filter(Boolean).length;
  const totalCount = Object.keys(state.checklist).length;

  return { state, markTourSeen, markChecked, dismiss, reset, completedCount, totalCount };
}