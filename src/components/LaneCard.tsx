import React, { useState } from 'react';
import { LaneData, StudentAnswer, MarkingFeedback, StudentWorkPackage, DifferentiationAxis } from '../types';
import { downloadStudentWorkPDF, downloadStudentWorkMarkdown, downloadStudentWorkDoc } from '../utils/exportUtils';
import { 
  Download, 
  FileText, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  FileCode, 
  UserCheck, 
  ChevronDown,
  PenTool
} from 'lucide-react';

interface LaneCardProps {
  lane: LaneData;
  index: number;
  axis: DifferentiationAxis;
  context: string;
  studentAnswer: StudentAnswer;
  feedback: MarkingFeedback | null;
  onAnswerChange: (index: number, answerText: string, studentName: string) => void;
  onMarkAnswer: (index: number) => void;
  isMarking: boolean;
  onOpenPreview: (pkg: StudentWorkPackage) => void;
}

export const LaneCard: React.FC<LaneCardProps> = ({
  lane,
  index,
  axis,
  context,
  studentAnswer,
  feedback,
  onAnswerChange,
  onMarkAnswer,
  isMarking,
  onOpenPreview,
}) => {
  const [pasteWarning, setPasteWarning] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(studentAnswer.studentName || '');

  const tierStyles = {
    Support: {
      bgHead: 'bg-blue-600',
      border: 'border-blue-200 hover:border-blue-300',
      badgeBg: 'bg-blue-600',
      badgeText: 'text-white',
      accentText: 'text-blue-700',
    },
    Core: {
      bgHead: 'bg-indigo-600',
      border: 'border-indigo-200 hover:border-indigo-300',
      badgeBg: 'bg-indigo-600',
      badgeText: 'text-white',
      accentText: 'text-indigo-700',
    },
    Extend: {
      bgHead: 'bg-purple-700',
      border: 'border-purple-200 hover:border-purple-300',
      badgeBg: 'bg-purple-700',
      badgeText: 'text-white',
      accentText: 'text-purple-700',
    },
  }[lane.tier] || {
    bgHead: 'bg-indigo-600',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    accentText: 'text-indigo-700',
  };

  const handlePasteBlock = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setPasteWarning('Pasting or dropping external text is disabled to encourage original typing.');
    setTimeout(() => setPasteWarning(''), 3500);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(index, e.target.value, studentName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStudentName(val);
    onAnswerChange(index, studentAnswer.answerText, val);
  };

  const currentPackage: StudentWorkPackage = {
    id: `work_${lane.tier}_${Date.now()}`,
    taskTitle: lane.task_text,
    context: context || 'General',
    axis,
    tier: lane.tier,
    question: lane.task_text,
    scaffold: lane.scaffold,
    vocab: lane.vocab,
    studentName: studentName || 'Student',
    answerText: studentAnswer.answerText,
    submittedAt: new Date().toISOString(),
    feedback: feedback || undefined,
  };

  return (
    <div className={`rounded-2xl border ${tierStyles.border} bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md`}>
      {/* Header */}
      <div className={`${tierStyles.bgHead} text-white px-5 py-3.5 flex items-center justify-between`}>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-85 block font-medium">Lane Concentration</span>
          <h3 className="font-sans font-bold text-xl leading-tight">{lane.tier} Tier</h3>
        </div>
        <span className="text-xs font-mono bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
          {axis.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Differentiated Question */}
        <div>
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1">
            Differentiated Task
          </h4>
          <p className="font-serif text-base text-slate-900 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {lane.task_text}
          </p>
        </div>

        {/* Scaffold & Key Vocab */}
        <div className="grid grid-cols-1 gap-3 text-xs font-serif">
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1">
              Scaffold / Strategy
            </h4>
            <p className="text-indigo-950 bg-indigo-50/70 p-3 rounded-lg border border-indigo-100/80">
              {lane.scaffold}
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1">
              Key Vocabulary
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {lane.vocab.map((term, i) => (
                <span key={i} className="font-mono text-[11px] bg-purple-50 text-purple-900 border border-purple-200/80 px-2.5 py-1 rounded-full font-medium">
                  {term}
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-t border-slate-200 my-1" />

        {/* Student Response Area */}
        <div className="flex-1 flex flex-col space-y-2 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="font-mono text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-purple-600" />
              Student Response
            </label>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <input
                type="text"
                placeholder="Student Name"
                value={studentName}
                onChange={handleNameChange}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 focus:outline-1 focus:outline-indigo-600 w-32 font-medium"
              />
            </div>
          </div>

          <textarea
            value={studentAnswer.answerText}
            onChange={handleTextChange}
            onPaste={handlePasteBlock}
            onCopy={handlePasteBlock}
            onCut={handlePasteBlock}
            onDrop={handlePasteBlock}
            rows={4}
            placeholder={`Type student response for the ${lane.tier} lane here...`}
            className="w-full font-serif text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all resize-y"
          />

          {pasteWarning && (
            <div className="font-mono text-[11px] text-rose-600 flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200 animate-shake">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              {pasteWarning}
            </div>
          )}

          {/* Action Bar: Submit for Marking Response & Download Work */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => onMarkAnswer(index)}
              disabled={isMarking || !studentAnswer.answerText.trim()}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3.5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs hover:shadow-md"
              title="Submit student work for AI formative marking and feedback"
            >
              {isMarking ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600 group-hover:text-white" />
                  Submitting &amp; Marking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 hover:text-white" />
                  Submit for Marking Response
                </>
              )}
            </button>

            {/* DOWNLOAD WORK BUTTON WITH DROPDOWN */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                title="Download student response, question, and marks"
              >
                <Download className="w-3.5 h-3.5" />
                Download Work
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-20 py-1 font-sans text-xs animate-fadeIn">
                  <div className="px-3 py-1.5 font-mono text-[10px] uppercase text-slate-500 border-b border-slate-100 font-semibold">
                    Download {lane.tier} Work Package
                  </div>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onOpenPreview(currentPackage);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-800 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    Preview Full Worksheet Package
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      downloadStudentWorkPDF(currentPackage);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-800 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Download PDF Report (.pdf)
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      downloadStudentWorkDoc(currentPackage);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-800 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                    Download Word Document (.doc)
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      downloadStudentWorkMarkdown(currentPackage);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-800 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-violet-600" />
                    Download Markdown (.md)
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      window.print();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Save via Browser
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Marking Feedback Display */}
          {feedback && (
            <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 animate-fadeIn shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className={`inline-block font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${tierStyles.badgeBg} ${tierStyles.badgeText}`}>
                    Level: {feedback.level}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Marked &amp; Recorded
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                  Strength
                </span>
                <p className="font-serif text-xs text-slate-900 leading-relaxed">
                  {feedback.strength}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-800 font-bold block">
                  Growth Next Step
                </span>
                <p className="font-serif text-xs text-slate-900 leading-relaxed">
                  {feedback.next_step}
                </p>
              </div>

              {feedback.detailed_feedback && (
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-bold block">
                    Commentary
                  </span>
                  <p className="font-serif text-xs text-slate-700 italic leading-relaxed">
                    "{feedback.detailed_feedback}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
