import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, parseISO, startOfDay } from 'date-fns';

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

export default function LeadConversionChart({ leads }) {
  const chartData = useMemo(() => {
    const days = 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      buckets[d] = { date: d, new: 0, contacted: 0, qualified: 0, converted: 0 };
    }
    leads.forEach(lead => {
      if (!lead.created_date) return;
      const d = format(parseISO(lead.created_date), 'MMM d');
      if (buckets[d]) buckets[d].new++;
      if (lead.status === 'converted' && lead.updated_date) {
        const ud = format(parseISO(lead.updated_date), 'MMM d');
        if (buckets[ud]) buckets[ud].converted++;
      }
      if (['contacted', 'qualified', 'in_negotiation', 'converted'].includes(lead.status) && lead.updated_date) {
        const ud = format(parseISO(lead.updated_date), 'MMM d');
        if (buckets[ud]) buckets[ud].contacted++;
      }
      if (['qualified', 'in_negotiation', 'converted'].includes(lead.status) && lead.updated_date) {
        const ud = format(parseISO(lead.updated_date), 'MMM d');
        if (buckets[ud]) buckets[ud].qualified++;
      }
    });
    return Object.values(buckets).slice(-14);
  }, [leads]);

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: '#ea00ea' }}>Lead Conversion Rates Over Time (Last 14 Days)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#9ea7b5', fontSize: 10 }} interval={1} />
          <YAxis tick={{ fill: '#9ea7b5', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ea7b5' }} />
          <Line type="monotone" dataKey="new" stroke="#54b0e7" dot={false} strokeWidth={2} name="New" />
          <Line type="monotone" dataKey="contacted" stroke="#f8d417" dot={false} strokeWidth={2} name="Contacted" />
          <Line type="monotone" dataKey="qualified" stroke="#a78bfa" dot={false} strokeWidth={2} name="Qualified" />
          <Line type="monotone" dataKey="converted" stroke="#2ecc71" dot={false} strokeWidth={2.5} name="Converted" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}