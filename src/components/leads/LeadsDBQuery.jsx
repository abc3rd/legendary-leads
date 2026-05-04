import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function LeadsDBQuery() {
  const [open, setOpen] = useState(false);
  const [geoTarget, setGeoTarget] = useState('');
  const [limit, setLimit] = useState('25');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runQuery = async () => {
    if (!geoTarget.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await base44.functions.invoke('queryLegendaryLeads', {
        geo_target: geoTarget.trim(),
        limit: Number(limit),
      });
      setResults(res.data?.rows || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') runQuery();
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
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(84,176,231,0.2)' }}>
          <p className="text-xs mb-3" style={{ color: '#9ea7b5' }}>
            Query the external leads database by US state (e.g. <span style={{ color: '#54b0e7' }}>CA</span>, <span style={{ color: '#54b0e7' }}>NY</span>, <span style={{ color: '#54b0e7' }}>TX</span>).
          </p>

          {/* Input row */}
          <div className="flex gap-2 mb-4">
            <Input
              value={geoTarget}
              onChange={e => setGeoTarget(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="State code, e.g. CA"
              className="flex-1 text-sm placeholder:text-gray-600 uppercase"
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
            <Button
              onClick={runQuery}
              disabled={loading || !geoTarget.trim()}
              className="font-semibold whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)', color: '#0a1929' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{loading ? 'Running...' : 'Query'}</span>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg px-4 py-3 mb-3 text-sm" style={{
              background: 'rgba(246,108,37,0.1)', border: '1px solid rgba(246,108,37,0.4)', color: '#f66c25'
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Results table */}
          {results !== null && (
            results.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#9ea7b5' }}>No results found for state "{geoTarget.toUpperCase()}".</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: '#9ea7b5' }}>{results.length} row{results.length !== 1 ? 's' : ''} returned</span>
                </div>
                <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid rgba(84,176,231,0.25)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(84,176,231,0.1)', borderBottom: '1px solid rgba(84,176,231,0.25)' }}>
                        {['ID', 'Industry', 'City', 'State', 'Score'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: '#54b0e7' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} style={{
                          borderBottom: i < results.length - 1 ? '1px solid rgba(94,106,120,0.2)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(84,176,231,0.03)'
                        }}>
                          <td className="px-3 py-2 font-mono" style={{ color: '#9ea7b5' }}>{row.id}</td>
                          <td className="px-3 py-2" style={{ color: '#d7dde5' }}>{row.industry || '—'}</td>
                          <td className="px-3 py-2" style={{ color: '#d7dde5' }}>{row.city || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full font-semibold" style={{
                              background: 'rgba(84,176,231,0.15)', color: '#54b0e7'
                            }}>{row.state}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span style={{ color: row.verification_score >= 80 ? '#2ecc71' : row.verification_score >= 50 ? '#f8d417' : '#f66c25' }}>
                              {row.verification_score ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
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