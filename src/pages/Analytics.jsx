import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Loader2, TrendingUp, Users, Eye, Clock, MousePointerClick, UserPlus, Filter, GitBranch, BarChart2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LeadFunnelChart from '../components/analytics/LeadFunnelChart';
import SequencePerformance from '../components/analytics/SequencePerformance';
import CategoryConversionChart from '../components/analytics/CategoryConversionChart';
import SentimentTrendChart from '../components/analytics/SentimentTrendChart';
import ExportPanel from '../components/analytics/ExportPanel';

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
const CARD = {
  background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)',
  border: '1.5px solid rgba(234,0,234,0.2)',
};

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
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const TABS = [
  { id: 'leads', label: 'Lead Analytics', icon: GitBranch },
  { id: 'ga4', label: 'Web Analytics', icon: BarChart2 },
  { id: 'export', label: 'Export', icon: Download },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('leads');

  // Lead data
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads_all'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['follow_up_logs_all'],
    queryFn: () => base44.entities.FollowUpLog.list('-created_date', 2000),
  });
  const { data: sequences = [] } = useQuery({
    queryKey: ['sequences_all'],
    queryFn: () => base44.entities.FollowUpSequence.list('-created_date', 100),
  });

  // GA4
  const [accounts, setAccounts] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [startDate, setStartDate] = useState('30daysAgo');
  const [dimension, setDimension] = useState('date');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');

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
      }
      setLoadingAccounts(false);
    })();
  }, []);

  const fetchReport = async () => {
    if (!selectedProperty) return;
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('analyticsData', {
      propertyId: selectedProperty, startDate, endDate: 'today', dimensions: [dimension],
    });
    const data = res.data;
    if (data.report) setReport(data.report);
    else setError(data.error || 'Failed to fetch report');
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProperty) fetchReport();
  }, [selectedProperty, startDate, dimension]);

  const { rows = [], metricHeaders = [] } = report || {};
  const chartData = rows.map(row => {
    const obj = { dim: row.dimensionValues?.[0]?.value || '' };
    metricHeaders.forEach((h, i) => { obj[h.name] = parseFloat(row.metricValues?.[i]?.value || 0); });
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
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ea00ea, #c3c3c3)' }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Analytics</h1>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>Lead funnel · Sequence performance · Web engagement</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'rgba(234,0,234,0.2)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  color: activeTab === tab.id ? '#ea00ea' : '#9ea7b5',
                  borderBottom: activeTab === tab.id ? '2px solid #ea00ea' : '2px solid transparent',
                  marginBottom: '-1px',
                }}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Lead Analytics Tab ── */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {leadsLoading || logsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ea00ea' }} />
              </div>
            ) : (
              <>
                <LeadFunnelChart leads={leads} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <CategoryConversionChart leads={leads} />
                  <SentimentTrendChart leads={leads} />
                </div>
                <div className="pt-2">
                  <h2 className="text-base font-bold mb-4" style={{ color: '#c3c3c3', fontFamily: 'Poppins, sans-serif' }}>
                    Follow-Up Sequence Performance
                  </h2>
                  <SequencePerformance logs={logs} sequences={sequences} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Export Tab ── */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <ExportPanel leads={leads} logs={logs} />
            <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(84,176,231,0.2)' }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: '#54b0e7' }}>System Logs Preview</h2>
              {logsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#54b0e7' }} /></div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#5e6a78' }}>No activity logs yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(84,176,231,0.15)' }}>
                        {['Username', 'Sequence', 'Channel', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color: '#54b0e7' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 20).map((log, i) => (
                        <tr key={i} className="hover:bg-white/5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-3 py-2" style={{ color: '#d7dde5' }}>{log.lead_username || '—'}</td>
                          <td className="px-3 py-2" style={{ color: '#9ea7b5' }}>{log.sequence_name || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: log.channel === 'email' ? 'rgba(84,176,231,0.15)' : 'rgba(74,203,191,0.15)', color: log.channel === 'email' ? '#54b0e7' : '#4acbbf' }}>
                              {log.channel?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span style={{ color: log.status === 'sent' ? '#2ecc71' : log.status === 'failed' ? '#f66c25' : '#9ea7b5' }}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-3 py-2" style={{ color: '#5e6a78' }}>
                            {log.created_date ? new Date(log.created_date).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length > 20 && <p className="text-xs mt-2 text-center" style={{ color: '#5e6a78' }}>Showing 20 of {logs.length} — export CSV for full data</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Web Analytics Tab (GA4) ── */}
        {activeTab === 'ga4' && (
          <div>
            {/* Filters */}
            <div className="rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end" style={CARD}>
              <Filter className="h-4 w-4 mt-1" style={{ color: '#4acbbf' }} />
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#9ea7b5' }}>Property</label>
                {loadingAccounts ? (
                  <span className="text-xs" style={{ color: '#9ea7b5' }}>Loading...</span>
                ) : (
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="w-52 bg-transparent border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#9ea7b5' }}>Date Range</label>
                <Select value={startDate} onValueChange={setStartDate}>
                  <SelectTrigger className="w-40 bg-transparent border-gray-600 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#9ea7b5' }}>Group By</label>
                <Select value={dimension} onValueChange={setDimension}>
                  <SelectTrigger className="w-48 bg-transparent border-gray-600 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIMENSIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={fetchReport} disabled={loading || !selectedProperty} className="text-sm font-semibold" style={{ background: '#4acbbf', color: '#0a1929' }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>

            {error && (
              <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: 'rgba(246,108,37,0.1)', border: '1px solid #f66c25', color: '#f66c25' }}>{error}</div>
            )}
            {loading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4acbbf' }} /></div>}

            {!loading && report && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {metricDefs.map(m => (
                    <div key={m.key} className="rounded-xl p-4" style={CARD}>
                      <div className="flex items-center gap-2 mb-1">
                        <m.icon className="h-4 w-4" style={{ color: m.color }} />
                        <span className="text-xs" style={{ color: '#9ea7b5' }}>{m.label}</span>
                      </div>
                      <div className="text-xl font-bold" style={{ color: '#fff' }}>{getTotalValue(m.key)}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-5 mb-4" style={CARD}>
                  <h2 className="text-sm font-semibold mb-4" style={{ color: '#4acbbf' }}>Sessions &amp; Active Users</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="dim" tick={{ fill: '#9ea7b5', fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="sessions" stroke="#54b0e7" dot={false} strokeWidth={2} name="Sessions" />
                      <Line type="monotone" dataKey="activeUsers" stroke="#4acbbf" dot={false} strokeWidth={2} name="Active Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl p-5 mb-4" style={CARD}>
                  <h2 className="text-sm font-semibold mb-4" style={{ color: '#f8d417' }}>Page Views &amp; New Users</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="dim" tick={{ fill: '#9ea7b5', fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="screenPageViews" fill="#f8d417" name="Page Views" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="newUsers" fill="#f66c25" name="New Users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl overflow-hidden" style={CARD}>
                  <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(234,0,234,0.15)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: '#9ea7b5' }}>
                      Breakdown by {DIMENSIONS.find(d => d.value === dimension)?.label}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(234,0,234,0.1)' }}>
                          <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#ea00ea' }}>
                            {DIMENSIONS.find(d => d.value === dimension)?.label}
                          </th>
                          {metricDefs.map(m => (
                            <th key={m.key} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: '#ea00ea' }}>{m.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.slice(0, 20).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-2.5 font-medium" style={{ color: '#fff' }}>{row.dim}</td>
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
        )}
      </div>
    </div>
  );
}