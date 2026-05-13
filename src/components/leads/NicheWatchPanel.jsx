import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Play, Loader2, Eye, EyeOff, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = ['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'];
const NICHES = ['Fitness & Health', 'Beauty & Fashion', 'Food & Cooking', 'Travel', 'Business & Finance',
  'Tech & Gadgets', 'Parenting', 'Gaming', 'Real Estate', 'Music & Entertainment'];

const FREQ_COLORS = { hourly: '#e74c3c', daily: '#f8d417', weekly: '#54b0e7' };

function WatchForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [platforms, setPlatforms] = useState(['instagram']);
  const [minF, setMinF] = useState('1000');
  const [maxF, setMaxF] = useState('5000000');
  const [leadsPerRun, setLeadsPerRun] = useState('10');
  const [tag, setTag] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [triggerSeq, setTriggerSeq] = useState(true);

  const togglePlatform = (p) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleNiche = (n) => setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  const handleSave = () => {
    const keywords = [...selectedNiches, ...(keyword ? [keyword] : [])];
    if (!name || keywords.length === 0 || platforms.length === 0) {
      toast.error('Name, at least one keyword, and one platform required');
      return;
    }
    onSave({
      name, keywords, platforms,
      min_followers: parseInt(minF) || 1000,
      max_followers: parseInt(maxF) || 5000000,
      leads_per_run: parseInt(leadsPerRun) || 10,
      tag: tag || keywords[0],
      run_frequency: frequency,
      trigger_sequence: triggerSeq,
      is_active: true,
    });
  };

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(234,0,234,0.05)', border: '1.5px solid rgba(234,0,234,0.3)' }}>
      <h3 className="text-sm font-bold" style={{ color: '#ea00ea' }}>New Niche Watch</h3>

      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Watch Name</p>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fitness Instagram"
          style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
      </div>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#9ea7b5' }}>Niches / Keywords</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {NICHES.map(n => (
            <button key={n} onClick={() => toggleNiche(n)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedNiches.includes(n) ? '#ea00ea' : 'rgba(255,255,255,0.05)',
                color: selectedNiches.includes(n) ? '#fff' : '#9ea7b5',
                border: `1px solid ${selectedNiches.includes(n) ? '#ea00ea' : '#2a3a4a'}`,
              }}>
              {n}
            </button>
          ))}
        </div>
        <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Custom keyword…"
          style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
      </div>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#9ea7b5' }}>Platforms</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => togglePlatform(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: platforms.includes(p) ? 'rgba(234,0,234,0.2)' : 'rgba(255,255,255,0.05)',
                color: platforms.includes(p) ? '#ea00ea' : '#9ea7b5',
                border: `1px solid ${platforms.includes(p) ? '#ea00ea' : '#2a3a4a'}`,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Min Followers</p>
          <Input type="number" value={minF} onChange={e => setMinF(e.target.value)}
            style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Max Followers</p>
          <Input type="number" value={maxF} onChange={e => setMaxF(e.target.value)}
            style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Leads/Run</p>
          <Input type="number" value={leadsPerRun} onChange={e => setLeadsPerRun(e.target.value)} min="1" max="20"
            style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Niche Tag</p>
          <Input value={tag} onChange={e => setTag(e.target.value)} placeholder="Auto from keyword"
            style={{ background: '#071a2c', color: '#fff', borderColor: '#2a3a4a' }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9ea7b5' }}>Run Frequency</p>
          <div className="flex gap-1.5">
            {['hourly','daily','weekly'].map(f => (
              <button key={f} onClick={() => setFrequency(f)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: frequency === f ? `${FREQ_COLORS[f]}20` : 'rgba(255,255,255,0.05)',
                  color: frequency === f ? FREQ_COLORS[f] : '#9ea7b5',
                  border: `1px solid ${frequency === f ? FREQ_COLORS[f] : '#2a3a4a'}`,
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setTriggerSeq(t => !t)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: triggerSeq ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)',
            color: triggerSeq ? '#2ecc71' : '#9ea7b5',
            border: `1px solid ${triggerSeq ? '#2ecc71' : '#2a3a4a'}`,
          }}>
          <Zap className="h-3 w-3" />
          {triggerSeq ? 'Auto-trigger sequences ON' : 'Auto-trigger sequences OFF'}
        </button>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1 text-sm" style={{ color: '#9ea7b5' }}>Cancel</Button>
        <Button onClick={handleSave} className="flex-1 text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)', color: '#fff' }}>
          Save Watch
        </Button>
      </div>
    </div>
  );
}

