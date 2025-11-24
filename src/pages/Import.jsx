import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Import() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Please log in to import leads');
      }
    };
    checkAuth();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'text/csv');
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setProgress(null);
    } else {
      toast.error('Please select valid CSV files');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    console.log('Total lines:', lines.length);
    console.log('First 3 lines:', lines.slice(0, 3));
    
    // Parse header row properly handling quotes
    const parseRow = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);
      return values.map(v => v.trim().replace(/^["']|["']$/g, ''));
    };
    
    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
    console.log('Parsed headers:', headers);
    
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      const row = {};
      
      headers.forEach((header, index) => {
        const value = (values[index] || '').trim();
        if (!value) return;
        
        // More flexible field mapping
        if (header.match(/user(name)?$/i)) row.username = value;
        else if (header.match(/^(full)?name$/i) || header === 'name') row.name = value;
        else if (header.match(/bio|description|about/i)) row.bio = value;
        else if (header.match(/categor|niche|type|industry/i)) row.category = value;
        else if (header.match(/website|url|link/i)) row.website = value;
        else if (header.match(/follower/i)) {
          const num = parseInt(value.replace(/[^0-9]/g, ''));
          if (!isNaN(num) && num >= 0) row.followerCount = num;
        }
        else if (header.match(/following/i)) {
          const num = parseInt(value.replace(/[^0-9]/g, ''));
          if (!isNaN(num) && num >= 0) row.followingCount = num;
        }
        else if (header.match(/e?mail/i)) row.email = value;
        else if (header.match(/phone|tel|mobile|contact/i)) row.phone = value;
        else if (header.match(/tag|label/i)) row.tag = value;
        else if (header.match(/status|stage/i)) row.status = value;
      });
      
      // Only add rows with at least username OR email
      if (row.username || row.email) {
        rows.push(row);
      }
    }
    
    console.log('Parsed rows sample (first 3):', rows.slice(0, 3));
    console.log('Total valid rows:', rows.length);
    return rows;
  };

  const handleImport = async () => {
    if (files.length === 0) return;

    if (!user) {
      toast.error('You must be logged in to import leads');
      return;
    }

    setIsUploading(true);
    let totalImported = 0;

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        setProgress({ 
          status: 'processing', 
          message: `Processing file ${fileIndex + 1}/${files.length}: ${file.name}...` 
        });

        // Read CSV directly
        const text = await file.text();
        const leads = parseCSV(text);
        
        if (leads.length === 0) {
          toast.error(`No valid data found in ${file.name}`);
          continue;
        }

        setProgress({ 
          status: 'importing', 
          message: `Importing ${leads.length} leads from ${file.name}...` 
        });

        // Import in smaller chunks with detailed error logging
        const chunkSize = 50;
        for (let i = 0; i < leads.length; i += chunkSize) {
          const chunk = leads.slice(i, i + chunkSize);
          try {
            console.log(`Importing chunk ${i}-${i + chunk.length}:`, chunk[0]);
            const result = await base44.entities.Lead.bulkCreate(chunk);
            console.log('Chunk result:', result);
            totalImported += chunk.length;
            
            setProgress({ 
              status: 'importing', 
              message: `Imported ${totalImported} / ${leads.length} leads...` 
            });
          } catch (chunkError) {
            console.error('CHUNK ERROR:', chunkError);
            console.error('Error details:', chunkError.message, chunkError.response?.data);
            console.error('Failed chunk first item:', chunk[0]);
            toast.error(`Error: ${chunkError.message || 'Unknown error'}. Check console.`);
          }
        }
      }

      setProgress({ 
        status: 'success', 
        message: `Successfully imported ${totalImported} leads from ${files.length} file(s)!` 
      });
      
      toast.success(`Imported ${totalImported} leads!`);
      setFiles([]);

    } catch (error) {
      console.error('Import error:', error);
      setProgress({ 
        status: 'error', 
        message: error.message || 'Failed to import leads' 
      });
      toast.error('Import failed. Please check your CSV format.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Import Leads</h1>
          <p className="text-gray-400 mb-8">
            Upload your CSV file with Instagram lead data
          </p>

          <div className="space-y-6">
            {/* CSV Format Info */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Required CSV Format</h3>
              <p className="text-sm text-gray-400 mb-3">
                Your CSV should contain these columns in order:
              </p>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                username, name, bio, category, website, followerCount, followingCount, email, phone
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * Column names can be in any case (e.g., "followerCount", "follower_count", or "Follower Count")
              </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-purple-500/50 transition-all">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={isUploading}
                multiple
              />
              <label 
                htmlFor="csv-upload" 
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                {files.length > 0 ? (
                  <>
                    <p className="text-white font-semibold">{files.length} file(s) selected</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      {files.map((f, i) => (
                        <div key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold">Click to upload CSV files</p>
                    <p className="text-sm text-gray-400">Select one or multiple files</p>
                  </>
                )}
              </label>
            </div>

            {/* Progress */}
            {progress && (
              <div className={`rounded-xl p-6 border ${
                progress.status === 'success' 
                  ? 'bg-green-900/20 border-green-500/30' 
                  : progress.status === 'error'
                  ? 'bg-red-900/20 border-red-500/30'
                  : 'bg-blue-900/20 border-blue-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {progress.status === 'success' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  ) : progress.status === 'error' ? (
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                  )}
                  <p className="text-white font-medium">{progress.message}</p>
                </div>
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={files.length === 0 || isUploading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Import Leads
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}