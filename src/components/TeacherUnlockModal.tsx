import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';

interface TeacherUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TEACHER_PIN_KEY = 'gradient_teacher_pin';
const DEFAULT_PIN = '1234';

export const TeacherUnlockModal: React.FC<TeacherUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentPin = typeof window !== 'undefined' ? localStorage.getItem(TEACHER_PIN_KEY) || DEFAULT_PIN : DEFAULT_PIN;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === currentPin || pinInput === DEFAULT_PIN) {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect Teacher Passcode. Default is 1234.');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('Passcode must be at least 4 digits.');
      return;
    }
    localStorage.setItem(TEACHER_PIN_KEY, newPin);
    setPinSuccessMsg('Teacher Passcode updated successfully!');
    setIsChangingPin(false);
    setNewPin('');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-200 font-bold block">
                Security Control
              </span>
              <h2 className="font-sans font-bold text-lg leading-tight">
                Teacher Command Access
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="font-serif text-xs text-slate-600 leading-relaxed">
            This prevents students on shared Chromebooks, tablets, or classroom projectors from accessing the Task Diffuser Studio, whole-class rosters, or grading analytics.
          </p>

          {!isChangingPin ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                  Enter Teacher Passcode
                </label>
                <input
                  type="password"
                  autoFocus
                  maxLength={12}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••"
                  className="w-full text-center font-mono font-extrabold text-2xl tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-slate-400">
                  <span>Default PIN: <strong className="text-slate-600">1234</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Change PIN
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {pinSuccessMsg && (
                <div className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-sans text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Stay in Student View
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="inline-flex items-center gap-1.5 font-sans font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Unlock Teacher Studio
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                  Set New Teacher Passcode
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 5892"
                  className="w-full text-center font-mono font-extrabold text-2xl tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="font-sans text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPin.length < 4}
                  className="font-sans font-bold text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Save Passcode
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
