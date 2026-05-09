import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, RefreshCw } from 'lucide-react';

const GRADE_CONFIG = {
  A: { color: '#2ecc71', bg: 'rgba(46,204,113,0.15)', label: 'Hot Lead' },
  B: { color: '#4acbbf', bg: 'rgba(74,203,191,0.15)', label: 'Warm Lead' },
  C: { color: '#f8d417', bg: 'rgba(248,212,23,0.15)', label: 'Neutral' },
  D: { color: '#f66c25', bg: 'rgba(246,108,37,0.15)', label: 'Cold Lead' },
  F: { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)', label: 'Low Priority' },
};

function ScoreRing({ score, grade }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['C'];
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const fill = circ * (score / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-xs font-bold" style={{ color: cfg.color }}>{score}</span>
        <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{grade}</span>
      </div>
    </div>
  );
}

export default function LeadScoreBadge({ lead, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const hasScore = lead.lead_score !== undefined && lead.lead_score !== null;
  const grade = lead.lead_grade || 'C';
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['C'];

  const analyze = async (e) => {
    e.stopPropagation();
    setLoading(true);
    await base44.functions.invoke('calculateLeadScore', { lead_id: lead.id });
    setLoading(false);
    if (onUpdated) onUpdated();
  };

  if (!hasScore) {
    return (
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all mt-2"
        style={{ background: 'rgba(248,212,23,0.1)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.3)' }}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
        {loading ? 'Scoring...' : 'Calculate Score'}
      </button>
    );
  }

  return (
    <div className="mt-2">
      <div
        className="flex items-center gap-2 cursor-pointer rounded-xl p-2 transition-all"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        onClick={() => setShowDetail(d => !d)}
      >
        <ScoreRing score={Math.round(lead.lead_score)} grade={grade} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· Lead Score</span>
          </div>
          {lead.lead_score_summary && (
            <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {lead.lead_score_summary}
            </p>
          )}
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="p-1 rounded-lg flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      </div>

      {showDetail && (
        <div className="mt-1.5 rounded-lg p-2.5 space-y-1.5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {lead.lead_score_summary && (
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{lead.lead_score_summary}</p>
          )}
          {/* Strengths / risks stored on lead via future enrichment — placeholder for now */}
        </div>
      )}
    </div>
  );
}