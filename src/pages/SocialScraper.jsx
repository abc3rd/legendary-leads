import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Instagram, Twitter, Youtube, Linkedin, Search, Plus, Check,
  Loader2, Globe, Users, Mail, Phone, ChevronRight, ArrowLeft, Sparkles
} from 'lucide-react';
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

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C', gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: '#1DA1F2', gradient: 'linear-gradient(135deg, #1DA1F2, #0d8ecf)' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0077B5', gradient: 'linear-gradient(135deg, #0077B5, #004182)' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000', gradient: 'linear-gradient(135deg, #FF0000, #CC0000)' },
  { id: 'tiktok', label: 'TikTok', icon: Globe, color: '#69C9D0', gradient: 'linear-gradient(135deg, #69C9D0, #EE1D52)' },
];

const NICHES = ['Fitness & Health', 'Beauty & Fashion', 'Food & Cooking', 'Travel', 'Business & Finance',
  'Tech & Gadgets', 'Parenting', 'Gaming', 'Real Estate', 'Music & Entertainment', 'Motivational', 'Pet Care'];

export default function SocialScraper() {
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [minFollowers, setMinFollowers] = useState('1000');
  const [maxFollowers, setMaxFollowers] = useState('1000000');
  const [count, setCount] = useState('10');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const search = async () => {
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    const keyword = customKeyword || niche;
    const res = await base44.functions.invoke('discoverLeads', {
      platform, keyword, niche: keyword,
      minFollowers: parseInt(minFollowers) || 1000,
      maxFollowers: parseInt(maxFollowers) || 1000000,
      count: Math.min(parseInt(count) || 10, 25),
    });
    const data = res.data;
    if (data.leads && Array.isArray(data.leads)) {
      setResults(data.leads);
      toast.success(`Found ${data.leads.length} profiles`);
    } else {
      toast.error('No results found');
    }
    setLoading(false);
  };

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const saveLeads = async (indices) => {
    setSaving(true);
    const toSave = [...indices].map(i => results[i]);
    const records = toSave.map(l => ({
      username: l.username || l.handle,
      name: l.name || l.display_name,
      bio: l.bio || l.description,
      category: l.niche || l.category || niche,
      followerCount: l.follower_count || l.followers || 0,
      followingCount: l.following_count || l.following || 0,
      website: l.website || l.url,
      email: l.email,
      phone: l.phone,
      status: 'new',
      tag: platform,
    }));
    await base44.entities.Lead.bulkCreate(records);
    qc.invalidateQueries({ queryKey: ['leads'] });
    toast.success(`Saved ${records.length} leads!`);
    setSelected(new Set());
    setSaving(false);
  };

  const saveSingle = async (lead) => {
    await base44.entities.Lead.create({
      username: lead.username || lead.handle,
      name: lead.name || lead.display_name,
      bio: lead.bio || lead.description,
      category: lead.niche || lead.category || niche,
      followerCount: lead.follower_count || lead.followers || 0,
      followingCount: lead.following_count || lead.following || 0,
      website: lead.website || lead.url,
      email: lead.email,
      phone: lead.phone,
      status: 'new',
      tag: platform,
    });
    qc.invalidateQueries({ queryKey: ['leads'] });
    toast.success('Lead added!');
  };

  const fmtNum = (n) => {
    if (!n) return '—';
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: OMEGA.bg }}>
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('Leads')}>
          <Button variant="ghost" className="mb-4" style={{ color: OMEGA.muted }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)' }}>
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: OMEGA.magenta, fontFamily: 'Poppins, sans-serif' }}>
              Social Scraper
            </h1>
            <p className="text-sm" style={{ color: OMEGA.muted }}>Discover leads from public social media profiles</p>
          </div>
        </div>

        {/* Search Config Card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: OMEGA.card, border: `1.5px solid ${OMEGA.border}` }}>
          {/* Platforms */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: OMEGA.muted }}>Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? p.gradient : 'rgba(255,255,255,0.05)',
                      color: active ? '#fff' : OMEGA.silver,
                      border: `1px solid ${active ? 'transparent' : OMEGA.border}`,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Niche */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: OMEGA.muted }}>Niche / Category</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => setNiche(niche === n ? '' : n)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: niche === n ? OMEGA.magenta : 'rgba(255,255,255,0.05)',
                    color: niche === n ? '#fff' : OMEGA.silver,
                    border: `1px solid ${niche === n ? OMEGA.magenta : OMEGA.border}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <Input
              value={customKeyword}
              onChange={e => setCustomKeyword(e.target.value)}
              placeholder="Or type a custom keyword / niche…"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }}
            />
          </div>

          {/* Ranges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: OMEGA.muted }}>Min Followers</p>
              <Input value={minFollowers} onChange={e => setMinFollowers(e.target.value)} type="number"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: OMEGA.muted }}>Max Followers</p>
              <Input value={maxFollowers} onChange={e => setMaxFollowers(e.target.value)} type="number"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: OMEGA.muted }}>Results (max 25)</p>
              <Input value={count} onChange={e => setCount(e.target.value)} type="number" min="1" max="25"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }} />
            </div>
          </div>

          <Button
            onClick={search}
            disabled={loading || (!niche && !customKeyword)}
            className="w-full font-bold py-3 text-base"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}
          >
            {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Scanning Profiles…</> : <><Search className="h-5 w-5 mr-2" /> Discover Leads</>}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ color: OMEGA.teal }}>
                {results.length} Profiles Found
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={selectAll}
                  style={{ color: OMEGA.silver, border: `1px solid ${OMEGA.border}` }}>
                  {selected.size === results.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selected.size > 0 && (
                  <Button size="sm" onClick={() => saveLeads(selected)} disabled={saving}
                    style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Save {selected.size} Lead{selected.size > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((lead, idx) => {
                const isSelected = selected.has(idx);
                const plat = PLATFORMS.find(p => p.id === platform);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className="rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? 'rgba(234,0,234,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isSelected ? OMEGA.magenta : OMEGA.border}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 relative"
                        style={{ background: plat?.gradient || OMEGA.magenta, color: '#fff' }}>
                        {(lead.name?.[0] || lead.username?.[0] || '?').toUpperCase()}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                            style={{ background: OMEGA.magenta }}>
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm" style={{ color: '#fff' }}>
                              {lead.name || lead.display_name || 'Unknown'}
                            </p>
                            <p className="text-xs" style={{ color: OMEGA.teal }}>
                              @{lead.username || lead.handle || '—'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold" style={{ color: OMEGA.yellow }}>
                              {fmtNum(lead.follower_count || lead.followers)}
                            </p>
                            <p className="text-[10px]" style={{ color: OMEGA.muted }}>followers</p>
                          </div>
                        </div>
                        {lead.bio && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: OMEGA.muted }}>{lead.bio}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {lead.email && <span className="text-[10px]" style={{ color: OMEGA.teal }}><Mail className="h-3 w-3 inline mr-0.5" />{lead.email}</span>}
                          {lead.phone && <span className="text-[10px]" style={{ color: OMEGA.silver }}><Phone className="h-3 w-3 inline mr-0.5" />{lead.phone}</span>}
                          {(lead.niche || lead.category) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(234,0,234,0.15)', color: OMEGA.magenta }}>
                              {lead.niche || lead.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); saveSingle(lead); }}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(234,0,234,0.1)', color: OMEGA.magenta }}
                        title="Add this lead"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}