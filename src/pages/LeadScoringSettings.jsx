import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sliders, Save, Play, Loader2, Info, CheckCircle2,
  TrendingUp, Users, Tag, Activity, Star, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Default scoring rules ────────────────────────────────────────────────────
const DEFAULT_RULES = {
  followerCount: [
    { label: '1K–10K', min: 1000,   max: 9999,   points: 10 },
    { label: '10K–50K', min: 10000,  max: 49999,  points: 25 },
    { label: '50K–250K', min: 50000, max: 249999, points: 50 },
    { label: '250K+', min: 250000,   max: null,   points: 80 },
  ],
  hasEmail:   { enabled: true, points: 20 },
  hasPhone:   { enabled: true, points: 15 },
  hasWebsite: { enabled: true, points: 10 },
  status: {
    new:            0,
    cold_outreach:  5,
    contacted:      15,
    qualified:      30,
    in_negotiation: 50,
    converted:      100,
    unresponsive:  -10,
  },
  sentiment: {
    Positive: 20,
    Neutral:   0,
    Negative: -15,
  },
  niches: [], // [{keyword, points}]
  thresholds: [
    { grade: 'A', minScore: 80 },
    { grade: 'B', minScore: 60 },
    { grade: 'C', minScore: 40 },
    { grade: 'D', minScore: 20 },
    { grade: 'F', minScore: 0  },
  ],
};

const STORAGE_KEY = 'll_scoring_rules_v1';
const loadRules = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_RULES; } catch { return DEFAULT_RULES; }
};
const saveRules = (r) => localStorage.setItem(STORAGE_KEY, JSON.stringify(r));

const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' };

function SectionTitle({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4" style={{ color }} />
      <h2 className="text-sm font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>{label}</h2>
    </div>
  );
}

function PointsInput({ value, onChange, small }) {
  return (
    <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
      className={small ? 'w-16 text-xs h-7 px-2' : 'w-20 text-sm'}
      style={{ background: '#071a2c', borderColor: 'rgba(234,0,234,0.3)', color: '#f8d417', textAlign: 'center' }} />
  );
}

