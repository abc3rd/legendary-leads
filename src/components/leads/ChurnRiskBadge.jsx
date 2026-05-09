import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

const RISK_CONFIG = {
  high: { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)', border: 'rgba(231,76,60,0.4)', label: 'High Churn Risk', icon: ShieldAlert },
  medium: { color: '#f66c25', bg: 'rgba(246,108,37,0.12)', border: 'rgba(246,108,37,0.35)', label: 'At-Risk Lead', icon: AlertTriangle },
  low: { color: '#f8d417', bg: 'rgba(248,212,23,0.1)', border: 'rgba(248,212,23,0.3)', label: 'Watch This Lead', icon: AlertTriangle },
};

export default function ChurnRiskBadge({ lead, onUpdated }) {
  const [loading, setLoading] = useState(false);

  const risk = lead.churn_risk;
  const cfg = RISK_CONFIG[risk];

  const analyze = async (e) => {
    e.stopPropagation();
    setLoading(true);
    await base44.functions.invoke('detectChurnRisk', { lead_id: lead.id });
    setLoading(false);
    if (onUpdated) onUpdated();
  };

  if (!cfg && risk !== 'none') {
    // No analysis yet — show subtle trigger
    return (
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mt-1.5 transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', color: '#5e6a78', border: '1px solid #2a3a4a' }}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
        {loading ? 'Checking...' : 'Check Churn Risk'}
      </button>
    );
  }

  if (!cfg) return null; // risk === 'none', clean lead

  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mt-1.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
        {lead.churn_reason && (
          <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {lead.churn_reason}
          </p>
        )}
        {lead.days_since_contact > 0 && (
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {lead.days_since_contact}d since last contact
          </p>
        )}
      </div>
      <button onClick={analyze} disabled={loading} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      </button>
    </div>
  );
}