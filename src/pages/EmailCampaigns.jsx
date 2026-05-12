import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Mail, Send, Clock, BarChart2, Trash2, Edit, Play, Pause, Eye, MousePointerClick, Users, ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import CampaignEditor from '../components/campaigns/CampaignEditor';
import CampaignStats from '../components/campaigns/CampaignStats';

const STATUS_COLORS = {
  draft: { bg: 'rgba(158,167,181,0.15)', color: '#9ea7b5' },
  scheduled: { bg: 'rgba(84,176,231,0.15)', color: '#54b0e7' },
  sending: { bg: 'rgba(248,212,23,0.15)', color: '#f8d417' },
  sent: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  paused: { bg: 'rgba(246,108,37,0.15)', color: '#f66c25' },
};

function CampaignCard({ campaign, onEdit, onDelete, onSend, sending }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[campaign.status] || STATUS_COLORS.draft;
  const openRate = campaign.sent_count > 0 ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1) : 0;
  const clickRate = campaign.opened_count > 0 ? ((campaign.clicked_count / campaign.opened_count) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(84,176,231,0.12)' }}>
              <Mail className="h-5 w-5" style={{ color: '#54b0e7' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold truncate" style={{ color: '#fff' }}>{campaign.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                  style={{ background: sc.bg, color: sc.color }}>
                  {campaign.status?.toUpperCase()}
                </span>
                {campaign.sequence_step > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                    Step {campaign.sequence_step}
                  </span>
                )}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: '#9ea7b5' }}>
                {campaign.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
              <Button size="sm" onClick={() => onSend(campaign)} disabled={sending === campaign.id}
                style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929', fontSize: 12 }}>
                {sending === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Send Now
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => onEdit(campaign)} style={{ color: '#9ea7b5', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(campaign.id)} style={{ color: '#f66c25' }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <button onClick={() => setExpanded(e => !e)} style={{ color: '#5e6a78' }}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { icon: Users, label: 'Recipients', val: campaign.total_recipients || 0, color: '#9ea7b5' },
            { icon: Send, label: 'Sent', val: campaign.sent_count || 0, color: '#54b0e7' },
            { icon: Eye, label: `Open Rate`, val: `${openRate}%`, color: '#f8d417' },
            { icon: MousePointerClick, label: 'Click Rate', val: `${clickRate}%`, color: '#2ecc71' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Icon className="h-3.5 w-3.5 mx-auto mb-0.5" style={{ color }} />
              <div className="text-sm font-bold" style={{ color }}>{val}</div>
              <div className="text-[9px]" style={{ color: '#5e6a78' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <CampaignStats campaign={campaign} />
        </div>
      )}
    </div>
  );
}

export default function EmailCampaigns() {
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sending, setSending] = useState(null);
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email_campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date', 200),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_all'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
  });

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter);

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await base44.entities.EmailCampaign.delete(id);
    qc.invalidateQueries({ queryKey: ['email_campaigns'] });
    toast.success('Campaign deleted');
  };

  const handleSend = async (campaign) => {
    setSending(campaign.id);
    // Resolve target leads
    let targets = leads.filter(l => l.email);
    if (campaign.target_filter) {
      const f = JSON.parse(campaign.target_filter);
      if (f.status) targets = targets.filter(l => l.status === f.status);
      if (f.category) targets = targets.filter(l => l.category === f.category);
      if (f.tag) targets = targets.filter(l => l.tag === f.tag);
    }

    await base44.entities.EmailCampaign.update(campaign.id, {
      status: 'sending',
      total_recipients: targets.length,
      sent_at: new Date().toISOString(),
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const lead of targets.slice(0, 500)) {
      const body = (campaign.body || '')
        .replace(/{{name}}/g, lead.name || lead.username || '')
        .replace(/{{username}}/g, lead.username || '')
        .replace(/{{email}}/g, lead.email || '')
        .replace(/{{category}}/g, lead.category || '')
        .replace(/{{status}}/g, lead.status || '');

      const subject = (campaign.subject || '')
        .replace(/{{name}}/g, lead.name || lead.username || '')
        .replace(/{{username}}/g, lead.username || '');

      const emailRes = await base44.integrations.Core.SendEmail({
        to: lead.email,
        subject,
        body,
        from_name: campaign.from_name || 'Legendary Leads',
      }).catch(() => null);

      if (emailRes) {
        sentCount++;
        await base44.entities.FollowUpLog.create({
          lead_id: lead.id,
          lead_username: lead.username,
          lead_email: lead.email,
          sequence_id: campaign.id,
          sequence_name: campaign.name,
          channel: 'email',
          status: 'sent',
          subject,
          body: body.slice(0, 500),
        });
      } else {
        failedCount++;
      }
    }

    await base44.entities.EmailCampaign.update(campaign.id, {
      status: 'sent',
      sent_count: sentCount,
      failed_count: failedCount,
    });

    qc.invalidateQueries({ queryKey: ['email_campaigns'] });
    toast.success(`Campaign sent to ${sentCount} leads!`);
    setSending(null);
  };

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    totalSent: campaigns.reduce((a, c) => a + (c.sent_count || 0), 0),
    totalOpened: campaigns.reduce((a, c) => a + (c.opened_count || 0), 0),
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)' }}>
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#54b0e7', fontFamily: 'Poppins, sans-serif' }}>
                Email Campaigns
              </h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>Draft, schedule & send multi-step email sequences</p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setShowEditor(true); }}
            style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Campaign
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Campaigns', val: stats.total, color: '#ea00ea', icon: Mail },
            { label: 'Sent', val: stats.sent, color: '#2ecc71', icon: Send },
            { label: 'Emails Delivered', val: stats.totalSent.toLocaleString(), color: '#54b0e7', icon: Users },
            { label: 'Total Opens', val: stats.totalOpened.toLocaleString(), color: '#f8d417', icon: Eye },
          ].map(({ label, val, color, icon: Icon }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg,#0a1929,#13202e)', border: `1.5px solid ${color}22` }}>
              <Icon className="h-4 w-4 mb-1" style={{ color }} />
              <div className="text-xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs" style={{ color: '#9ea7b5' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-5">
          {['all', 'draft', 'scheduled', 'sent', 'paused'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
              style={{
                background: filter === f ? 'rgba(84,176,231,0.2)' : 'rgba(255,255,255,0.04)',
                color: filter === f ? '#54b0e7' : '#9ea7b5',
                border: `1px solid ${filter === f ? 'rgba(84,176,231,0.4)' : 'transparent'}`,
              }}>
              {f === 'all' ? `All (${campaigns.length})` : `${f} (${campaigns.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#54b0e7' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ border: '2px dashed rgba(84,176,231,0.2)' }}>
            <Mail className="h-12 w-12 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
            <p className="font-semibold mb-1" style={{ color: '#9ea7b5' }}>No campaigns yet</p>
            <p className="text-sm mb-4" style={{ color: '#5e6a78' }}>Create a multi-step email sequence to engage your leads</p>
            <Button onClick={() => { setEditing(null); setShowEditor(true); }}
              style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}>
              <Plus className="h-4 w-4 mr-1" /> Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(c => (
              <CampaignCard key={c.id} campaign={c}
                onEdit={(c) => { setEditing(c); setShowEditor(true); }}
                onDelete={handleDelete}
                onSend={handleSend}
                sending={sending}
              />
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <CampaignEditor
          campaign={editing}
          leads={leads}
          onClose={() => setShowEditor(false)}
          onSaved={() => { setShowEditor(false); qc.invalidateQueries({ queryKey: ['email_campaigns'] }); }}
        />
      )}
    </div>
  );
}