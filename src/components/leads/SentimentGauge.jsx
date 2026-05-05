import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Smile, Meh, Frown } from 'lucide-react';
import { toast } from 'sonner';

const SENTIMENT_CONFIG = {
  Positive: { color: '#2ecc71', bg: 'rgba(46,204,113,0.12)', border: 'rgba(46,204,113,0.4)', icon: Smile, label: 'Positive' },
  Neutral:  { color: '#f8d417', bg: 'rgba(248,212,23,0.12)', border: 'rgba(248,212,23,0.4)',  icon: Meh,   label: 'Neutral'  },
  Negative: { color: '#f66c25', bg: 'rgba(246,108,37,0.12)', border: 'rgba(246,108,37,0.4)', icon: Frown,  label: 'Negative' },
};

// Arc gauge rendered as SVG
function GaugeArc({ score }) {
  const pct = Math.max(0, Math.min(100, score ?? 50));
  // Arc from -180deg to 0deg (half circle), mapped to 0–100
  const radius = 36;
  const cx = 50;
  const cy = 50;
  const startAngle = Math.PI; // left
  const endAngle = 0;         // right
  const angle = startAngle - (pct / 100) * Math.PI;
  const x = cx + radius * Math.cos(angle);
  const y = cy - radius * Math.sin(angle);
  const largeArc = pct > 50 ? 0 : 1;

  // Background arc
  const bgX = cx + radius * Math.cos(0);
  const bgY = cy - radius * Math.sin(0);

  // Color based on score
  const color = pct >= 65 ? '#2ecc71' : pct >= 35 ? '#f8d417' : '#f66c25';

  return (
    <svg viewBox="0 0 100 55" className="w-24 h-14">
      {/* Track */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round"
      />
      {/* Fill */}
      {pct > 0 && (
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        />
      )}
      {/* Needle dot */}
      <circle cx={x} cy={y} r="4" fill={color} />
      {/* Score label */}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{pct}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="#9ea7b5">/ 100</text>
    </svg>
  );
}

export default function SentimentGauge({ lead, onUpdated }) {
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('analyzeSentiment', { lead_id: lead.id });
      if (res.data.error) { toast.error(res.data.error); return; }
      toast.success('Sentiment analyzed!');
      if (onUpdated) onUpdated();
    } catch (e) {
      toast.error('Analysis failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cfg = SENTIMENT_CONFIG[lead.sentiment] || null;
  const Icon = cfg?.icon;

  return (
    <div className="rounded-xl p-3 mt-3" style={{
      background: cfg ? cfg.bg : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${cfg ? cfg.border : 'rgba(255,255,255,0.08)'}`,
    }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: '#9ea7b5' }}>AI Sentiment</span>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
          style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.3)' }}
          title="Re-analyze sentiment"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {lead.sentiment ? (
        <div className="flex items-center gap-3">
          <GaugeArc score={lead.sentiment_score} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            {lead.sentiment_summary && (
              <p className="text-xs line-clamp-2" style={{ color: '#9ea7b5' }}>{lead.sentiment_summary}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-center py-1" style={{ color: '#5e6a78' }}>
          Click "Analyze" to detect sentiment from conversation history
        </p>
      )}
    </div>
  );
}