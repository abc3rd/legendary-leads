import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Users, Plus, Trash2, Loader2, ArrowLeft, ToggleLeft, ToggleRight, Zap, Target, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const OMEGA = {
  bg: '#0d0d1a',
  card: 'linear-gradient(135deg, #0d0d1a 0%, #111128 100%)',
  border: 'rgba(234,0,234,0.25)',
  magenta: '#ea00ea',
  teal: '#00c2e0',
  silver: '#c3c3c3',
  muted: '#7a7a8c',
  yellow: '#f5d800',
};

const CATEGORIES = ['Fitness & Health', 'Beauty & Fashion', 'Food & Cooking', 'Travel', 'Business & Finance',
  'Tech & Gadgets', 'Gaming', 'Real Estate', 'Music', 'Motivational', 'Pet Care'];

export default function RoundRobin() {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategories, setNewCategories] = useState([]);
  const [adding, setAdding] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const qc = useQueryClient();

  const { data: assignees = [], isLoading } = useQuery({
    queryKey: ['lead_assignments'],
    queryFn: () => base44.entities.LeadAssignment.list('-created_date', 100),
  });

  const { data: unassignedLeads = [] } = useQuery({
    queryKey: ['unassigned_leads'],
    queryFn: async () => {
      const all = await base44.entities.Lead.list('-created_date', 200);
      return all.filter(l => !l.assigned_to);
    },
    refetchInterval: 10000,
  });

  const addAssignee = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    await base44.entities.LeadAssignment.create({
      assignee_email: newEmail.trim(),
      assignee_name: newName.trim() || newEmail.trim(),
      category_expertise: newCategories,
      active_lead_count: 0,
      is_active: true,
    });
    setNewEmail(''); setNewName(''); setNewCategories([]);
    qc.invalidateQueries({ queryKey: ['lead_assignments'] });
    toast.success('Team member added!');
    setAdding(false);
  };

  const toggleActive = async (a) => {
    await base44.entities.LeadAssignment.update(a.id, { is_active: !a.is_active });
    qc.invalidateQueries({ queryKey: ['lead_assignments'] });
  };

  const deleteAssignee = async (id) => {
    await base44.entities.LeadAssignment.delete(id);
    qc.invalidateQueries({ queryKey: ['lead_assignments'] });
    toast.success('Removed');
  };

  const autoAssignAll = async () => {
    setAssigning('all');
    let count = 0;
    for (const lead of unassignedLeads) {
      const res = await base44.functions.invoke('roundRobinAssign', { lead_id: lead.id, category: lead.category });
      if (res.data?.success) count++;
    }
    qc.invalidateQueries({ queryKey: ['leads'] });
    qc.invalidateQueries({ queryKey: ['unassigned_leads'] });
    qc.invalidateQueries({ queryKey: ['lead_assignments'] });
    toast.success(`Auto-assigned ${count} leads!`);
    setAssigning(null);
  };

  const toggleCat = (cat) => {
    setNewCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: OMEGA.bg }}>
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('TaskBoard')}>
          <Button variant="ghost" className="mb-4" style={{ color: OMEGA.muted }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)' }}>
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" style={{ color: OMEGA.magenta, fontFamily: 'Poppins, sans-serif' }}>
              Round-Robin Assignment
            </h1>
            <p className="text-sm" style={{ color: OMEGA.muted }}>Auto-assign leads to team members by expertise & workload</p>
          </div>
          {unassignedLeads.length > 0 && (
            <Button
              onClick={autoAssignAll}
              disabled={!!assigning || assignees.filter(a => a.is_active).length === 0}
              style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}
            >
              {assigning === 'all' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Auto-Assign {unassignedLeads.length} Leads
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Team Members', value: assignees.filter(a => a.is_active).length, color: OMEGA.teal },
            { label: 'Unassigned Leads', value: unassignedLeads.length, color: OMEGA.yellow },
            { label: 'Total Assigned', value: assignees.reduce((s, a) => s + (a.active_lead_count || 0), 0), color: OMEGA.magenta },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: OMEGA.card, border: `1.5px solid ${OMEGA.border}` }}>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: OMEGA.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add Member */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: OMEGA.card, border: `1.5px solid ${OMEGA.border}` }}>
          <h2 className="font-bold mb-4 text-sm" style={{ color: OMEGA.teal }}>Add Team Member</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address *"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }} />
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }} />
          </div>
          <p className="text-xs font-semibold mb-2" style={{ color: OMEGA.muted }}>Category Expertise (select all that apply)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => toggleCat(cat)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: newCategories.includes(cat) ? OMEGA.magenta : 'rgba(255,255,255,0.05)',
                  color: newCategories.includes(cat) ? '#fff' : OMEGA.silver,
                  border: `1px solid ${newCategories.includes(cat) ? OMEGA.magenta : OMEGA.border}`,
                }}>
                {cat}
              </button>
            ))}
          </div>
          <Button onClick={addAssignee} disabled={!newEmail.trim() || adding}
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Member
          </Button>
        </div>

        {/* Assignee List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: OMEGA.magenta }} /></div>
        ) : (
          <div className="space-y-3">
            {assignees.map(a => (
              <div key={a.id} className="rounded-xl p-4" style={{
                background: OMEGA.card,
                border: `1.5px solid ${a.is_active ? OMEGA.border : 'rgba(100,100,120,0.2)'}`,
                opacity: a.is_active ? 1 : 0.6,
              }}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
                    {(a.assignee_name?.[0] || a.assignee_email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#fff' }}>{a.assignee_name || a.assignee_email}</p>
                    <p className="text-xs" style={{ color: OMEGA.muted }}>{a.assignee_email}</p>
                    {(a.category_expertise || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(a.category_expertise || []).map(cat => (
                          <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,194,224,0.15)', color: OMEGA.teal }}>
                            <Target className="h-2.5 w-2.5 inline mr-0.5" />{cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-2xl font-bold" style={{ color: OMEGA.yellow }}>{a.active_lead_count || 0}</p>
                    <p className="text-[10px]" style={{ color: OMEGA.muted }}>leads</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(a)} style={{ color: a.is_active ? OMEGA.teal : OMEGA.muted }}>
                      {a.is_active ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                    </button>
                    <button onClick={() => deleteAssignee(a.id)} style={{ color: '#f44' }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {assignees.length === 0 && (
              <div className="text-center py-16 rounded-2xl" style={{ border: `2px dashed ${OMEGA.border}` }}>
                <Users className="h-10 w-10 mx-auto mb-3" style={{ color: OMEGA.muted }} />
                <p style={{ color: OMEGA.muted }}>No team members configured yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}