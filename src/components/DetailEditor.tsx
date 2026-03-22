
import React, { useState, useEffect } from 'react';
import { X, Save, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Copy, ExternalLink, MapPin, Calendar, User, Globe, Hash, Info, Tag, Layers, Microscope, FileText, ZoomIn, ZoomOut, RotateCw, Maximize, RefreshCw } from 'lucide-react';
import { SpecimenRecord, EntomologicalData } from '../types';

interface DetailEditorProps {
  record: SpecimenRecord;
  onClose: () => void;
  onSave: (id: string, data: EntomologicalData, reviewed?: boolean) => void;
  hasPrev: boolean;
  hasNext: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const DetailEditor: React.FC<DetailEditorProps> = ({ record, onClose, onSave, hasPrev, hasNext, onNavigate }) => {
  const [formData, setFormData] = useState<EntomologicalData>(record.data);
  const [isDirty, setIsDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setFormData(record.data);
    setIsDirty(false);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, [record.id, record.data]);

  const handleChange = (field: keyof EntomologicalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = (reviewed: boolean = false) => {
    onSave(record.id, formData, reviewed);
    setIsDirty(false);
  };

  const handleNext = () => {
    handleSave(true);
    if (hasNext) {
      onNavigate('next');
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderField = (label: string, field: keyof EntomologicalData, icon: React.ReactNode, placeholder: string = "", isFullWidth: boolean = false) => (
    <div className={`space-y-1.5 ${isFullWidth ? 'col-span-full' : ''}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon} {label}
      </label>
      <div className="relative group">
        <input 
          type="text" 
          value={formData[field] || ''} 
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
        />
        {formData[field] && (
          <button 
            onClick={() => copyToClipboard(formData[field])}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy to clipboard"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-300">
      {/* Editor Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onNavigate('prev')} 
              disabled={!hasPrev}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 rounded-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => onNavigate('next')} 
              disabled={!hasNext}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 rounded-lg transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{record.filename}</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                  record.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                  record.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
               }`}>
                  {record.status}
               </span>
               {record.reviewed && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                    <CheckCircle2 size={10} /> Reviewed
                  </span>
               )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 animate-pulse">
              Unsaved Changes
            </span>
          )}
          <button 
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-100 transition-all active:scale-95"
          >
            <CheckCircle2 size={16} /> Mark Reviewed
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Image Viewer */}
        <div 
          className="w-1/2 h-full bg-slate-900 flex flex-col relative group overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           <div className="flex-1 flex items-center justify-center p-8 pointer-events-none">
              <img 
                src={record.imageUrl} 
                alt="Specimen Label" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-200" 
                style={{ 
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`
                }}
              />
           </div>
           
           {/* Image Overlay Actions */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
              <button 
                onClick={() => handleZoom(0.2)}
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button 
                onClick={() => handleZoom(-0.2)}
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={handleRotate}
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                title="Rotate"
              >
                <RotateCw size={18} />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleReset}
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                title="Reset View"
              >
                <RefreshCw size={18} />
              </button>
              <a 
                href={record.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                title="Open Original"
              >
                <ExternalLink size={18} />
              </a>
           </div>
        </div>

        {/* Right: Form Editor */}
        <div className="w-1/2 h-full overflow-y-auto bg-white custom-scrollbar">
          <div className="p-8 max-w-2xl mx-auto space-y-8">
            
            {/* Error Alert */}
            {record.status === 'error' && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-bold mb-1">Processing Error</h4>
                  <p className="text-xs leading-relaxed opacity-90">{record.errorMsg}</p>
                </div>
              </div>
            )}

            {/* Form Sections */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Locality Section */}
              <div className="col-span-full space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                        <MapPin size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Locality & Geography</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {renderField("Country", "country", <Globe size={12} />, "e.g. New Zealand")}
                    {renderField("State/Province", "state", <MapPin size={12} />, "e.g. AK (Crosby Code)")}
                    {renderField("Locality (Parsed)", "locality", <MapPin size={12} />, "e.g. Waitakere Ranges", true)}
                    {renderField("Verbatim Locality", "verbatim_locality", <Tag size={12} />, "Original text from label", true)}
                 </div>

                 <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {renderField("Latitude", "decimal_latitude", <Hash size={12} />, "-36.1234")}
                    {renderField("Longitude", "decimal_longitude", <Hash size={12} />, "174.1234")}
                    {renderField("Geocode Method", "geocode_method", <Info size={12} />, "AI-estimated", true)}
                 </div>
              </div>

              {/* Collection Details */}
              <div className="col-span-full space-y-4 pt-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 bg-emerald-50 rounded flex items-center justify-center text-emerald-600">
                        <Calendar size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Collection Data</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {renderField("Date (Start)", "collection_date", <Calendar size={12} />, "DD-MM-YYYY")}
                    {renderField("Date (End)", "collection_date_end", <Calendar size={12} />, "DD-MM-YYYY")}
                    {renderField("Collector", "collector", <User size={12} />, "e.g. Smith PC")}
                    {renderField("Altitude", "altitude", <Layers size={12} />, "e.g. 500m")}
                    {renderField("Habitat", "habitat", <Microscope size={12} />, "e.g. Forest floor", true)}
                    {renderField("Method", "method", <Tag size={12} />, "e.g. Malaise trap", true)}
                 </div>
              </div>

              {/* Identification & Notes */}
              <div className="col-span-full space-y-4 pt-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center text-amber-600">
                        <User size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Identification & Notes</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {renderField("Determiner", "determiner", <User size={12} />, "Who identified the specimen")}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={12} /> Notes
                      </label>
                      <textarea 
                        value={formData.notes || ''} 
                        onChange={(e) => handleChange('notes', e.target.value)}
                        className="w-full h-24 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm resize-none"
                      />
                    </div>
                 </div>
              </div>

              {/* Raw OCR Text */}
              <div className="col-span-full space-y-4 pt-4">
                 <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-600">
                        <FileText size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Raw OCR Transcription</h3>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {formData.raw_ocr_text || <span className="italic opacity-50">No raw transcription available</span>}
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
         <button 
            onClick={handleNext}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
         >
            {hasNext ? 'Next Image' : 'Save & Finish'} <ChevronRight size={18} />
         </button>
      </div>
    </div>
  );
};
