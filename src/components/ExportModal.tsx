import React from 'react';
import { StudentWorkPackage } from '../types';
import { downloadStudentWorkPDF, downloadStudentWorkMarkdown, downloadStudentWorkDoc, formatDate } from '../utils/exportUtils';
import { X, Download, FileText, FileCode, Printer, CheckCircle } from 'lucide-react';

interface ExportModalProps {
  pkg: StudentWorkPackage | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ pkg, onClose }) => {
  if (!pkg) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/90 font-semibold flex items-center gap-1.5">
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-sans font-bold">EduTN43</span>
              EduTN43 GRADIENT — Classroom Task Differentiation Studio
            </span>
            <h3 className="font-sans font-bold text-lg">
              {pkg.studentName || 'Student'} — {pkg.tier} Tier Differentiated Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Live Document Preview */}
        <div className="p-6 overflow-y-auto space-y-5 font-serif text-sm text-slate-900">
          {/* Metadata */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs font-sans">
            <div>
              <span className="font-mono text-[10px] text-slate-500 uppercase block">Student</span>
              <strong className="text-slate-900 text-sm">{pkg.studentName || 'Anonymous Student'}</strong>
            </div>
            <div>
              <span className="font-mono text-[10px] text-slate-500 uppercase block">Subject / Unit</span>
              <strong className="text-slate-900 text-sm">{pkg.context || 'General Science'}</strong>
            </div>
            <div>
              <span className="font-mono text-[10px] text-slate-500 uppercase block">Differentiation Lane</span>
              <span className="inline-block bg-indigo-600 text-white px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
                {pkg.tier} Tier ({pkg.axis.toUpperCase()})
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-slate-500 uppercase block">Submitted</span>
              <span className="text-slate-600">{formatDate(pkg.submittedAt)}</span>
            </div>
          </div>

          {/* Differentiated Task */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-indigo-700 font-bold mb-1.5">
              1. Differentiated Task
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-800">
              {pkg.question}
            </div>
            {pkg.scaffold && (
              <p className="text-xs text-slate-600 mt-2">
                <strong className="text-slate-800">Scaffold:</strong> {pkg.scaffold}
              </p>
            )}
            {pkg.vocab && pkg.vocab.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                <strong className="text-slate-800">Vocabulary:</strong> {pkg.vocab.join(', ')}
              </p>
            )}
          </div>

          {/* Student Response */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-purple-700 font-bold mb-1.5">
              2. Student Written Response
            </h4>
            <div className="bg-white border-2 border-purple-200 p-4 rounded-xl whitespace-pre-wrap min-h-[80px] shadow-2xs">
              {pkg.answerText.trim() || '[No answer response entered]'}
            </div>
          </div>

          {/* Evaluation / Feedback */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-indigo-700 font-bold mb-1.5">
              3. Formative Feedback
            </h4>
            {pkg.feedback ? (
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <span className="font-mono text-xs font-bold uppercase bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                    {pkg.feedback.level}
                  </span>
                </div>
                <p className="text-xs text-slate-800">
                  <strong className="text-indigo-950">Strength:</strong> {pkg.feedback.strength}
                </p>
                <p className="text-xs text-slate-800">
                  <strong className="text-indigo-950">Next Step:</strong> {pkg.feedback.next_step}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Response not yet marked.</p>
            )}
          </div>
        </div>

        {/* Modal Footer: Download Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="font-mono text-xs text-slate-500">
            Choose download format:
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadStudentWorkPDF(pkg)}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF (.pdf)
            </button>

            <button
              onClick={() => downloadStudentWorkDoc(pkg)}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              Word Doc (.doc)
            </button>

            <button
              onClick={() => downloadStudentWorkMarkdown(pkg)}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              Markdown (.md)
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
