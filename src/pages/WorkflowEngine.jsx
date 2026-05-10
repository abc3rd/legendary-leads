import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Zap, Trash2, ToggleLeft, ToggleRight, Loader2, Play,
  GitBranch, ChevronRight, AlertCircle, Brain, ArrowRight,
  Layers, Shuffle, Star, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'status_change',    label: 'Status Changes',       color: '#f8d417' },
  { value: 'score_threshold',  label: 'Score Threshold',      color: '#4acbbf' },
  { value: 'score_change',     label: 'Score Updated',        color: '#54b0e7' },
  { value: 'sentiment_change', label: 'Sentiment Changes',    color: '#ea00ea' },
  { value: 'sentiment_score',  label: 'Sentiment Score ≥',   color: '#a78bfa' },
  { value: 'interaction_count',label: 'Interaction Count ≥',  color: '#f66c25' },
  { value: 'no_interaction',   label: 'No Interaction (days)',color: '#9ea7b5' },
];

const ACTION_TYPES = [
  { value: 'trigger_sequence',     label: 'Trigger Follow-Up Sequence' },
  { value: 'switch_sequence',      label: 'Switch to Different Sequence' },
  { value: 'assign_team_member',   label: 'Auto-Assign Team Member' },
  { value: 'add_tag',              label: 'Add Tag to Lead' },
  { value: 'change_status',        label: 'Change Lead Status' },
  { value: 'run_sentiment',        label: 'Run Sentiment Analysis' },
  { value: 'score_lead',           label: 'Recalculate Lead Score' },
];

const STATUSES = ['new','cold_outreach','contacted','qualified','in_negotiation','converted','unresponsive'];
const SENTIMENTS = ['Positive','Neutral','Negative'];
const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' };

// ─── Condition Builder ────────────────────────────────────────────────────────
function ConditionRow({ cond, idx, onChange, onRemove, sequences }) {
  const s = (k, v) => onChange(idx, { ...cond, [k]: v });
  return (
    <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <select value={cond.field} onChange={e => s('field', e.target.value)}
        className="rounded px-2 py-1 text-xs flex-shrink-0" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
        <option value="sentiment">Sentiment</option>
        <option value="sentiment_score">Sentiment Score</option>
        <option value="lead_score">Lead Score</option>
        <option value="status">Status</option>
        <option value="followerCount">Follower Count</option>
        <option value="interaction_count">Interaction Count</option>
        <option value="days_since_contact">Days Since Contact</option>
        <option value="lead_grade">Lead Grade</option>
        <option value="churn_risk">Churn Risk</option>
      </select>
      <select value={cond.op} onChange={e => s('op', e.target.value)}
        className="rounded px-2 py-1 text-xs flex-shrink-0" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
        <option value="eq">equals</option>
        <option value="neq">not equals</option>
        <option value="gte">≥</option>
        <option value="lte">≤</option>
        <option value="gt">&gt;</option>
        <option value="lt">&lt;</option>
      </select>
      <Input value={cond.value} onChange={e => s('value', e.target.value)}
        placeholder="value" className="w-28 text-xs h-7"
        style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
      <button onClick={() => onRemove(idx)} className="text-xs ml-auto" style={{ color: '#f66c25' }}>✕</button>
    </div>
  );
}

