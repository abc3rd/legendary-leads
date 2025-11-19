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
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/[_\s]/g, '');
        let value = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
        
        if (key.includes('follower') || key.includes('following')) {
          value = parseInt(value) || 0;
        }
        
        if (key.includes('username')) row.username = value;
        else if (key.includes('name') && !key.includes('user')) row.name = value;
        else if (key.includes('bio')) row.bio = value;
        else if (key.includes('category')) row.category = value;
        else if (key.includes('website')) row.website = value;
        else if (key.includes('follower') && key.includes('count')) row.followerCount = value;
        else if (key.includes('following') && key.includes('count')) row.followingCount = value;
        else if (key.includes('email')) row.email = value;
        else if (key.includes('phone')) row.phone = value;
      });
      
      if (row.username || row.email) rows.push(row);
    }
    return rows;
  };

  const handleImport = async () => {
    if (files.length === 0) return;

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

        // Import in chunks of 1000
        const chunkSize = 1000;
        for (let i = 0; i < leads.length; i += chunkSize) {
          const chunk = leads.slice(i, i + chunkSize);
          await base44.entities.Lead.bulkCreate(chunk);
          totalImported += chunk.length;
          
          setProgress({ 
            status: 'importing', 
            message: `Imported ${totalImported} leads so far...` 
          });
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