export default function NicheWatchPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning] = useState({});

  const { data: watches = [] } = useQuery({
    queryKey: ['niche_watches'],
    queryFn: () => base44.entities.NicheWatch.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NicheWatch.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['niche_watches'] }); setShowForm(false); toast.success('Watch created!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NicheWatch.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['niche_watches'] }); toast.success('Watch deleted'); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.NicheWatch.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['niche_watches'] }),
  });

  const runNow = async (watch) => {
    setRunning(r => ({ ...r, [watch.id]: true }));
    try {
      const res = await base44.functions.invoke('runNicheWatch', { watchId: watch.id });
      const found = res.data?.results?.[0]?.found || 0;
      toast.success(`Discovered ${found} new lead${found !== 1 ? 's' : ''}!`);
      qc.invalidateQueries({ queryKey: ['niche_watches'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    } catch {
      toast.error('Watch run failed');
    }
    setRunning(r => ({ ...r, [watch.id]: false }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#4acbbf' }}>Proactive Discovery Watches</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>Auto-monitor niches and pull profiles into your leads pool</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}
          style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)', color: '#fff' }}>
          <Plus className="h-4 w-4 mr-1" /> New Watch
        </Button>
      </div>

      {showForm && (
        <WatchForm onSave={d => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />
      )}

      {watches.length === 0 && !showForm ? (
        <div className="rounded-xl py-10 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: '#4acbbf' }} />
          <p className="text-sm" style={{ color: '#9ea7b5' }}>No watches configured yet.</p>
          <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>Create a watch to auto-discover leads 24/7.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watches.map(watch => (
            <div key={watch.id} className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${watch.is_active ? 'rgba(74,203,191,0.3)' : 'rgba(255,255,255,0.08)'}`,
                opacity: watch.is_active ? 1 : 0.6,
              }}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4acbbf20, #00c2e020)', border: '1px solid #4acbbf40' }}>
                  <Eye className="h-4 w-4" style={{ color: '#4acbbf' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: '#fff' }}>{watch.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${FREQ_COLORS[watch.run_frequency] || '#9ea7b5'}20`, color: FREQ_COLORS[watch.run_frequency] || '#9ea7b5' }}>
                      {watch.run_frequency}
                    </span>
                    {watch.trigger_sequence && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71' }}>
                        <Zap className="h-2.5 w-2.5 inline mr-0.5" />sequences
                      </span>
                    )}
                    {!watch.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#9ea7b5' }}>Paused</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {watch.keywords?.slice(0, 4).map(k => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(234,0,234,0.12)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.25)' }}>
                        {k}
                      </span>
                    ))}
                    {watch.keywords?.length > 4 && (
                      <span className="text-[10px]" style={{ color: '#9ea7b5' }}>+{watch.keywords.length - 4} more</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs" style={{ color: '#9ea7b5' }}>
                      {watch.platforms?.join(', ')} · {watch.leads_per_run}/run
                    </span>
                    {watch.total_leads_found > 0 && (
                      <span className="text-xs font-semibold" style={{ color: '#4acbbf' }}>
                        {watch.total_leads_found} total found
                      </span>
                    )}
                    {watch.last_run_at && (
                      <span className="text-[10px]" style={{ color: '#5e6a78' }}>
                        Last: {new Date(watch.last_run_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => runNow(watch)}
                    disabled={running[watch.id]}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}
                    title="Run now">
                    {running[watch.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: watch.id, is_active: !watch.is_active })}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: watch.is_active ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.06)', color: watch.is_active ? '#2ecc71' : '#9ea7b5' }}
                    title={watch.is_active ? 'Pause' : 'Resume'}>
                    {watch.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => deleteMutation.mutate(watch.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}