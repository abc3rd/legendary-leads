import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, CheckSquare, FileDown, MessageSquare, Clock, Star, TrendingUp,
  Upload, Loader2, Eye, Lock, ExternalLink, Shield, Package, CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'new', label: 'Lead Identified', icon: User },
  { key: 'cold_outreach', label: 'Outreach Sent', icon: MessageSquare },
  { key: 'contacted', label: 'In Contact', icon: MessageSquare },
  { key: 'qualified', label: 'Qualified', icon: Star },
  { key: 'in_negotiation', label: 'Negotiating', icon: TrendingUp },
  { key: 'converted', label: 'Converted ✓', icon: CheckCircle2 },
];

const GRADE_COLORS = { A: '#2ecc71', B: '#4acbbf', C: '#f8d417', D: '#f66c25', F: '#e74c3c' };

function StatusTimeline({ status }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 72 }}>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all`}
                style={{
                  background: done ? (active ? 'linear-gradient(135deg,#ea00ea,#a78bfa)' : 'rgba(46,204,113,0.2)') : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${done ? (active ? '#ea00ea' : '#2ecc71') : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: active ? '0 0 12px rgba(234,0,234,0.5)' : 'none',
                }}>
                <Icon className="h-4 w-4" style={{ color: done ? (active ? '#fff' : '#2ecc71') : '#5e6a78' }} />
              </div>
              <span className="text-[10px] mt-1.5 text-center leading-tight"
                style={{ color: done ? (active ? '#ea00ea' : '#2ecc71') : '#5e6a78', maxWidth: 64 }}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="h-0.5 flex-1" style={{ minWidth: 16, background: i < currentIdx ? '#2ecc71' : 'rgba(255,255,255,0.08)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AssetCard({ asset }) {
  const isLink = asset.file_type === 'link' || (!asset.file_url && asset.description?.startsWith('http'));
  return (
    <div className="rounded-xl p-4 flex items-start gap-3 hover:bg-white/5 transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(84,176,231,0.12)' }}>
        <Package className="h-4.5 w-4.5" style={{ color: '#54b0e7' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#fff' }}>{asset.title}</p>
        {asset.description && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#9ea7b5' }}>{asset.description}</p>
        )}
        <p className="text-[10px] mt-1" style={{ color: '#5e6a78' }}>
          Shared by {asset.uploaded_by_name || 'Your team'} · {asset.file_type?.toUpperCase()}
        </p>
      </div>
      {asset.file_url && (
        <a href={asset.file_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all hover:opacity-80"
          style={{ background: 'rgba(84,176,231,0.15)', color: '#54b0e7', border: '1px solid rgba(84,176,231,0.3)' }}>
          <FileDown className="h-3.5 w-3.5" />
          {isLink ? 'Open' : 'Download'}
        </a>
      )}
    </div>
  );
}

export default function ClientPortal() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [lead, setLead] = useState(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuth) => {
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        setAuthed(true);
        // Auto-find their lead record by email
        const leads = await base44.entities.Lead.list('-created_date', 5000);
        const match = leads.find(l => l.email?.toLowerCase() === me.email?.toLowerCase());
        if (match) setLead(match);
      }
      setLoading(false);
    });
  }, []);

  const handleLookup = async () => {
    if (!lookupEmail.trim()) return;
    setLookupLoading(true);
    setNotFound(false);
    const leads = await base44.entities.Lead.list('-created_date', 5000);
    const match = leads.find(l => l.email?.toLowerCase() === lookupEmail.toLowerCase().trim());
    if (match) {
      setLead(match);
    } else {
      setNotFound(true);
    }
    setLookupLoading(false);
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['client_tasks', lead?.id],
    queryFn: () => lead ? base44.entities.Task.filter({ lead_id: lead.id }) : [],
    enabled: !!lead,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['client_notes', lead?.id],
    queryFn: () => lead ? base44.entities.LeadNote.filter({ lead_id: lead.id }) : [],
    enabled: !!lead,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['client_assets', lead?.id],
    queryFn: () => lead ? base44.entities.ClientPortalAsset.filter({ lead_id: lead.id }) : [],
    enabled: !!lead,
  });

  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const sharedAssets = assets.filter(a => a.is_visible);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1929' }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ea00ea' }} />
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #a78bfa)', boxShadow: '0 0 24px rgba(234,0,234,0.4)' }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
            Client Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9ea7b5' }}>
            Your personal dashboard — status, tasks, and shared assets
          </p>
        </div>

        {/* Not logged in — lookup by email */}
        {!lead && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: '1.5px solid rgba(234,0,234,0.25)' }}>
            {!authed && (
              <div className="mb-6">
                <Lock className="h-10 w-10 mx-auto mb-3" style={{ color: '#ea00ea' }} />
                <p className="font-semibold mb-1" style={{ color: '#fff' }}>Access Your Portal</p>
                <p className="text-sm mb-4" style={{ color: '#9ea7b5' }}>Sign in with Google or enter your email address below to find your record</p>
                <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                  style={{ background: 'linear-gradient(135deg,#ea00ea,#a78bfa)', color: '#fff' }}>
                  Sign In with Google
                </Button>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="text-xs" style={{ color: '#5e6a78' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                </div>
              </div>
            )}
            <p className="text-sm mb-3" style={{ color: '#9ea7b5' }}>Look up by email address</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input value={lookupEmail} onChange={e => setLookupEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="your@email.com"
                style={{ background: '#071a2c', borderColor: 'rgba(234,0,234,0.3)', color: '#fff' }} />
              <Button onClick={handleLookup} disabled={lookupLoading}
                style={{ background: 'rgba(234,0,234,0.2)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.4)', flexShrink: 0 }}>
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
              </Button>
            </div>
            {notFound && (
              <p className="text-sm mt-3" style={{ color: '#f66c25' }}>
                No record found for that email. Please contact your account manager.
              </p>
            )}
          </div>
        )}

        {/* Found lead — full portal */}
        {lead && (
          <div className="space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: '1.5px solid rgba(234,0,234,0.3)' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ea00ea,#a78bfa)', color: '#fff' }}>
                  {(lead.name || lead.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#fff' }}>{lead.name || lead.username}</h2>
                  {lead.username && lead.name && <p className="text-sm" style={{ color: '#9ea7b5' }}>@{lead.username}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {lead.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>
                        {lead.category}
                      </span>
                    )}
                    {lead.lead_grade && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${GRADE_COLORS[lead.lead_grade]}22`, color: GRADE_COLORS[lead.lead_grade] }}>
                        Grade {lead.lead_grade}
                      </span>
                    )}
                    {lead.assigned_name && (
                      <span className="text-xs" style={{ color: '#5e6a78' }}>
                        Your manager: <strong style={{ color: '#9ea7b5' }}>{lead.assigned_name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <StatusTimeline status={lead.status} />
            </div>

            {/* Tasks */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: '1.5px solid rgba(248,212,23,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="h-5 w-5" style={{ color: '#f8d417' }} />
                <h3 className="font-bold" style={{ color: '#f8d417' }}>Pending Actions</h3>
                {pendingTasks.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-auto"
                    style={{ background: 'rgba(248,212,23,0.15)', color: '#f8d417' }}>
                    {pendingTasks.length} open
                  </span>
                )}
              </div>
              {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#5e6a78' }}>No tasks assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map(t => (
                    <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(248,212,23,0.05)', border: '1px solid rgba(248,212,23,0.1)' }}>
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f8d417' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#fff' }}>{t.title}</p>
                        {t.description && <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{t.description}</p>}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ea7b5' }}>
                            {t.task_type}
                          </span>
                          {t.due_date && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(246,108,37,0.15)', color: '#f66c25' }}>
                              Due {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: t.status === 'In Progress' ? 'rgba(84,176,231,0.15)' : 'rgba(255,255,255,0.06)', color: t.status === 'In Progress' ? '#54b0e7' : '#9ea7b5' }}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {completedTasks.length > 0 && (
                    <p className="text-xs text-center pt-1" style={{ color: '#5e6a78' }}>
                      + {completedTasks.length} completed task{completedTasks.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Shared Assets */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: '1.5px solid rgba(84,176,231,0.2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" style={{ color: '#54b0e7' }} />
                <h3 className="font-bold" style={{ color: '#54b0e7' }}>Shared Assets & Updates</h3>
              </div>
              {sharedAssets.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: '#5e6a78' }}>No assets shared yet — check back soon</p>
              ) : (
                <div className="space-y-3">
                  {sharedAssets.map(a => <AssetCard key={a.id} asset={a} />)}
                </div>
              )}
            </div>

            {/* Recent updates from notes */}
            {notes.filter(n => n.activity_type !== 'score_update').length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: '1.5px solid rgba(74,203,191,0.2)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5" style={{ color: '#4acbbf' }} />
                  <h3 className="font-bold" style={{ color: '#4acbbf' }}>Recent Updates</h3>
                </div>
                <div className="space-y-2">
                  {notes.filter(n => ['note', 'status_change', 'email_sent'].includes(n.activity_type)).slice(0, 5).map(n => (
                    <div key={n.id} className="flex gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#4acbbf' }} />
                      <div>
                        <p className="text-xs" style={{ color: '#d7dde5' }}>{n.body}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#5e6a78' }}>
                          {n.created_date ? new Date(n.created_date).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs pb-4" style={{ color: '#5e6a78' }}>
              Questions? Contact your account manager or email support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}