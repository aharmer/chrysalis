
import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-amber-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold">Important Disclaimer</h2>
          <p className="text-amber-50 text-sm mt-1">Please read before using Chrysalis</p>
        </div>
        
        <div className="p-8 space-y-4">
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              <strong>AI Accuracy:</strong> Chrysalis uses artificial intelligence (Google Gemini) to transcribe and parse specimen labels. While highly capable, AI can hallucinate, misinterpret handwriting, or provide incorrect coordinates.
            </p>
            <p>
              <strong>Verification Required:</strong> All extracted data <strong>must be manually verified</strong> by a qualified entomologist or curator before being committed to a formal database or research project.
            </p>
            <p>
              <strong>Data Privacy:</strong> Your API key and specimen images are processed locally in your browser. However, images are sent to Google's servers for processing via the Gemini API. Ensure you have the right to share these images.
            </p>
            <p>
              <strong>No Liability:</strong> The developers of Chrysalis are not responsible for any errors, data loss, or scientific inaccuracies resulting from the use of this tool.
            </p>
          </div>

          <button 
            onClick={onAccept}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            <CheckCircle2 size={18} /> I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
