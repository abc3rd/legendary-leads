import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format, parseISO, isAfter } from 'date-fns';

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

export default function SentimentTrendChart({ leads }) {
  const data = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    // Group by week bucket
    const buckets = {};
    leads.forEach(l => {
      if (!l.sentiment_analyzed_at) return;
      const d = parseISO(l.sentiment_analyzed_at);
      if (!isAfter(d, cutoff)) return;
      const week = format(d, 'MMM d');
      if (!buckets[week]) buckets[week] = { week, Positive: 0, Neutral: 0, Negative: 0 };
      if (l.sentiment) buckets[week][l.sentiment] = (buckets[week][l.sentiment] || 0) + 1;
    });
    return Object.values(buckets).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [leads]);

  if (data.length === 0) return (
    <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
      <p className="text-xs py-6" style={{ color: '#9ea7b5' }}>No sentiment data in the last 30 days. Run AI sentiment analysis on your leads to see trends.</p>
    </div>
  );

  return (
    <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.2)' }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: '#ea00ea' }}>Sentiment Trends (Last 30 Days)</h2>
      <p className="text-xs mb-4" style={{ color: '#9ea7b5' }}>Leads analyzed by AI sentiment over time</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="week" tick={{ fill: '#9ea7b5', fontSize: 10 }} />
          <YAxis tick={{ fill: '#9ea7b5', fontSize: 10 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ea7b5' }} />
          <Line type="monotone" dataKey="Positive" stroke="#2ecc71" strokeWidth={2} dot={{ r: 3 }} name="Positive" />
          <Line type="monotone" dataKey="Neutral" stroke="#f8d417" strokeWidth={2} dot={{ r: 3 }} name="Neutral" />
          <Line type="monotone" dataKey="Negative" stroke="#e74c3c" strokeWidth={2} dot={{ r: 3 }} name="Negative" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}