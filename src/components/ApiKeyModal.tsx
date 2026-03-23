
import React, { useState } from 'react';
import { Key, ExternalLink, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!key.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    if (!key.startsWith('AIza')) {
      setError('Invalid API key format. Should start with "AIza"');
      return;
    }
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key size={32} />
          </div>
          <h2 className="text-2xl font-bold">Welcome to Chrysalis</h2>
          <p className="text-blue-100 text-sm mt-1">To get started, please provide your Gemini API Key</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gemini API Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                placeholder="Enter your API key here..."
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all focus:ring-2 ${error ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-blue-800 text-xs font-bold mb-1 uppercase tracking-tight">How to get a key?</h4>
            <p className="text-blue-700 text-xs leading-relaxed">
              You can get a free API key from the Google AI Studio. 
              Your key is stored locally in your browser and is never sent to our servers.
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs mt-3 transition-colors"
            >
              Get API Key from AI Studio <ExternalLink size={12} />
            </a>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
          >
            Start Processing
          </button>
        </div>
      </div>
    </div>
  );
};
