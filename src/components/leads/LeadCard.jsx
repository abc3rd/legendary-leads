import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Globe, Users, User, MapPin, Tag } from 'lucide-react';
import EnrichLeadButton from './EnrichLeadButton';
import SentimentGauge from './SentimentGauge';
import LeadScoreBadge from './LeadScoreBadge';

const STATUS_COLORS = {
  new: { bg: '#4acbbf', text: '#0a1929' },
  cold_outreach: { bg: '#54b0e7', text: '#0a1929' },
  contacted: { bg: '#f8d417', text: '#0a1929' },
  qualified: { bg: '#f66c25', text: '#fff' },
  in_negotiation: { bg: '#9b59b6', text: '#fff' },
  converted: { bg: '#2ecc71', text: '#0a1929' },
  unresponsive: { bg: '#5e6a78', text: '#fff' },
};

const STATUSES = Object.keys(STATUS_COLORS);

export default function LeadCard({ lead, onEnriched }) {
  const [localStatus, setLocalStatus] = useState(lead.status);
  const [statusChanging, setStatusChanging] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === localStatus || statusChanging) return;
    setLocalStatus(newStatus);
    setStatusChanging(true);
    await base44.entities.Lead.update(lead.id, { status: newStatus });
    setStatusChanging(false);
    if (onEnriched) onEnriched();
  };

  const getAreaCode = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(0, 3) : null;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '—';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const areaCode = getAreaCode(lead.phone);
  const statusStyle = STATUS_COLORS[localStatus] || STATUS_COLORS.new;
  const initial = lead.name?.[0]?.toUpperCase() || lead.username?.[0]?.toUpperCase() || 'L';

  return (
    <Card
      className="group hover:shadow-2xl transition-all duration-300"
      style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '1.5px solid #5e6a78' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#4acbbf'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#5e6a78'}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)' }}>
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate" style={{ color: '#ffffff' }}>
                {lead.name || 'Unknown'}
              </h3>
              <p className="text-xs truncate" style={{ color: '#9ea7b5' }}>
                @{lead.username || '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {localStatus && (
              <Select value={localStatus} onValueChange={handleStatusChange} disabled={statusChanging}>
                <SelectTrigger
                  className="h-auto text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap border-none outline-none w-auto"
                  style={{ background: statusStyle.bg, color: statusStyle.text, opacity: statusChanging ? 0.7 : 1 }}
                  onClick={e => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a2332', border: '1px solid #4acbbf' }}>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} style={{ color: '#fff' }}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {lead.category && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: 'rgba(248,212,23,0.15)', color: '#f8d417', border: '1px solid rgba(248,212,23,0.3)'
              }}>
                {lead.category}
              </span>
            )}
          </div>
        </div>

        {lead.bio && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: '#9ea7b5' }}>{lead.bio}</p>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3 rounded-lg p-2" style={{ background: 'rgba(84,176,231,0.07)' }}>
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#54b0e7' }} />
            <span style={{ color: '#d7dde5' }}>
              <span className="font-bold">{formatNumber(lead.followerCount)}</span>
              <span style={{ color: '#9ea7b5' }}> followers</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <User className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#4acbbf' }} />
            <span style={{ color: '#d7dde5' }}>
              <span className="font-bold">{formatNumber(lead.followingCount)}</span>
              <span style={{ color: '#9ea7b5' }}> following</span>
            </span>
          </div>
        </div>

        <div className="space-y-1.5 border-t pt-3" style={{ borderColor: 'rgba(94,106,120,0.4)' }}>
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs hover:opacity-80" style={{ color: '#4acbbf' }}>
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </a>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#d7dde5' }}>
              <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#54b0e7' }} />
              <span className="truncate flex-1">{lead.phone}</span>
              {areaCode && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  background: 'rgba(84,176,231,0.15)', color: '#54b0e7', border: '1px solid rgba(84,176,231,0.3)'
                }}>
                  <MapPin className="h-2.5 w-2.5 inline mr-0.5" />{areaCode}
                </span>
              )}
            </div>
          )}
          {lead.website && (
            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:opacity-80" style={{ color: '#f8d417' }}>
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{lead.website}</span>
            </a>
          )}
        </div>

        <SentimentGauge lead={lead} onUpdated={onEnriched} />
        <LeadScoreBadge lead={lead} onUpdated={onEnriched} />

        <div className="mt-3 pt-2 border-t flex justify-end" style={{ borderColor: 'rgba(94,106,120,0.3)' }}>
          <EnrichLeadButton lead={lead} onEnriched={onEnriched} />
        </div>

        {lead.tag && (
          <div className="mt-2 flex items-center gap-1.5">
            <Tag className="h-3 w-3" style={{ color: '#f66c25' }} />
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              background: 'rgba(246,108,37,0.15)', color: '#f66c25', border: '1px solid rgba(246,108,37,0.3)'
            }}>
              {lead.tag}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}