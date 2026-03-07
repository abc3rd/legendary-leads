import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Mail, MessageSquare, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const STATUS_ICON = {
  sent: <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#2ecc71' }} />,
  failed: <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#f66c25' }} />,
  pending: <Clock className="h-4 w-4 flex-shrink-0" style={{ color: '#f8d417' }} />,
};

export default function FollowUpLogsPanel() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['follow_up_logs'],
    queryFn: () => base44.entities.FollowUpLog.list('-created_date', 100),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4acbbf' }} /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{ border: '2px dashed rgba(74,203,191,0.2)' }}>
        <p className="text-lg" style={{ color: '#9ea7b5' }}>No activity yet</p>
        <p className="text-sm mt-1" style={{ color: '#5e6a78' }}>Follow-up sends will appear here</p>
      </div>
    );
  }

  const sent = logs.filter(l => l.status === 'sent').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const pending = logs.filter(l => l.status === 'pending').length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Sent', value: sent, color: '#2ecc71' },
          { label: 'Pending', value: pending, color: '#f8d417' },
          { label: 'Failed', value: failed, color: '#f66c25' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{
            background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
            border: `1.5px solid ${s.color}40`
          }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {logs.map(log => (
          <div key={log.id} className="rounded-xl p-4" style={{
            background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
            border: '1px solid #1a2332'
          }}>
            <div className="flex items-start gap-3">
              {STATUS_ICON[log.status] || STATUS_ICON.pending}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                    @{log.lead_username || log.lead_id?.slice(0, 8)}
                  </span>
                  {log.channel === 'email'
                    ? <Mail className="h-3.5 w-3.5" style={{ color: '#54b0e7' }} />
                    : <MessageSquare className="h-3.5 w-3.5" style={{ color: '#4acbbf' }} />}
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: log.status === 'sent' ? 'rgba(46,204,113,0.15)' : log.status === 'failed' ? 'rgba(246,108,37,0.15)' : 'rgba(248,212,23,0.15)',
                    color: log.status === 'sent' ? '#2ecc71' : log.status === 'failed' ? '#f66c25' : '#f8d417'
                  }}>{log.status}</span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9ea7b5' }}>
                  {log.sequence_name && <span>Seq: <strong>{log.sequence_name}</strong> · </span>}
                  {log.channel === 'email' && log.lead_email}
                  {log.channel === 'sms' && log.lead_phone}
                </p>
                {log.subject && <p className="text-xs mt-0.5 truncate" style={{ color: '#f8d417' }}>📧 {log.subject}</p>}
                {log.error && <p className="text-xs mt-0.5" style={{ color: '#f66c25' }}>⚠ {log.error}</p>}
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: '#5e6a78' }}>
                {new Date(log.created_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}