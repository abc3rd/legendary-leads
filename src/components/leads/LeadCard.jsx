import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Instagram, Mail, Phone, Globe, Users, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeadCard({ lead }) {
  const getAreaCode = (phone) => {
    if (!phone) return null;
    const match = phone.match(/\(?(\d{3})\)?/);
    return match ? match[1] : null;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const areaCode = getAreaCode(lead.phone);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {lead.name?.[0]?.toUpperCase() || lead.username?.[0]?.toUpperCase() || 'L'}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                {lead.name || 'Unknown'}
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Instagram className="h-3 w-3" />
                @{lead.username}
              </p>
            </div>
          </div>
          {lead.category && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {lead.category}
            </Badge>
          )}
        </div>

        {lead.bio && (
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">
            {lead.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-gray-400">
              <span className="text-white font-semibold">{formatNumber(lead.followerCount)}</span> followers
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <User className="h-4 w-4 text-green-400" />
            <span className="text-gray-400">
              <span className="text-white font-semibold">{formatNumber(lead.followingCount)}</span> following
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-800 pt-4">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-purple-400 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {lead.email}
            </a>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Phone className="h-4 w-4" />
              {lead.phone}
              {areaCode && (
                <Badge variant="outline" className="ml-auto text-xs border-gray-700 text-gray-400">
                  <MapPin className="h-3 w-3 mr-1" />
                  {areaCode}
                </Badge>
              )}
            </div>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-purple-400 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {lead.website}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}