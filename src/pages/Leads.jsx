import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react';
import LeadCard from '../components/leads/LeadCard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    return (
      lead.username?.toLowerCase().includes(search) ||
      lead.name?.toLowerCase().includes(search) ||
      lead.bio?.toLowerCase().includes(search) ||
      lead.category?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search)
    );
  });

  const exportToCSV = () => {
    const headers = ['username', 'name', 'bio', 'category', 'website', 'followerCount', 'followingCount', 'email', 'phone'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => 
        headers.map(h => `"${lead[h] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legendary-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">All Leads</h1>
              <p className="text-gray-400 mt-1">
                {isLoading ? 'Loading...' : `${filteredLeads.length} leads found`}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, name, bio, category, or email..."
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No leads match your search' : 'No leads imported yet'}
            </p>
            {!searchTerm && (
              <Link to={createPageUrl('Import')}>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600">
                  Import Leads
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}