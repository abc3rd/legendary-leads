import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Zap, Clock, Mail, MessageSquare, Loader2, ToggleLeft, ToggleRight, Trash2, BookTemplate, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TemplateEditor from '../components/sequences/TemplateEditor';
import SequenceEditor from '../components/sequences/SequenceEditor';
import FollowUpLogsPanel from '../components/sequences/FollowUpLogsPanel';
import { toast } from 'sonner';

const TABS = ['Templates', 'Sequences', 'Activity Log'];

export default function Sequences() {
  const [activeTab, setActiveTab] = useState('Sequences');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingSequence, setEditingSequence] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showSequenceEditor, setShowSequenceEditor] = useState(false);
  const qc = useQueryClient();

  const { data: templates = [], isLoading: tLoading } = useQuery({
    queryKey: ['follow_up_templates'],
    queryFn: () => base44.entities.FollowUpTemplate.list('-created_date', 100),
  });

  const { data: sequences = [], isLoading: sLoading } = useQuery({
    queryKey: ['follow_up_sequences'],
    queryFn: () => base44.entities.FollowUpSequence.list('-created_date', 100),
  });

  const deleteTemplate = async (id) => {
    await base44.entities.FollowUpTemplate.delete(id);
    qc.invalidateQueries({ queryKey: ['follow_up_templates'] });
    toast.success('Template deleted');
  };

  const deleteSequence = async (id) => {
    await base44.entities.FollowUpSequence.delete(id);
    qc.invalidateQueries({ queryKey: ['follow_up_sequences'] });
    toast.success('Sequence deleted');
  };

  const toggleSequence = async (seq) => {
    await base44.entities.FollowUpSequence.update(seq.id, { is_active: !seq.is_active });
    qc.invalidateQueries({ queryKey: ['follow_up_sequences'] });
  };

  const openNewTemplate = () => { setEditingTemplate(null); setShowTemplateEditor(true); };
  const openEditTemplate = (t) => { setEditingTemplate(t); setShowTemplateEditor(true); };
  const openNewSequence = () => { setEditingSequence(null); setShowSequenceEditor(true); };
  const openEditSequence = (s) => { setEditingSequence(s); setShowSequenceEditor(true); };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" style={{ color: '#9ea7b5' }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
              Follow-Up Sequences
            </h1>
            <p className="text-sm" style={{ color: '#9ea7b5' }}>Automate email & SMS outreach for your leads</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'rgba(74,203,191,0.2)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{
                color: activeTab === tab ? '#4acbbf' : '#9ea7b5',
                borderBottom: activeTab === tab ? '2px solid #4acbbf' : '2px solid transparent',
                marginBottom: '-1px'
              }}>
              {tab === 'Templates' && <BookTemplate className="h-4 w-4 inline mr-1.5" />}
              {tab === 'Sequences' && <Zap className="h-4 w-4 inline mr-1.5" />}
              {tab === 'Activity Log' && <Activity className="h-4 w-4 inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'Templates' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm" style={{ color: '#9ea7b5' }}>
                Reusable message templates with dynamic variables like <code className="text-xs px-1 rounded" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>{'{{name}}'}</code>
              </p>
              <Button onClick={openNewTemplate} style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
                <Plus className="h-4 w-4 mr-1" /> New Template
              </Button>
            </div>
            {tLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4acbbf' }} /></div>
            ) : templates.length === 0 ? (
              <EmptyState icon={<Mail className="h-10 w-10" />} label="No templates yet" action={openNewTemplate} actionLabel="Create Template" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                  <TemplateCard key={t.id} template={t} onEdit={openEditTemplate} onDelete={deleteTemplate} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sequences Tab */}
        {activeTab === 'Sequences' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm" style={{ color: '#9ea7b5' }}>
                Triggers connect lead events to templates. Status-change triggers fire instantly; time-based run on a daily schedule.
              </p>
              <Button onClick={openNewSequence} style={{ background: 'linear-gradient(135deg, #f8d417 0%, #f66c25 100%)', color: '#0a1929' }}>
                <Plus className="h-4 w-4 mr-1" /> New Sequence
              </Button>
            </div>
            {sLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4acbbf' }} /></div>
            ) : sequences.length === 0 ? (
              <EmptyState icon={<Zap className="h-10 w-10" />} label="No sequences yet" action={openNewSequence} actionLabel="Create Sequence" />
            ) : (
              <div className="space-y-3">
                {sequences.map(s => (
                  <SequenceCard key={s.id} sequence={s} templates={templates} onEdit={openEditSequence} onDelete={deleteSequence} onToggle={toggleSequence} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'Activity Log' && <FollowUpLogsPanel />}
      </div>

      {/* Editors (modals) */}
      {showTemplateEditor && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setShowTemplateEditor(false)}
          onSaved={() => { setShowTemplateEditor(false); qc.invalidateQueries({ queryKey: ['follow_up_templates'] }); }}
        />
      )}
      {showSequenceEditor && (
        <SequenceEditor
          sequence={editingSequence}
          templates={templates}
          onClose={() => setShowSequenceEditor(false)}
          onSaved={() => { setShowSequenceEditor(false); qc.invalidateQueries({ queryKey: ['follow_up_sequences'] }); }}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, label, action, actionLabel }) {
  return (
    <div className="text-center py-20 rounded-2xl" style={{ border: '2px dashed rgba(74,203,191,0.2)' }}>
      <div className="inline-flex mb-4" style={{ color: '#5e6a78' }}>{icon}</div>
      <p className="mb-4 text-lg" style={{ color: '#9ea7b5' }}>{label}</p>
      <Button onClick={action} style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
        <Plus className="h-4 w-4 mr-1" /> {actionLabel}
      </Button>
    </div>
  );
}

function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '1.5px solid #5e6a78' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {template.channel === 'email'
            ? <Mail className="h-4 w-4 flex-shrink-0" style={{ color: '#54b0e7' }} />
            : <MessageSquare className="h-4 w-4 flex-shrink-0" style={{ color: '#4acbbf' }} />}
          <h3 className="font-semibold truncate" style={{ color: '#ffffff' }}>{template.name}</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{
          background: template.channel === 'email' ? 'rgba(84,176,231,0.2)' : 'rgba(74,203,191,0.2)',
          color: template.channel === 'email' ? '#54b0e7' : '#4acbbf'
        }}>{template.channel.toUpperCase()}</span>
      </div>
      {template.subject && <p className="text-xs mb-1 truncate" style={{ color: '#f8d417' }}>Subject: {template.subject}</p>}
      <p className="text-xs line-clamp-2 mb-3" style={{ color: '#9ea7b5' }}>{template.body}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(template)} style={{ color: '#4acbbf', borderColor: '#4acbbf', border: '1px solid' }}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(template.id)} style={{ color: '#f66c25' }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SequenceCard({ sequence, templates, onEdit, onDelete, onToggle }) {
  const template = templates.find(t => t.id === sequence.template_id);
  return (
    <div className="rounded-xl p-4" style={{
      background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
      border: `1.5px solid ${sequence.is_active ? '#4acbbf' : '#5e6a78'}`
    }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
            background: sequence.trigger_type === 'status_change' ? 'rgba(248,212,23,0.15)' : 'rgba(84,176,231,0.15)'
          }}>
            {sequence.trigger_type === 'status_change'
              ? <Zap className="h-5 w-5" style={{ color: '#f8d417' }} />
              : <Clock className="h-5 w-5" style={{ color: '#54b0e7' }} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate" style={{ color: '#ffffff' }}>{sequence.name}</h3>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>
              {sequence.trigger_type === 'status_change'
                ? `Fires when status → "${(sequence.trigger_status || 'any').replace(/_/g, ' ')}"`
                : `Time-based — ${sequence.delay_days || 0}d after import`}
              {template && ` · ${template.channel === 'email' ? '✉' : '💬'} ${template.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(sequence)} style={{ color: sequence.is_active ? '#4acbbf' : '#5e6a78' }}>
            {sequence.is_active
              ? <ToggleRight className="h-7 w-7" />
              : <ToggleLeft className="h-7 w-7" />}
          </button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(sequence)} style={{ color: '#9ea7b5', border: '1px solid #5e6a78' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(sequence.id)} style={{ color: '#f66c25' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}