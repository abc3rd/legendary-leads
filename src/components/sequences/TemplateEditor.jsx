import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const VARIABLES = ['{{name}}', '{{username}}', '{{email}}', '{{phone}}', '{{category}}', '{{status}}'];

export default function TemplateEditor({ template, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: template?.name || '',
    channel: template?.channel || 'email',
    subject: template?.subject || '',
    body: template?.body || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const insertVar = (v) => set('body', form.body + v);

  const save = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error('Name and body are required');
      return;
    }
    setSaving(true);
    if (template?.id) {
      await base44.entities.FollowUpTemplate.update(template.id, form);
    } else {
      await base44.entities.FollowUpTemplate.create(form);
    }
    toast.success(template ? 'Template updated' : 'Template created');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
        border: '2px solid #4acbbf'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(74,203,191,0.3)' }}>
          <h2 className="text-lg font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} style={{ color: '#9ea7b5' }}><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Name */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Template Name</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Cold Outreach Email"
              style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#fff' }} />
          </div>

          {/* Channel */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#9ea7b5' }}>Channel</label>
            <div className="grid grid-cols-2 gap-2">
              {['email', 'sms'].map(ch => (
                <button key={ch} onClick={() => set('channel', ch)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: form.channel === ch ? (ch === 'email' ? 'rgba(84,176,231,0.2)' : 'rgba(74,203,191,0.2)') : 'rgba(10,25,41,0.5)',
                    border: `2px solid ${form.channel === ch ? (ch === 'email' ? '#54b0e7' : '#4acbbf') : '#5e6a78'}`,
                    color: form.channel === ch ? (ch === 'email' ? '#54b0e7' : '#4acbbf') : '#9ea7b5'
                  }}>
                  {ch === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {ch === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
          </div>

          {/* Subject (email only) */}
          {form.channel === 'email' && (
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Subject Line</label>
              <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Hey {{name}}, let's connect!"
                style={{ background: '#071a2c', borderColor: '#54b0e7', color: '#fff' }} />
            </div>
          )}

          {/* Variables */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#9ea7b5' }}>Insert Variable</label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <button key={v} onClick={() => insertVar(v)}
                  className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf', border: '1px solid rgba(74,203,191,0.3)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>
              Message Body {form.channel === 'sms' && <span style={{ color: '#f66c25' }}>(keep under 160 chars for single SMS)</span>}
            </label>
            <textarea
              value={form.body}
              onChange={e => set('body', e.target.value)}
              rows={6}
              placeholder="Hi {{name}}, I came across your profile and wanted to reach out..."
              className="w-full rounded-lg p-3 text-sm resize-none outline-none"
              style={{ background: '#071a2c', border: '1px solid #4acbbf', color: '#fff' }}
            />
            {form.channel === 'sms' && (
              <p className="text-xs mt-1" style={{ color: form.body.length > 160 ? '#f66c25' : '#9ea7b5' }}>
                {form.body.length} / 160 characters
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'rgba(74,203,191,0.3)' }}>
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #5e6a78' }}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1 font-semibold"
            style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
            {saving ? 'Saving...' : (template ? 'Update' : 'Create Template')}
          </Button>
        </div>
      </div>
    </div>
  );
}