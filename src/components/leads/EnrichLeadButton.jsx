import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';

export default function EnrichLeadButton({ lead, onEnriched }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const enrich = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    try {
      const res = await base44.functions.invoke('aiLeadAssistant', {
        action: 'enrich',
        lead: {
          username: lead.username,
          name: lead.name,
          bio: lead.bio,
          category: lead.category,
          followerCount: lead.followerCount,
          website: lead.website,
          email: lead.email,
          phone: lead.phone,
        }
      });
      const enriched = res.data?.enriched;
      if (enriched) {
        // Only update fields that were empty
        const updates = {};
        const fields = ['bio', 'category', 'followerCount', 'followingCount', 'website', 'email', 'phone', 'tag'];
        for (const f of fields) {
          if (!lead[f] && enriched[f]) updates[f] = enriched[f];
        }
        if (Object.keys(updates).length > 0) {
          await base44.entities.Lead.update(lead.id, updates);
          onEnriched?.();
        }
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={enrich}
      disabled={loading}
      title="AI Enrich this lead"
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: done ? 'rgba(46,204,113,0.15)' : 'rgba(248,212,23,0.1)',
        color: done ? '#2ecc71' : '#f8d417',
        border: `1px solid ${done ? 'rgba(46,204,113,0.3)' : 'rgba(248,212,23,0.3)'}`,
        whiteSpace: 'nowrap'
      }}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : done ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {done ? 'Enriched!' : 'AI Enrich'}
    </button>
  );
}