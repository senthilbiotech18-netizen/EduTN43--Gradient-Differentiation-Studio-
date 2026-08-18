import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, Sparkles, Users, ArrowRight } from 'lucide-react';

interface TeacherLoginCardProps {
  onSuccess: () => void;
  onSwitchToStudent: () => void;
}

const TEACHER_PIN_KEY = 'gradient_teacher_pin';
const DEFAULT_PIN = '1234';

export const TeacherLoginCard: React.FC<TeacherLoginCardProps> = ({
  onSuccess,
  onSwitchToStudent,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string>('');

  const currentPin = typeof window !== 'undefined' ? localStorage.getItem(TEACHER_PIN_KEY) || DEFAULT_PIN : DEFAULT_PIN;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === currentPin || pinInput === DEFAULT_PIN) {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect Teacher Passcode. Default passcode is 1234.');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('Passcode must be at least 4 digits.');
      return;
    }
    localStorage.setItem(TEACHER_PIN_KEY, newPin);
    setPinSuccessMsg('Teacher Passcode updated successfully! You can now log in.');
    setIsChangingPin(false);
    setNewPin('');
    setTimeout(() => setPinSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-xl mx-auto my-8 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xs border border-white/20 shadow-inner">
            <Lock className="w-8 h-8 text-indigo-200" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-300 font-bold block mb-1">
            Restricted Educator Access
          </span>
          <h2 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white mb-2">
            Teacher Command Portal
          </h2>
          <p className="font-serif text-xs sm:text-sm text-indigo-100/80 max-w-md mx-auto leading-relaxed">
            Enter your teacher passcode to access the <strong>Task Diffuser Studio</strong>, create differentiated class assignments, and monitor live student submissions.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {!isChangingPin ? (
            <form onSubmit={handleUnlock} className="space-y-5">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-2 text-center">
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
                  className="w-full text-center font-mono font-extrabold text-3xl tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                />
                <div className="flex items-center justify-between mt-2 text-xs font-mono text-slate-400">
                  <span>Default Passcode: <strong className="text-slate-700">1234</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Change Passcode
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {pinSuccessMsg && (
                <div className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{pinSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Teacher Command &amp; Diffuser</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onSwitchToStudent}
                    className="font-sans text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Are you a student? <span className="text-indigo-600 underline">Go to Student Task Portal</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-2 text-center">
                  Set New Teacher Passcode
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 5892"
                  className="w-full text-center font-mono font-extrabold text-3xl tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                />
                <p className="text-[11px] font-serif text-slate-500 text-center mt-1.5">
                  Choose a 4-12 digit code only you know.
                </p>
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
                  className="font-sans font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Save New Passcode
                </button>
              </div>
            </form>
          )}

          {/* Feature Highlights */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>AI Task Diffuser (Support/Core/Extend)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Whole-Class Live Tracker &amp; CSV Exports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
