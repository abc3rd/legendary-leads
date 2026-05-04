import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Mail, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const CARD = {
  background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)',
  border: '1.5px solid rgba(234,0,234,0.2)',
};

const COLORS = { sent: '#2ecc71', pending: '#f8d417', failed: '#f66c25' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1b2a', border: '1px solid #ea00ea55', color: '#fff' }}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function SequencePerformance({ logs, sequences }) {
  // Aggregate per sequence
  const seqMap = {};
  logs.forEach(log => {
    const key = log.sequence_name || log.sequence_id || 'Unknown';
    if (!seqMap[key]) seqMap[key] = { name: key, sent: 0, pending: 0, failed: 0, total: 0 };
    seqMap[key][log.status] = (seqMap[key][log.status] || 0) + 1;
    seqMap[key].total += 1;
  });

  const seqData = Object.values(seqMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Overall status pie
  const totalSent = logs.filter(l => l.status === 'sent').length;
  const totalPending = logs.filter(l => l.status === 'pending').length;
  const totalFailed = logs.filter(l => l.status === 'failed').length;
  const pieData = [
    { name: 'Sent', value: totalSent, color: '#2ecc71' },
    { name: 'Pending', value: totalPending, color: '#f8d417' },
    { name: 'Failed', value: totalFailed, color: '#f66c25' },
  ].filter(d => d.value > 0);

  // Channel breakdown
  const emailLogs = logs.filter(l => l.channel === 'email');
  const smsLogs = logs.filter(l => l.channel === 'sms');
  const emailSentRate = emailLogs.length > 0
    ? ((emailLogs.filter(l => l.status === 'sent').length / emailLogs.length) * 100).toFixed(1)
    : '—';
  const smsSentRate = smsLogs.length > 0
    ? ((smsLogs.filter(l => l.status === 'sent').length / smsLogs.length) * 100).toFixed(1)
    : '—';

  if (logs.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center" style={CARD}>
        <Mail className="h-10 w-10 mx-auto mb-3" style={{ color: '#5e6a78' }} />
        <p style={{ color: '#9ea7b5' }}>No follow-up activity yet. Sequences will appear here once leads start moving through your funnel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Channel KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sent', value: totalSent, icon: CheckCircle, color: '#2ecc71' },
          { label: 'Pending', value: totalPending, icon: Clock, color: '#f8d417' },
          { label: 'Failed', value: totalFailed, icon: AlertCircle, color: '#f66c25' },
          { label: 'Email Delivery Rate', value: `${emailSentRate}%`, icon: Mail, color: '#54b0e7' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl p-4" style={CARD}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                <p className="text-xs" style={{ color: '#9ea7b5' }}>{kpi.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'Poppins, sans-serif' }}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sequence Performance Bar */}
        <div className="rounded-xl p-5" style={CARD}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
            Sequence Performance
          </h3>
          {seqData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#5e6a78' }}>No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={seqData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ea7b5', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#c3c3c3', fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" stackId="a" fill="#2ecc71" name="Sent" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#f8d417" name="Pending" />
                <Bar dataKey="failed" stackId="a" fill="#f66c25" name="Failed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Delivery Status Pie */}
        <div className="rounded-xl p-5" style={CARD}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#54b0e7', fontFamily: 'Poppins, sans-serif' }}>
            Overall Delivery Status
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottleneck callout */}
      {totalFailed > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{
          background: 'rgba(246,108,37,0.08)', border: '1.5px solid rgba(246,108,37,0.4)'
        }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f66c25' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f66c25' }}>Bottleneck Detected</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>
              {totalFailed} message{totalFailed !== 1 ? 's' : ''} failed to send — most likely missing contact info on leads or unset SMS credentials.
              Check the Activity Log for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}