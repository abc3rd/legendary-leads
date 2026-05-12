import React from 'react';
import { Eye, MousePointerClick, Send, XCircle, TrendingUp } from 'lucide-react';

export default function CampaignStats({ campaign }) {
  const { sent_count = 0, opened_count = 0, clicked_count = 0, failed_count = 0, total_recipients = 0 } = campaign;
  const openRate = sent_count > 0 ? ((opened_count / sent_count) * 100).toFixed(1) : 0;
  const clickRate = opened_count > 0 ? ((clicked_count / opened_count) * 100).toFixed(1) : 0;
  const deliveryRate = total_recipients > 0 ? (((sent_count) / total_recipients) * 100).toFixed(1) : 0;

  const bars = [
    { label: 'Delivery', val: deliveryRate, count: sent_count, color: '#54b0e7', icon: Send },
    { label: 'Open Rate', val: openRate, count: opened_count, color: '#f8d417', icon: Eye },
    { label: 'Click Rate', val: clickRate, count: clicked_count, color: '#2ecc71', icon: MousePointerClick },
  ];

  return (
    <div className="pt-4 space-y-3">
      {bars.map(({ label, val, count, color, icon: Icon }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9ea7b5' }}>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              {label}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#5e6a78' }}>{count.toLocaleString()}</span>
              <span className="text-xs font-bold" style={{ color }}>{val}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(val, 100)}%`, background: color }} />
          </div>
        </div>
      ))}
      {failed_count > 0 && (
        <div className="flex items-center gap-2 text-xs pt-1" style={{ color: '#f66c25' }}>
          <XCircle className="h-3.5 w-3.5" />
          {failed_count} failed deliveries
        </div>
      )}
      {campaign.scheduled_at && campaign.status === 'scheduled' && (
        <div className="text-xs pt-1" style={{ color: '#54b0e7' }}>
          Scheduled for: {new Date(campaign.scheduled_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}