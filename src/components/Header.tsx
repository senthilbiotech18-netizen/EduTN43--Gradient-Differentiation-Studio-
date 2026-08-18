import React from 'react';
import { Key, Download, Users, Layers, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { AppViewMode } from '../types';

interface HeaderProps {
  onReset?: () => void;
  hasResult?: boolean;
  onOpenApiKeyModal?: () => void;
  hasPersonalKey?: boolean;
  onOpenInstallModal?: () => void;
  activeMode: AppViewMode;
  onSelectMode: (mode: AppViewMode) => void;
  onOpenAssignModal?: () => void;
  activeClassCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onReset, 
  hasResult, 
  onOpenApiKeyModal,
  hasPersonalKey,
  onOpenInstallModal,
  activeMode,
  onSelectMode,
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
          <span>GRADIENT — DIFFERENTIATION &amp; CLASSROOM STUDIO</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
              title="Install desktop application on Chromebook, Mac, or Windows"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Install Desktop App</span>
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
              <span>{hasPersonalKey ? 'Personal API Active' : 'Personal API Key'}</span>
            </button>
          )}

          {hasResult && activeMode === 'diffuse_studio' && (
            <button
              onClick={onReset}
              className="text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-md transition-colors bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              ← Diffuse New Task
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Tab 1: Task Differentiation Studio */}
          <button
            onClick={() => onSelectMode('diffuse_studio')}
            className={`inline-flex items-center gap-2 font-sans font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeMode === 'diffuse_studio'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Task Diffuser Studio
          </button>

          {/* Tab 2: Whole-Class Live Dashboard */}
          <button
            onClick={() => onSelectMode('live_class_board')}
            className={`inline-flex items-center gap-2 font-sans font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer relative ${
              activeMode === 'live_class_board'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Class Live Tracker
            {activeClassCount > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeMode === 'live_class_board' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {activeClassCount}
              </span>
            )}
          </button>

          {/* Tab 3: Student Task Portal */}
          <button
            onClick={() => onSelectMode('student_portal')}
            className={`inline-flex items-center gap-2 font-sans font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeMode === 'student_portal'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Join Portal
          </button>
        </div>

        {/* Quick Assign to Whole Class Action (if task is diffused) */}
        {hasResult && onOpenAssignModal && (
          <button
            onClick={onOpenAssignModal}
            className="inline-flex items-center gap-1.5 font-sans font-bold text-xs bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs ml-auto"
          >
            <Users className="w-3.5 h-3.5 text-purple-700" />
            Assign to Whole Class
          </button>
        )}
      </div>

      {activeMode === 'diffuse_studio' && (
        <>
          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-2">
            One task in. Three concentrations out.
          </h1>
          <p className="text-slate-600 text-base max-w-2xl leading-relaxed font-serif">
            Diffuses a single core prompt into calibrated Support, Core, and Extend concentrations with live teacher talk moves, automated student work evaluation, and whole-class assignment distribution.
          </p>

          {/* Signature: Diffusion Blue/Purple Gradient Bar */}
          <div className="relative h-11 rounded-xl my-4 overflow-hidden shadow-inner border border-indigo-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
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
        </>
      )}
    </header>
  );
};


