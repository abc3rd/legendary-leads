import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['new', 'cold_outreach', 'contacted', 'qualified', 'in_negotiation', 'converted', 'unresponsive'];
const SORT_OPTIONS = [
  { value: 'created_date_desc', label: 'Newest First' },
  { value: 'created_date_asc', label: 'Oldest First' },
  { value: 'followerCount_desc', label: 'Most Followers' },
  { value: 'followerCount_asc', label: 'Fewest Followers' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function FilterDrawer({ open, onClose, filters, onChange, categories, tags }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const reset = () => {
    onChange({
      category: '', tag: '', status: '',
      hasEmail: false, hasPhone: false,
      minFollowers: '', maxFollowers: '',
      sortBy: 'created_date_desc',
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
              border: '2px solid rgba(74,203,191,0.3)',
              borderBottom: 'none',
              maxHeight: '88vh',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)'
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#5e6a78' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(74,203,191,0.2)' }}>
              <h2 className="text-lg font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Filters & Sort</h2>
              <div className="flex items-center gap-3">
                <button onClick={reset} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f66c25', background: 'rgba(246,108,37,0.1)' }}>
                  Clear all
                </button>
                <button onClick={onClose} style={{ color: '#9ea7b5' }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5" style={{ maxHeight: 'calc(88vh - 90px)' }}>
              {/* Sort By */}
              <Section label="Sort By">
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map(opt => (
                    <PillBtn key={opt.value} active={filters.sortBy === opt.value} onClick={() => set('sortBy', opt.value)} color="#4acbbf">
                      {opt.label}
                    </PillBtn>
                  ))}
                </div>
              </Section>

              {/* Status */}
              <Section label="Status">
                <div className="flex flex-wrap gap-2">
                  <PillBtn active={!filters.status} onClick={() => set('status', '')} color="#9ea7b5">All</PillBtn>
                  {STATUSES.map(s => (
                    <PillBtn key={s} active={filters.status === s} onClick={() => set('status', s)} color="#4acbbf">
                      {s.replace(/_/g, ' ')}
                    </PillBtn>
                  ))}
                </div>
              </Section>

              {/* Category */}
              {categories.length > 0 && (
                <Section label="Category">
                  <div className="flex flex-wrap gap-2">
                    <PillBtn active={!filters.category} onClick={() => set('category', '')} color="#9ea7b5">All</PillBtn>
                    {categories.map(c => (
                      <PillBtn key={c} active={filters.category === c} onClick={() => set('category', c)} color="#54b0e7">{c}</PillBtn>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <Section label="Tag">
                  <div className="flex flex-wrap gap-2">
                    <PillBtn active={!filters.tag} onClick={() => set('tag', '')} color="#9ea7b5">All</PillBtn>
                    {tags.map(t => (
                      <PillBtn key={t} active={filters.tag === t} onClick={() => set('tag', t)} color="#f66c25">{t}</PillBtn>
                    ))}
                  </div>
                </Section>
              )}

              {/* Followers */}
              <Section label="Follower Range">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#9ea7b5' }}>Min</label>
                    <Input type="number" placeholder="e.g. 10000" value={filters.minFollowers}
                      onChange={e => set('minFollowers', e.target.value)}
                      style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#fff' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#9ea7b5' }}>Max</label>
                    <Input type="number" placeholder="e.g. 500000" value={filters.maxFollowers}
                      onChange={e => set('maxFollowers', e.target.value)}
                      style={{ background: '#071a2c', borderColor: '#4acbbf', color: '#fff' }} />
                  </div>
                </div>
              </Section>

              {/* Contact toggles */}
              <Section label="Contact Info">
                <div className="flex gap-3">
                  <PillBtn active={filters.hasEmail} onClick={() => set('hasEmail', !filters.hasEmail)} color="#4acbbf">
                    ✉ Has Email
                  </PillBtn>
                  <PillBtn active={filters.hasPhone} onClick={() => set('hasPhone', !filters.hasPhone)} color="#54b0e7">
                    📞 Has Phone
                  </PillBtn>
                </div>
              </Section>
            </div>

            <div className="px-5 pb-3 pt-2 border-t" style={{ borderColor: 'rgba(74,203,191,0.2)' }}>
              <Button onClick={onClose} className="w-full font-semibold py-6"
                style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
                Apply Filters <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9ea7b5' }}>{label}</p>
      {children}
    </div>
  );
}

function PillBtn({ active, onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? `${color}25` : 'transparent',
        border: `1.5px solid ${active ? color : '#5e6a78'}`,
        color: active ? color : '#9ea7b5'
      }}
    >
      {children}
    </button>
  );
}