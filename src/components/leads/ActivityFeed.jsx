import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare, RefreshCw, UserCheck, Mail, Star,
  CheckCircle2, Tag, Loader2, Activity
} from 'lucide-react';

const ACTIVITY_CONFIG = {
  note:          { icon: MessageSquare, color: '#4acbbf', label: 'Note' },
  status_change: { icon: RefreshCw,     color: '#f8d417', label: 'Status Change' },
  assignment:    { icon: UserCheck,     color: '#ea00ea', label: 'Assignment' },
  email_sent:    { icon: Mail,          color: '#54b0e7', label: 'Email Sent' },
  sms_sent:      { icon: MessageSquare, color: '#a78bfa', label: 'SMS Sent' },
  score_update:  { icon: Star,          color: '#f66c25', label: 'Score Update' },
};

function ActivityItem({ item, index }) {
  const cfg = ACTIVITY_CONFIG[item.activity_type] || ACTIVITY_CONFIG.note;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Icon */}
      <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${cfg.color}18` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: '#fff' }}>
            {item.author_name || item.author_email || 'System'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: `${cfg.color}18`, color: cfg.color }}>
            {cfg.label}
          </span>
          {item.lead_username && (
            <span className="text-[10px]" style={{ color: '#5e6a78' }}>
              on <span style={{ color: '#4acbbf' }}>@{item.lead_username}</span>
            </span>
          )}
          <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: '#5e6a78' }}>
            {item.created_date
              ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#9ea7b5' }}>{item.body}</p>
      </div>
    </motion.div>
  );
}

export default function ActivityFeed() {
  const { data: activity = [], isLoading, refetch } = useQuery({
    queryKey: ['activity_feed_legendb'],
    queryFn: () => base44.entities.LeadNote.list('-created_date', 40),
    refetchInterval: 30000,
  });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,18,30,0.95)', border: '1.5px solid rgba(234,0,234,0.25)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(234,0,234,0.12)', background: 'rgba(234,0,234,0.05)' }}>
        <Activity className="h-4 w-4" style={{ color: '#ea00ea' }} />
        <span className="text-sm font-bold" style={{ color: '#ea00ea' }}>Team Activity Feed</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(234,0,234,0.12)', color: '#ea00ea' }}>
          Live · last 40 entries
        </span>
        <button onClick={() => refetch()} className="h-6 w-6 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#9ea7b5' }}
          title="Refresh">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 overflow-y-auto" style={{ maxHeight: 480 }}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#ea00ea' }} />
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-14">
            <Activity className="h-10 w-10 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
            <p className="text-sm font-medium" style={{ color: '#5e6a78' }}>No activity yet</p>
            <p className="text-xs mt-1" style={{ color: '#3a4a5a' }}>
              Status changes, notes, and assignments will appear here
            </p>
          </div>
        ) : (
          activity.map((item, i) => <ActivityItem key={item.id} item={item} index={i} />)
        )}
      </div>
    </div>
  );
}