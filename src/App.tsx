
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Settings, Play, Download, Trash2, AlertCircle, CheckCircle2, Loader2, ScanText, Thermometer, FileText, RefreshCw, CheckSquare, Square, Search } from 'lucide-react';
import { EntomologicalData, SpecimenRecord, ProcessingStats } from './types';
import { DEFAULT_ENTOMOLOGY_PROMPT } from './constants';
import { processSpecimenImage, fileToBase64 } from './services/gemini-service';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DetailEditor } from './components/DetailEditor';
import { DisclaimerModal } from './components/DisclaimerModal';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(!localStorage.getItem('gemini_api_key'));
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(!localStorage.getItem('chrysalis_disclaimer_accepted'));
  const [prompt, setPrompt] = useState<string>(DEFAULT_ENTOMOLOGY_PROMPT);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [showPromptSettings, setShowPromptSettings] = useState<boolean>(false);
  const [records, setRecords] = useState<SpecimenRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats: ProcessingStats = {
    total: records.length,
    processed: records.filter(r => r.status === 'success' || r.status === 'error').length,
    successful: records.filter(r => r.status === 'success').length,
    failed: records.filter(r => r.status === 'error').length,
    reviewed: records.filter(r => r.reviewed).length
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files) as File[];
      const newRecords: SpecimenRecord[] = [];

      for (const file of newFiles) {
        const imageUrl = URL.createObjectURL(file);
        
        const id = Math.random().toString(36).substring(7);
        newRecords.push({
          id,
          filename: file.name,
          imageUrl,
          status: 'pending',
          reviewed: false,
          data: {
            raw_ocr_text: '',
            collection_date: '',
            collection_date_end: '',
            collector: '',
            country: '',
            state: '',
            locality: '',
            verbatim_locality: '',
            decimal_latitude: '',
            decimal_longitude: '',
            geocode_method: '',
            altitude: '',
            habitat: '',
            method: '',
            determiner: '',
            notes: ''
          }
        });
      }
      setRecords(prev => [...prev, ...newRecords]);
      // Select the first new record if none selected
      if (!selectedRecordId && newRecords.length > 0) {
        setSelectedRecordId(newRecords[0].id);
      }
    }
  };

  const runProcessing = useCallback(async (recordsToProcess: SpecimenRecord[]) => {
    if (isProcessing || recordsToProcess.length === 0) return;
    if (!apiKey) {
        setShowKeyModal(true);
        return;
    }

    setIsProcessing(true);

    for (const record of recordsToProcess) {
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: 'processing', errorMsg: undefined } : r));

      try {
        const response = await fetch(record.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], record.filename, { type: blob.type });
        const base64 = await fileToBase64(file);

        const result = await processSpecimenImage(apiKey, base64, prompt, "gemini-2.5-flash", temperature);

        setRecords(prev => prev.map(r => r.id === record.id ? { 
            ...r, 
            status: 'success', 
            data: result 
        } : r));

      } catch (error: any) {
        setRecords(prev => prev.map(r => r.id === record.id ? { 
            ...r, 
            status: 'error', 
            errorMsg: error.message 
        } : r));
      }
    }

    setIsProcessing(false);
  }, [apiKey, isProcessing, prompt, temperature]);

  const handleProcessPending = () => {
    const pendingRecords = records.filter(r => r.status === 'pending');
    runProcessing(pendingRecords);
  };

  const handleReprocessAll = () => {
    if (window.confirm("Are you sure you want to reprocess ALL images? This will overwrite existing data.")) {
        runProcessing(records);
    }
  };

  const handleReprocessSingle = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const record = records.find(r => r.id === id);
    if (record) {
        runProcessing([record]);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('chrysalis_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const handleExportCsv = () => {
    if (records.length === 0) return;

    // 1. Define strict column order to match prompt schema + metadata
    const EXPORT_COLUMNS = [
      'accession_number',    // Derived
      'filename',            // Metadata
      'reviewed',            // Metadata
      'status',              // Metadata
      'raw_ocr_text',        // Data...
      'collection_date',
      'collection_date_end',
      'collector',
      'country',
      'state',
      'locality',
      'verbatim_locality',
      'decimal_latitude',
      'decimal_longitude',
      'geocode_method',
      'altitude',
      'habitat',
      'method',
      'determiner',
      'notes'
    ];
    
    // 2. Helper to extract accession number from filename
    // Looks for patterns like NZAC03028810 or generally [Letters][Numbers]
    const getAccession = (filename: string) => {
        const match = filename.match(/([A-Za-z]+)(\d+)/);
        if (match) {
            return match[0];
        }
        // Fallback: filename without extension
        return filename.split('.').slice(0, -1).join('.');
    };

    const rows = records.map(r => {
      // Prepare the flat data object
      const accession = getAccession(r.filename);
      const rowData: Record<string, string> = {
        accession_number: accession,
        filename: r.filename,
        status: r.status,
        reviewed: r.reviewed ? 'Yes' : 'No',
        ...r.data
      };

      // Map strict columns to values, escaping quotes
      return EXPORT_COLUMNS.map(col => {
        const val = rowData[col] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    // Create CSV content with headers
    const csvContent = [EXPORT_COLUMNS.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `entomo_data_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateRecord = (id: string, newData: EntomologicalData, reviewed?: boolean) => {
    setRecords(prev => prev.map(r => r.id === id ? { 
        ...r, 
        data: newData,
        reviewed: reviewed !== undefined ? reviewed : r.reviewed 
    } : r));
  };

  const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecords(prev => {
        const next = prev.filter(r => r.id !== id);
        if (selectedRecordId === id) {
            setSelectedRecordId(next.length > 0 ? next[0].id : null);
        }
        return next;
    });
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = records.findIndex(r => r.id === selectedRecordId);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < records.length) {
      setSelectedRecordId(records[nextIndex].id);
    }
  };

  // derived state for selected record
  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const selectedIndex = records.findIndex(r => r.id === selectedRecordId);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <DisclaimerModal isOpen={showDisclaimer} onAccept={handleAcceptDisclaimer} />
      <ApiKeyModal isOpen={!showDisclaimer && showKeyModal} onSave={handleSaveApiKey} />
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-blue-200">
            <ScanText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">Chrysalis</h1>
            <p className="text-[10px] text-slate-500 font-medium">Transforming specimen labels to digital data</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Stats Badge */}
           <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600 border border-slate-200">
              <span className="flex items-center gap-1.5" title="Total Records"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {stats.total}</span>
              <span className="flex items-center gap-1.5" title="Processed"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {stats.processed}</span>
              <span className="flex items-center gap-1.5" title="Reviewed"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {stats.reviewed}</span>
           </div>

          <button 
            onClick={() => setShowPromptSettings(!showPromptSettings)}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${showPromptSettings ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          
          <button 
            onClick={() => setShowKeyModal(true)}
            className={`text-xs font-mono px-2 py-1 rounded transition-colors ${apiKey ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600 animate-pulse'}`}
          >
            {apiKey ? 'API Key Configured' : 'Set API Key'}
          </button>
        </div>
      </header>

      {/* Settings Drawer */}
      {showPromptSettings && (
        <div className="bg-slate-50 border-b border-slate-200 p-4 shadow-inner animate-in slide-in-from-top-4 duration-200 shrink-0 z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Thermometer size={14} /> Model Temperature
                    </h3>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={temperature} 
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-2/3 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="font-mono bg-slate-100 px-2 rounded text-xs py-0.5">{temperature}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            Low (0.0) = Precise. High (1.0) = Creative.
                        </p>
                    </div>
                </div>
            </div>
            <div className="w-full md:w-2/3">
                <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> System Prompt
                </h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 p-3 text-xs font-mono border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
            </div>
          </div>
        </div>
      )}

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: List & Toolbar */}
        <div className="w-[400px] flex flex-col border-r border-slate-200 bg-white shrink-0 z-0">
             {/* Toolbar */}
            <div className="p-3 border-b border-slate-200 flex flex-wrap gap-2 bg-slate-50">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow-sm transition-all"
                >
                    <Upload size={16} /> Add
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileUpload}
                />
                
                <button 
                    onClick={handleProcessPending}
                    disabled={isProcessing || records.filter(r => r.status === 'pending').length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium shadow-sm transition-all"
                    title="Process Pending Images"
                >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    Run
                </button>

                 <div className="w-full flex gap-2">
                    <button 
                        onClick={handleReprocessAll}
                        disabled={isProcessing || records.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded text-xs font-medium transition-all"
                    >
                        <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} /> Reprocess All
                    </button>
                     <button 
                        onClick={handleExportCsv}
                        disabled={records.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded text-xs font-medium transition-all"
                    >
                        <Download size={14} /> Export
                    </button>
                 </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 p-2 space-y-2">
                {records.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <Search size={32} className="mb-2 opacity-30" />
                        <p className="text-sm font-medium">No images</p>
                        <p className="text-xs">Upload to start</p>
                    </div>
                )}

                {records.map((record) => (
                    <div 
                        key={record.id}
                        onClick={() => setSelectedRecordId(record.id)}
                        className={`group relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedRecordId === record.id 
                                ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400 z-10' 
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded bg-slate-200 overflow-hidden shrink-0 border border-slate-100 relative">
                            <img src={record.imageUrl} alt="" className="w-full h-full object-cover" />
                            {/* Status Overlay */}
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                {record.status === 'processing' && <Loader2 className="animate-spin text-white drop-shadow-md" size={16} />}
                                {record.status === 'error' && <AlertCircle className="text-red-500 bg-white rounded-full p-0.5" size={16} />}
                                {record.status === 'success' && !record.reviewed && <CheckCircle2 className="text-green-500 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100" size={16} />}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-xs font-bold truncate ${selectedRecordId === record.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {record.filename}
                                </span>
                                {record.reviewed && (
                                    <CheckSquare size={14} className="text-green-600" />
                                )}
                            </div>
                            
                            <div className="text-[11px] text-slate-600 truncate leading-tight h-4">
                                {record.data.locality || <span className="text-slate-400 italic">No locality</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate leading-tight flex items-center gap-1 mt-1">
                                <span className="font-medium text-slate-600">{record.data.collector || '-'}</span>
                                <span className="text-slate-300">•</span>
                                <span>{record.data.collection_date || '--/--/----'}</span>
                            </div>
                        </div>

                        {/* Row Actions */}
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <button 
                                onClick={(e) => handleReprocessSingle(record.id, e)}
                                className="p-1 text-slate-400 hover:text-blue-600 bg-white/80 hover:bg-white rounded shadow-sm"
                                title="Reprocess"
                             >
                                <RefreshCw size={12} />
                             </button>
                             <button 
                                onClick={(e) => handleDeleteRecord(record.id, e)}
                                className="p-1 text-slate-400 hover:text-red-600 bg-white/80 hover:bg-white rounded shadow-sm"
                                title="Delete"
                             >
                                <Trash2 size={12} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
             {selectedRecord ? (
                <DetailEditor 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecordId(null)} 
                    onSave={handleUpdateRecord}
                    hasPrev={selectedIndex > 0}
                    hasNext={selectedIndex < records.length - 1}
                    onNavigate={handleNavigate}
                />
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <ScanText size={64} className="mb-4 opacity-10" />
                    <p className="text-lg font-medium text-slate-500">Select a record</p>
                    <p className="text-sm">Click on an item from the list to view and edit details</p>
                </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default App;
