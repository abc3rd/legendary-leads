import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Users, Eye, Clock, MousePointerClick, UserPlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7daysAgo' },
  { label: 'Last 14 days', value: '14daysAgo' },
  { label: 'Last 30 days', value: '30daysAgo' },
  { label: 'Last 90 days', value: '90daysAgo' },
];

const DIMENSIONS = [
  { label: 'Date', value: 'date' },
  { label: 'Country', value: 'country' },
  { label: 'Device Category', value: 'deviceCategory' },
  { label: 'Page Path', value: 'pagePath' },
  { label: 'Source / Medium', value: 'sessionDefaultChannelGrouping' },
];

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #0d2137 0%, #1a2d42 100%)',
  border: '1px solid rgba(74,203,191,0.2)',
};

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl p-4" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs font-medium" style={{ color: '#9ea7b5' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{value}</div>
    </div>
  );
}

function fmt(val, isFloat = false) {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  if (isFloat) return n.toFixed(2);
  return n.toLocaleString();
}

function fmtDuration(seconds) {
  const s = parseFloat(seconds);
  if (isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

export default function Analytics() {
  const [accounts, setAccounts] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [startDate, setStartDate] = useState('30daysAgo');
  const [dimension, setDimension] = useState('date');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');

  // Load GA4 properties on mount
  useEffect(() => {
    (async () => {
      setLoadingAccounts(true);
      const res = await base44.functions.invoke('analyticsData', {});
      const data = res.data;
      if (data.accounts) {
        const properties = [];
        (data.accounts || []).forEach(acc => {
          (acc.propertySummaries || []).forEach(prop => {
            properties.push({ id: prop.property, name: prop.displayName });
          });
        });
        setAccounts(properties);
        if (properties.length > 0) setSelectedProperty(properties[0].id);
      } else {
        setError(data.error || 'Failed to load properties');
      }
      setLoadingAccounts(false);
    })();
  }, []);

  const fetchReport = async () => {
    if (!selectedProperty) return;
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('analyticsData', {
      propertyId: selectedProperty,
      startDate,
      endDate: 'today',
      dimensions: [dimension],
    });
    const data = res.data;
    if (data.report) {
      setReport(data.report);
    } else {
      setError(data.error || 'Failed to fetch report');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProperty) fetchReport();
  }, [selectedProperty, startDate, dimension]);

  // Parse report into chart data + totals
  const { rows = [], dimensionHeaders = [], metricHeaders = [] } = report || {};

  const chartData = rows.map(row => {
    const dimVal = row.dimensionValues?.[0]?.value || '';
    const obj = { dim: dimVal };
    metricHeaders.forEach((h, i) => {
      obj[h.name] = parseFloat(row.metricValues?.[i]?.value || 0);
    });
    return obj;
  });

  const totals = report?.totals?.[0]?.metricValues || [];
  const metricDefs = [
    { key: 'sessions', label: 'Sessions', icon: TrendingUp, color: '#54b0e7' },
    { key: 'activeUsers', label: 'Active Users', icon: Users, color: '#4acbbf' },
    { key: 'screenPageViews', label: 'Page Views', icon: Eye, color: '#f8d417' },
    { key: 'newUsers', label: 'New Users', icon: UserPlus, color: '#f66c25' },
    { key: 'bounceRate', label: 'Bounce Rate', icon: MousePointerClick, color: '#a78bfa' },
    { key: 'averageSessionDuration', label: 'Avg. Session', icon: Clock, color: '#34d399' },
  ];

  const getTotalValue = (key) => {
    const idx = metricHeaders.findIndex(h => h.name === key);
    if (idx === -1 || !totals[idx]) return '—';
    const val = totals[idx].value;
    if (key === 'bounceRate') return `${(parseFloat(val) * 100).toFixed(1)}%`;
    if (key === 'averageSessionDuration') return fmtDuration(val);
    return fmt(val);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #54b0e7, #4acbbf)' }}>
            <TrendingUp className="h-5 w-5" style={{ color: '#0a1929' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Analytics</h1>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>Google Analytics · User Engagement</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end" style={CARD_STYLE}>
          <Filter className="h-4 w-4 mt-1" style={{ color: '#4acbbf' }} />
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#9ea7b5' }}>Property</label>
            {loadingAccounts ? (
              <div className="text-xs" style={{ color: '#9ea7b5' }}>Loading...</div>
            ) : (
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-52 bg-transparent border-gray-600 text-white text-sm">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#9ea7b5' }}>Date Range</label>
            <Select value={startDate} onValueChange={setStartDate}>
              <SelectTrigger className="w-40 bg-transparent border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#9ea7b5' }}>Group By</label>
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger className="w-48 bg-transparent border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={fetchReport}
            disabled={loading || !selectedProperty}
            className="text-sm font-semibold"
            style={{ background: '#4acbbf', color: '#0a1929' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: 'rgba(246,108,37,0.1)', border: '1px solid #f66c25', color: '#f66c25' }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4acbbf' }} />
          </div>
        )}

        {/* Metrics */}
        {!loading && report && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {metricDefs.map(m => (
                <MetricCard key={m.key} icon={m.icon} label={m.label} value={getTotalValue(m.key)} color={m.color} />
              ))}
            </div>

            {/* Sessions Chart */}
            <div className="rounded-xl p-5 mb-4" style={CARD_STYLE}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#4acbbf' }}>Sessions &amp; Active Users</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="dim" tick={{ fill: '#9ea7b5', fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d2137', border: '1px solid #4acbbf', color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="sessions" stroke="#54b0e7" dot={false} strokeWidth={2} name="Sessions" />
                  <Line type="monotone" dataKey="activeUsers" stroke="#4acbbf" dot={false} strokeWidth={2} name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Page Views Chart */}
            <div className="rounded-xl p-5 mb-4" style={CARD_STYLE}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#f8d417' }}>Page Views &amp; New Users</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="dim" tick={{ fill: '#9ea7b5', fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d2137', border: '1px solid #4acbbf', color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="screenPageViews" fill="#f8d417" name="Page Views" radius={[4,4,0,0]} />
                  <Bar dataKey="newUsers" fill="#f66c25" name="New Users" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(74,203,191,0.15)' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#9ea7b5' }}>Breakdown by {DIMENSIONS.find(d => d.value === dimension)?.label}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(74,203,191,0.1)' }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#4acbbf' }}>
                        {DIMENSIONS.find(d => d.value === dimension)?.label}
                      </th>
                      {metricDefs.map(m => (
                        <th key={m.key} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#4acbbf' }}>{m.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(0, 20).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-2.5 font-medium" style={{ color: '#ffffff' }}>{row.dim}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{fmt(row.sessions)}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{fmt(row.activeUsers)}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{fmt(row.screenPageViews)}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{fmt(row.newUsers)}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{row.bounceRate != null ? `${(row.bounceRate * 100).toFixed(1)}%` : '—'}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: '#d7dde5' }}>{fmtDuration(row.averageSessionDuration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}