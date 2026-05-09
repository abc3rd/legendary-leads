import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Mail, MessageSquare, Trash2, Search, Copy, FileText, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TemplateEditor from '../components/sequences/TemplateEditor';

const VARS = ['{{name}}', '{{username}}', '{{email}}', '{{category}}', '{{status}}'];

function TemplateCard({ template, onEdit, onDelete }) {
  const isEmail = template.channel === 'email';
  const color = isEmail ? '#54b0e7' : '#4acbbf';

  const copyBody = () => {
    navigator.clipboard.writeText(template.body || '');
    toast.success('Copied to clipboard');
  };

  return (
    <div className="group rounded-2xl p-5 transition-all hover:shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '66'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18` }}>
            {isEmail ? <Mail className="h-4.5 w-4.5" style={{ color }} /> : <MessageSquare className="h-4.5 w-4.5" style={{ color }} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: '#fff' }}>{template.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${color}18`, color }}>
              {template.channel?.toUpperCase()}
            </span>
          </div>
        </div>
        <button onClick={copyBody} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#9ea7b5' }} title="Copy body">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {template.subject && (
        <p className="text-xs mb-2 truncate font-medium" style={{ color: '#f8d417' }}>
          ✉ {template.subject}
        </p>
      )}
      <p className="text-xs line-clamp-3 mb-4" style={{ color: '#9ea7b5', lineHeight: '1.6' }}>{template.body}</p>

      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Button size="sm" onClick={() => onEdit(template)}
          className="flex-1 text-xs font-semibold"
          style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
          Edit Template
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(template.id)} style={{ color: '#f66c25' }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Templates() {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['follow_up_templates'],
    queryFn: () => base44.entities.FollowUpTemplate.list('-created_date', 200),
  });

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.body?.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'all' || t.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await base44.entities.FollowUpTemplate.delete(id);
    qc.invalidateQueries({ queryKey: ['follow_up_templates'] });
    toast.success('Template deleted');
  };

  const emailCount = templates.filter(t => t.channel === 'email').length;
  const smsCount = templates.filter(t => t.channel === 'sms').length;

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)' }}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#54b0e7', fontFamily: 'Poppins, sans-serif' }}>
                Templates
              </h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Reusable email & SMS drafts for sequences and workflows</p>
            </div>
          </div>
          <Button onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
            style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Stats + Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {[
            { label: 'All', value: 'all', count: templates.length, color: '#ea00ea' },
            { label: 'Email', value: 'email', count: emailCount, color: '#54b0e7' },
            { label: 'SMS', value: 'sms', count: smsCount, color: '#4acbbf' },
          ].map(f => (
            <button key={f.value} onClick={() => setChannelFilter(f.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: channelFilter === f.value ? `${f.color}22` : 'rgba(255,255,255,0.04)',
                color: channelFilter === f.value ? f.color : '#9ea7b5',
                border: `1.5px solid ${channelFilter === f.value ? f.color + '66' : 'transparent'}`,
              }}>
              {f.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${f.color}22`, color: f.color }}>{f.count}</span>
            </button>
          ))}
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#5e6a78' }} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                className="pl-9 text-sm" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Variables reference */}
        <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3 flex-wrap"
          style={{ background: 'rgba(84,176,231,0.07)', border: '1px solid rgba(84,176,231,0.2)' }}>
          <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#54b0e7' }} />
          <span className="text-xs" style={{ color: '#9ea7b5' }}>Available variables:</span>
          {VARS.map(v => (
            <code key={v} className="text-xs px-2 py-0.5 rounded cursor-pointer transition-opacity hover:opacity-70"
              style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}
              onClick={() => { navigator.clipboard.writeText(v); toast.success(`Copied ${v}`); }}>
              {v}
            </code>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#54b0e7', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ border: '2px dashed rgba(84,176,231,0.2)' }}>
            <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
            <p className="font-semibold mb-1" style={{ color: '#9ea7b5' }}>
              {search || channelFilter !== 'all' ? 'No templates match your filter' : 'No templates yet'}
            </p>
            <p className="text-sm mb-4" style={{ color: '#5e6a78' }}>Create reusable drafts with dynamic variables</p>
            {!search && channelFilter === 'all' && (
              <Button onClick={() => { setEditingTemplate(null); setShowEditor(true); }}
                style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}>
                <Plus className="h-4 w-4 mr-1" /> Create First Template
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t}
                onEdit={(t) => { setEditingTemplate(t); setShowEditor(true); }}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setShowEditor(false)}
          onSaved={() => { setShowEditor(false); qc.invalidateQueries({ queryKey: ['follow_up_templates'] }); }}
        />
      )}
    </div>
  );
}