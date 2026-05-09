import React, { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export default function DragDropImport({ onFileSelected }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="rounded-xl p-10 text-center cursor-pointer transition-all"
      style={{
        border: `2px dashed ${dragging ? '#4acbbf' : 'rgba(74,203,191,0.35)'}`,
        background: dragging ? 'rgba(74,203,191,0.07)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <Upload className="h-10 w-10 mx-auto mb-3" style={{ color: '#4acbbf' }} />
      <p className="font-semibold mb-1" style={{ color: '#fff' }}>Drop your CSV file here</p>
      <p className="text-sm" style={{ color: '#9ea7b5' }}>or click to browse</p>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <FileText className="h-3.5 w-3.5" style={{ color: '#5e6a78' }} />
        <span className="text-xs" style={{ color: '#5e6a78' }}>Supports .csv files</span>
      </div>
    </div>
  );
}