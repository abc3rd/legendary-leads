import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#4acbbf', '#54b0e7', '#f8d417', '#f66c25', '#ea00ea', '#2ecc71', '#9b59b6', '#e74c3c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      <p style={{ color: '#2ecc71' }}>Converted: <strong>{payload[0]?.value}</strong></p>
      <p style={{ color: '#9ea7b5' }}>Total: <strong>{payload[1]?.value}</strong></p>
      <p style={{ color: '#f8d417' }}>Rate: <strong>{payload[2]?.value}%</strong></p>
    </div>
  );
};

export default function CategoryConversionChart({ leads }) {
  const data = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const cat = l.category || 'Uncategorized';
      if (!map[cat]) map[cat] = { total: 0, converted: 0 };
      map[cat].total++;
      if (l.status === 'converted') map[cat].converted++;
    });
    return Object.entries(map)
      .map(([cat, v]) => ({
        category: cat.length > 14 ? cat.slice(0, 13) + '…' : cat,
        converted: v.converted,
        total: v.total,
        rate: v.total > 0 ? Math.round((v.converted / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 12);
  }, [leads]);

  if (data.length === 0) return <p className="text-xs text-center py-8" style={{ color: '#9ea7b5' }}>No category data yet.</p>;

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(74,203,191,0.25)' }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: '#4acbbf' }}>Conversion Rate by Category</h2>
      <p className="text-xs mb-4" style={{ color: '#9ea7b5' }}>Top categories ranked by % converted</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ea7b5', fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="category" tick={{ fill: '#d7dde5', fontSize: 10 }} width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="rate" name="Conversion %" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}