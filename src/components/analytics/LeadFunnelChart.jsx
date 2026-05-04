import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const STATUS_ORDER = [
  { value: 'new',            label: 'New',            color: '#4acbbf' },
  { value: 'cold_outreach',  label: 'Cold Outreach',  color: '#54b0e7' },
  { value: 'contacted',      label: 'Contacted',      color: '#f8d417' },
  { value: 'qualified',      label: 'Qualified',      color: '#f66c25' },
  { value: 'in_negotiation', label: 'Negotiation',    color: '#ea00ea' },
  { value: 'converted',      label: 'Converted',      color: '#2ecc71' },
  { value: 'unresponsive',   label: 'Unresponsive',   color: '#5e6a78' },
];

const CARD = {
  background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)',
  border: '1.5px solid rgba(234,0,234,0.2)',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function LeadFunnelChart({ leads }) {
  // Count leads per status
  const statusCounts = {};
  STATUS_ORDER.forEach(s => { statusCounts[s.value] = 0; });
  leads.forEach(l => { if (statusCounts[l.status] !== undefined) statusCounts[l.status]++; });

  const funnelData = STATUS_ORDER.map(s => ({
    name: s.label,
    count: statusCounts[s.value],
    color: s.color,
  }));

  const total = leads.length || 1;
  const converted = statusCounts['converted'];
  const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';

  // Drop-off rates between stages (excluding unresponsive)
  const pipeline = STATUS_ORDER.filter(s => s.value !== 'unresponsive');
  const velocityData = pipeline.map((s, i) => {
    const current = statusCounts[s.value];
    const prev = i === 0 ? total : statusCounts[pipeline[i - 1].value];
    const dropPct = prev > 0 ? (((prev - current) / prev) * 100).toFixed(1) : '0';
    return { name: s.label, count: current, drop: parseFloat(dropPct), color: s.color };
  });

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: total, color: '#ea00ea' },
          { label: 'Conversion Rate', value: `${convRate}%`, color: '#2ecc71' },
          { label: 'Converted', value: converted, color: '#2ecc71' },
          { label: 'Unresponsive', value: statusCounts['unresponsive'], color: '#5e6a78' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4" style={CARD}>
            <p className="text-xs mb-1" style={{ color: '#9ea7b5' }}>{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'Poppins, sans-serif' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel Bar Chart */}
      <div className="rounded-xl p-5" style={CARD}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
          Lead Funnel — Stage Distribution
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ea7b5', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#c3c3c3', fontSize: 11 }} width={88} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Leads">
              {funnelData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList dataKey="count" position="right" style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage Velocity — Drop-off */}
      <div className="rounded-xl p-5" style={CARD}>
        <h3 className="text-sm font-bold mb-1" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
          Funnel Stage Velocity — Drop-off %
        </h3>
        <p className="text-xs mb-4" style={{ color: '#5e6a78' }}>% of leads lost at each stage transition</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#9ea7b5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9ea7b5', fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="drop" name="Drop-off %" radius={[4, 4, 0, 0]}>
              {velocityData.map((entry, i) => (
                <Cell key={i} fill={entry.drop > 50 ? '#f66c25' : entry.drop > 25 ? '#f8d417' : '#2ecc71'} />
              ))}
              <LabelList dataKey="drop" position="top" formatter={v => `${v}%`} style={{ fill: '#fff', fontSize: 10 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}