export default function LeadScoringSettings() {
  const [rules, setRules] = useState(loadRules);
  const [running, setRunning] = useState(false);
  const [runStats, setRunStats] = useState(null);
  const [newNiche, setNewNiche] = useState({ keyword: '', points: 15 });
  const qc = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_scoring_preview'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });

  const set = (path, value) => {
    setRules(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // Compute score for a single lead given current rules
  const computeScore = (lead) => {
    let score = 0;

    // Follower count
    const fc = lead.followerCount || 0;
    for (const band of rules.followerCount) {
      if (fc >= band.min && (band.max === null || fc <= band.max)) {
        score += band.points;
        break;
      }
    }

    // Contact info
    if (rules.hasEmail.enabled && lead.email) score += rules.hasEmail.points;
    if (rules.hasPhone.enabled && lead.phone) score += rules.hasPhone.points;
    if (rules.hasWebsite.enabled && lead.website) score += rules.hasWebsite.points;

    // Status
    const statusPoints = rules.status[lead.status];
    if (statusPoints !== undefined) score += statusPoints;

    // Sentiment
    if (lead.sentiment && rules.sentiment[lead.sentiment] !== undefined) {
      score += rules.sentiment[lead.sentiment];
    }

    // Niches
    for (const niche of rules.niches) {
      if (niche.keyword && lead.category?.toLowerCase().includes(niche.keyword.toLowerCase())) {
        score += niche.points;
      }
    }

    return Math.max(0, Math.min(100, score));
  };

  const gradeFromScore = (score) => {
    for (const t of rules.thresholds) {
      if (score >= t.minScore) return t.grade;
    }
    return 'F';
  };

  // Preview — show distribution
  const preview = React.useMemo(() => {
    if (!leads.length) return null;
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    leads.forEach(l => { const g = gradeFromScore(computeScore(l)); if (dist[g] !== undefined) dist[g]++; });
    return dist;
  }, [leads, rules]);

  const handleSave = () => { saveRules(rules); toast.success('Scoring rules saved!'); };

  const handleRunScoring = async () => {
    setRunning(true);
    setRunStats(null);
    let updated = 0, errors = 0;
    for (const lead of leads) {
      const score = computeScore(lead);
      const grade = gradeFromScore(score);
      if (lead.lead_score !== score || lead.lead_grade !== grade) {
        await base44.entities.Lead.update(lead.id, {
          lead_score: score,
          lead_grade: grade,
          lead_score_at: new Date().toISOString(),
          lead_score_summary: `Custom scoring: ${score}/100 (${grade})`,
        }).catch(() => errors++);
        updated++;
      }
    }
    setRunStats({ updated, errors, total: leads.length });
    qc.invalidateQueries({ queryKey: ['leads_scoring_preview'] });
    toast.success(`Updated ${updated} leads!`);
    setRunning(false);
  };

  const addNiche = () => {
    if (!newNiche.keyword.trim()) return;
    setRules(r => ({ ...r, niches: [...r.niches, { ...newNiche }] }));
    setNewNiche({ keyword: '', points: 15 });
  };

  const removeNiche = (i) => setRules(r => ({ ...r, niches: r.niches.filter((_, idx) => idx !== i) }));

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', boxShadow: '0 0 18px rgba(248,212,23,0.3)' }}>
              <Sliders className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Lead Scoring Rules</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Define custom weights · auto-update all leads</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="ghost" style={{ color: '#4acbbf', border: '1px solid rgba(74,203,191,0.3)' }}>
              <Save className="h-4 w-4 mr-1.5" /> Save Rules
            </Button>
            <Button onClick={handleRunScoring} disabled={running || !leads.length}
              style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929', fontWeight: 600 }}>
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              {running ? 'Scoring…' : `Score All ${leads.length} Leads`}
            </Button>
          </div>
        </div>

        {/* Run result banner */}
        {runStats && (
          <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
            style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)' }}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#2ecc71' }} />
            <p className="text-sm" style={{ color: '#fff' }}>
              Scoring complete — <strong style={{ color: '#2ecc71' }}>{runStats.updated}</strong> leads updated out of {runStats.total}.
              {runStats.errors > 0 && <span style={{ color: '#f66c25' }}> {runStats.errors} errors.</span>}
            </p>
          </div>
        )}

        {/* Live preview distribution */}
        {preview && (
          <div className="rounded-xl p-4 mb-5 flex items-center gap-4 flex-wrap" style={CARD}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#f8d417' }} />
              <span className="text-xs font-semibold" style={{ color: '#f8d417' }}>Live Grade Preview</span>
            </div>
            {['A','B','C','D','F'].map(g => (
              <div key={g} className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: g === 'A' ? 'rgba(46,204,113,0.2)' : g === 'B' ? 'rgba(74,203,191,0.2)' : g === 'C' ? 'rgba(248,212,23,0.2)' : g === 'D' ? 'rgba(246,108,37,0.2)' : 'rgba(255,255,255,0.08)', color: g === 'A' ? '#2ecc71' : g === 'B' ? '#4acbbf' : g === 'C' ? '#f8d417' : g === 'D' ? '#f66c25' : '#9ea7b5' }}>
                  {g}
                </span>
                <span className="text-xs" style={{ color: '#fff' }}>{preview[g]}</span>
              </div>
            ))}
            <span className="text-xs ml-auto" style={{ color: '#5e6a78' }}>Preview only — run scoring to apply</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Follower Count Bands */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionTitle icon={Users} label="Follower Count Bands" color="#ea00ea" />
            <div className="space-y-3">
              {rules.followerCount.map((band, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs flex-1 font-semibold" style={{ color: '#d7dde5' }}>{band.label}</span>
                  <span className="text-[10px]" style={{ color: '#5e6a78' }}>+</span>
                  <PointsInput value={band.points} onChange={v => set(`followerCount.${i}.points`, v)} />
                  <span className="text-[10px]" style={{ color: '#5e6a78' }}>pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionTitle icon={CheckCircle2} label="Contact Info Bonuses" color="#4acbbf" />
            <div className="space-y-3">
              {[
                { key: 'hasEmail', label: 'Has Email' },
                { key: 'hasPhone', label: 'Has Phone' },
                { key: 'hasWebsite', label: 'Has Website' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <button onClick={() => set(`${key}.enabled`, !rules[key].enabled)}
                    className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: rules[key].enabled ? '#4acbbf' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(74,203,191,0.4)' }}>
                    {rules[key].enabled && <span className="text-[10px] text-black font-bold">✓</span>}
                  </button>
                  <span className="text-xs flex-1 font-semibold" style={{ color: rules[key].enabled ? '#d7dde5' : '#5e6a78' }}>{label}</span>
                  <PointsInput value={rules[key].points} onChange={v => set(`${key}.points`, v)} />
                  <span className="text-[10px]" style={{ color: '#5e6a78' }}>pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Points */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionTitle icon={Activity} label="Status Points" color="#f8d417" />
            <div className="space-y-2.5">
              {Object.keys(rules.status).map(status => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs flex-1 capitalize font-semibold" style={{ color: '#d7dde5' }}>{status.replace(/_/g,' ')}</span>
                  <PointsInput value={rules.status[status]} onChange={v => set(`status.${status}`, v)} />
                  <span className="text-[10px]" style={{ color: '#5e6a78' }}>pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment Points */}
          <div className="rounded-xl p-5" style={CARD}>
            <SectionTitle icon={Star} label="Sentiment Points" color="#54b0e7" />
            <div className="space-y-3">
              {['Positive','Neutral','Negative'].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs flex-1 font-semibold"
                    style={{ color: s === 'Positive' ? '#2ecc71' : s === 'Negative' ? '#f66c25' : '#9ea7b5' }}>{s}</span>
                  <PointsInput value={rules.sentiment[s]} onChange={v => set(`sentiment.${s}`, v)} />
                  <span className="text-[10px]" style={{ color: '#5e6a78' }}>pts</span>
                </div>
              ))}
            </div>

            {/* Grade Thresholds */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-bold mb-3" style={{ color: '#a78bfa' }}>Grade Thresholds (min score)</p>
              <div className="space-y-2">
                {rules.thresholds.map((t, i) => (
                  <div key={t.grade} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4" style={{ color: t.grade === 'A' ? '#2ecc71' : t.grade === 'B' ? '#4acbbf' : t.grade === 'C' ? '#f8d417' : t.grade === 'D' ? '#f66c25' : '#9ea7b5' }}>{t.grade}</span>
                    <span className="text-[10px] flex-1" style={{ color: '#5e6a78' }}>≥</span>
                    <PointsInput value={t.minScore} onChange={v => set(`thresholds.${i}.minScore`, v)} small />
                    <span className="text-[10px]" style={{ color: '#5e6a78' }}>pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Niche Keywords */}
          <div className="rounded-xl p-5 lg:col-span-2" style={CARD}>
            <SectionTitle icon={Tag} label="Industry Niche Bonuses" color="#f66c25" />
            <div className="flex gap-2 mb-4">
              <Input value={newNiche.keyword} onChange={e => setNewNiche(n => ({ ...n, keyword: e.target.value }))}
                placeholder="e.g. fitness, beauty, crypto…"
                style={{ background: '#071a2c', borderColor: 'rgba(246,108,37,0.3)', color: '#fff' }}
                onKeyDown={e => e.key === 'Enter' && addNiche()} />
              <PointsInput value={newNiche.points} onChange={v => setNewNiche(n => ({ ...n, points: v }))} />
              <Button onClick={addNiche} style={{ background: '#f66c25', color: '#fff', flexShrink: 0 }}>Add</Button>
            </div>
            {rules.niches.length === 0 ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#5e6a78' }}>
                <Info className="h-3.5 w-3.5" />
                No niche keywords yet — add keywords to boost matching leads
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rules.niches.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(246,108,37,0.12)', border: '1px solid rgba(246,108,37,0.3)', color: '#f66c25' }}>
                    {n.keyword} <span style={{ color: '#f8d417' }}>+{n.points}pts</span>
                    <button onClick={() => removeNiche(i)} style={{ color: '#5e6a78' }} className="hover:text-red-400 ml-1">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-5 rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(84,176,231,0.06)', border: '1px solid rgba(84,176,231,0.2)' }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#54b0e7' }} />
          <p className="text-xs" style={{ color: '#9ea7b5' }}>
            Rules are saved to your browser. Click <strong style={{ color: '#4acbbf' }}>Save Rules</strong> to persist, then <strong style={{ color: '#f8d417' }}>Score All Leads</strong> to apply. Scores are capped 0–100. The workflow engine will fire on leads crossing grade thresholds automatically.
          </p>
        </div>
      </div>
    </div>
  );
}