// ─── Rule Modal ───────────────────────────────────────────────────────────────
function RuleModal({ rule, sequences, onClose, onSaved }) {
  const defaultForm = {
    name: '', description: '',
    trigger_type: 'status_change',
    trigger_status_to: 'contacted', trigger_status_from: '',
    trigger_score_above: 70, trigger_score_below: '',
    trigger_sentiment: 'Positive', trigger_sentiment_score: 60,
    trigger_interaction_count: 3, trigger_no_interaction_days: 7,
    conditions: [], conditions_logic: 'AND',
    action_type: 'trigger_sequence',
    sequence_id: '', sequence_name: '',
    switch_sequence_id: '', switch_sequence_name: '',
    assign_to_email: '', assign_to_name: '',
    add_tag_value: '', change_status_to: '',
    filter_category: '', filter_min_followers: '',
    is_active: true,
  };
  const [form, setForm] = useState(rule ? { ...defaultForm, ...rule, conditions: rule.conditions ? (typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions) : [] } : defaultForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addCondition = () => setForm(f => ({ ...f, conditions: [...(f.conditions||[]), { field: 'sentiment', op: 'eq', value: 'Positive' }] }));
  const updateCondition = (idx, cond) => setForm(f => { const c = [...(f.conditions||[])]; c[idx] = cond; return { ...f, conditions: c }; });
  const removeCondition = (idx) => setForm(f => ({ ...f, conditions: (f.conditions||[]).filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    const payload = { ...form, conditions: JSON.stringify(form.conditions || []) };
    if (form.action_type === 'trigger_sequence') {
      const seq = sequences.find(s => s.id === form.sequence_id);
      if (seq) payload.sequence_name = seq.name;
    }
    if (form.action_type === 'switch_sequence') {
      const seq = sequences.find(s => s.id === form.switch_sequence_id);
      if (seq) payload.switch_sequence_name = seq.name;
    }
    if (form.id) await base44.entities.WorkflowRule.update(form.id, payload);
    else await base44.entities.WorkflowRule.create({ ...payload, run_count: 0 });
    toast.success(form.id ? 'Rule updated' : 'Rule created');
    onSaved();
    setSaving(false);
  };

  const triggerColor = TRIGGER_TYPES.find(t => t.value === form.trigger_type)?.color || '#f8d417';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#0d1b2a', border: '2px solid #ea00ea' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)' }}>
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
            {form.id ? 'Edit Rule' : 'New IF-THIS-THEN-THAT Rule'}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Rule Name</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Re-engage unresponsive positive-sentiment leads"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Description</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} maxLength={1000}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff' }} />
          </div>

          {/* TRIGGER */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: `${triggerColor}08`, border: `1px solid ${triggerColor}30` }}>
            <p className="text-xs font-bold flex items-center gap-2" style={{ color: triggerColor }}>
              <Zap className="h-3.5 w-3.5" /> IF (Primary Trigger)
            </p>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Event Type</label>
              <select value={form.trigger_type} onChange={e => set('trigger_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: `1px solid ${triggerColor}50` }}>
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {form.trigger_type === 'status_change' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>From status</label>
                  <select value={form.trigger_status_from} onChange={e => set('trigger_status_from', e.target.value)}
                    className="w-full rounded-lg px-2 py-1.5 text-xs" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                    <option value="">Any</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>To status</label>
                  <select value={form.trigger_status_to} onChange={e => set('trigger_status_to', e.target.value)}
                    className="w-full rounded-lg px-2 py-1.5 text-xs" style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </div>
            )}
            {form.trigger_type === 'score_threshold' && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Score ≥</label>
                  <Input type="number" value={form.trigger_score_above} onChange={e => set('trigger_score_above', e.target.value)}
                    style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
                <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Score ≤</label>
                  <Input type="number" value={form.trigger_score_below} onChange={e => set('trigger_score_below', e.target.value)}
                    style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
              </div>
            )}
            {form.trigger_type === 'sentiment_change' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Sentiment becomes</label>
                <select value={form.trigger_sentiment} onChange={e => set('trigger_sentiment', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #ea00ea' }}>
                  {SENTIMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            {form.trigger_type === 'sentiment_score' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Sentiment score ≥</label>
                <Input type="number" value={form.trigger_sentiment_score} onChange={e => set('trigger_sentiment_score', e.target.value)}
                  style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
            )}
            {form.trigger_type === 'interaction_count' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Total interactions ≥</label>
                <Input type="number" value={form.trigger_interaction_count} onChange={e => set('trigger_interaction_count', e.target.value)}
                  style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
            )}
            {form.trigger_type === 'no_interaction' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>No interaction for (days)</label>
                <Input type="number" value={form.trigger_no_interaction_days} onChange={e => set('trigger_no_interaction_days', e.target.value)}
                  style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
            )}
          </div>

          {/* EXTRA CONDITIONS */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold flex items-center gap-2" style={{ color: '#a78bfa' }}>
                <Brain className="h-3.5 w-3.5" /> AND (Additional Conditions)
              </p>
              <div className="flex items-center gap-2">
                <select value={form.conditions_logic} onChange={e => set('conditions_logic', e.target.value)}
                  className="rounded px-2 py-1 text-[10px]" style={{ background: '#071a2c', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <option value="AND">ALL must match (AND)</option>
                  <option value="OR">ANY matches (OR)</option>
                </select>
                <button onClick={addCondition} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                  + Add
                </button>
              </div>
            </div>
            {(form.conditions || []).length === 0 ? (
              <p className="text-[10px]" style={{ color: '#5e6a78' }}>No extra conditions — rule fires on primary trigger alone.</p>
            ) : (
              <div className="space-y-2">
                {(form.conditions || []).map((cond, i) => (
                  <ConditionRow key={i} cond={cond} idx={i} onChange={updateCondition} onRemove={removeCondition} sequences={sequences} />
                ))}
              </div>
            )}
          </div>

          {/* FILTERS */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(84,176,231,0.05)', border: '1px solid rgba(84,176,231,0.15)' }}>
            <p className="text-xs font-bold" style={{ color: '#54b0e7' }}>🔍 Lead Filters (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Category</label>
                <Input value={form.filter_category} onChange={e => set('filter_category', e.target.value)}
                  placeholder="e.g. fitness" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Min followers</label>
                <Input type="number" value={form.filter_min_followers} onChange={e => set('filter_min_followers', e.target.value)}
                  placeholder="e.g. 10000" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
            </div>
          </div>

          {/* THEN / ACTION */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(74,203,191,0.05)', border: '1px solid rgba(74,203,191,0.2)' }}>
            <p className="text-xs font-bold flex items-center gap-2" style={{ color: '#4acbbf' }}>
              <ArrowRight className="h-3.5 w-3.5" /> THEN (Action)
            </p>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Action Type</label>
              <select value={form.action_type} onChange={e => set('action_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}>
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {form.action_type === 'trigger_sequence' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Sequence to trigger</label>
                <select value={form.sequence_id} onChange={e => set('sequence_id', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                  <option value="">Select sequence…</option>
                  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {form.action_type === 'switch_sequence' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Move lead to sequence</label>
                <select value={form.switch_sequence_id} onChange={e => set('switch_sequence_id', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}>
                  <option value="">Select sequence…</option>
                  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {form.action_type === 'assign_team_member' && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Email</label>
                  <Input value={form.assign_to_email} onChange={e => set('assign_to_email', e.target.value)}
                    placeholder="team@company.com" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
                <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Name</label>
                  <Input value={form.assign_to_name} onChange={e => set('assign_to_name', e.target.value)}
                    placeholder="Jane Smith" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
              </div>
            )}
            {form.action_type === 'add_tag' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Tag value</label>
                <Input value={form.add_tag_value} onChange={e => set('add_tag_value', e.target.value)}
                  placeholder="hot-lead" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} /></div>
            )}
            {form.action_type === 'change_status' && (
              <div><label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Set status to</label>
                <select value={form.change_status_to} onChange={e => set('change_status_to', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}>
                  <option value="">Select…</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            )}
            {['run_sentiment','score_lead'].includes(form.action_type) && (
              <p className="text-xs" style={{ color: '#9ea7b5' }}>This action runs automatically on all matching leads when the trigger fires.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 font-semibold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (form.id ? 'Update Rule' : 'Create Rule')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────
function RuleCard({ rule, onEdit, onToggle, onDelete }) {
  const triggerType = TRIGGER_TYPES.find(t => t.value === rule.trigger_type);
  const conditions = (() => { try { return typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : (rule.conditions || []); } catch { return []; } })();

  const getTriggerLabel = () => {
    if (rule.trigger_type === 'status_change') {
      const from = rule.trigger_status_from ? rule.trigger_status_from.replace(/_/g,' ') : 'any';
      return `Status "${from}" → "${(rule.trigger_status_to||'').replace(/_/g,' ')}"`;
    }
    if (rule.trigger_type === 'score_threshold') return `Score ${rule.trigger_score_above ? `≥${rule.trigger_score_above}` : ''} ${rule.trigger_score_below ? `≤${rule.trigger_score_below}` : ''}`.trim();
    if (rule.trigger_type === 'sentiment_change') return `Sentiment → ${rule.trigger_sentiment}`;
    if (rule.trigger_type === 'sentiment_score') return `Sentiment score ≥ ${rule.trigger_sentiment_score}`;
    if (rule.trigger_type === 'interaction_count') return `Interactions ≥ ${rule.trigger_interaction_count}`;
    if (rule.trigger_type === 'no_interaction') return `No contact ≥ ${rule.trigger_no_interaction_days} days`;
    return rule.trigger_type;
  };

  const getActionLabel = () => {
    if (rule.action_type === 'trigger_sequence') return `▶ ${rule.sequence_name || rule.sequence_id || '—'}`;
    if (rule.action_type === 'switch_sequence') return `⇄ Switch to: ${rule.switch_sequence_name || rule.switch_sequence_id || '—'}`;
    if (rule.action_type === 'assign_team_member') return `👤 ${rule.assign_to_name || rule.assign_to_email}`;
    if (rule.action_type === 'add_tag') return `🏷 "${rule.add_tag_value}"`;
    if (rule.action_type === 'change_status') return `→ Status: ${rule.change_status_to?.replace(/_/g,' ')}`;
    if (rule.action_type === 'run_sentiment') return '🧠 Run Sentiment Analysis';
    if (rule.action_type === 'score_lead') return '⭐ Recalculate Lead Score';
    return '—';
  };

  return (
    <div className="rounded-xl p-4" style={{ ...CARD, border: `1.5px solid ${rule.is_active ? `${triggerType?.color || '#f8d417'}40` : 'rgba(255,255,255,0.07)'}` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: '#fff' }}>{rule.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: rule.is_active ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)', color: rule.is_active ? '#2ecc71' : '#5e6a78' }}>
              {rule.is_active ? 'Active' : 'Paused'}
            </span>
            {(rule.run_count || 0) > 0 && <span className="text-[10px]" style={{ color: '#5e6a78' }}><Play className="h-2.5 w-2.5 inline mr-0.5" />{rule.run_count} runs</span>}
            {conditions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                +{conditions.length} condition{conditions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-1 rounded-lg font-mono" style={{ background: `${triggerType?.color || '#f8d417'}15`, color: triggerType?.color || '#f8d417' }}>
              ⚡ {getTriggerLabel()}
            </span>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#5e6a78' }} />
            <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(74,203,191,0.1)', color: '#4acbbf' }}>
              {getActionLabel()}
            </span>
          </div>
          {rule.description && <p className="text-[10px] mt-1.5 italic" style={{ color: '#5e6a78' }}>{rule.description}</p>}
          {(rule.filter_category || rule.filter_min_followers) && (
            <p className="text-[10px] mt-1" style={{ color: '#5e6a78' }}>
              Filters: {[rule.filter_category && `category="${rule.filter_category}"`, rule.filter_min_followers && `followers≥${rule.filter_min_followers}`].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggle(rule)} style={{ color: rule.is_active ? '#4acbbf' : '#5e6a78' }}>
            {rule.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
          </button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(rule)} style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)} style={{ color: '#f66c25' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TEMPLATE_RULES = [
  { name: 'Re-engage cold positives', trigger_type: 'sentiment_change', trigger_sentiment: 'Positive', action_type: 'switch_sequence', conditions: [], description: 'When a lead turns positive, move them to a warm outreach sequence automatically.' },
  { name: 'Flag high churn risk', trigger_type: 'no_interaction', trigger_no_interaction_days: 14, action_type: 'add_tag', add_tag_value: 'churn-risk', conditions: [], description: 'Tag leads with no interaction for 14+ days.' },
  { name: 'Auto-promote qualified leads', trigger_type: 'score_threshold', trigger_score_above: 75, action_type: 'change_status', change_status_to: 'qualified', conditions: [], description: 'Automatically move high-score leads to qualified status.' },
];

export default function WorkflowEngine() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const qc = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['workflow_rules'],
    queryFn: () => base44.entities.WorkflowRule.list('-created_date', 100),
  });
  const { data: sequences = [] } = useQuery({
    queryKey: ['sequences_wf'],
    queryFn: () => base44.entities.FollowUpSequence.list('-created_date', 100),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['workflow_rules'] });
  const handleToggle = async (rule) => { await base44.entities.WorkflowRule.update(rule.id, { is_active: !rule.is_active }); refetch(); };
  const handleDelete = async (id) => { if (!confirm('Delete this rule?')) return; await base44.entities.WorkflowRule.delete(id); toast.success('Rule deleted'); refetch(); };

  const applyTemplate = (t) => { setEditing({ ...t, conditions: [] }); setShowModal(true); };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)' }}>
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Workflow Engine</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>IF-this-THEN-that · Sentiment · Multi-channel · Sequence switching</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Rule
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'rules', label: 'Rules', icon: GitBranch },
            { id: 'templates', label: 'Templates', icon: Layers },
            { id: 'logic', label: 'Logic Flow', icon: Shuffle },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #f8d41722, #ea00ea22)' : 'transparent', color: activeTab === t.id ? '#f8d417' : '#9ea7b5', border: activeTab === t.id ? '1px solid rgba(248,212,23,0.3)' : '1px solid transparent' }}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-3 mb-5 flex items-start gap-3" style={{ background: 'rgba(248,212,23,0.07)', border: '1px solid rgba(248,212,23,0.25)' }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#f8d417' }} />
          <p className="text-xs" style={{ color: '#9ea7b5' }}>
            <strong style={{ color: '#f8d417' }}>IF-THEN Rules:</strong> Triggers include status change, sentiment analysis scores, interaction history, score thresholds, and inactivity periods. Actions include sequence switching, status change, tagging, assignment, and running AI analysis.
          </p>
        </div>

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f8d417' }} /></div>
          : rules.length === 0 ? (
            <div className="text-center py-20 rounded-2xl" style={{ border: '2px dashed rgba(248,212,23,0.2)' }}>
              <GitBranch className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
              <p className="font-semibold mb-1" style={{ color: '#9ea7b5' }}>No workflow rules yet</p>
              <p className="text-sm mb-4" style={{ color: '#5e6a78' }}>Create IF-THEN rules based on sentiment, scores, interactions & more</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => { setEditing(null); setShowModal(true); }}
                  style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929' }}>
                  <Plus className="h-4 w-4 mr-1" /> Create First Rule
                </Button>
                <Button onClick={() => setActiveTab('templates')} variant="ghost"
                  style={{ color: '#9ea7b5', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Layers className="h-4 w-4 mr-1" /> Browse Templates
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <RuleCard key={rule.id} rule={rule}
                  onEdit={r => { setEditing(r); setShowModal(true); }}
                  onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <p className="text-sm mb-4" style={{ color: '#9ea7b5' }}>Pre-built rule templates — click to customize and save.</p>
            {TEMPLATE_RULES.map((t, i) => {
              const tt = TRIGGER_TYPES.find(x => x.value === t.trigger_type);
              return (
                <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-4"
                  style={{ background: 'linear-gradient(135deg, #0a1929, #13202e)', border: `1.5px solid ${tt?.color || '#f8d417'}30` }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tt?.color || '#f8d417' }} />
                      <span className="font-semibold text-sm" style={{ color: '#fff' }}>{t.name}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#9ea7b5' }}>{t.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded" style={{ background: `${tt?.color || '#f8d417'}15`, color: tt?.color || '#f8d417' }}>{tt?.label}</span>
                      <ChevronRight className="h-3 w-3" style={{ color: '#5e6a78' }} />
                      <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(74,203,191,0.1)', color: '#4acbbf' }}>
                        {ACTION_TYPES.find(a => a.value === t.action_type)?.label}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => applyTemplate(t)}
                    style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929', flexShrink: 0 }}>
                    Use
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Logic Flow Tab */}
        {activeTab === 'logic' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#9ea7b5' }}>Visual overview of your active IF-THEN chains.</p>
            {rules.filter(r => r.is_active).length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(234,0,234,0.15)' }}>
                <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
                <p className="text-sm" style={{ color: '#5e6a78' }}>No active rules to visualize</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.filter(r => r.is_active).map((rule, i) => {
                  const tt = TRIGGER_TYPES.find(t => t.value === rule.trigger_type);
                  const at = ACTION_TYPES.find(a => a.value === rule.action_type);
                  const conditions = (() => { try { return typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : (rule.conditions || []); } catch { return []; } })();
                  return (
                    <div key={rule.id} className="rounded-xl p-4 flex items-center gap-3 flex-wrap"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: `${tt?.color || '#f8d417'}18`, color: tt?.color || '#f8d417', border: `1px solid ${tt?.color || '#f8d417'}30` }}>
                        IF {tt?.label}
                      </span>
                      {conditions.length > 0 && (
                        <>
                          <span className="text-xs" style={{ color: '#5e6a78' }}>{rule.conditions_logic}</span>
                          <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{conditions.length} extra check{conditions.length > 1 ? 's' : ''}</span>
                        </>
                      )}
                      <ChevronRight className="h-4 w-4" style={{ color: '#5e6a78' }} />
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(74,203,191,0.12)', color: '#4acbbf', border: '1px solid rgba(74,203,191,0.25)' }}>
                        THEN {at?.label}
                      </span>
                      <span className="text-xs ml-auto" style={{ color: '#5e6a78' }}>{rule.run_count || 0} runs</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <RuleModal rule={editing} sequences={sequences}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refetch(); }} />
      )}
    </div>
  );
}