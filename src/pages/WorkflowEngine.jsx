import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight, Loader2, Play, GitBranch, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'status_change', label: 'Status Changes', color: '#f8d417' },
  { value: 'score_threshold', label: 'Score Threshold', color: '#4acbbf' },
  { value: 'score_change', label: 'Score Updated', color: '#54b0e7' },
];
const STATUSES = ['new','cold_outreach','contacted','qualified','in_negotiation','converted','unresponsive'];
const ACTION_TYPES = [
  { value: 'trigger_sequence', label: 'Trigger Follow-Up Sequence' },
  { value: 'assign_team_member', label: 'Auto-Assign Team Member' },
  { value: 'add_tag', label: 'Add Tag to Lead' },
];
const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' };

function RuleModal({ rule, sequences, onClose, onSaved }) {
  const [form, setForm] = useState(rule || {
    name: '', description: '', trigger_type: 'status_change', trigger_status_to: 'contacted',
    trigger_status_from: '', trigger_score_above: 70, trigger_score_below: '',
    action_type: 'trigger_sequence', sequence_id: '', sequence_name: '',
    assign_to_email: '', assign_to_name: '', add_tag_value: '',
    filter_category: '', filter_min_followers: '', is_active: true
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    const payload = { ...form };
    if (form.action_type === 'trigger_sequence') {
      const seq = sequences.find(s => s.id === form.sequence_id);
      if (seq) payload.sequence_name = seq.name;
    }
    if (form.id) await base44.entities.WorkflowRule.update(form.id, payload);
    else await base44.entities.WorkflowRule.create({ ...payload, run_count: 0 });
    toast.success(form.id ? 'Rule updated' : 'Rule created');
    onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#0d1b2a', border: '2px solid #ea00ea' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
          {form.id ? 'Edit Rule' : 'New Workflow Rule'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Rule Name</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Nurture contacted leads"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Description <span style={{ color: '#5e6a78' }}>(optional)</span></label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              placeholder="Describe what this rule does…" maxLength={1000} rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff' }} />
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(248,212,23,0.05)', border: '1px solid rgba(248,212,23,0.2)' }}>
            <p className="text-xs font-bold" style={{ color: '#f8d417' }}>⚡ TRIGGER</p>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>When…</label>
              <select value={form.trigger_type} onChange={e => set('trigger_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.trigger_type === 'status_change' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>From status (optional)</label>
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
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Score ≥</label>
                  <Input type="number" value={form.trigger_score_above} onChange={e => set('trigger_score_above', e.target.value)}
                    placeholder="70" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Score ≤ (optional)</label>
                  <Input type="number" value={form.trigger_score_below} onChange={e => set('trigger_score_below', e.target.value)}
                    placeholder="100" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(84,176,231,0.05)', border: '1px solid rgba(84,176,231,0.15)' }}>
            <p className="text-xs font-bold" style={{ color: '#54b0e7' }}>🔍 FILTERS (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Category</label>
                <Input value={form.filter_category} onChange={e => set('filter_category', e.target.value)}
                  placeholder="e.g. fitness" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Min followers</label>
                <Input type="number" value={form.filter_min_followers} onChange={e => set('filter_min_followers', e.target.value)}
                  placeholder="e.g. 10000" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(74,203,191,0.05)', border: '1px solid rgba(74,203,191,0.2)' }}>
            <p className="text-xs font-bold" style={{ color: '#4acbbf' }}>🎯 ACTION</p>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Then…</label>
              <select value={form.action_type} onChange={e => set('action_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}>
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {form.action_type === 'trigger_sequence' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Sequence</label>
                <select value={form.sequence_id} onChange={e => set('sequence_id', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                  <option value="">Select sequence…</option>
                  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {form.action_type === 'assign_team_member' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Email</label>
                  <Input value={form.assign_to_email} onChange={e => set('assign_to_email', e.target.value)}
                    placeholder="team@company.com" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Name</label>
                  <Input value={form.assign_to_name} onChange={e => set('assign_to_name', e.target.value)}
                    placeholder="Jane Smith" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
                </div>
              </div>
            )}
            {form.action_type === 'add_tag' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Tag value</label>
                <Input value={form.add_tag_value} onChange={e => set('add_tag_value', e.target.value)}
                  placeholder="hot-lead" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              </div>
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

export default function WorkflowEngine() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
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

  const handleToggle = async (rule) => {
    await base44.entities.WorkflowRule.update(rule.id, { is_active: !rule.is_active });
    refetch();
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await base44.entities.WorkflowRule.delete(id);
    toast.success('Rule deleted');
    refetch();
  };

  const getTriggerLabel = (rule) => {
    if (rule.trigger_type === 'status_change') {
      const from = rule.trigger_status_from ? rule.trigger_status_from.replace(/_/g,' ') : 'any status';
      const to = (rule.trigger_status_to || '').replace(/_/g,' ');
      return `Status: "${from}" → "${to}"`;
    }
    if (rule.trigger_type === 'score_threshold') {
      const parts = [];
      if (rule.trigger_score_above) parts.push(`≥ ${rule.trigger_score_above}`);
      if (rule.trigger_score_below) parts.push(`≤ ${rule.trigger_score_below}`);
      return `Lead score ${parts.join(' and ')}`;
    }
    return 'Lead score updated';
  };

  const getActionLabel = (rule) => {
    if (rule.action_type === 'trigger_sequence') return `Send: "${rule.sequence_name || rule.sequence_id}"`;
    if (rule.action_type === 'assign_team_member') return `Assign to ${rule.assign_to_name || rule.assign_to_email}`;
    if (rule.action_type === 'add_tag') return `Tag: "${rule.add_tag_value}"`;
    return '—';
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)' }}>
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Workflow Engine</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Conditional automation rules triggered by lead changes</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Rule
          </Button>
        </div>

        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: 'rgba(248,212,23,0.07)', border: '1px solid rgba(248,212,23,0.25)' }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#f8d417' }} />
          <p className="text-xs" style={{ color: '#9ea7b5' }}>
            <strong style={{ color: '#f8d417' }}>How it works:</strong> Rules fire when a lead's status or score changes and the trigger condition matches. Actions run automatically — sequences send, leads get assigned, or tags are applied.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f8d417' }} /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ border: '2px dashed rgba(248,212,23,0.2)' }}>
            <GitBranch className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
            <p className="font-semibold mb-1" style={{ color: '#9ea7b5' }}>No workflow rules yet</p>
            <p className="text-sm mb-4" style={{ color: '#5e6a78' }}>Automate sequences, assignments & tags based on lead behavior</p>
            <Button onClick={() => { setEditing(null); setShowModal(true); }}
              style={{ background: 'linear-gradient(135deg, #f8d417, #ea00ea)', color: '#0a1929' }}>
              <Plus className="h-4 w-4 mr-1" /> Create First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => {
              const triggerType = TRIGGER_TYPES.find(t => t.value === rule.trigger_type);
              return (
                <div key={rule.id} className="rounded-xl p-4" style={{ ...CARD, border: `1.5px solid ${rule.is_active ? 'rgba(248,212,23,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm" style={{ color: '#fff' }}>{rule.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: rule.is_active ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)', color: rule.is_active ? '#2ecc71' : '#5e6a78' }}>
                          {rule.is_active ? 'Active' : 'Paused'}
                        </span>
                        {(rule.run_count || 0) > 0 && (
                          <span className="text-[10px]" style={{ color: '#5e6a78' }}>
                            <Play className="h-2.5 w-2.5 inline mr-0.5" />{rule.run_count} runs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-1 rounded-lg font-mono" style={{ background: `${triggerType?.color || '#f8d417'}15`, color: triggerType?.color || '#f8d417' }}>
                          ⚡ {getTriggerLabel(rule)}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#5e6a78' }} />
                        <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(74,203,191,0.1)', color: '#4acbbf' }}>
                          🎯 {getActionLabel(rule)}
                        </span>
                      </div>
                      {(rule.filter_category || rule.filter_min_followers) && (
                        <p className="text-[10px] mt-1.5" style={{ color: '#5e6a78' }}>
                          Filters: {[rule.filter_category && `category="${rule.filter_category}"`, rule.filter_min_followers && `followers≥${rule.filter_min_followers}`].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggle(rule)} style={{ color: rule.is_active ? '#4acbbf' : '#5e6a78' }}>
                        {rule.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(rule); setShowModal(true); }}
                        style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)} style={{ color: '#f66c25' }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <RuleModal rule={editing} sequences={sequences} onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refetch(); }} />
      )}
    </div>
  );
}