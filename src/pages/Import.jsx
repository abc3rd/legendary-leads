import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOnboarding } from '@/components/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// ─── Validators ─────────────────────────────────────────────────────────────
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  // Valid: 10–15 digits (E.164 range)
  if (digits.length < 10 || digits.length > 15) return null;
  return phone.trim();
};

// ─── Streaming line reader ───────────────────────────────────────────────────
async function* readLines(file) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) yield buffer;
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) yield line;
    }
  }
}

// ─── CSV row parser (handles quotes) ────────────────────────────────────────
function parseRow(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

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

// ─── Map header → field name ─────────────────────────────────────────────────
function mapHeader(h) {
  const k = h.toLowerCase().replace(/[_\s-]/g, '');
  if (k.match(/user(name)?$/)) return 'username';
  if (k.match(/^(full)?name$/)) return 'name';
  if (k.match(/bio|description|about/)) return 'bio';
  if (k.match(/categor|niche|type|industry/)) return 'category';
  if (k.match(/website|url|link/)) return 'website';
  if (k.match(/follower(?!ing)/)) return 'followerCount';
  if (k.match(/following/)) return 'followingCount';
  if (k.match(/e?mail/)) return 'email';
  if (k.match(/phone|tel|mobile|contact/)) return 'phone';
  if (k.match(/tag|label/)) return 'tag';
  if (k.match(/status|stage/)) return 'status';
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Import() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const { markChecked } = useOnboarding();

  React.useEffect(() => {
    base44.auth.me().catch(() => toast.error('Please log in to import leads'));
  }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(f =>
      f.name.endsWith('.csv') || f.type === 'text/csv'
    );
    if (selected.length > 0) { setFiles(selected); setProgress(null); setStats(null); }
    else toast.error('Please select valid CSV files');
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setStats(null);

    let totalParsed = 0;
    let totalImported = 0;
    let totalSkipped = 0;
    let invalidEmails = 0;
    let invalidPhones = 0;

    const CHUNK_SIZE = 200;

    try {
      for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi];
        setProgress({ status: 'processing', message: `Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...` });

        let headers = null;
        let chunk = [];

        const flushChunk = async () => {
          if (chunk.length === 0) return;
          await base44.entities.Lead.bulkCreate(chunk);
          totalImported += chunk.length;
          chunk = [];
          setProgress({
            status: 'importing',
            message: `Imported ${totalImported.toLocaleString()} leads... (file ${fi + 1}/${files.length})`
          });
        };

        for await (const line of readLines(file)) {
          if (!headers) {
            headers = parseRow(line).map(mapHeader);
            continue;
          }

          totalParsed++;
          const values = parseRow(line);
          const row = {};

          headers.forEach((field, idx) => {
            if (!field) return;
            const raw = (values[idx] || '').trim();
            if (!raw) return;

            if (field === 'followerCount' || field === 'followingCount') {
              const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(n)) row[field] = n;
            } else if (field === 'email') {
              if (isValidEmail(raw)) { row.email = raw.toLowerCase(); }
              else { invalidEmails++; }
            } else if (field === 'phone') {
              const normalized = normalizePhone(raw);
              if (normalized) { row.phone = normalized; }
              else { invalidPhones++; }
            } else {
              row[field] = raw;
            }
          });

          if (!row.username && !row.email) { totalSkipped++; continue; }

          chunk.push(row);
          if (chunk.length >= CHUNK_SIZE) await flushChunk();
        }

        await flushChunk(); // Final flush
      }

      const finalStats = { totalParsed, totalImported, totalSkipped, invalidEmails, invalidPhones };
      setStats(finalStats);
      setProgress({ status: 'success', message: `Done! Imported ${totalImported.toLocaleString()} leads.` });
      toast.success(`Imported ${totalImported.toLocaleString()} leads!`);
      if (totalImported > 0) markChecked('importLeads');
      setFiles([]);
    } catch (error) {
      console.error('Import error:', error);
      setProgress({ status: 'error', message: error.message || 'Import failed' });
      toast.error('Import failed. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6" style={{ color: '#9ea7b5' }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="rounded-2xl shadow-2xl p-6 sm:p-8" style={{
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          border: '2px solid #4acbbf'
        }}>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Import Leads</h1>
          <p className="mb-6 text-sm" style={{ color: '#9ea7b5' }}>
            Upload large CSV files — streamed line-by-line for memory efficiency. Supports millions of rows.
          </p>

          {/* Validation badge */}
          <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl text-sm" style={{
            background: 'rgba(74,203,191,0.1)', border: '1px solid #4acbbf'
          }}>
            <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: '#4acbbf' }} />
            <span style={{ color: '#d7dde5' }}>
              <strong style={{ color: '#4acbbf' }}>Email & phone validated</strong> on upload — invalid entries are skipped &amp; counted
            </span>
          </div>

          {/* CSV Format */}
          <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(84,176,231,0.07)', border: '1px solid rgba(84,176,231,0.3)' }}>
            <h3 className="font-semibold mb-2 text-sm" style={{ color: '#54b0e7' }}>Supported CSV Columns</h3>
            <div className="rounded-lg p-3 font-mono text-xs overflow-x-auto" style={{ background: '#071a2c', color: '#d7dde5' }}>
              username, name, bio, category, website, followerCount, followingCount, email, phone, tag, status
            </div>
            <p className="text-xs mt-2" style={{ color: '#9ea7b5' }}>Column names are flexible (e.g. "Follower Count", "follower_count", "followers" all map correctly)</p>
          </div>

          {/* Drop Zone */}
          <div
            className="rounded-xl p-10 text-center mb-6 transition-all"
            style={{
              border: `2px dashed ${files.length > 0 ? '#4acbbf' : '#5e6a78'}`,
              background: files.length > 0 ? 'rgba(74,203,191,0.05)' : 'transparent'
            }}
          >
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange}
              className="hidden" id="csv-upload" disabled={isUploading} multiple />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)'
              }}>
                <Upload className="h-7 w-7" style={{ color: '#0a1929' }} />
              </div>
              {files.length > 0 ? (
                <>
                  <p className="font-semibold" style={{ color: '#ffffff' }}>{files.length} file(s) selected</p>
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="text-sm" style={{ color: '#9ea7b5' }}>
                        {f.name} — <span style={{ color: '#4acbbf' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold" style={{ color: '#ffffff' }}>Click to upload CSV files</p>
                  <p className="text-sm" style={{ color: '#9ea7b5' }}>No file size limit — streamed for performance</p>
                </>
              )}
            </label>
          </div>

          {/* Progress */}
          {progress && (
            <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{
              background: progress.status === 'success' ? 'rgba(46,204,113,0.1)'
                : progress.status === 'error' ? 'rgba(192,57,43,0.1)'
                : 'rgba(84,176,231,0.1)',
              border: `1px solid ${progress.status === 'success' ? '#2ecc71'
                : progress.status === 'error' ? '#c0392b' : '#54b0e7'}`
            }}>
              {progress.status === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#2ecc71' }} />
                : progress.status === 'error' ? <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#c0392b' }} />
                : <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" style={{ color: '#54b0e7' }} />}
              <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{progress.message}</p>
            </div>
          )}

          {/* Validation Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Rows Parsed', value: stats.totalParsed.toLocaleString(), color: '#54b0e7' },
                { label: 'Imported', value: stats.totalImported.toLocaleString(), color: '#4acbbf' },
                { label: 'Skipped (no ID)', value: stats.totalSkipped.toLocaleString(), color: '#f8d417' },
                { label: 'Invalid Emails', value: stats.invalidEmails.toLocaleString(), color: '#f66c25' },
                { label: 'Invalid Phones', value: stats.invalidPhones.toLocaleString(), color: '#f66c25' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{
                  background: 'rgba(10,25,41,0.8)', border: `1px solid ${s.color}30`
                }}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#9ea7b5' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={files.length === 0 || isUploading}
            className="w-full py-6 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)',
              color: '#0a1929',
              opacity: files.length === 0 || isUploading ? 0.5 : 1
            }}
          >
            {isUploading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Importing...</>
            ) : (
              <><Upload className="h-5 w-5 mr-2" />Import Leads</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}