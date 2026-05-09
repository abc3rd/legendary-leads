import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOnboarding } from '@/components/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ColumnMapper from '../components/import/ColumnMapper';

// ─── Validators ──────────────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return phone.trim();
};

// ─── CSV Helpers ──────────────────────────────────────────────────────────────
async function* readLines(file) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) { if (buffer.trim()) yield buffer; break; }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) { if (line.trim()) yield line; }
  }
}

function parseRow(line) {
  const values = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; }
    else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
    else { current += char; }
  }
  values.push(current);
  return values.map(v => v.trim().replace(/^["']|["']$/g, ''));
}

const STEPS = ['Upload', 'Map Columns', 'Import'];

export default function Import() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const { markChecked } = useOnboarding();

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.endsWith('.csv') || f.type === 'text/csv');
    if (!selected.length) { toast.error('Please select a valid CSV file'); return; }

    setFiles(selected);
    setStats(null);
    setProgress(null);

    // Parse first file headers + sample rows for mapping step
    const file = selected[0];
    const lines = [];
    for await (const line of readLines(file)) {
      lines.push(line);
      if (lines.length > 6) break;
    }
    if (lines.length > 0) {
      const headers = parseRow(lines[0]);
      const samples = lines.slice(1).map(l => parseRow(l));
      setCsvHeaders(headers);
      setSampleRows(samples);
    }
    setStep(1);
  };

  const handleConfirmMapping = (confirmedMapping) => {
    setMapping(confirmedMapping);
    setStep(2);
    handleImport(confirmedMapping);
  };

  const handleImport = async (confirmedMapping) => {
    setIsImporting(true);
    setStats(null);

    let totalParsed = 0, totalImported = 0, totalSkipped = 0, invalidEmails = 0, invalidPhones = 0;
    const CHUNK_SIZE = 200;

    try {
      for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi];
        setProgress({ status: 'processing', message: `Reading ${file.name}…` });

        let headersParsed = false;
        let chunk = [];

        const flushChunk = async () => {
          if (!chunk.length) return;
          await base44.entities.Lead.bulkCreate(chunk);
          totalImported += chunk.length;
          chunk = [];
          setProgress({ status: 'importing', message: `Imported ${totalImported.toLocaleString()} leads…` });
        };

        for await (const line of readLines(file)) {
          if (!headersParsed) { headersParsed = true; continue; } // skip header row

          totalParsed++;
          const values = parseRow(line);
          const row = {};

          csvHeaders.forEach((col, idx) => {
            const field = confirmedMapping[col];
            if (!field || field === '__skip__') return;
            const raw = (values[idx] || '').trim();
            if (!raw) return;

            if (field === 'followerCount' || field === 'followingCount') {
              const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(n)) row[field] = n;
            } else if (field === 'email') {
              if (isValidEmail(raw)) row.email = raw.toLowerCase();
              else invalidEmails++;
            } else if (field === 'phone') {
              const normalized = normalizePhone(raw);
              if (normalized) row.phone = normalized;
              else invalidPhones++;
            } else {
              row[field] = raw;
            }
          });

          if (!row.username && !row.email) { totalSkipped++; continue; }
          chunk.push(row);
          if (chunk.length >= CHUNK_SIZE) await flushChunk();
        }
        await flushChunk();
      }

      const finalStats = { totalParsed, totalImported, totalSkipped, invalidEmails, invalidPhones };
      setStats(finalStats);
      setProgress({ status: 'success', message: `Done! Imported ${totalImported.toLocaleString()} leads.` });
      toast.success(`Imported ${totalImported.toLocaleString()} leads!`);
      if (totalImported > 0) markChecked('importLeads');
    } catch (error) {
      setProgress({ status: 'error', message: error.message || 'Import failed' });
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => { setStep(0); setFiles([]); setCsvHeaders([]); setSampleRows([]); setMapping({}); setStats(null); setProgress(null); };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6" style={{ color: '#9ea7b5' }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <div className="rounded-2xl shadow-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '2px solid #4acbbf' }}>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Import Wizard</h1>
          <p className="mb-6 text-sm" style={{ color: '#9ea7b5' }}>Upload CSV → Map columns → Validate & import</p>

          {/* Step indicators */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: step >= i ? '#4acbbf' : '#1a2a3a', color: step >= i ? '#0a1929' : '#5e6a78' }}>
                    {step > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: step >= i ? '#4acbbf' : '#5e6a78' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px mx-3" style={{ background: step > i ? '#4acbbf' : '#1a2a3a' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Upload */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(74,203,191,0.1)', border: '1px solid #4acbbf' }}>
                <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: '#4acbbf' }} />
                <span style={{ color: '#d7dde5' }}><strong style={{ color: '#4acbbf' }}>Email & phone validated</strong> — invalid entries are skipped & counted</span>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(84,176,231,0.07)', border: '1px solid rgba(84,176,231,0.3)' }}>
                <h3 className="font-semibold mb-2 text-sm" style={{ color: '#54b0e7' }}>Supported Fields</h3>
                <div className="rounded-lg p-3 font-mono text-xs overflow-x-auto" style={{ background: '#071a2c', color: '#d7dde5' }}>
                  username, name, bio, category, website, followerCount, followingCount, email, phone, tag, status
                </div>
                <p className="text-xs mt-2" style={{ color: '#9ea7b5' }}>Column names are flexible — you'll map them in the next step.</p>
              </div>

              <div className="rounded-xl p-10 text-center transition-all" style={{ border: '2px dashed #5e6a78' }}>
                <input type="file" accept=".csv,text/csv" onChange={handleFileChange}
                  className="hidden" id="csv-upload" multiple />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)' }}>
                    <Upload className="h-7 w-7" style={{ color: '#0a1929' }} />
                  </div>
                  <p className="font-semibold" style={{ color: '#ffffff' }}>Click to upload CSV files</p>
                  <p className="text-sm" style={{ color: '#9ea7b5' }}>Column mapping wizard included</p>
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Map Columns */}
          {step === 1 && (
            <ColumnMapper
              csvHeaders={csvHeaders}
              sampleRows={sampleRows}
              onConfirm={handleConfirmMapping}
              onBack={reset}
            />
          )}

          {/* Step 2: Import Progress */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5" style={{ color: '#4acbbf' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#fff' }}>{files[0]?.name}</p>
                  <p className="text-xs" style={{ color: '#9ea7b5' }}>{files.length} file(s) · {csvHeaders.length} columns · {Object.values(mapping).filter(v => v && v !== '__skip__').length} mapped</p>
                </div>
              </div>

              {progress && (
                <div className="rounded-xl p-4 flex items-center gap-3" style={{
                  background: progress.status === 'success' ? 'rgba(46,204,113,0.1)' : progress.status === 'error' ? 'rgba(192,57,43,0.1)' : 'rgba(84,176,231,0.1)',
                  border: `1px solid ${progress.status === 'success' ? '#2ecc71' : progress.status === 'error' ? '#c0392b' : '#54b0e7'}`
                }}>
                  {progress.status === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#2ecc71' }} />
                    : progress.status === 'error' ? <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#c0392b' }} />
                    : <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" style={{ color: '#54b0e7' }} />}
                  <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{progress.message}</p>
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Rows Parsed', value: stats.totalParsed.toLocaleString(), color: '#54b0e7' },
                    { label: 'Imported', value: stats.totalImported.toLocaleString(), color: '#4acbbf' },
                    { label: 'Skipped', value: stats.totalSkipped.toLocaleString(), color: '#f8d417' },
                    { label: 'Invalid Emails', value: stats.invalidEmails.toLocaleString(), color: '#f66c25' },
                    { label: 'Invalid Phones', value: stats.invalidPhones.toLocaleString(), color: '#f66c25' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(10,25,41,0.8)', border: `1px solid ${s.color}30` }}>
                      <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {progress?.status === 'success' && (
                <Button onClick={reset} className="w-full font-bold"
                  style={{ background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)', color: '#0a1929' }}>
                  Import Another File
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}