import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Database, Loader2, Search, ChevronDown, ChevronUp, Download } from 'lucide-react';

const LIMIT_OPTIONS = [10, 25, 50, 100];

function scoreColor(score) {
  if (score == null) return { color: '#9ea7b5', bg: 'rgba(94,106,120,0.15)', label: '—' };
  if (score >= 90) return { color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' };
  if (score >= 70) return { color: '#f8d417', bg: 'rgba(248,212,23,0.15)' };
  return { color: '#9ea7b5', bg: 'rgba(94,106,120,0.12)' };
}

function rowBg(score) {
  if (score == null) return 'transparent';
  if (score >= 90) return 'rgba(46,204,113,0.04)';
  if (score >= 70) return 'rgba(248,212,23,0.04)';
  return 'rgba(94,106,120,0.04)';
}

function exportCSV(rows) {
  const headers = ['id', 'industry', 'city', 'state', 'verification_score', 'follower_count', 'email', 'phone'];
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `legendary-leads-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const formatFollowers = (n) => {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

export default function LeadsDBQuery() {
  const [open, setOpen] = useState(false);
  const [geoTarget, setGeoTarget] = useState('');
  const [limit, setLimit] = useState('25');
  const [followerRange, setFollowerRange] = useState([0, 1000]);  // in thousands
  const [useFollowerFilter, setUseFollowerFilter] = useState(false);
  const [contactAvail, setContactAvail] = useState('any');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runQuery = async () => {
    if (!geoTarget.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const payload = {
        geo_target: geoTarget.trim(),
        limit: Number(limit),
        contact_availability: contactAvail === 'any' ? undefined : contactAvail,
      };
      if (useFollowerFilter) {
        payload.min_followers = followerRange[0] * 1000;
        payload.max_followers = followerRange[1] * 1000;
      }
      const res = await base44.functions.invoke('queryLegendaryLeads', payload);
      setResults(res.data?.rows || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '2px solid #54b0e7', background: 'rgba(10,25,41,0.9)' }}>
      {/* Header toggle */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" style={{ color: '#54b0e7' }} />
          <span className="font-bold text-sm" style={{ color: '#54b0e7', fontFamily: 'Poppins, sans-serif' }}>
            DB Lead Query
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: 'rgba(84,176,231,0.15)', color: '#54b0e7', border: '1px solid rgba(84,176,231,0.3)'
          }}>PostgreSQL</span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4" style={{ color: '#54b0e7' }} />
          : <ChevronDown className="h-4 w-4" style={{ color: '#54b0e7' }} />}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: 'rgba(84,176,231,0.2)' }}>

          {/* Row 1: State + Limit + Query */}
          <div className="flex flex-wrap gap-2">
            <Input
              value={geoTarget}
              onChange={e => setGeoTarget(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && runQuery()}
              placeholder="State, e.g. CA"
              className="w-24 text-sm placeholder:text-gray-600"
              style={{ background: '#071a2c', borderColor: '#54b0e7', color: '#fff' }}
              maxLength={2}
            />
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-28 text-sm" style={{ background: '#071a2c', borderColor: 'rgba(84,176,231,0.4)', color: '#fff' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: '#1a2332', border: '1px solid #54b0e7' }}>
                {LIMIT_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)} style={{ color: '#fff' }}>{n} rows</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={contactAvail} onValueChange={setContactAvail}>
              <SelectTrigger className="w-36 text-sm" style={{ background: '#071a2c', borderColor: 'rgba(84,176,231,0.4)', color: '#fff' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: '#1a2332', border: '1px solid #54b0e7' }}>
                <SelectItem value="any" style={{ color: '#fff' }}>Any Contact</SelectItem>
                <SelectItem value="email" style={{ color: '#fff' }}>Has Email</SelectItem>
                <SelectItem value="phone" style={{ color: '#fff' }}>Has Phone</SelectItem>
                <SelectItem value="both" style={{ color: '#fff' }}>Email + Phone</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={runQuery}
              disabled={loading || !geoTarget.trim()}
              className="font-semibold whitespace-nowrap ml-auto"
              style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{loading ? 'Running...' : 'Query'}</span>
            </Button>
          </div>

          {/* Row 2: Follower Slider */}
          <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(84,176,231,0.06)', border: '1px solid rgba(84,176,231,0.2)' }}>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="follower-toggle"
                checked={useFollowerFilter}
                onChange={e => setUseFollowerFilter(e.target.checked)}
                className="accent-[#54b0e7]"
              />
              <label htmlFor="follower-toggle" className="text-xs font-semibold cursor-pointer" style={{ color: '#54b0e7' }}>
                Follower Count Filter
              </label>
              {useFollowerFilter && (
                <span className="text-xs ml-auto" style={{ color: '#d7dde5' }}>
                  {followerRange[0]}K – {followerRange[1] >= 1000 ? '1M+' : `${followerRange[1]}K`}
                </span>
              )}
            </div>
            {useFollowerFilter && (
              <Slider
                min={0}
                max={1000}
                step={10}
                value={followerRange}
                onValueChange={setFollowerRange}
                className="mt-1"
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{
              background: 'rgba(246,108,37,0.1)', border: '1px solid rgba(246,108,37,0.4)', color: '#f66c25'
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Results */}
          {results !== null && (
            results.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#9ea7b5' }}>
                No results for "{geoTarget}" (after deduplication &amp; filters).
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#9ea7b5' }}>
                    <span>{results.length} row{results.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>90+ </span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>70–89</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-500"></span>&lt;70</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => exportCSV(results)}
                    style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929' }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export CSV
                  </Button>
                </div>

                <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid rgba(84,176,231,0.25)', maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr style={{ background: 'rgba(10,25,41,0.98)', borderBottom: '1px solid rgba(84,176,231,0.25)' }}>
                        {['ID', 'Industry', 'City', 'State', 'Followers', 'Contact', 'Score'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: '#54b0e7' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => {
                        const sc = scoreColor(row.verification_score);
                        return (
                          <tr key={i} style={{
                            borderBottom: i < results.length - 1 ? '1px solid rgba(94,106,120,0.15)' : 'none',
                            background: rowBg(row.verification_score),
                          }}>
                            <td className="px-3 py-2 font-mono" style={{ color: '#9ea7b5' }}>{row.id}</td>
                            <td className="px-3 py-2" style={{ color: '#d7dde5' }}>{row.industry || '—'}</td>
                            <td className="px-3 py-2" style={{ color: '#d7dde5' }}>{row.city || '—'}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-full font-semibold" style={{
                                background: 'rgba(84,176,231,0.15)', color: '#54b0e7'
                              }}>{row.state}</span>
                            </td>
                            <td className="px-3 py-2" style={{ color: '#4acbbf' }}>
                              {formatFollowers(row.follower_count) || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                {row.email && <span title={row.email} className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>✉</span>}
                                {row.phone && <span title={row.phone} className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(84,176,231,0.15)', color: '#54b0e7' }}>☎</span>}
                                {!row.email && !row.phone && <span style={{ color: '#5e6a78' }}>—</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[11px]" style={{ background: sc.bg, color: sc.color }}>
                                {row.verification_score ?? '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}