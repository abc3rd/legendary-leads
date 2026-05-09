import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

const TASK_TYPES = ['Make Phone Call', 'Send Direct Message', 'Send Email', 'Schedule Meeting', 'Follow Up', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function TaskModal({ task, leads, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'Follow Up',
    status: task?.status || 'Pending',
    priority: task?.priority || 'Medium',
    assigned_to: task?.assigned_to || '',
    lead_id: task?.lead_id || '',
    lead_name: task?.lead_name || '',
    lead_username: task?.lead_username || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    notes: task?.notes || '',
    ...(task?.id ? { id: task.id } : {}),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLeadChange = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    set('lead_id', leadId);
    set('lead_name', lead?.name || lead?.username || '');
    set('lead_username', lead?.username || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const data = { ...form };
    if (data.due_date) data.due_date = new Date(data.due_date).toISOString();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '2px solid #f8d417' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(248,212,23,0.3)' }}>
          <h2 className="font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
            {task?.id ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} style={{ color: '#9ea7b5' }}><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required
              placeholder="Task title…"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Type</label>
              <select value={form.task_type} onChange={e => set('task_type', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Due Date</label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Assign To (email)</label>
            <Input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
              placeholder="teammate@company.com"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Linked Lead</label>
            <select value={form.lead_id} onChange={e => handleLeadChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
              <option value="">No linked lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.username} {l.category ? `· ${l.category}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Optional details…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }} />
          </div>

          {form.status === 'Completed' && (
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#9ea7b5' }}>Completion Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={2} placeholder="What happened?"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 font-bold"
              style={{ background: 'linear-gradient(135deg, #f8d417 0%, #f66c25 100%)', color: '#0a1929' }}>
              {task?.id ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}