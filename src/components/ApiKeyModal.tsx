import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
  currentKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, currentKey = '' }) => {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError('API Key cannot be empty');
      return;
    }
    // Simple validation pattern check for Gemini API keys (starting with AIza or AQ)
    if (!trimmedKey.startsWith('AIza') && !trimmedKey.startsWith('AQ')) {
      setError('Invalid format. Gemini API keys should start with "AIza" or "AQ"');
      return;
    }
    setError('');
    onSave(trimmedKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <Key size={18} />
            </div>
            <h3 className="font-bold text-slate-800">Set Gemini API Key</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            To avoid incurring costs for the application developer, please provide your own <strong>Gemini API Key</strong>. 
            Your key is stored securely in your browser's local storage and is sent only to make requests. It is never stored on the server.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder="AIza... or AQ..."
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Get a free API key from Google AI Studio <ExternalLink size={12} />
          </a>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
            >
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
