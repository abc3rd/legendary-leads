import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Radar, Sparkles, ChevronDown, ChevronUp, Loader2, Check, Save,
  Globe, Mail, Phone, Users, ExternalLink, X, Plus, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#ea00ea' },
  { id: 'tiktok',    label: 'TikTok',    color: '#f8d417' },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#54b0e7' },
  { id: 'youtube',   label: 'YouTube',   color: '#f66c25' },
  { id: 'twitter',   label: 'X / Twitter', color: '#c3c3c3' },
];

const CARD = {
  background: 'linear-gradient(135deg, #071a2c 0%, #0f2236 100%)',
  border: '1.5px solid rgba(234,0,234,0.3)',
};

const NICHE_PRESETS = [
  'Fitness & Wellness', 'Beauty & Skincare', 'Food & Restaurants',
  'Real Estate', 'Fashion & Lifestyle', 'Tech & Gadgets',
  'Finance & Crypto', 'Travel & Tourism', 'Health Coaches',
];

function ConfidenceBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 75 ? '#2ecc71' : pct >= 50 ? '#f8d417' : '#f66c25';
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
      {pct}% match
    </span>
  );
}

function DiscoveredLeadCard({ lead, selected, onToggle, onSave, saving }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-xl p-4 transition-all cursor-pointer select-none"
      style={{
        ...CARD,
        border: selected ? '1.5px solid #ea00ea' : '1.5px solid rgba(234,0,234,0.15)',
        boxShadow: selected ? '0 0 12px rgba(234,0,234,0.2)' : 'none',
      }}
      onClick={() => onToggle(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar placeholder */}
          <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #54b0e7)', color: '#fff' }}>
            {(lead.name || lead.username || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: '#fff' }}>{lead.name || lead.username}</span>
              {lead.username && <span className="text-xs" style={{ color: '#9ea7b5' }}>@{lead.username}</span>}
              <ConfidenceBadge score={lead.confidence} />
            </div>
            {lead.category && (
              <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(248,212,23,0.12)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.3)' }}>
                {lead.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-transparent' : ''}`}
            style={{ background: selected ? '#ea00ea' : 'transparent', borderColor: selected ? '#ea00ea' : '#5e6a78' }}>
            {selected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      </div>

      {lead.bio && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: '#9ea7b5' }}>{lead.bio}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: '#7a8a9a' }}>
        {lead.followerCount > 0 && (
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{lead.followerCount >= 1000 ? `${(lead.followerCount / 1000).toFixed(1)}K` : lead.followerCount}</span>
        )}
        {lead.email && <span className="flex items-center gap-1" style={{ color: '#4acbbf' }}><Mail className="h-3 w-3" />{lead.email}</span>}
        {lead.phone && <span className="flex items-center gap-1" style={{ color: '#54b0e7' }}><Phone className="h-3 w-3" />{lead.phone}</span>}
        {lead.website && <span className="flex items-center gap-1" style={{ color: '#f8d417' }}><Globe className="h-3 w-3" />website</span>}
        {lead.platform && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(84,176,231,0.12)', color: '#54b0e7' }}>{lead.platform}</span>}
      </div>

      {lead.reason && (
        <p className="text-xs mt-2 italic" style={{ color: '#5e7a8c' }}>💡 {lead.reason}</p>
      )}

      {lead.source && (
        <p className="text-xs mt-1" style={{ color: '#3a5a6a' }}>Source: {lead.source}</p>
      )}
    </div>
  );
}

export default function LeadDiscovery({ onLeadsCreated }) {
  const [open, setOpen] = useState(false);
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [mustHaveEmail, setMustHaveEmail] = useState(false);
  const [mustHavePhone, setMustHavePhone] = useState(false);
  const [mustHaveWebsite, setMustHaveWebsite] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
  const [count, setCount] = useState(10);
  const [tag, setTag] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleLead = (lead) => {
    setSelected(prev => {
      const next = new Set(prev);
      const key = lead.username || lead.name;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(results.map(l => l.username || l.name)));
  const clearAll = () => setSelected(new Set());

  const discover = async () => {
    if (!niche.trim()) { toast.error('Please enter a niche or industry'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform'); return; }
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    setError('');
    try {
      const res = await base44.functions.invoke('discoverLeads', {
        niche, location, minFollowers: minFollowers ? Number(minFollowers) : undefined,
        maxFollowers: maxFollowers ? Number(maxFollowers) : undefined,
        mustHaveEmail, mustHavePhone, mustHaveWebsite,
        platforms: selectedPlatforms, count, tag: tag || niche, autoSave: false,
      });
      if (res.data.error) { setError(res.data.error); return; }
      const leads = res.data.leads || [];
      setResults(leads);
      setSelected(new Set(leads.map(l => l.username || l.name)));
      if (leads.length === 0) toast.info('No leads found — try broader criteria');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSelected = async () => {
    const toSave = results.filter(l => selected.has(l.username || l.name));
    if (toSave.length === 0) { toast.error('No leads selected'); return; }
    setSaving(true);
    try {
      await base44.entities.Lead.bulkCreate(
        toSave.map(l => ({
          username: l.username || '',
          name: l.name || '',
          bio: l.bio || '',
          category: l.category || niche,
          followerCount: l.followerCount || 0,
          followingCount: l.followingCount || 0,
          website: l.website || '',
          email: l.email || '',
          phone: l.phone || '',
          tag: tag || niche,
          status: 'new',
        }))
      );
      toast.success(`✅ ${toSave.length} leads saved to your database!`);
      if (onLeadsCreated) onLeadsCreated();
      setResults([]);
      setSelected(new Set());
    } catch (e) {
      toast.error('Failed to save leads: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all"
        style={{
          background: open
            ? 'linear-gradient(135deg, rgba(234,0,234,0.15) 0%, rgba(84,176,231,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(234,0,234,0.08) 0%, rgba(10,25,41,0.8) 100%)',
          border: '1.5px solid rgba(234,0,234,0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,0,234,0.2)' }}>
            <Radar className="h-4 w-4" style={{ color: '#ea00ea' }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: '#ea00ea' }}>AI Lead Discovery</p>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>Scan directories & social profiles to find new leads</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4" style={{ color: '#ea00ea' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#ea00ea' }} />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl p-5 space-y-5" style={CARD}>
          {/* Niche */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#c3c3c3' }}>Niche / Industry *</label>
            <Input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="e.g. Fitness coaches, Vegan food blogs, Real estate agents..."
              style={{ background: '#051424', borderColor: '#ea00ea55', color: '#fff' }}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NICHE_PRESETS.map(n => (
                <button key={n} onClick={() => setNiche(n)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: niche === n ? 'rgba(234,0,234,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${niche === n ? '#ea00ea' : '#2a3a4a'}`,
                    color: niche === n ? '#ea00ea' : '#7a8a9a',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#c3c3c3' }}>Platforms to Scan</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    background: selectedPlatforms.includes(p.id) ? `${p.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${selectedPlatforms.includes(p.id) ? p.color : '#2a3a4a'}`,
                    color: selectedPlatforms.includes(p.id) ? p.color : '#7a8a9a',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Location (optional)</label>
              <Input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. New York, California..."
                style={{ background: '#051424', borderColor: '#2a3a4a', color: '#fff', fontSize: '13px' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Min Followers</label>
              <Input type="number" value={minFollowers} onChange={e => setMinFollowers(e.target.value)}
                placeholder="e.g. 5000"
                style={{ background: '#051424', borderColor: '#2a3a4a', color: '#fff', fontSize: '13px' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Max Followers</label>
              <Input type="number" value={maxFollowers} onChange={e => setMaxFollowers(e.target.value)}
                placeholder="e.g. 500000"
                style={{ background: '#051424', borderColor: '#2a3a4a', color: '#fff', fontSize: '13px' }} />
            </div>
          </div>

          {/* Contact & Count row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Has Email', val: mustHaveEmail, set: setMustHaveEmail },
                { label: 'Has Phone', val: mustHavePhone, set: setMustHavePhone },
                { label: 'Has Website', val: mustHaveWebsite, set: setMustHaveWebsite },
              ].map(({ label, val, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#c3c3c3' }}>
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="accent-pink-500" />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-semibold" style={{ color: '#9ea7b5' }}>Count:</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))}
                className="rounded-lg px-2 py-1 text-sm"
                style={{ background: '#051424', border: '1px solid #2a3a4a', color: '#fff' }}>
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
              </select>
            </div>
          </div>

          {/* Tag */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Tag for saved leads (optional)</label>
            <Input value={tag} onChange={e => setTag(e.target.value)}
              placeholder="e.g. fitness-q2, la-realtors... defaults to niche name"
              style={{ background: '#051424', borderColor: '#2a3a4a', color: '#fff', fontSize: '13px' }} />
          </div>

          {/* Scan Button */}
          <Button onClick={discover} disabled={loading}
            className="w-full font-bold py-5 text-sm"
            style={{ background: 'linear-gradient(135deg, #ea00ea 0%, #7b00ea 100%)', color: '#fff', letterSpacing: '0.05em' }}>
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning directories & profiles...</>
              : <><Radar className="h-4 w-4 mr-2" /> Discover Leads with AI</>}
          </Button>

          {error && (
            <div className="rounded-lg p-3 flex items-start gap-2 text-sm" style={{ background: 'rgba(246,108,37,0.1)', border: '1px solid #f66c25', color: '#f66c25' }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: '#ea00ea' }}>
                  {results.length} leads discovered · {selected.size} selected
                </p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs px-2 py-1 rounded" style={{ color: '#4acbbf', border: '1px solid #4acbbf33' }}>All</button>
                  <button onClick={clearAll} className="text-xs px-2 py-1 rounded" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>None</button>
                </div>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {results.map((lead, i) => (
                  <DiscoveredLeadCard
                    key={i}
                    lead={lead}
                    selected={selected.has(lead.username || lead.name)}
                    onToggle={toggleLead}
                  />
                ))}
              </div>

              <Button
                onClick={saveSelected}
                disabled={saving || selected.size === 0}
                className="w-full mt-4 font-bold py-5"
                style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #1aa35a 100%)', color: '#fff' }}>
                {saving
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  : <><Save className="h-4 w-4 mr-2" />Save {selected.size} Lead{selected.size !== 1 ? 's' : ''} to Database</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}