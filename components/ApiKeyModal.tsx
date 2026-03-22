import React, { useState } from 'react';
import { Key, ExternalLink, ShieldAlert, CheckCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = useState('');
  const [step, setStep] = useState<'input' | 'disclaimer'>('input');

  if (!isOpen) return null;

  if (step === 'disclaimer') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Data Privacy Disclaimer</h2>
          </div>
          
          <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
            <p className="font-medium text-slate-800">
              Chrysalis uses Google Gemini to power its AI identification and analysis features. By using this service, any images, text, or other data you submit may be processed by Google and are subject to Google's Privacy Policy and Terms of Service.
            </p>
            <p>
              This means that uploaded content — including specimen photographs and associated metadata — may be visible to Google as part of Gemini's processing pipeline.
            </p>
            <p>
              Please consider this before submitting any sensitive or confidential material. Chrysalis does not control how Google handles data processed through its AI services. It is your responsibility to assess whether your data is appropriate to share in light of these third-party privacy implications.
            </p>
            <p className="font-bold text-blue-600">
              By continuing to use Chrysalis, you acknowledge and accept these terms.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => onSave(key)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in duration-300">
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

        <div className="space-y-2 mb-6">
          <label className="block text-sm font-bold text-slate-700">
            Gemini API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50"
          />
        </div>

        <div className="flex justify-between items-center">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
                Get a key <ExternalLink size={12}/>
            </a>
          <button
            onClick={() => setStep('disclaimer')}
            disabled={!key}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-md shadow-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
