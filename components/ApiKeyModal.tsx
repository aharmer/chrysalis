import React, { useState } from 'react';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Key size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">API Configuration</h2>
        </div>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          This app runs entirely in your browser. To process images, we need a Google Gemini API key. 
          This replaces the need for separate Google Vision and OpenRouter keys.
        </p>

        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Gemini API Key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4"
        />

        <div className="flex justify-end gap-3 items-center">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mr-auto"
            >
                Get a key <ExternalLink size={14}/>
            </a>
          <button
            onClick={() => onSave(key)}
            disabled={!key}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Start Processing
          </button>
        </div>
      </div>
    </div>
  );
};
