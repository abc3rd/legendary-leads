import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Wand2, RefreshCw, Plus, X, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'generate', label: 'Generate', icon: Wand2, desc: 'Create leads from criteria' },
  { id: 'suggest', label: 'Suggest', icon: Sparkles, desc: 'AI-powered recommendations' },
];

export default function AILeadAssistant({ onLeadsCreated }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [criteria, setCriteria] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const run = async () => {
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    setSavedCount(0);
    try {
      const res = await base44.functions.invoke('aiLeadAssistant', {
        action: activeTab,
        criteria: { description: criteria, count: Number(count) },
      });
      const leads = res.data?.leads || [];
      setResults(leads);
      setSelected(new Set(leads.map((_, i) => i)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const saveSelected = async () => {
    setSaving(true);
    const toSave = results
      .filter((_, i) => selected.has(i))
      .map(l => ({ ...l, status: l.status || 'new' }));

    await base44.entities.Lead.bulkCreate(toSave);
    setSavedCount(toSave.length);
    setSaving(false);
    onLeadsCreated?.();
    setTimeout(() => {
      setResults([]);
      setSelected(new Set());
      setSavedCount(0);
    }, 2000);
  };

  const formatNum = (n) => {
    if (!n) return null;
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
    return n;
  };

  return (
    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '2px solid #f8d417', background: 'rgba(10,25,41,0.9)' }}>
      {/* Header toggle */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: '#f8d417' }} />
          <span className="font-bold text-sm" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
            AI Lead Assistant
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: 'rgba(248,212,23,0.15)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.3)'
          }}>BETA</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" style={{ color: '#f8d417' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#f8d417' }} />}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(248,212,23,0.2)' }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setResults([]); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? '#f8d417' : 'rgba(248,212,23,0.08)',
                    color: active ? '#0a1929' : '#f8d417',
                    border: `1px solid ${active ? '#f8d417' : 'rgba(248,212,23,0.3)'}`
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Input row */}
          <div className="flex gap-2 mb-4">
            <Input
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && criteria.trim() && run()}
              placeholder={
                activeTab === 'generate'
                  ? 'e.g. fitness influencers in NYC with 50k+ followers'
                  : 'e.g. similar to my beauty niche leads'
              }
              className="flex-1 text-sm placeholder:text-gray-600"
              style={{ background: '#071a2c', borderColor: '#f8d417', color: '#fff' }}
            />
            <select
              value={count}
              onChange={e => setCount(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-sm outline-none"
              style={{ background: '#071a2c', color: '#fff', border: '1px solid rgba(248,212,23,0.4)' }}
            >
              {[3, 5, 10].map(n => <option key={n} value={n}>{n} leads</option>)}
            </select>
            <Button
              onClick={run}
              disabled={loading || !criteria.trim()}
              className="font-semibold whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #f8d417, #f66c25)', color: '#0a1929' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{loading ? 'Thinking...' : 'Generate'}</span>
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: '#9ea7b5' }}>
                  {selected.size} of {results.length} selected
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelected(new Set(results.map((_, i) => i)))}
                    className="text-xs px-2 py-1 rounded" style={{ color: '#4acbbf', background: 'rgba(74,203,191,0.1)' }}>
                    All
                  </button>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs px-2 py-1 rounded" style={{ color: '#9ea7b5', background: 'rgba(158,167,181,0.1)' }}>
                    None
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {results.map((lead, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: selected.has(i) ? 'rgba(248,212,23,0.08)' : 'rgba(10,25,41,0.5)',
                      border: `1px solid ${selected.has(i) ? 'rgba(248,212,23,0.4)' : 'rgba(94,106,120,0.3)'}`,
                    }}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded flex-shrink-0 flex items-center justify-center border transition-all`}
                      style={{
                        background: selected.has(i) ? '#f8d417' : 'transparent',
                        borderColor: selected.has(i) ? '#f8d417' : '#5e6a78'
                      }}>
                      {selected.has(i) && <CheckCircle className="h-3 w-3" style={{ color: '#0a1929' }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: '#fff' }}>{lead.name || lead.username}</span>
                        {lead.username && <span className="text-xs" style={{ color: '#9ea7b5' }}>@{lead.username}</span>}
                        {lead.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                            background: 'rgba(248,212,23,0.1)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.2)'
                          }}>{lead.category}</span>
                        )}
                        {lead.followerCount && (
                          <span className="text-xs" style={{ color: '#4acbbf' }}>{formatNum(lead.followerCount)} followers</span>
                        )}
                      </div>
                      {lead.bio && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9ea7b5' }}>{lead.bio}</p>}
                      {lead.reason && <p className="text-xs mt-0.5 italic" style={{ color: '#54b0e7' }}>💡 {lead.reason}</p>}
                      <div className="flex gap-3 mt-1 text-xs" style={{ color: '#5e6a78' }}>
                        {lead.email && <span style={{ color: '#4acbbf' }}>✉ {lead.email}</span>}
                        {lead.website && <span style={{ color: '#f8d417' }}>🌐 {lead.website}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setResults([]); setSelected(new Set()); }}
                  className="text-xs" style={{ color: '#5e6a78' }}>
                  Clear results
                </button>
                {savedCount > 0 ? (
                  <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#2ecc71' }}>
                    <CheckCircle className="h-4 w-4" /> {savedCount} leads saved!
                  </span>
                ) : (
                  <Button
                    onClick={saveSelected}
                    disabled={saving || selected.size === 0}
                    className="font-semibold"
                    style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929' }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Save {selected.size} Lead{selected.size !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}