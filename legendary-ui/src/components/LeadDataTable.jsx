import React, { useState, useEffect } from 'react';

function LeadDataTable() {
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tier, setTier] = useState('premium'); // 'basic' or 'premium'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Set pageSize based on tier
  useEffect(() => {
    setPageSize(tier === 'basic' ? 10 : 50);
  }, [tier]);

  useEffect(() => {
    fetch(`http://localhost:4000/api/leads?page=${page}&pageSize=${pageSize}&search=${searchTerm}&category=${category}`)
      .then(res => res.json())
      .then(response => {
        setLeads(response?.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLeads([]);
        setLoading(false);
      });
  }, [page, pageSize, searchTerm, category]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, category]);

  const exportToCSV = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/leads?page=1&pageSize=10000&search=${searchTerm}&category=${category}`);
      const data = await res.json();
      const allLeads = data.data || [];
      
      const headers = tier === 'premium' 
        ? ['Username', 'Name', 'Category', 'Followers', 'Email', 'Bio', 'Following', 'Website', 'Phone', 'Location', 'Last Online']
        : ['Username', 'Name', 'Category', 'Followers', 'Bio', 'Following', 'Location', 'Last Online'];
      
      const csvContent = [
        headers.join(','),
        ...allLeads.map(lead => {
          const row = tier === 'premium'
            ? [
                lead.username,
                lead.name,
                lead.category,
                lead.followers,
                lead.email,
                lead.bio,
                lead.followingCount,
                lead.website,
                lead.phone,
                lead.location,
                lead.lastOnline
              ]
            : [
                lead.username,
                lead.name,
                lead.category,
                lead.followers,
                lead.bio,
                lead.followingCount,
                lead.location,
                lead.lastOnline
              ];
          return row.map(field => `"${field || ''}"`).join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filtered-leads.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('leads', file);

      const response = await fetch('http://localhost:4000/api/leads/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Add auth header if needed
          // 'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        alert('Leads uploaded successfully!');
        // Refresh the data
        window.location.reload();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload leads. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatLastOnline = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(leads.map(lead => lead.username));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRow = (username) => {
    setSelectedRows(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username) 
        : [...prev, username]
    );
  };

  const openPanel = (lead) => {
    setSelectedLead(lead);
    setIsPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Lead Management</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Core dashboard table
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Review and manage high-priority inbound leads with fast filtering-ready layout.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
                {loading ? 'Loading...' : `${leads.length} leads loaded`}
              </div>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="basic">Basic ({tier === 'basic' ? '10' : '50'} results)</option>
                <option value="premium">Premium ({tier === 'premium' ? '50' : '10'} results)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Upload Your Own Leads</h3>
              <p className="text-sm text-slate-600">Import leads from CSV file (columns: username, name, email, phone, website, bio, category)</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="lead-upload"
              />
              <label
                htmlFor="lead-upload"
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  isUploading ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
              >
                {isUploading ? 'Uploading...' : 'Upload CSV'}
              </label>
            </div>
          </div>
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-600 mt-2">Processing your leads...</p>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Influencer">Influencer</option>
              <option value="Business">Business</option>
              <option value="Artist">Artist</option>
              <option value="Other">Other</option>
            </select>
            <button
              onClick={exportToCSV}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Export CSV
            </button>
          </div>
          {selectedRows.length > 0 && (
            <div className="text-sm text-slate-600">
              {selectedRows.length} selected
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRows.length === leads.length && leads.length > 0}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Followers
                  </th>
                  {tier === 'premium' && (
                    <>
                      <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                        Website
                      </th>
                    </>
                  )}
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Bio
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Following
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium uppercase tracking-[0.16em] text-slate-500">
                    Last Online
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {leads.map((row) => (
                  <tr 
                    key={row.username} 
                    className="transition-colors duration-200 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openPanel(row)}
                  >
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.username)}
                        onChange={() => toggleRow(row.username)}
                      />
                    </td>
                    <td className="px-6 py-5 font-medium text-slate-900">{row.username}</td>
                    <td className="px-6 py-5 text-slate-700">{row.name}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-700">{row.followers?.toLocaleString()}</td>
                    {tier === 'premium' && (
                      <>
                        <td className="px-6 py-5 text-slate-600">{row.email}</td>
                        <td className="px-6 py-5 text-slate-700">{row.phone}</td>
                        <td className="px-6 py-5 text-slate-700">
                          {row.website && (
                            <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {row.website}
                            </a>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-5 text-slate-700 truncate max-w-xs">{row.bio}</td>
                    <td className="px-6 py-5 text-slate-700">{row.followingCount?.toLocaleString()}</td>
                    <td className="px-6 py-5 text-slate-700">{row.location || 'Unknown'}</td>
                    <td className="px-6 py-5 text-slate-700">{formatLastOnline(row.lastOnline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded disabled:opacity-50"
            >
              Previous Page
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded"
            >
              Next Page
            </button>
          </div>
        </div>

        {/* Action Panel */}
        {isPanelOpen && selectedLead && (
          <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{selectedLead.name}</h2>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Username</p>
                  <p className="text-slate-900">@{selectedLead.username}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Category</p>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {selectedLead.category}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Location</p>
                  <p className="text-slate-700">{selectedLead.location || 'Unknown'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Last Online</p>
                  <p className="text-slate-700">{formatLastOnline(selectedLead.lastOnline)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Bio</p>
                  <p className="text-slate-700 leading-relaxed">{selectedLead.bio}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Stats</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{selectedLead.followers?.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">Followers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{selectedLead.followingCount?.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">Following</p>
                    </div>
                  </div>
                </div>
                
                {tier === 'premium' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Contact</p>
                    {selectedLead.email && (
                      <a 
                        href={`mailto:${selectedLead.email}`}
                        className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Email: {selectedLead.email}
                      </a>
                    )}
                    {selectedLead.website && (
                      <a 
                        href={selectedLead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Visit Website
                      </a>
                    )}
                    {selectedLead.phone && (
                      <a 
                        href={`tel:${selectedLead.phone}`}
                        className="block w-full px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Call: {selectedLead.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadDataTable