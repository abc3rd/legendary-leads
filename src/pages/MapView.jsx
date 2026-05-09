import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Loader2, MapPin, Users, Filter } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import useLeadClusters from '../hooks/useLeadClusters';

const STATUS_COLORS = {
  new: '#4acbbf',
  cold_outreach: '#54b0e7',
  contacted: '#f8d417',
  qualified: '#f66c25',
  in_negotiation: '#9b59b6',
  converted: '#2ecc71',
  unresponsive: '#5e6a78',
};

const ALL_STATUSES = Object.keys(STATUS_COLORS);

// US area code → approximate lat/lng
const AREA_CODE_GEO = {
  '212': [40.7128, -74.006],  '213': [34.0522, -118.2437], '214': [32.7767, -96.797],
  '305': [25.7617, -80.1918], '310': [33.9425, -118.4081], '312': [41.8781, -87.6298],
  '404': [33.749, -84.388],   '415': [37.7749, -122.4194], '469': [32.7767, -96.797],
  '512': [30.2672, -97.7431], '602': [33.4484, -112.074],  '617': [42.3601, -71.0589],
  '702': [36.1699, -115.1398],'713': [29.7604, -95.3698],  '718': [40.6501, -73.9496],
  '720': [39.7392, -104.9903],'786': [25.7617, -80.1918],  '818': [34.1975, -118.6048],
  '832': [29.7604, -95.3698], '858': [32.7157, -117.1611], '917': [40.7128, -74.006],
  '929': [40.7128, -74.006],  '949': [33.6595, -117.9988], '954': [26.1224, -80.1373],
};

function getLatLngFromLead(lead) {
  if (!lead.phone) return null;
  const digits = lead.phone.replace(/\D/g, '');
  const areaCode = digits.slice(0, 3);
  const geo = AREA_CODE_GEO[areaCode];
  if (!geo) return null;
  // Add small jitter so markers don't perfectly overlap
  return [geo[0] + (Math.random() - 0.5) * 0.15, geo[1] + (Math.random() - 0.5) * 0.15];
}

function ClusterPopup({ cluster }) {
  return (
    <div style={{ minWidth: 160 }}>
      <p className="font-bold text-sm mb-1" style={{ color: '#0a1929' }}>
        {cluster.leads.length} Leads in Area
      </p>
      <div className="space-y-0.5 max-h-32 overflow-y-auto">
        {cluster.leads.map(l => (
          <div key={l.id} className="flex items-center gap-1 text-xs">
            <span style={{ color: STATUS_COLORS[l.status] || '#888', fontSize: 8 }}>●</span>
            <span>{l.name || l.username || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapView() {
  const [activeStatuses, setActiveStatuses] = useState(new Set(ALL_STATUSES));

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-map'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  // Attach lat/lng to leads
  const geoLeads = useMemo(() => {
    return leads
      .filter(l => activeStatuses.has(l.status))
      .map(l => ({ ...l, _latlng: getLatLngFromLead(l) }))
      .filter(l => l._latlng);
  }, [leads, activeStatuses]);

  const clusters = useLeadClusters(geoLeads);

  const toggleStatus = (s) => {
    setActiveStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); }
      else next.add(s);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1929' }}>
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#4acbbf' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-7 w-7" style={{ color: '#ea00ea' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Lead Map</h1>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>{geoLeads.length} leads with location data · {clusters.length} clusters</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(74,203,191,0.2)' }}>
          <div className="flex items-center gap-1 mr-2">
            <Filter className="h-3.5 w-3.5" style={{ color: '#9ea7b5' }} />
            <span className="text-xs font-semibold" style={{ color: '#9ea7b5' }}>Filter by Status:</span>
          </div>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeStatuses.has(s) ? STATUS_COLORS[s] + '22' : 'transparent',
                color: activeStatuses.has(s) ? STATUS_COLORS[s] : '#5e6a78',
                border: `1px solid ${activeStatuses.has(s) ? STATUS_COLORS[s] : '#2a3a4a'}`,
              }}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden" style={{ height: 520, border: '2px solid rgba(74,203,191,0.3)' }}>
          {geoLeads.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center" style={{ background: '#071a2c' }}>
              <MapPin className="h-12 w-12 mb-3" style={{ color: '#4acbbf', opacity: 0.4 }} />
              <p style={{ color: '#9ea7b5' }}>No leads with location data for selected statuses.</p>
              <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>Leads need a phone number with a US area code to appear on the map.</p>
            </div>
          ) : (
            <MapContainer
              center={[37.5, -96]}
              zoom={4}
              style={{ height: '100%', width: '100%', background: '#0d1b2a' }}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {clusters.map((cluster, idx) => {
                const isSingle = cluster.leads.length === 1;
                const lead = cluster.leads[0];
                const color = isSingle ? (STATUS_COLORS[lead.status] || '#4acbbf') : '#ea00ea';
                return (
                  <CircleMarker
                    key={idx}
                    center={cluster.center}
                    radius={isSingle ? 8 : Math.min(8 + cluster.leads.length * 2, 28)}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.85,
                      color: '#fff',
                      weight: isSingle ? 1.5 : 2,
                    }}
                  >
                    <Popup>
                      {isSingle ? (
                        <div style={{ minWidth: 140 }}>
                          <p className="font-bold text-sm" style={{ color: '#0a1929' }}>{lead.name || lead.username}</p>
                          <p className="text-xs" style={{ color: STATUS_COLORS[lead.status] }}>
                            {lead.status?.replace(/_/g, ' ')}
                          </p>
                          {lead.email && <p className="text-xs mt-0.5">{lead.email}</p>}
                          {lead.phone && <p className="text-xs">{lead.phone}</p>}
                          {lead.followerCount && (
                            <p className="text-xs mt-1" style={{ color: '#555' }}>
                              <Users className="inline h-3 w-3 mr-0.5" />{lead.followerCount.toLocaleString()} followers
                            </p>
                          )}
                        </div>
                      ) : (
                        <ClusterPopup cluster={cluster} />
                      )}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {ALL_STATUSES.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs" style={{ color: '#9ea7b5' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block' }} />
              {s.replace(/_/g, ' ')}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9ea7b5' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea00ea', display: 'inline-block' }} />
            cluster
          </div>
        </div>
      </div>
    </div>
  );
}