import React, { useState } from 'react';
import { DiffusedResult, ClassAssignment } from '../types';
import { generateAssignmentCode, saveClassAssignment } from '../utils/classAssignmentStorage';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  X, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

interface TeacherAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DiffusedResult | null;
  onAssignmentCreated: (assignment: ClassAssignment) => void;
  onViewDashboard: (assignmentId: string) => void;
}

export const TeacherAssignModal: React.FC<TeacherAssignModalProps> = ({
  isOpen,
  onClose,
  result,
  onAssignmentCreated,
  onViewDashboard,
}) => {
  const [title, setTitle] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('Instructor');
  const [allowSelfSelection, setAllowSelfSelection] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [createdAssignment, setCreatedAssignment] = useState<ClassAssignment | null>(null);

  // Initialize title when result changes
  React.useEffect(() => {
    if (result) {
      const derivedTitle = result.context ? `${result.context} Task` : 'Class Differentiated Task';
      setTitle(derivedTitle);
      setCreatedAssignment(null);
    }
  }, [result]);

  if (!isOpen || !result) return null;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCode = generateAssignmentCode();
    const newAssignment: ClassAssignment = {
      id: `assign_${Date.now()}`,
      code: newCode,
      title: title.trim(),
      teacherName: teacherName.trim() || 'Instructor',
      curriculum: result.curriculum,
      gradeLevel: result.gradeLevel,
      originalTask: result.originalTask,
      context: result.context,
      axis: result.axis,
      lanes: result.lanes,
      talk_moves: result.talk_moves,
      grouping_tip: result.grouping_tip,
      createdAt: new Date().toISOString(),
      allowSelfSelection,
      status: 'active',
    };

    saveClassAssignment(newAssignment);
    setCreatedAssignment(newAssignment);
    onAssignmentCreated(newAssignment);
  };

  const getStudentDirectUrl = (code: string) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?code=${code}&mode=student`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = (code: string) => {
    const url = getStudentDirectUrl(code);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-200 font-semibold block">
                Classroom Add-On
              </span>
              <h2 className="font-sans font-bold text-xl leading-tight">
                Assign Common Task to Whole Class
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {!createdAssignment ? (
            <form onSubmit={handlePublish} className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs font-serif text-slate-700 space-y-1">
                <p className="font-sans font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  How Class Task Assignment Works:
                </p>
                <p>
                  1. Your 3 diffused lanes (Support, Core, Extend) will be assigned as a single common class task.
                </p>
                <p>
                  2. Students enter the <strong>Class PIN</strong> to access their concentration lane and complete their work.
                </p>
                <p>
                  3. All student responses and AI formative marks stream directly into your <strong>Live Class Dashboard</strong>.
                </p>
              </div>

              {/* Assignment Title */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Assignment Title / Unit Topic
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. IB MYP 2 Biology: Cell Membrane Transport"
                  className="w-full font-sans text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>

              {/* Teacher Name & Curriculum / Axis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Teacher / Dept
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="e.g. Dr. Senthil Kumar"
                    className="w-full font-sans text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Curriculum &amp; Class
                  </label>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs font-mono font-bold text-indigo-900 truncate">
                    {result.curriculum || 'Standard'} • {result.gradeLevel || 'General'}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold mb-1">
                    Differentiation Axis
                  </label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-700 uppercase truncate">
                    {result.axis}
                  </div>
                </div>
              </div>

              {/* Student Lane Selection Mode */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Student Lane Selection
                  </span>
                  <input
                    type="checkbox"
                    id="self-select-tier"
                    checked={allowSelfSelection}
                    onChange={(e) => setAllowSelfSelection(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <label htmlFor="self-select-tier" className="text-xs font-serif text-slate-600 block cursor-pointer">
                  {allowSelfSelection 
                    ? 'Students can self-select their entry lane (Support, Core, or Extend) with teacher guidance prompts.'
                    : 'Teacher guides or locks specific tiers for individual student stations.'}
                </label>
              </div>

              {/* Publish Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-sans text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="inline-flex items-center gap-2 font-sans font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Generate Class Code &amp; Assign
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-sans font-bold text-xl text-slate-900 mb-1">
                  Assignment Live &amp; Ready for Class!
                </h3>
                <p className="font-serif text-xs text-slate-600">
                  Students can now join this common task on their Chromebooks or devices.
                </p>
              </div>

              {/* Big Class Code Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-5 max-w-sm mx-auto shadow-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-700 font-bold block mb-1">
                  Class Join PIN / Code
                </span>
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-indigo-900 tracking-wider mb-3">
                  {createdAssignment.code}
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopyCode(createdAssignment.code)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Code Copied!' : 'Copy PIN'}
                  </button>

                  <button
                    onClick={() => handleCopyLink(createdAssignment.code)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onViewDashboard(createdAssignment.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-sans font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  Open Live Class Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto font-sans text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close &amp; Keep Editing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
