import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Clock, Users, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';

const VARS = ['{{name}}', '{{username}}', '{{email}}', '{{category}}', '{{status}}'];

const STATUS_OPTIONS = ['new', 'cold_outreach', 'contacted', 'qualified', 'in_negotiation', 'converted', 'unresponsive'];

export default function CampaignEditor({ campaign, leads = [], onClose, onSaved }) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    body: campaign?.body || '',
    from_name: campaign?.from_name || 'Legendary Leads',
    reply_to: campaign?.reply_to || '',
    status: campaign?.status || 'draft',
    scheduled_at: campaign?.scheduled_at || '',
    target_filter: campaign?.target_filter || '{}',
    sequence_step: campaign?.sequence_step || 1,
  });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState(() => {
    try { return JSON.parse(campaign?.target_filter || '{}').status || ''; } catch { return ''; }
  });
  const [filterCategory, setFilterCategory] = useState(() => {
    try { return JSON.parse(campaign?.target_filter || '{}').category || ''; } catch { return ''; }
  });

  const categories = [...new Set(leads.map(l => l.category).filter(Boolean))];

  const targetCount = leads.filter(l => {
    if (!l.email) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterCategory && l.category !== filterCategory) return false;
    return true;
  }).length;

  const buildFilter = (status, category) => {
    const f = {};
    if (status) f.status = status;
    if (category) f.category = category;
    return JSON.stringify(f);
  };

  const insertVar = (v) => {
    setForm(f => ({ ...f, body: f.body + v }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }
    setSaving(true);
    const payload = { ...form, target_filter: buildFilter(filterStatus, filterCategory) };
    if (campaign?.id) {
      await base44.entities.EmailCampaign.update(campaign.id, payload);
      toast.success('Campaign updated');
    } else {
      await base44.entities.EmailCampaign.create(payload);
      toast.success('Campaign created');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#0d1b2a', border: '1.5px solid rgba(84,176,231,0.3)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(84,176,231,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(84,176,231,0.15)' }}>
              <Mail className="h-4.5 w-4.5" style={{ color: '#54b0e7' }} />
            </div>
            <h2 className="font-bold" style={{ color: '#54b0e7' }}>{campaign ? 'Edit Campaign' : 'New Email Campaign'}</h2>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: '#9ea7b5' }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name & step */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Campaign Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Welcome Sequence Step 1"
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Sequence Step</label>
              <Input type="number" min={1} value={form.sequence_step}
                onChange={e => setForm(f => ({ ...f, sequence_step: parseInt(e.target.value) || 1 }))}
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          </div>

          {/* From / Reply-to */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>From Name</label>
              <Input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))}
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Reply-To Email</label>
              <Input value={form.reply_to} onChange={e => setForm(f => ({ ...f, reply_to: e.target.value }))}
                placeholder="optional"
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Subject Line *</label>
            <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Hey {{name}}, we'd love to connect!"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs" style={{ color: '#9ea7b5' }}>Email Body *</label>
              <div className="flex gap-1.5 flex-wrap">
                {VARS.map(v => (
                  <button key={v} onClick={() => insertVar(v)}
                    className="text-[10px] px-1.5 py-0.5 rounded hover:opacity-70 transition-opacity"
                    style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={8}
              placeholder="Hi {{name}},&#10;&#10;We noticed your profile and wanted to reach out..."
              className="w-full rounded-lg p-3 text-sm resize-y"
              style={{ background: '#071a2c', border: '1px solid #2a3a4a', color: '#fff', outline: 'none', fontFamily: 'monospace' }}
            />
          </div>

          {/* Audience filter */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" style={{ color: '#ea00ea' }} />
              <h4 className="text-sm font-semibold" style={{ color: '#ea00ea' }}>Target Audience</h4>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea' }}>
                {targetCount} leads with email
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Filter by Status</label>
                <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Filter by Category</label>
                <Select value={filterCategory || 'all'} onValueChange={v => setFilterCategory(v === 'all' ? '' : v)}>
                  <SelectTrigger style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }}>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Schedule Send (optional)</label>
            <div className="flex gap-2 items-center">
              <Clock className="h-4 w-4 flex-shrink-0" style={{ color: '#54b0e7' }} />
              <Input type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(84,176,231,0.15)' }}>
          <Button variant="ghost" onClick={onClose} style={{ color: '#9ea7b5' }}>Cancel</Button>
          <Button onClick={() => { setForm(f => ({ ...f, status: 'draft' })); handleSave(); }} disabled={saving}
            variant="outline" className="flex-1" style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#9ea7b5' }}>
            Save as Draft
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="flex-1" style={{ background: 'linear-gradient(135deg,#54b0e7,#4acbbf)', color: '#0a1929' }}>
            {saving ? 'Saving…' : campaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </div>
  );
}