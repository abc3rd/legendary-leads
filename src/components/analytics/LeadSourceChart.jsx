import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#ea00ea', '#4acbbf', '#f8d417', '#54b0e7', '#f66c25', '#a78bfa', '#2ecc71', '#e74c3c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #4acbbf55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      <p style={{ color: '#4acbbf' }}>Leads: <strong>{payload[0]?.value}</strong></p>
      <p style={{ color: '#2ecc71' }}>Converted: <strong>{payload[1]?.value}</strong></p>
    </div>
  );
};

export default function LeadSourceChart({ leads }) {
  const chartData = useMemo(() => {
    const sources = {};
    leads.forEach(lead => {
      const src = lead.platform_source || lead.category || 'Direct';
      if (!sources[src]) sources[src] = { source: src, total: 0, converted: 0 };
      sources[src].total++;
      if (lead.status === 'converted') sources[src].converted++;
    });
    return Object.values(sources)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map(s => ({ ...s, rate: s.total > 0 ? ((s.converted / s.total) * 100).toFixed(1) : 0 }));
  }, [leads]);

  if (!chartData.length) return (
    <div className="rounded-xl p-5 flex items-center justify-center h-48" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(74,203,191,0.2)' }}>
      <p className="text-sm" style={{ color: '#5e6a78' }}>No source data available</p>
    </div>
  );

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(74,203,191,0.2)' }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: '#4acbbf' }}>Top-Performing Lead Sources</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9ea7b5', fontSize: 10 }} />
          <YAxis type="category" dataKey="source" tick={{ fill: '#d7dde5', fontSize: 10 }} width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" name="Total Leads" radius={[0, 4, 4, 0]} fill="#4acbbf">
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
          <Bar dataKey="converted" name="Converted" radius={[0, 4, 4, 0]} fill="#2ecc71" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {chartData.slice(0, 4).map((s, i) => (
          <div key={s.source} className="rounded-lg p-2 text-center" style={{ background: `${COLORS[i]}10`, border: `1px solid ${COLORS[i]}30` }}>
            <div className="text-sm font-bold" style={{ color: COLORS[i] }}>{s.rate}%</div>
            <div className="text-[10px] truncate" style={{ color: '#9ea7b5' }}>{s.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}