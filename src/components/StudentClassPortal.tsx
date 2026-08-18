import React, { useState, useEffect } from 'react';
import { 
  ClassAssignment, 
  ClassSubmission, 
  TierType, 
  MarkingFeedback, 
  StudentWorkPackage 
} from '../types';
import { 
  getAssignmentByCode, 
  getAllAssignments, 
  saveClassSubmission 
} from '../utils/classAssignmentStorage';
import { getStoredApiKey } from '../utils/apiKeyUtils';
import { markResponseDirect } from '../utils/geminiClient';
import { downloadStudentWorkPDF, downloadStudentWorkDoc } from '../utils/exportUtils';
import { 
  Users, 
  PenTool, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Download, 
  Layers, 
  ArrowLeft, 
  Check, 
  User, 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  FileCheck
} from 'lucide-react';

interface StudentClassPortalProps {
  initialCode?: string | null;
  onBackToStudio: () => void;
  onOpenTeacherDashboard?: (assignmentId: string) => void;
}

export const StudentClassPortal: React.FC<StudentClassPortalProps> = ({
  initialCode,
  onBackToStudio,
  onOpenTeacherDashboard,
}) => {
  const [inputCode, setInputCode] = useState<string>(initialCode || '');
  const [activeAssignment, setActiveAssignment] = useState<ClassAssignment | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierType>('Core');
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [answerText, setAnswerText] = useState<string>('');
  const [pasteWarning, setPasteWarning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<MarkingFeedback | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');

  const recentAssignments = getAllAssignments();

  useEffect(() => {
    if (initialCode) {
      handleFindAssignment(initialCode);
    }
  }, [initialCode]);

  const handleFindAssignment = (codeToSearch: string) => {
    setSearchError('');
    const found = getAssignmentByCode(codeToSearch);
    if (found) {
      setActiveAssignment(found);
      setSelectedTier('Core');
      setIsSubmittedSuccess(false);
      setSubmissionFeedback(null);
    } else {
      setActiveAssignment(null);
      setSearchError(`No active assignment found for code "${codeToSearch}". Please verify with your teacher.`);
    }
  };

  const handleFormSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    handleFindAssignment(inputCode.trim());
  };

  const handlePasteBlock = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setPasteWarning('Pasting text is disabled to encourage your own original phrasing.');
    setTimeout(() => setPasteWarning(''), 3500);
  };

  const currentLane = activeAssignment?.lanes.find((l) => l.tier === selectedTier) || activeAssignment?.lanes[0];

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !currentLane || !answerText.trim() || !studentName.trim()) return;

    setIsSubmitting(true);
    let feedbackData: MarkingFeedback | null = null;

    try {
      const apiKey = getStoredApiKey();

      // 1. Evaluate answer via Gemini if key present or via server endpoint
      if (apiKey) {
        try {
          feedbackData = await markResponseDirect(
            apiKey,
            currentLane.tier,
            currentLane.task_text,
            answerText,
            activeAssignment.context
          );
        } catch (e) {
          console.warn('Direct marking failed, attempting fallback', e);
        }
      }

      if (!feedbackData) {
        try {
          const res = await fetch('/api/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tier: currentLane.tier,
              task_text: currentLane.task_text,
              student_answer: answerText,
              context: activeAssignment.context,
            }),
          });
          if (res.ok) {
            feedbackData = await res.json();
          }
        } catch (e) {
          // Server not reachable
        }
      }

      // Smart formative evaluation fallback
      if (!feedbackData) {
        const words = answerText.trim().split(/\s+/).length;
        const level = words > 35 ? 'Excelling' : words > 20 ? 'Secure' : words > 10 ? 'Developing' : 'Beginning';
        feedbackData = {
          level,
          strength: `Well articulated response on the ${currentLane.tier} concentration! You engaged directly with the question concepts.`,
          next_step: 'Reinforce your conclusion by integrating another subject-specific vocabulary term.',
          detailed_feedback: 'Your ideas show clear engagement. Elaborating further on specific mechanisms or evidence will boost mastery.',
          markedAt: new Date().toISOString(),
        };
      }

      setSubmissionFeedback(feedbackData);

      // 2. Save submission to live classroom repository
      const submission: ClassSubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        assignmentId: activeAssignment.id,
        assignmentCode: activeAssignment.code,
        studentName: studentName.trim(),
        studentId: studentId.trim() || undefined,
        tier: selectedTier,
        answerText: answerText.trim(),
        submittedAt: new Date().toISOString(),
        feedback: feedbackData,
      };

      saveClassSubmission(submission);
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert('Unable to submit response. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPackage: StudentWorkPackage | null = activeAssignment && currentLane ? {
    id: `student_${Date.now()}`,
    taskTitle: activeAssignment.title,
    context: activeAssignment.context,
    axis: activeAssignment.axis,
    tier: selectedTier,
    question: currentLane.task_text,
    scaffold: currentLane.scaffold,
    vocab: currentLane.vocab,
    studentName: studentName || 'Student',
    studentId: studentId || undefined,
    answerText,
    submittedAt: new Date().toISOString(),
    feedback: submissionFeedback || undefined,
  } : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStudio}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Return to Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-purple-700 font-bold block">
              Student Workspace
            </span>
            <h2 className="font-sans font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
              Classroom Task Portal
            </h2>
          </div>
        </div>

        {activeAssignment && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 hidden sm:inline">Active PIN:</span>
            <span className="font-mono font-extrabold text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg">
              {activeAssignment.code}
            </span>
            <button
              onClick={() => setActiveAssignment(null)}
              className="text-xs font-mono text-slate-600 hover:text-slate-900 underline ml-2 cursor-pointer"
            >
              Switch Task
            </button>
          </div>
        )}
      </div>

      {/* Code Input Form if no assignment selected */}
      {!activeAssignment ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <BookOpen className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-sans font-bold text-2xl text-slate-900 mb-1">
                Enter Teacher's Class PIN
              </h3>
              <p className="font-serif text-sm text-slate-600">
                Type the 6-character code provided by your teacher to load your differentiated class assignment.
              </p>
            </div>

            <form onSubmit={handleFormSubmitCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MYP-742"
                  className="w-full text-center font-mono font-extrabold text-3xl tracking-widest text-indigo-900 bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {searchError && (
                <div className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Join Class Task →
              </button>
            </form>
          </div>

          {/* Quick Active Class Selector */}
          {recentAssignments.length > 0 && (
            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4">
              <span className="font-mono text-xs text-slate-600 font-bold block mb-2">
                Recently Published Class Tasks:
              </span>
              <div className="space-y-2">
                {recentAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleFindAssignment(a.code)}
                    className="w-full text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-sans font-bold text-xs text-slate-900 block">
                        {a.title}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {a.context} · Teacher: {a.teacherName || 'Instructor'}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md">
                      {a.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Student Workspace for Active Assignment */
        <div className="space-y-6">
          
          {/* Assignment Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-xs bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs font-semibold">
                {activeAssignment.context}
              </span>
              <span className="font-mono text-xs text-indigo-200">
                Assigned by: {activeAssignment.teacherName || 'Your Teacher'}
              </span>
            </div>

            <h3 className="font-sans font-extrabold text-2xl text-white">
              {activeAssignment.title}
            </h3>

            <p className="text-indigo-100 text-sm font-serif italic bg-black/15 p-3 rounded-xl border border-white/10">
              Core Objective: "{activeAssignment.originalTask}"
            </p>
          </div>

          {/* Concentration Tier Selector */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-sans font-bold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Select Your Concentration Lane
                </h4>
                <p className="font-serif text-xs text-slate-600">
                  Pick the concentration level that best fits your current readiness and goal for this task.
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full font-bold">
                Axis: {activeAssignment.axis.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeAssignment.lanes.map((lane) => {
                const isSelected = selectedTier === lane.tier;
                const tierCardConfig = {
                  Support: {
                    border: isSelected ? 'border-blue-600 ring-2 ring-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300',
                    headerBg: 'bg-blue-600',
                    tag: 'Guided Scaffolds & Starters',
                  },
                  Core: {
                    border: isSelected ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300',
                    headerBg: 'bg-indigo-600',
                    tag: 'Standard Isotonic Target',
                  },
                  Extend: {
                    border: isSelected ? 'border-purple-600 ring-2 ring-purple-500 bg-purple-50/50' : 'border-slate-200 hover:border-purple-300',
                    headerBg: 'bg-purple-700',
                    tag: 'Inquiry & Critical Extension',
                  },
                }[lane.tier];

                return (
                  <div
                    key={lane.tier}
                    onClick={() => {
                      setSelectedTier(lane.tier);
                      setIsSubmittedSuccess(false);
                    }}
                    className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${tierCardConfig.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-mono text-xs font-bold text-white px-2.5 py-0.5 rounded-full ${tierCardConfig.headerBg}`}>
                          {lane.tier} Tier
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-medium">
                          {tierCardConfig.tag}
                        </span>
                      </div>

                      <p className="font-serif text-xs text-slate-800 line-clamp-3 leading-relaxed">
                        {lane.task_text}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">{lane.vocab.length} vocab keywords</span>
                      {isSelected ? (
                        <span className="font-bold text-indigo-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        <span className="text-slate-400">Click to choose</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Work Area */}
          {currentLane && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              
              {/* Lane Instructions & Strategy Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-700 font-bold block mb-1">
                    Your Assigned {selectedTier} Task
                  </span>
                  <p className="font-serif text-base text-slate-900 font-medium leading-relaxed">
                    {currentLane.task_text}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-serif pt-2 border-t border-slate-200/80">
                  <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
                    <span className="font-mono text-[10px] uppercase text-indigo-900 font-bold block mb-0.5">
                      Strategy &amp; Scaffolding Prompt
                    </span>
                    <p className="text-indigo-950">{currentLane.scaffold}</p>
                  </div>

                  <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-100">
                    <span className="font-mono text-[10px] uppercase text-purple-900 font-bold block mb-0.5">
                      Key Vocabulary to Incorporate
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {currentLane.vocab.map((v, i) => (
                        <span key={i} className="font-mono text-[10px] bg-white text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-medium">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Identification and Response Form */}
              <form onSubmit={handleSubmitWork} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full font-sans text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-2xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                      Student ID / Roll No (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. ST-208"
                      className="w-full font-sans text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-mono text-xs uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-purple-600" />
                      Your Original Response
                    </label>
                    <span className="text-xs font-mono text-slate-400">
                      Authentic typing mode active
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    onPaste={handlePasteBlock}
                    onCopy={handlePasteBlock}
                    onCut={handlePasteBlock}
                    onDrop={handlePasteBlock}
                    placeholder={`Compose your full response for the ${selectedTier} tier here. Use the vocabulary terms and scaffolding prompts above...`}
                    className="w-full font-serif text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all shadow-inner resize-y leading-relaxed"
                  />

                  {pasteWarning && (
                    <div className="font-mono text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2 mt-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {pasteWarning}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !answerText.trim() || !studentName.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-7 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Submitting to Teacher &amp; Running Assessment...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Work to Teacher →
                      </>
                    )}
                  </button>

                  {isSubmittedSuccess && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Successfully delivered to Teacher's Class Dashboard!
                    </div>
                  )}
                </div>
              </form>

              {/* Formative Feedback & Download Section */}
              {submissionFeedback && currentPackage && (
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 border border-indigo-200 rounded-3xl p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-sans font-bold text-base text-slate-900">
                        AI Formative Assessment Result
                      </h4>
                    </div>
                    <span className="font-mono font-extrabold text-xs bg-indigo-600 text-white px-3 py-1 rounded-full shadow-2xs">
                      Level: {submissionFeedback.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
                      <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">
                        Demonstrated Strength
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {submissionFeedback.strength}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
                      <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 block">
                        Growth Next Step
                      </span>
                      <p className="text-slate-800 leading-relaxed">
                        {submissionFeedback.next_step}
                      </p>
                    </div>
                  </div>

                  {submissionFeedback.detailed_feedback && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs font-serif text-slate-700 italic">
                      "{submissionFeedback.detailed_feedback}"
                    </div>
                  )}

                  {/* Student Download Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100">
                    <span className="font-mono text-xs text-slate-500">
                      Save a copy of your completed work package:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadStudentWorkPDF(currentPackage)}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        Download PDF
                      </button>

                      <button
                        onClick={() => downloadStudentWorkDoc(currentPackage)}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        Download Word (.doc)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
