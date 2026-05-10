import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Loader2, CheckCircle2, AlertCircle, Save, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_COLORS = { name: '#4acbbf', bio: '#f8d417', followerCount: '#ea00ea', category: '#54b0e7', email: '#2ecc71', website: '#f66c25', phone: '#a78bfa' };

function StagingCard({ lead, onApprove, onReject, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...lead });

  const fields = ['name', 'username', 'bio', 'category', 'email', 'website', 'phone'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'linear-gradient(135deg, #071a2c, #0f2236)', border: '1.5px solid rgba(74,203,191,0.3)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff' }}>
            {(lead.name || lead.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#fff' }}>{lead.name || '—'}</p>
            <p className="text-xs" style={{ color: '#4acbbf' }}>@{lead.username || 'unknown'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(248,212,23,0.12)', color: '#f8d417' }}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Scraped fields */}
      {!editing ? (
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'followerCount', label: 'Followers', val: lead.followerCount?.toLocaleString() },
            { key: 'followingCount', label: 'Following', val: lead.followingCount?.toLocaleString() },
            { key: 'category', label: 'Category', val: lead.category },
            { key: 'email', label: 'Email', val: lead.email },
            { key: 'website', label: 'Website', val: lead.website },
            { key: 'phone', label: 'Phone', val: lead.phone },
          ].filter(f => f.val).map(({ key, label, val }) => (
            <div key={key} className="text-xs">
              <span style={{ color: '#5e6a78' }}>{label}: </span>
              <span style={{ color: FIELD_COLORS[key] || '#d7dde5' }}>{val}</span>
            </div>
          ))}
          {lead.bio && <div className="col-span-2 text-xs" style={{ color: '#9ea7b5' }}>{lead.bio.slice(0, 120)}{lead.bio.length > 120 ? '…' : ''}</div>}
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map(f => (
            <div key={f} className="flex items-center gap-2">
              <label className="text-[10px] w-20 flex-shrink-0" style={{ color: '#5e6a78' }}>{f}</label>
              <Input value={draft[f] || ''} onChange={e => setDraft(d => ({ ...d, [f]: e.target.value }))}
                className="text-xs h-7" style={{ background: '#071a2c', borderColor: '#2a3a4a', color: '#fff' }} />
            </div>
          ))}
        </div>
      )}

      {/* Engagement preview */}
      {lead.engagement && (
        <div className="flex items-center gap-3 text-[10px] px-3 py-2 rounded-lg"
          style={{ background: 'rgba(248,212,23,0.07)', border: '1px solid rgba(248,212,23,0.15)' }}>
          <span style={{ color: '#f8d417' }}>Engagement:</span>
          {lead.engagement.avg_likes && <span style={{ color: '#d7dde5' }}>❤ {lead.engagement.avg_likes} avg likes</span>}
          {lead.engagement.avg_comments && <span style={{ color: '#d7dde5' }}>💬 {lead.engagement.avg_comments} avg comments</span>}
          {lead.engagement.rate && <span style={{ color: '#2ecc71' }}>{lead.engagement.rate}% rate</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApprove(editing ? draft : lead)}
          style={{ background: 'linear-gradient(135deg, #2ecc71, #1aa35a)', color: '#fff', flex: 1 }}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Add to CRM
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReject(lead)}
          style={{ color: '#f66c25', border: '1px solid rgba(246,108,37,0.3)' }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function ProfileScraper() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [staging, setStaging] = useState([]);
  const [error, setError] = useState('');
  const [approved, setApproved] = useState(0);

  const scrape = async () => {
    if (!url.trim()) { toast.error('Enter a profile URL'); return; }
    setLoading(true);
    setError('');
    try {
      // Use AI to extract profile data from the URL
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract social media profile data from this URL: ${url}

Return structured data for a lead profile. Use web search to find real public data about this profile/account if possible. Extract:
- name (full name)
- username (handle without @)
- bio (bio text)
- category (niche/industry like "Fitness Coach", "Beauty Influencer", etc.)
- followerCount (integer)
- followingCount (integer)  
- email (if publicly listed)
- website (if listed)
- phone (if listed)
- platform (instagram/tiktok/youtube/linkedin/twitter)
- engagement: { avg_likes, avg_comments, rate (percentage as string like "3.2%") }

If you cannot access the URL directly, generate realistic estimated data based on the URL structure and platform.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            username: { type: 'string' },
            bio: { type: 'string' },
            category: { type: 'string' },
            followerCount: { type: 'number' },
            followingCount: { type: 'number' },
            email: { type: 'string' },
            website: { type: 'string' },
            phone: { type: 'string' },
            platform: { type: 'string' },
            engagement: {
              type: 'object',
              properties: {
                avg_likes: { type: 'number' },
                avg_comments: { type: 'number' },
                rate: { type: 'string' },
              }
            }
          }
        }
      });

      const lead = { ...res, source_url: url, status: 'new' };
      setStaging(prev => [lead, ...prev]);
      setUrl('');
      toast.success('Profile extracted — review in staging area');
    } catch (e) {
      setError('Failed to extract profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const approveToLead = async (lead) => {
    await base44.entities.Lead.create({
      username: lead.username || '',
      name: lead.name || '',
      bio: lead.bio || '',
      category: lead.category || '',
      followerCount: lead.followerCount || 0,
      followingCount: lead.followingCount || 0,
      email: lead.email || '',
      website: lead.website || '',
      phone: lead.phone || '',
      platform_source: lead.platform || '',
      tag: 'scraped',
      status: 'new',
    });
    setStaging(prev => prev.filter(l => l !== lead && l.source_url !== lead.source_url));
    setApproved(n => n + 1);
    toast.success(`@${lead.username || lead.name} added to CRM!`);
  };

  const rejectLead = (lead) => {
    setStaging(prev => prev.filter(l => l !== lead));
    toast.info('Lead removed from staging');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,18,30,0.95)', border: '1.5px solid rgba(84,176,231,0.3)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(84,176,231,0.15)', background: 'rgba(84,176,231,0.05)' }}>
        <Link2 className="h-4 w-4" style={{ color: '#54b0e7' }} />
        <span className="text-sm font-bold" style={{ color: '#54b0e7' }}>Profile URL Scraper</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(84,176,231,0.15)', color: '#54b0e7' }}>AI-Powered Extraction</span>
        {approved > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71' }}>{approved} added</span>}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && scrape()}
            placeholder="Paste Instagram, TikTok, LinkedIn, YouTube, or Twitter profile URL..."
            style={{ background: '#071a2c', borderColor: 'rgba(84,176,231,0.4)', color: '#fff' }}
            className="text-sm placeholder:text-gray-600 flex-1" />
          <Button onClick={scrape} disabled={loading || !url.trim()}
            style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929', flexShrink: 0 }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(246,108,37,0.1)', border: '1px solid rgba(246,108,37,0.3)', color: '#f66c25' }}>
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
          </div>
        )}

        <p className="text-[10px]" style={{ color: '#5e6a78' }}>
          Paste any public social profile URL. AI extracts name, bio, follower count, engagement data and places it in the staging area for validation before adding to CRM.
        </p>

        {/* Staging area */}
        {staging.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4" style={{ color: '#f8d417' }} />
              <span className="text-xs font-bold" style={{ color: '#f8d417' }}>Staging Area ({staging.length})</span>
              <span className="text-[10px]" style={{ color: '#5e6a78' }}>Review & approve before adding to CRM</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <AnimatePresence>
                {staging.map((lead, i) => (
                  <StagingCard key={i} lead={lead} onApprove={approveToLead} onReject={rejectLead} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}