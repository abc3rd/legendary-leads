import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Mail, Activity, MessageSquare, UserCheck, Star, Loader2, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' };

const ACTIVITY_ICONS = {
  note: MessageSquare, status_change: RefreshCw, assignment: UserCheck,
  email_sent: Mail, sms_sent: MessageSquare, score_update: Star,
};
const ACTIVITY_COLORS = {
  note: '#4acbbf', status_change: '#f8d417', assignment: '#ea00ea',
  email_sent: '#54b0e7', sms_sent: '#a78bfa', score_update: '#f66c25',
};

function InviteModal({ onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) { toast.error('Email required'); return; }
    setLoading(true);
    await base44.users.inviteUser(email.trim(), role);
    toast.success(`Invite sent to ${email}`);
    onInvited();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0d1b2a', border: '2px solid #ea00ea' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Invite Team Member</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Email address</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com"
              style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}>
              <option value="user">Team Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Cancel</Button>
          <Button onClick={handleInvite} disabled={loading} className="flex-1 font-semibold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" />Send Invite</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ item }) {
  const Icon = ACTIVITY_ICONS[item.activity_type] || MessageSquare;
  const color = ACTIVITY_COLORS[item.activity_type] || '#4acbbf';

  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}15` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: '#fff' }}>{item.author_name || item.author_email || 'System'}</span>
          {item.lead_name && <span className="text-xs" style={{ color: '#5e6a78' }}>on <span style={{ color: '#4acbbf' }}>@{item.lead_username || item.lead_name}</span></span>}
          <span className="text-[10px] ml-auto" style={{ color: '#5e6a78' }}>
            {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true }) : ''}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{item.body}</p>
      </div>
    </div>
  );
}

export default function TeamDashboard() {
  const [showInvite, setShowInvite] = useState(false);
  const [selectedLead, setSelectedLead] = useState('');
  const [noteText, setNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['team_users'],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['leads_team'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });
  const { data: activity = [], isLoading: actLoading } = useQuery({
    queryKey: ['lead_notes_feed'],
    queryFn: () => base44.entities.LeadNote.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const postNote = async () => {
    if (!noteText.trim()) return;
    setPostingNote(true);
    const lead = leads.find(l => l.id === selectedLead);
    await base44.entities.LeadNote.create({
      lead_id: selectedLead || '',
      lead_name: lead?.name || '',
      lead_username: lead?.username || '',
      author_email: currentUser?.email || '',
      author_name: currentUser?.full_name || currentUser?.email || '',
      body: noteText.trim(),
      activity_type: 'note',
    });
    setNoteText('');
    qc.invalidateQueries({ queryKey: ['lead_notes_feed'] });
    toast.success('Note posted');
    setPostingNote(false);
  };

  const totalLeads = leads.length;
  const assignedLeads = leads.filter(l => l.assigned_to).length;

  const byAssignee = users.map(u => ({
    user: u,
    count: leads.filter(l => l.assigned_to === u.email).length,
    active: leads.filter(l => l.assigned_to === u.email && !['converted','unresponsive'].includes(l.status)).length,
  }));

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Team Dashboard</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Manage your team, assignments & shared activity</p>
            </div>
          </div>
          <Button onClick={() => setShowInvite(true)} style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
            <Plus className="h-4 w-4 mr-1.5" /> Invite Member
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Team Members', value: users.length, color: '#ea00ea' },
            { label: 'Total Leads', value: totalLeads, color: '#4acbbf' },
            { label: 'Assigned', value: assignedLeads, color: '#f8d417' },
            { label: 'Unassigned', value: totalLeads - assignedLeads, color: '#f66c25' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={CARD}>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <div className="rounded-xl p-4" style={CARD}>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#ea00ea' }}>
                <Users className="h-4 w-4" /> Team Members
              </h2>
              {users.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#5e6a78' }}>No team members yet</p>
              ) : (
                <div className="space-y-2">
                  {byAssignee.map(({ user, count, active }) => {
                    const initial = user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
                    return (
                      <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{user.full_name || user.email}</p>
                          <p className="text-[10px]" style={{ color: '#5e6a78' }}>{user.role}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{ color: '#4acbbf' }}>{count}</div>
                          <div className="text-[10px]" style={{ color: '#5e6a78' }}>{active} active</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button onClick={() => setShowInvite(true)} variant="ghost" className="w-full mt-3 text-xs"
                style={{ color: '#ea00ea', border: '1px dashed rgba(234,0,234,0.3)' }}>
                <Plus className="h-3 w-3 mr-1" /> Invite team member
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl p-4" style={CARD}>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#4acbbf' }}>
                <MessageSquare className="h-4 w-4" /> Post to Activity Feed
              </h2>
              <div className="flex flex-col gap-2">
                <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#071a2c', color: selectedLead ? '#fff' : '#5e6a78', border: '1px solid #2a3a4a' }}>
                  <option value="">General note (no lead)</option>
                  {leads.slice(0, 100).map(l => <option key={l.id} value={l.id}>@{l.username || l.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note for the team…"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postNote()}
                    style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
                  <Button onClick={postNote} disabled={postingNote || !noteText.trim()}
                    style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929', flexShrink: 0 }}>
                    {postingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={CARD}>
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: '#f8d417' }}>
                <Activity className="h-4 w-4" /> Team Activity Feed
              </h2>
              <p className="text-xs mb-3" style={{ color: '#5e6a78' }}>Notes, assignments & system events</p>
              {actLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#4acbbf' }} /></div>
              ) : activity.length === 0 ? (
                <div className="text-center py-10">
                  <Activity className="h-8 w-8 mx-auto mb-2" style={{ color: '#2a3a4a' }} />
                  <p className="text-xs" style={{ color: '#5e6a78' }}>No activity yet — post a note to get started</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {activity.map(item => <ActivityItem key={item.id} item={item} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={() => qc.invalidateQueries({ queryKey: ['team_users'] })} />}
    </div>
  );
}