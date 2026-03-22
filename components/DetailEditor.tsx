
import React, { useState, useEffect, useRef } from 'react';
import { SpecimenRecord, EntomologicalData } from '../types';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, CheckSquare, Square, Check, AlertCircle } from 'lucide-react';

interface DetailEditorProps {
  record: SpecimenRecord;
  onClose: () => void;
  onSave: (id: string, data: EntomologicalData, reviewed?: boolean) => void;
  hasPrev: boolean;
  hasNext: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const DetailEditor: React.FC<DetailEditorProps> = ({ 
  record, 
  onSave, 
  hasPrev, 
  hasNext, 
  onNavigate 
}) => {
  const [formData, setFormData] = useState<EntomologicalData>(record.data);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when record prop changes (i.e. user selected a new row)
  useEffect(() => {
    setFormData(record.data);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [record.id, record.data]); // Depend on ID to reset view

  // Handle Wheel Zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent the whole page or right sidebar from scrolling
      e.preventDefault();
      
      const delta = e.deltaY;
      // Sensitivity factor - smaller is smoother
      const zoomFactor = 0.0015;
      
      setZoom(prev => {
        const nextZoom = prev - delta * zoomFactor;
        return Math.min(Math.max(nextZoom, 0.5), 5);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleNavigation = (direction: 'prev' | 'next') => {
    // Save current changes first (and keep reviewed status as is, unless explicitly toggled elsewhere)
    onSave(record.id, formData);
    onNavigate(direction);
  };

  const handleBlur = () => {
    // Auto-save on blur of any input
    onSave(record.id, formData);
  };

  const toggleReviewed = () => {
    onSave(record.id, formData, !record.reviewed);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl/Cmd + Arrows always navigate and save
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'ArrowRight' && hasNext) {
                e.preventDefault();
                handleNavigation('next');
                return;
            }
            if (e.key === 'ArrowLeft' && hasPrev) {
                e.preventDefault();
                handleNavigation('prev');
                return;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, formData, record.id]);

  const handleChange = (field: keyof EntomologicalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Group fields for better layout
  const fieldGroups = [
    { title: 'Core Data', fields: ['collector', 'collection_date', 'collection_date_end', 'determiner'] },
    { title: 'Geography', fields: ['country', 'state', 'locality', 'verbatim_locality'] },
    { title: 'Coordinates', fields: ['decimal_latitude', 'decimal_longitude', 'geocode_method', 'altitude'] },
    { title: 'Details', fields: ['habitat', 'method', 'raw_ocr_text', 'notes'] },
  ];

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-4">
           {/* Navigation */}
           <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button 
                  disabled={!hasPrev} 
                  onClick={() => handleNavigation('prev')}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                  title="Previous (Ctrl+Left)"
              >
                  <ChevronLeft size={18} />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-0.5"></div>
              <button 
                  disabled={!hasNext} 
                  onClick={() => handleNavigation('next')}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                  title="Next (Ctrl+Right)"
              >
                  <ChevronRight size={18} />
              </button>
           </div>

           <div className="flex flex-col">
               <span className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[200px]" title={record.filename}>{record.filename}</span>
               <span className="text-[10px] text-slate-500 font-mono">{record.id}</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleReviewed}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all font-medium text-sm ${
                record.reviewed 
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {record.reviewed ? <CheckSquare size={16} /> : <Square size={16} />}
            {record.reviewed ? 'Reviewed' : 'Mark Reviewed'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left: Image Viewer (50% on desktop) */}
        <div 
          ref={containerRef}
          className="w-1/2 bg-slate-100 relative overflow-hidden flex items-center justify-center border-r border-slate-200 group"
        >
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 p-1.5 rounded-lg shadow-sm backdrop-blur opacity-50 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} className="p-1.5 hover:bg-slate-200 rounded" title="Zoom In"><ZoomIn size={18}/></button>
              <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="p-1.5 hover:bg-slate-200 rounded" title="Zoom Out"><ZoomOut size={18}/></button>
              <button onClick={handleRotate} className="p-1.5 hover:bg-slate-200 rounded" title="Rotate 90°"><RotateCw size={18}/></button>
              <button onClick={() => {setZoom(1); setRotation(0); setPan({x:0, y:0})}} className="text-[10px] font-bold p-1.5 hover:bg-slate-200 rounded" title="Reset View">RST</button>
          </div>
          
          {record.status === 'processing' && (
              <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-sm font-medium text-blue-800">Processing...</span>
                  </div>
              </div>
          )}

          {record.status === 'error' && (
              <div className="absolute inset-0 z-20 bg-red-50/80 flex flex-col items-center justify-center p-4 text-center">
                   <AlertCircle size={32} className="text-red-500 mb-2" />
                   <p className="text-red-800 font-bold">Processing Failed</p>
                   <p className="text-red-600 text-sm">{record.errorMsg || "Unknown error"}</p>
              </div>
          )}
          
          <div 
              className="cursor-move w-full h-full flex items-center justify-center"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
          >
              <img 
                  src={record.imageUrl} 
                  alt="Specimen" 
                  style={{ 
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.2s'
                  }}
                  className="max-w-[95%] max-h-[95%] object-contain select-none shadow-xl"
                  draggable={false}
              />
          </div>
        </div>

        {/* Right: Form (50% on desktop) */}
        <div className="w-1/2 overflow-y-auto bg-white p-5 custom-scrollbar">
          <div className="space-y-6 pb-10">
              {fieldGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-1">
                          {group.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                          {group.fields.map((fieldKey) => {
                              const key = fieldKey as keyof EntomologicalData;
                              const isLong = key === 'raw_ocr_text' || key === 'notes' || key === 'verbatim_locality';
                              
                              return (
                                  <div key={key} className={isLong ? "col-span-2" : "col-span-1"}>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 capitalize tracking-tight">
                                          {key.replace(/_/g, ' ')}
                                      </label>
                                      {isLong ? (
                                          <textarea
                                              value={formData[key]}
                                              onChange={(e) => handleChange(key, e.target.value)}
                                              onBlur={handleBlur}
                                              rows={key === 'raw_ocr_text' ? 4 : 2}
                                              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-mono bg-slate-50/50 transition-all outline-none resize-y"
                                          />
                                      ) : (
                                          <input 
                                              type="text"
                                              value={formData[key]}
                                              onChange={(e) => handleChange(key, e.target.value)}
                                              onBlur={handleBlur}
                                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all outline-none bg-slate-50/50 focus:bg-white"
                                          />
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
              
              <div className="pt-4 flex justify-end">
                   <button 
                        onClick={toggleReviewed}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                             record.reviewed 
                             ? 'bg-green-100 text-green-700 hover:bg-green-200'
                             : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                        }`}
                   >
                        {record.reviewed ? <Check size={18} /> : <CheckSquare size={18} />}
                        {record.reviewed ? 'Marked as Reviewed' : 'Mark as Reviewed'}
                   </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
