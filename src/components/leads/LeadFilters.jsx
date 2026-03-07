import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import FilterDrawer from './FilterDrawer';

const STATUSES = ['new', 'cold_outreach', 'contacted', 'qualified', 'in_negotiation', 'converted', 'unresponsive'];
const SORT_OPTIONS = [
  { value: 'created_date_desc', label: 'Newest First' },
  { value: 'created_date_asc', label: 'Oldest First' },
  { value: 'followerCount_desc', label: 'Most Followers' },
  { value: 'followerCount_asc', label: 'Fewest Followers' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function LeadFilters({ filters, onChange, categories, tags, totalCount, filteredCount }) {
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const set = (key, value) => onChange({ ...filters, [key]: value });

  const activeCount = [
    filters.category,
    filters.tag,
    filters.status,
    filters.hasEmail,
    filters.hasPhone,
    filters.minFollowers,
    filters.maxFollowers,
  ].filter(Boolean).length;

  const reset = () => onChange({
    category: '',
    tag: '',
    status: '',
    hasEmail: false,
    hasPhone: false,
    minFollowers: '',
    maxFollowers: '',
    sortBy: 'created_date_desc',
  });

  return (
    <>
    {/* Mobile: single button opens bottom drawer */}
    <div className="sm:hidden mb-4">
      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: 'rgba(10,25,41,0.8)', border: '2px solid #4acbbf' }}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: '#4acbbf' }} />
          <span className="font-semibold text-sm" style={{ color: '#f8d417' }}>Filters & Sort</span>
          {activeCount > 0 && (
            <Badge className="text-xs px-2 py-0.5" style={{ background: '#f66c25', color: '#fff', borderRadius: '999px' }}>
              {activeCount}
            </Badge>
          )}
        </div>
        <span className="text-xs" style={{ color: '#9ea7b5' }}>{filteredCount} / {totalCount}</span>
      </button>
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={onChange}
        categories={categories}
        tags={tags}
      />
    </div>

    {/* Desktop: existing inline filters */}
    <div className="hidden sm:block rounded-xl mb-4" style={{ background: 'rgba(10,25,41,0.8)', border: '2px solid #4acbbf' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: '#4acbbf' }} />
          <span className="font-semibold text-sm" style={{ color: '#f8d417' }}>
            Filters &amp; Sort
          </span>
          {activeCount > 0 && (
            <Badge className="text-xs px-2 py-0.5" style={{ background: '#f66c25', color: '#fff', borderRadius: '999px' }}>
              {activeCount}
            </Badge>
          )}
          <span className="text-xs ml-2" style={{ color: '#9ea7b5' }}>
            {filteredCount} / {totalCount} leads
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: '#f66c25', background: 'rgba(246,108,37,0.1)' }}
            >
              Clear all
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4" style={{ color: '#9ea7b5' }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: '#9ea7b5' }} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(74,203,191,0.3)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">

            {/* Sort */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={e => set('sortBy', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Category</label>
              <select
                value={filters.category}
                onChange={e => set('category', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Status</label>
              <select
                value={filters.status}
                onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            {/* Follower Range */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Min Followers</label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={filters.minFollowers}
                onChange={e => set('minFollowers', e.target.value)}
                className="text-sm placeholder:text-gray-600"
                style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#fff' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Max Followers</label>
              <Input
                type="number"
                placeholder="e.g. 500000"
                value={filters.maxFollowers}
                onChange={e => set('maxFollowers', e.target.value)}
                className="text-sm placeholder:text-gray-600"
                style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#fff' }}
              />
            </div>

            {/* Tag */}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ea7b5' }}>Tag</label>
              <select
                value={filters.tag}
                onChange={e => set('tag', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#071a2c', color: '#fff', border: '1px solid #4acbbf' }}
              >
                <option value="">All Tags</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => set('hasEmail', !filters.hasEmail)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filters.hasEmail ? '#4acbbf' : 'rgba(74,203,191,0.1)',
                color: filters.hasEmail ? '#0a1929' : '#4acbbf',
                border: '1px solid #4acbbf'
              }}
            >
              ✉ Has Email
            </button>
            <button
              onClick={() => set('hasPhone', !filters.hasPhone)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filters.hasPhone ? '#54b0e7' : 'rgba(84,176,231,0.1)',
                color: filters.hasPhone ? '#0a1929' : '#54b0e7',
                border: '1px solid #54b0e7'
              }}
            >
              📞 Has Phone
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}