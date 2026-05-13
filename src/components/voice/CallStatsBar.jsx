import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

export default function CallStatsBar() {
  const { data: logs = [] } = useQuery({
    queryKey: ['call_logs'],
    queryFn: () => base44.entities.CallLog.list('-created_date', 200),
  });

  const total = logs.length;
  const completed = logs.filter(l => l.status === 'completed').length;
  const interested = logs.filter(l => l.outcome === 'interested' || l.outcome === 'converted').length;
  const followUps = logs.filter(l => l.follow_up_scheduled).length;
  const positives = logs.filter(l => l.sentiment === 'Positive').length;
  const rate = total > 0 ? Math.round((interested / total) * 100) : 0;
  const sentimentRate = completed > 0 ? Math.round((positives / completed) * 100) : 0;

  const stats = [
    { label: 'Total Calls', value: total, icon: Phone, color: '#ea00ea' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: '#2ecc71' },
    { label: 'Interest Rate', value: `${rate}%`, icon: TrendingUp, color: '#f8d417' },
    { label: 'Follow-Ups', value: followUps, icon: Calendar, color: '#54b0e7' },
    { label: 'Positive Sentiment', value: `${sentimentRate}%`, icon: TrendingUp, color: '#9b59b6' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}30` }}>
            <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: s.color }} />
            <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Poppins, sans-serif' }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: '#9ea7b5' }}>{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}