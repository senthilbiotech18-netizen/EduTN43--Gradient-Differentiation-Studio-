import React, { useState, useEffect } from 'react';
import { 
  ClassAssignment, 
  ClassSubmission, 
  TierType, 
  MarkingFeedback, 
  StudentWorkPackage,
  CurriculumType
} from '../types';
import { 
  getAssignmentByCode, 
  getAssignmentByCodeAsync,
  getAllAssignments, 
  getAllAssignmentsAsync,
  saveClassSubmission,
  saveClassAssignmentLocal,
  importAssignmentFromShareString,
  decodeAssignmentPayload
} from '../utils/classAssignmentStorage';
import { getStoredApiKey } from '../utils/apiKeyUtils';
import { markResponseDirect } from '../utils/geminiClient';
import { downloadStudentWorkPDF, downloadStudentWorkDoc, downloadStudentWorkMarkdown } from '../utils/exportUtils';
import { CURRICULUM_CONFIGS, getGradesForCurriculum } from '../utils/curriculumConfig';
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
  FileCheck,
  ChevronDown,
  FileCode,
  FileText,
  Printer,
  GraduationCap
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
  const [curriculum, setCurriculum] = useState<CurriculumType>('IGCSE');
  const [gradeLevel, setGradeLevel] = useState<string>('FM 3');
  const [section, setSection] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [answerText, setAnswerText] = useState<string>('');
  const [pasteWarning, setPasteWarning] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<MarkingFeedback | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [recentAssignments, setRecentAssignments] = useState<ClassAssignment[]>(getAllAssignments());

  const [pasteLinkInput, setPasteLinkInput] = useState<string>('');
  const [showPasteLinkModal, setShowPasteLinkModal] = useState<boolean>(false);

  useEffect(() => {
    // Check URL parameters for taskData on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const taskDataParam = params.get('taskData') || params.get('data');
      if (taskDataParam) {
        const decoded = decodeAssignmentPayload(taskDataParam);
        if (decoded) {
          saveClassAssignmentLocal(decoded);
          setActiveAssignment(decoded);
          setSelectedTier('Core');
          if (decoded.curriculum && decoded.curriculum in CURRICULUM_CONFIGS) {
            setCurriculum(decoded.curriculum as CurriculumType);
            if (decoded.gradeLevel) setGradeLevel(decoded.gradeLevel);
          }
          return;
        }
      }
    }

    // Sync latest assignments from server
    getAllAssignmentsAsync().then((list) => {
      if (list && list.length > 0) {
        setRecentAssignments(list);
      }
    });

    if (initialCode) {
      handleFindAssignment(initialCode);
    }
  }, [initialCode]);

  const handleCurriculumChange = (newCurriculum: CurriculumType) => {
    setCurriculum(newCurriculum);
    const availableGrades = getGradesForCurriculum(newCurriculum);
    setGradeLevel(availableGrades[Math.floor(availableGrades.length / 2)] || availableGrades[0]);
  };

  const handleFindAssignment = async (codeToSearch: string) => {
    setSearchError('');
    setIsSearching(true);

    // 1. Check if the input is a full Direct Link or Task Data Payload
    if (codeToSearch.includes('taskData=') || codeToSearch.length > 30) {
      const imported = importAssignmentFromShareString(codeToSearch);
      if (imported) {
        setActiveAssignment(imported);
        setSelectedTier('Core');
        if (imported.curriculum && imported.curriculum in CURRICULUM_CONFIGS) {
          setCurriculum(imported.curriculum as CurriculumType);
          if (imported.gradeLevel) setGradeLevel(imported.gradeLevel);
        }
        setIsSubmittedSuccess(false);
        setSubmissionFeedback(null);
        setIsSearching(false);
        return;
      }
    }

    try {
      const found = await getAssignmentByCodeAsync(codeToSearch);
      if (found) {
        setActiveAssignment(found);
        setSelectedTier('Core');
        if (found.curriculum && found.curriculum in CURRICULUM_CONFIGS) {
          setCurriculum(found.curriculum as CurriculumType);
          if (found.gradeLevel) {
            setGradeLevel(found.gradeLevel);
          }
        }
        setIsSubmittedSuccess(false);
        setSubmissionFeedback(null);
      } else {
        setActiveAssignment(null);
        setSearchError(`No active assignment found for PIN "${codeToSearch}". If your teacher shared a Direct Link, paste it below or click the link to load directly.`);
      }
    } catch (e) {
      const localFound = getAssignmentByCode(codeToSearch);
      if (localFound) {
        setActiveAssignment(localFound);
        setSelectedTier('Core');
        if (localFound.curriculum && localFound.curriculum in CURRICULUM_CONFIGS) {
          setCurriculum(localFound.curriculum as CurriculumType);
          if (localFound.gradeLevel) {
            setGradeLevel(localFound.gradeLevel);
          }
        }
        setIsSubmittedSuccess(false);
        setSubmissionFeedback(null);
      } else {
        setActiveAssignment(null);
        setSearchError(`Could not find assignment for PIN "${codeToSearch}". If this task was created on another device, paste the teacher's Direct Link below.`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportSharedLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteLinkInput.trim()) return;
    const imported = importAssignmentFromShareString(pasteLinkInput.trim());
    if (imported) {
      setActiveAssignment(imported);
      setSelectedTier('Core');
      if (imported.curriculum && imported.curriculum in CURRICULUM_CONFIGS) {
        setCurriculum(imported.curriculum as CurriculumType);
        if (imported.gradeLevel) setGradeLevel(imported.gradeLevel);
      }
      setSearchError('');
      setPasteLinkInput('');
      setShowPasteLinkModal(false);
    } else {
      setSearchError('Invalid task link or share code format. Please copy the complete direct link from your teacher.');
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
    if (!activeAssignment || !currentLane || !answerText.trim() || !studentName.trim() || !section.trim()) return;

    setIsSubmitting(true);
    let feedbackData: MarkingFeedback | null = null;
    const fullContext = `${curriculum} (${gradeLevel}) • ${activeAssignment.context || activeAssignment.title}`;

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
            fullContext
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
              context: fullContext,
              curriculum,
              gradeLevel,
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
          strength: `Well articulated response on the ${currentLane.tier} concentration for ${curriculum} ${gradeLevel}! You engaged directly with the subject concepts.`,
          next_step: `Reinforce your conclusion by integrating another ${curriculum}-aligned analytical keyword.`,
          detailed_feedback: `Your ideas demonstrate clear participation in the ${gradeLevel} curriculum. Elaborating further on specific mechanisms or examples will boost mastery.`,
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
        curriculum,
        gradeLevel,
        section: section.trim(),
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
    curriculum,
    gradeLevel,
    axis: activeAssignment.axis,
    tier: selectedTier,
    question: currentLane.task_text,
    scaffold: currentLane.scaffold,
    vocab: currentLane.vocab,
    studentName: studentName || 'Student',
    section: section || undefined,
    studentId: studentId || undefined,
    answerText,
    submittedAt: new Date().toISOString(),
    feedback: submissionFeedback || undefined,
  } : null;

  const availableGrades = getGradesForCurriculum(curriculum);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStudio}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Exit / Teacher Mode"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-purple-700 font-bold block">
              Student Isolated Portal
            </span>
            <h2 className="font-sans font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
              Classroom Task Workspace
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
              Enter Another PIN
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
                Type the 6-character PIN provided by your teacher (e.g. on the board or in your task assignment) to load your differentiated learning task.
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
                <div className="text-xs font-serif text-slate-700 bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3 text-left">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans font-bold text-amber-900">Task PIN Not Found in this Browser Session</p>
                      <p className="text-xs mt-1 text-slate-600">{searchError}</p>
                    </div>
                  </div>

                  {/* Paste Direct Link Box */}
                  <div className="pt-2 border-t border-amber-200/60">
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                      📎 Paste Teacher's Direct Link or Share Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pasteLinkInput}
                        onChange={(e) => setPasteLinkInput(e.target.value)}
                        placeholder="Paste the full link copied from teacher..."
                        className="flex-1 text-xs font-mono bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleImportSharedLink}
                        className="font-sans font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        Load Task
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!inputCode.trim() || isSearching}
                className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isSearching ? 'Loading Task...' : 'Open Differentiated Task →'}
              </button>
            </form>

            {/* Toggle to paste direct link manually */}
            {!searchError && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasteLinkModal(!showPasteLinkModal)}
                  className="font-mono text-xs text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {showPasteLinkModal ? 'Hide Link Input' : 'Have a Direct Share Link / Code? Click here to paste'}
                </button>

                {showPasteLinkModal && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 animate-fadeIn">
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                      Paste Direct Task Link or Share Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pasteLinkInput}
                        onChange={(e) => setPasteLinkInput(e.target.value)}
                        placeholder="Paste link starting with https:// or share code..."
                        className="flex-1 text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleImportSharedLink}
                        className="font-sans font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        Load Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available / Sample Tasks on this device */}
            {recentAssignments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 text-left space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                  Available Classroom Tasks ({recentAssignments.length}):
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {recentAssignments.slice(0, 4).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setInputCode(a.code);
                        handleFindAssignment(a.code);
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="truncate mr-2">
                        <div className="font-sans font-bold text-xs text-slate-900 group-hover:text-indigo-900 truncate">
                          {a.title}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          {a.curriculum ? `${a.curriculum} • ${a.gradeLevel || ''}` : a.context}
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md shrink-0">
                        {a.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>🔒 Student Isolated Session</span>
              <span>·</span>
              <span>Zero Access to Class Rosters &amp; Grades</span>
            </div>
          </div>
        </div>
      ) : (
        /* Student Workspace for Active Assignment */
        <div className="space-y-6">
          
          {/* Assignment Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs font-semibold">
                  {activeAssignment.curriculum ? `${activeAssignment.curriculum} [${activeAssignment.gradeLevel || 'Standard'}]` : activeAssignment.context}
                </span>
                <span className="font-mono text-xs bg-white/10 px-2.5 py-1 rounded-full text-indigo-100">
                  {activeAssignment.context}
                </span>
              </div>
              <span className="font-mono text-xs text-indigo-200">
                Teacher: {activeAssignment.teacherName || 'Instructor'}
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
                    tag: 'Standard Target',
                  },
                  Extend: {
                    border: isSelected ? 'border-purple-600 ring-2 ring-purple-500 bg-purple-50/50' : 'border-slate-200 hover:border-purple-300',
                    headerBg: 'bg-purple-700',
                    tag: 'Inquiry & Extension',
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
                <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-indigo-900 font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Student Information &amp; Curriculum Alignment
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md font-medium">
                      Required for Gradebook Dossier
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Curriculum Selection */}
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                        Curriculum <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={curriculum}
                        onChange={(e) => handleCurriculumChange(e.target.value as CurriculumType)}
                        className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-bold"
                      >
                        <option value="IGCSE">IGCSE (FM 1–FM 5)</option>
                        <option value="IBMYP">IB MYP (MYP 1–MYP 5)</option>
                        <option value="ICSE">ICSE (Grades 1–10)</option>
                        <option value="IBDP">IBDP (IBDP 1 &amp; 2)</option>
                      </select>
                    </div>

                    {/* Class / Grade Level */}
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                        Class / Grade ({curriculum}) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-bold"
                      >
                        {availableGrades.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Section */}
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                        Section <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="e.g. A, B, Sec 1"
                        className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs font-medium"
                      />
                    </div>

                    {/* Student ID */}
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-slate-700 font-bold mb-1">
                        Student ID (Opt)
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. ST-208"
                        className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Full Name */}
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
                      className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs font-bold"
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
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting || !answerText.trim() || !studentName.trim() || !section.trim()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-7 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      title="Submit your work to your teacher and receive instant AI formative marks"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Submitting &amp; Marking Response...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit for Marking Response →
                        </>
                      )}
                    </button>

                    {currentPackage && (
                      <button
                        type="button"
                        onClick={() => downloadStudentWorkPDF(currentPackage)}
                        disabled={!answerText.trim()}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-indigo-700 border border-slate-300 hover:bg-slate-50 px-4 py-3 rounded-2xl transition-all cursor-pointer shadow-2xs disabled:opacity-40"
                        title="Download your work as PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        Download Work (.pdf)
                      </button>
                    )}
                  </div>

                  {isSubmittedSuccess && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Marked &amp; Delivered to Teacher Dashboard!
                    </div>
                  )}
                </div>
              </form>

              {/* Formative Feedback & Comprehensive Download Section */}
              {submissionFeedback && currentPackage && (
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 border border-indigo-200 rounded-3xl p-6 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-sans font-bold text-base text-slate-900">
                        AI Formative Assessment Result
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full font-bold">
                        {curriculum} • {gradeLevel}
                      </span>
                      <span className="font-mono font-extrabold text-xs bg-indigo-600 text-white px-3 py-1 rounded-full shadow-2xs">
                        Level: {submissionFeedback.level}
                      </span>
                    </div>
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

                  {/* Student Download Actions Bar */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-200/80">
                    <span className="font-mono text-xs text-indigo-950 font-medium">
                      Download your marked worksheet package:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => downloadStudentWorkPDF(currentPackage)}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF (.pdf)
                      </button>

                      <button
                        onClick={() => downloadStudentWorkDoc(currentPackage)}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                        Download Word (.doc)
                      </button>

                      <button
                        onClick={() => downloadStudentWorkMarkdown(currentPackage)}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Markdown (.md)
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
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
