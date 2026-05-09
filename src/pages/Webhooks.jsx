import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Zap, Globe, CheckCircle2, XCircle, Loader2, Copy, RefreshCw, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const EVENTS = [
  { id: 'lead.created', label: 'Lead Created', desc: 'Fires when a new lead is added', color: '#4acbbf' },
  { id: 'lead.updated', label: 'Lead Updated', desc: 'Fires when a lead is modified', color: '#54b0e7' },
  { id: 'lead.status_changed', label: 'Lead Status Changed', desc: 'Fires when lead pipeline status changes', color: '#f8d417' },
  { id: 'lead.converted', label: 'Lead Converted', desc: 'Fires when a lead is marked converted', color: '#2ecc71' },
  { id: 'followup.sent', label: 'Follow-Up Sent', desc: 'Fires when a follow-up email/SMS is sent', color: '#a78bfa' },
  { id: 'task.completed', label: 'Task Completed', desc: 'Fires when a task is marked complete', color: '#f66c25' },
  { id: 'lead.assigned', label: 'Lead Assigned', desc: 'Fires when a lead is assigned to a team member', color: '#ea00ea' },
];

const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' };

function WebhookModal({ webhook, onClose, onSaved }) {
  const [form, setForm] = useState(webhook || { name: '', url: '', events: [], secret: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const toggleEvent = (id) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter(e => e !== id) : [...f.events, id]
    }));
  };

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    setForm(f => ({ ...f, secret }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.url.trim() || !form.url.startsWith('http')) { toast.error('Valid URL required'); return; }
    if (form.events.length === 0) { toast.error('Select at least one event'); return; }
    setSaving(true);
    if (form.id) {
      await base44.entities.WebhookConfig.update(form.id, form);
    } else {
      await base44.entities.WebhookConfig.create({ ...form, delivery_count: 0, failure_count: 0 });
    }
    toast.success(form.id ? 'Webhook updated' : 'Webhook created');
    onSaved();
    setSaving(false);
  };

  const handleTest = async () => {
    if (!form.url.trim()) { toast.error('Enter a URL first'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(form.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': 'test.ping' },
        body: JSON.stringify({ event: 'test.ping', timestamp: new Date().toISOString(), data: { message: 'Legendary Leads webhook test' } }),
        mode: 'no-cors',
      });
      setTestResult({ ok: true, msg: 'Test payload sent (no-cors mode)' });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#0d1b2a', border: '2px solid #ea00ea' }}>
        <h2 className="text-xl font-bold mb-5" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
          {form.id ? 'Edit Webhook' : 'New Webhook'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9ea7b5' }}>Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Zapier Lead Sync"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9ea7b5' }}>Endpoint URL</label>
            <div className="flex gap-2">
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://hooks.zapier.com/..."
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              <Button size="sm" onClick={handleTest} disabled={testing}
                style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf', border: '1px solid #4acbbf', whiteSpace: 'nowrap' }}>
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
              </Button>
            </div>
            {testResult && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: testResult.ok ? '#2ecc71' : '#f66c25' }}>
                {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {testResult.msg}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: '#9ea7b5' }}>Secret (for HMAC signature)</label>
            <div className="flex gap-2">
              <Input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                placeholder="Optional signing secret"
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
              <Button size="sm" onClick={generateSecret}
                style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea', border: '1px solid #ea00ea', whiteSpace: 'nowrap' }}>
                Generate
              </Button>
            </div>
            <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>We'll send X-Webhook-Signature header for verification</p>
          </div>

          <div>
            <label className="text-xs mb-2 block" style={{ color: '#9ea7b5' }}>Subscribe to Events</label>
            <div className="space-y-2">
              {EVENTS.map(ev => (
                <label key={ev.id} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: form.events.includes(ev.id) ? `${ev.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${form.events.includes(ev.id) ? ev.color : '#1a2a3a'}` }}>
                  <input type="checkbox" checked={form.events.includes(ev.id)} onChange={() => toggleEvent(ev.id)}
                    className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: form.events.includes(ev.id) ? ev.color : '#d7dde5' }}>{ev.label}</p>
                    <p className="text-xs" style={{ color: '#5e6a78' }}>{ev.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 font-semibold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (form.id ? 'Update' : 'Create Webhook')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Webhooks() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => base44.entities.WebhookConfig.list('-created_date', 100),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['webhooks'] });

  const handleToggle = async (wh) => {
    await base44.entities.WebhookConfig.update(wh.id, { is_active: !wh.is_active });
    refetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this webhook?')) return;
    await base44.entities.WebhookConfig.delete(id);
    toast.success('Webhook deleted');
    refetch();
  };

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (wh) => { setEditing(wh); setShowModal(true); };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)' }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Webhooks</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Send real-time events to external platforms</p>
            </div>
          </div>
          <Button onClick={openNew} style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Webhook
          </Button>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: 'rgba(74,203,191,0.08)', border: '1px solid rgba(74,203,191,0.3)' }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#4acbbf' }} />
          <div className="text-xs" style={{ color: '#9ea7b5' }}>
            <strong style={{ color: '#4acbbf' }}>How it works:</strong> Configure endpoint URLs and subscribe to events. When events fire (lead created, status changed, etc.), we send a <code className="px-1 rounded text-xs" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>POST</code> request with JSON payload to your URL. Compatible with Zapier, Make, n8n, and any custom endpoint.
          </div>
        </div>

        {/* Event Reference */}
        <div className="rounded-xl p-4 mb-6" style={CARD}>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#c3c3c3' }}>Available Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EVENTS.map(ev => (
              <div key={ev.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                <code className="text-xs" style={{ color: ev.color }}>{ev.id}</code>
                <span className="text-xs truncate" style={{ color: '#5e6a78' }}>— {ev.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks List */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ea00ea' }} /></div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ border: '2px dashed rgba(234,0,234,0.2)' }}>
            <Globe className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
            <p className="font-semibold mb-1" style={{ color: '#9ea7b5' }}>No webhooks configured</p>
            <p className="text-sm mb-4" style={{ color: '#5e6a78' }}>Connect to Zapier, Make, or any HTTP endpoint</p>
            <Button onClick={openNew} style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
              <Plus className="h-4 w-4 mr-1" /> Create First Webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="rounded-xl p-4" style={{ ...CARD, border: `1.5px solid ${wh.is_active ? 'rgba(74,203,191,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: '#fff' }}>{wh.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: wh.is_active ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)', color: wh.is_active ? '#2ecc71' : '#5e6a78' }}>
                        {wh.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs mb-2 truncate" style={{ color: '#4acbbf' }}>{wh.url}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(wh.events || []).map(evId => {
                        const ev = EVENTS.find(e => e.id === evId);
                        return (
                          <span key={evId} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: `${ev?.color || '#ea00ea'}15`, color: ev?.color || '#ea00ea', border: `1px solid ${ev?.color || '#ea00ea'}30` }}>
                            {evId}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs" style={{ color: '#5e6a78' }}>
                      <span>📤 {wh.delivery_count || 0} delivered</span>
                      {wh.failure_count > 0 && <span style={{ color: '#f66c25' }}>⚠ {wh.failure_count} failed</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(wh)} title={wh.is_active ? 'Pause' : 'Activate'}
                      style={{ color: wh.is_active ? '#4acbbf' : '#5e6a78' }}>
                      {wh.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(wh)}
                      style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(wh.id)}
                      style={{ color: '#f66c25' }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <WebhookModal
          webhook={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refetch(); }}
        />
      )}
    </div>
  );
}