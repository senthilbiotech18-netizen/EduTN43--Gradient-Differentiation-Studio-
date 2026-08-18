import React from 'react';
import { Key, Download, Users, Layers, Sparkles, BookOpen, GraduationCap, Lock, Unlock, LogOut } from 'lucide-react';
import { AppPortalMode, TeacherSubTab } from '../types';

interface HeaderProps {
  onReset?: () => void;
  hasResult?: boolean;
  onOpenApiKeyModal?: () => void;
  hasPersonalKey?: boolean;
  onOpenInstallModal?: () => void;
  portalMode: AppPortalMode;
  onSelectPortal: (portal: AppPortalMode) => void;
  teacherSubTab: TeacherSubTab;
  onSelectTeacherSubTab: (subTab: TeacherSubTab) => void;
  isTeacherAuthenticated: boolean;
  onLockTeacherSession: () => void;
  onOpenAssignModal?: () => void;
  activeClassCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onReset, 
  hasResult, 
  onOpenApiKeyModal,
  hasPersonalKey,
  onOpenInstallModal,
  portalMode,
  onSelectPortal,
  teacherSubTab,
  onSelectTeacherSubTab,
  isTeacherAuthenticated,
  onLockTeacherSession,
  onOpenAssignModal,
  activeClassCount = 0,
}) => {
  return (
    <header className="mb-8 space-y-4">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 text-xs font-mono tracking-widest text-indigo-700 uppercase font-semibold flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shrink-0" />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-sans font-bold px-2 py-0.5 rounded-md text-[11px] tracking-normal normal-case shadow-2xs">EduTN43</span>
          <span className="text-slate-400 font-light">|</span>
          <span>GRADIENT — ISOTONIC TASK DIFFERENTIATION &amp; CLASSROOM SYSTEM</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
              title="Install desktop application on Chromebook, Mac, or Windows"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Install App</span>
            </button>
          )}

          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                hasPersonalKey
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-indigo-300'
              }`}
            >
              <Key className={`w-3.5 h-3.5 ${hasPersonalKey ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <span>{hasPersonalKey ? 'Personal API Active' : 'API Key'}</span>
            </button>
          )}

          {portalMode === 'teacher' && isTeacherAuthenticated && (
            <button
              onClick={onLockTeacherSession}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Lock teacher portal to prevent unauthorized classroom access"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lock Teacher Session</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Portal Master Navigation Switcher */}
      <div className="bg-white border-2 border-indigo-100/80 rounded-2xl p-1.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 p-0.5 bg-slate-100 rounded-xl flex-wrap">
          {/* Portal 1: Student View (No Password Required) */}
          <button
            onClick={() => onSelectPortal('student')}
            className={`inline-flex items-center gap-2 font-sans font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all cursor-pointer ${
              portalMode === 'student'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span>Student Portal</span>
            <span className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Open Access
            </span>
          </button>

          {/* Portal 2: Teacher Portal (Password Protected) */}
          <button
            onClick={() => onSelectPortal('teacher')}
            className={`inline-flex items-center gap-2 font-sans font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all cursor-pointer ${
              portalMode === 'teacher'
                ? 'bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {isTeacherAuthenticated ? <Unlock className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-amber-400" />}
            <span>Teacher Portal</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
              portalMode === 'teacher' 
                ? 'bg-white/20 text-white' 
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              🔒 Protected
            </span>
          </button>
        </div>

        {/* When in Teacher Mode and Authenticated: show Teacher Sub-Navigation */}
        {portalMode === 'teacher' && isTeacherAuthenticated && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onSelectTeacherSubTab('diffuse_studio')}
              className={`inline-flex items-center gap-1.5 font-sans font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                teacherSubTab === 'diffuse_studio'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Task Diffuser Studio
            </button>

            <button
              onClick={() => onSelectTeacherSubTab('live_class_board')}
              className={`inline-flex items-center gap-1.5 font-sans font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer relative ${
                teacherSubTab === 'live_class_board'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Class Live Tracker &amp; Portfolios
              {activeClassCount > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  teacherSubTab === 'live_class_board' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {activeClassCount}
                </span>
              )}
            </button>

            {hasResult && onOpenAssignModal && teacherSubTab === 'diffuse_studio' && (
              <button
                onClick={onOpenAssignModal}
                className="inline-flex items-center gap-1.5 font-sans font-bold text-xs bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs ml-1"
              >
                <Users className="w-3.5 h-3.5 text-purple-700" />
                Assign to Whole Class
              </button>
            )}

            {hasResult && onReset && teacherSubTab === 'diffuse_studio' && (
              <button
                onClick={onReset}
                className="text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors bg-slate-50 hover:bg-slate-100 cursor-pointer ml-1"
              >
                ← New Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Banner for Diffuse Studio when inside Teacher Portal */}
      {portalMode === 'teacher' && isTeacherAuthenticated && teacherSubTab === 'diffuse_studio' && (
        <div className="pt-2">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-1.5">
            One task in. Three concentrations out.
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed font-serif mb-3">
            Diffuses a single core prompt into calibrated Support, Core, and Extend concentrations with live teacher talk moves, automated student work evaluation, and whole-class assignment distribution.
          </p>

          {/* Signature: Diffusion Blue/Purple Gradient Bar */}
          <div className="relative h-10 rounded-xl overflow-hidden shadow-inner border border-indigo-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
            <div 
              className="absolute inset-0 opacity-40 animate-[drift_9s_linear_infinite]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.75) 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4 text-[11px] font-mono text-white/95 font-medium tracking-wider">
              <span className="bg-black/20 px-2 py-0.5 rounded backdrop-blur-xs">LOW CONCENTRATION — SUPPORT</span>
              <span className="bg-black/20 px-2 py-0.5 rounded backdrop-blur-xs hidden sm:inline">ISOTONIC — CORE</span>
              <span className="bg-black/20 px-2 py-0.5 rounded backdrop-blur-xs">HIGH CONCENTRATION — EXTEND</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};



