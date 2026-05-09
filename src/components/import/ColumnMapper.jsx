import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

const LEAD_FIELDS = [
  { key: 'username', label: 'Username', required: false },
  { key: 'name', label: 'Full Name', required: false },
  { key: 'bio', label: 'Bio / Description', required: false },
  { key: 'category', label: 'Category / Niche', required: false },
  { key: 'email', label: 'Email', required: false, validated: true },
  { key: 'phone', label: 'Phone', required: false, validated: true },
  { key: 'website', label: 'Website / URL', required: false },
  { key: 'followerCount', label: 'Follower Count', required: false, numeric: true },
  { key: 'followingCount', label: 'Following Count', required: false, numeric: true },
  { key: 'tag', label: 'Tag / Label', required: false },
  { key: 'status', label: 'Pipeline Status', required: false },
  { key: '__skip__', label: '— Skip this column —', required: false },
];

const AUTO_MAP = {
  username: /user(name)?$/i,
  name: /^(full)?name$/i,
  bio: /bio|description|about/i,
  category: /categor|niche|type|industry/i,
  email: /e?mail/i,
  phone: /phone|tel|mobile|contact/i,
  website: /website|url|link/i,
  followerCount: /follower(?!ing)/i,
  followingCount: /following/i,
  tag: /tag|label/i,
  status: /status|stage/i,
};

function autoDetect(header) {
  const clean = header.toLowerCase().replace(/[_\s-]/g, '');
  for (const [field, regex] of Object.entries(AUTO_MAP)) {
    if (regex.test(clean)) return field;
  }
  return '__skip__';
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
const isValidPhone = (v) => {
  const d = String(v).replace(/\D/g, '');
  return d.length >= 10 && d.length <= 15;
};

export default function ColumnMapper({ csvHeaders, sampleRows, onConfirm, onBack }) {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    const auto = {};
    csvHeaders.forEach(h => { auto[h] = autoDetect(h); });
    setMapping(auto);
  }, [csvHeaders]);

  const setMap = (col, field) => setMapping(m => ({ ...m, [col]: field }));

  const reset = () => {
    const auto = {};
    csvHeaders.forEach(h => { auto[h] = autoDetect(h); });
    setMapping(auto);
  };

  // Validation preview on sample data
  const validationIssues = {};
  csvHeaders.forEach((col, colIdx) => {
    const field = mapping[col];
    if (field === 'email' || field === 'phone') {
      const samples = sampleRows.map(r => r[colIdx]).filter(Boolean);
      const invalid = samples.filter(v => field === 'email' ? !isValidEmail(v) : !isValidPhone(v));
      if (invalid.length > 0) validationIssues[col] = `${invalid.length} of ${samples.length} sample values invalid`;
    }
  });

  const mappedCount = Object.values(mapping).filter(v => v && v !== '__skip__').length;
  const hasAtLeastOne = Object.values(mapping).some(v => v === 'username' || v === 'email');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Map Your Columns</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{mappedCount} of {csvHeaders.length} columns mapped · {sampleRows.length} sample rows loaded</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3a4a' }}>
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold" style={{ background: '#071a2c', color: '#9ea7b5', borderBottom: '1px solid #1a2a3a' }}>
          <div className="col-span-3">CSV Column</div>
          <div className="col-span-1 text-center">→</div>
          <div className="col-span-4">Lead Field</div>
          <div className="col-span-4">Sample Values</div>
        </div>

        <div className="divide-y" style={{ divideColor: '#1a2a3a' }}>
          {csvHeaders.map((col, colIdx) => {
            const field = mapping[col];
            const samples = sampleRows.slice(0, 3).map(r => r[colIdx]).filter(Boolean);
            const issue = validationIssues[col];
            const isSkipped = field === '__skip__';
            const fieldDef = LEAD_FIELDS.find(f => f.key === field);

            return (
              <div key={col} className="grid grid-cols-12 px-4 py-2.5 items-center gap-2"
                style={{ background: isSkipped ? 'rgba(0,0,0,0.2)' : 'transparent', opacity: isSkipped ? 0.5 : 1 }}>
                <div className="col-span-3">
                  <p className="text-xs font-semibold truncate" style={{ color: '#d7dde5' }}>{col}</p>
                  {issue && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" style={{ color: '#f66c25' }} />
                      <p className="text-[10px]" style={{ color: '#f66c25' }}>{issue}</p>
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-center">
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: isSkipped ? '#3a4a5a' : '#4acbbf' }} />
                </div>
                <div className="col-span-4">
                  <select
                    value={field || '__skip__'}
                    onChange={e => setMap(col, e.target.value)}
                    className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ background: '#071a2c', color: isSkipped ? '#5e6a78' : '#fff', border: `1px solid ${issue ? '#f66c25' : isSkipped ? '#1a2a3a' : '#4acbbf'}` }}>
                    {LEAD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <div className="flex flex-wrap gap-1">
                    {samples.slice(0, 2).map((s, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded truncate max-w-[100px]"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#9ea7b5' }} title={s}>
                        {String(s).slice(0, 18)}{String(s).length > 18 ? '…' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasAtLeastOne && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(246,108,37,0.1)', border: '1px solid #f66c25', color: '#f66c25' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Map at least one identifier column (Username or Email) to proceed.
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>
          ← Back
        </Button>
        <Button
          onClick={() => onConfirm(mapping)}
          disabled={!hasAtLeastOne}
          className="flex-1 font-bold"
          style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929', opacity: !hasAtLeastOne ? 0.5 : 1 }}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm & Import
        </Button>
      </div>
    </div>
  );
}