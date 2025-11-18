import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { toast } from 'sonner';

export default function Import() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setProgress(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress({ status: 'uploading', message: 'Uploading file...' });

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress({ status: 'processing', message: 'Extracting lead data...' });

      // Extract data using AI
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              name: { type: 'string' },
              bio: { type: 'string' },
              category: { type: 'string' },
              website: { type: 'string' },
              followerCount: { type: 'number' },
              followingCount: { type: 'number' },
              email: { type: 'string' },
              phone: { type: 'string' }
            }
          }
        }
      });

      if (result.status === 'error') {
        throw new Error(result.details || 'Failed to extract data');
      }

      const leads = Array.isArray(result.output) ? result.output : [result.output];
      
      setProgress({ status: 'importing', message: `Importing ${leads.length} leads...` });

      // Bulk create leads
      await base44.entities.Lead.bulkCreate(leads);

      setProgress({ 
        status: 'success', 
        message: `Successfully imported ${leads.length} leads!` 
      });
      
      toast.success(`Imported ${leads.length} leads!`);
      setFile(null);

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
              />
              <label 
                htmlFor="csv-upload" 
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                {file ? (
                  <>
                    <p className="text-white font-semibold">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold">Click to upload CSV</p>
                    <p className="text-sm text-gray-400">or drag and drop</p>
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
              disabled={!file || isUploading}
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