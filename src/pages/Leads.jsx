import React, { useState, useMemo, useEffect, useCallback } from 'react';;
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react';
import PullToRefresh from '../components/ui/PullToRefresh';
import LeadCard from '../components/leads/LeadCard';
import LeadFilters from '../components/leads/LeadFilters';
import AILeadAssistant from '../components/leads/AILeadAssistant';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/components/hooks/useOnboarding';

const DEFAULT_FILTERS = {
  category: '',
  tag: '',
  status: '',
  hasEmail: false,
  hasPhone: false,
  minFollowers: '',
  maxFollowers: '',
  sortBy: 'created_date_desc',
};

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const queryClient = useQueryClient();
  const { markChecked } = useOnboarding();

  // Mark "viewLeads" step as done when user lands here
  useEffect(() => { markChecked('viewLeads'); }, []);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);

  // Derive unique categories and tags from data
  const categories = useMemo(() => {
    const set = new Set(leads.map(l => l.category).filter(Boolean));
    return [...set].sort();
  }, [leads]);

  const tags = useMemo(() => {
    const set = new Set(leads.map(l => l.tag).filter(Boolean));
    return [...set].sort();
  }, [leads]);

  const processedLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // Text search
      const search = searchTerm.toLowerCase();
      if (search) {
        const matches = (
          lead.username?.toLowerCase().includes(search) ||
          lead.name?.toLowerCase().includes(search) ||
          lead.bio?.toLowerCase().includes(search) ||
          lead.category?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search) ||
          lead.tag?.toLowerCase().includes(search)
        );
        if (!matches) return false;
      }

      // Category
      if (filters.category && lead.category !== filters.category) return false;

      // Tag
      if (filters.tag && lead.tag !== filters.tag) return false;

      // Status
      if (filters.status && lead.status !== filters.status) return false;

      // Has email
      if (filters.hasEmail && !lead.email) return false;

      // Has phone
      if (filters.hasPhone && !lead.phone) return false;

      // Min followers
      if (filters.minFollowers !== '' && (lead.followerCount ?? 0) < Number(filters.minFollowers)) return false;

      // Max followers
      if (filters.maxFollowers !== '' && (lead.followerCount ?? 0) > Number(filters.maxFollowers)) return false;

      return true;
    });

    // Sorting
    const [field, direction] = filters.sortBy.split('_').reduce((acc, part, i, arr) => {
      if (i === arr.length - 1) {
        return [arr.slice(0, -1).join('_'), part];
      }
      return acc;
    }, ['created_date', 'desc']);

    // Map sort field names
    const fieldMap = {
      created_date: 'created_date',
      followerCount: 'followerCount',
      name: 'name',
    };

    const sortField = fieldMap[field] || 'created_date';
    const dir = direction === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      const av = a[sortField] ?? (typeof a[sortField] === 'number' ? 0 : '');
      const bv = b[sortField] ?? (typeof b[sortField] === 'number' ? 0 : '');
      if (typeof av === 'number' || typeof bv === 'number') {
        return ((av || 0) - (bv || 0)) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });

    return result;
  }, [leads, searchTerm, filters]);

  const exportToCSV = () => {
    const headers = ['username', 'name', 'bio', 'category', 'website', 'followerCount', 'followingCount', 'email', 'phone', 'tag', 'status'];
    const csvContent = [
      headers.join(','),
      ...processedLeads.map(lead =>
        headers.map(h => `"${lead[h] ?? ''}"`).join(',')
      )
    ].join('\n');

    markChecked('exportCSV');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legendary-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>
                All Leads
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>
                {isLoading ? 'Loading...' : `${processedLeads.length} of ${leads.length} leads`}
              </p>
            </div>
          </div>

          <Button
            onClick={exportToCSV}
            disabled={processedLeads.length === 0}
            className="font-semibold"
            style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9ea7b5' }} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, name, bio, category, email, or tag..."
              className="pl-10 text-sm placeholder:text-gray-600"
              style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#ffffff' }}
            />
          </div>
        </div>

        {/* AI Lead Assistant */}
        <AILeadAssistant
          onLeadsCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            markChecked('useAI');
          }}
        />

        {/* Filters */}
        <LeadFilters
          filters={filters}
          onChange={setFilters}
          categories={categories}
          tags={tags}
          totalCount={leads.length}
          filteredCount={processedLeads.length}
        />

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#4acbbf' }} />
          </div>
        ) : processedLeads.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-lg" style={{ color: '#9ea7b5' }}>
              {searchTerm || Object.values(filters).some(Boolean)
                ? 'No leads match your filters'
                : 'No leads imported yet'}
            </p>
            {!searchTerm && (
              <Link to={createPageUrl('Import')}>
                <Button className="mt-4 font-semibold"
                  style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
                  Import Leads
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {processedLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onEnriched={() => queryClient.invalidateQueries({ queryKey: ['leads'] })} />
            ))}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}