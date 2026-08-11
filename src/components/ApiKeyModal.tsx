import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, X, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey, removeStoredApiKey, testGeminiApiKey } from '../utils/apiKeyUtils';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdate?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid?: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      removeStoredApiKey();
      setTestResult({ valid: false, error: 'Key cleared. Now using default server credentials.' });
      if (onKeyUpdate) onKeyUpdate();
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testGeminiApiKey(cleanKey);
    setIsTesting(false);
    setTestResult(result);

    if (result.valid) {
      saveStoredApiKey(cleanKey);
      if (onKeyUpdate) onKeyUpdate();
    }
  };

  const handleClear = () => {
    removeStoredApiKey();
    setApiKey('');
    setTestResult({ valid: false, error: 'Personal API key removed. Reverted to shared server key.' });
    if (onKeyUpdate) onKeyUpdate();
  };

  const hasPersonalKey = Boolean(getStoredApiKey());

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900 font-sans"
        id="api-key-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-100 font-bold block">
                EduTN43 Custom Credentials
              </span>
              <h3 className="font-bold text-lg leading-tight">Personal Gemini API Key</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed font-sans">
              <strong className="text-indigo-900 font-semibold block mb-0.5">Bypass Traffic Limits &amp; Rate Constraints</strong>
              Connect your personal Google AI Studio key to ensure unconstrained model access during peak school hours. Your key is stored securely in your browser's private LocalStorage.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="gemini-api-key-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  id="gemini-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste AIzaSy... key here"
                  className="w-full text-sm font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-xl p-3 pr-10 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Status Feedback */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs font-sans flex items-center gap-2.5 ${
                testResult.valid 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                {testResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <strong className="font-semibold">{testResult.valid ? 'API Key Verified!' : 'Key Status'}</strong>
                  <p className="mt-0.5 leading-normal">{testResult.valid ? 'Your key is working and actively saved.' : testResult.error}</p>
                </div>
              </div>
            )}

            {!testResult && hasPersonalKey && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Personal API Key is currently active for all differentiation requests.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                Get Free Gemini Key <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                {hasPersonalKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Remove Key
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isTesting || !apiKey.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isTesting ? 'Validating...' : 'Validate & Save Key'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
