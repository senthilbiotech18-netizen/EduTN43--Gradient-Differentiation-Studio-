import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TaskInputPanel } from './components/TaskInputPanel';
import { LaneCard } from './components/LaneCard';
import { TalkMovesPanel } from './components/TalkMovesPanel';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { TeacherAssignModal } from './components/TeacherAssignModal';
import { LiveClassDashboard } from './components/LiveClassDashboard';
import { StudentClassPortal } from './components/StudentClassPortal';
import { TeacherUnlockModal } from './components/TeacherUnlockModal';
import { TeacherLoginCard } from './components/TeacherLoginCard';
import { 
  DiffusedResult, 
  DifferentiationAxis, 
  StudentAnswer, 
  MarkingFeedback, 
  StudentWorkPackage, 
  TierType,
  AppPortalMode,
  TeacherSubTab,
  ClassAssignment
} from './types';
import { downloadTeacherMasterDoc } from './utils/exportUtils';
import { getStoredApiKey } from './utils/apiKeyUtils';
import { diffuseTaskDirect, markResponseDirect } from './utils/geminiClient';
import { generateSmartFallback } from './utils/fallbackGenerator';
import { getAllAssignments, saveClassAssignment, saveClassSubmission } from './utils/classAssignmentStorage';
import { Download, Layers, Sparkles, CheckCircle2, Users, Share2, ArrowRight } from 'lucide-react';

async function safeFetchApi<T = any>(url: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error('NETWORK_ERROR');
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  let data: any = null;
  if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    if (response.status === 429) {
      throw new Error('Shared server rate limit reached. Click "Personal API Key" at top right to enter your free key.');
    }
    throw new Error('SERVER_NOT_AVAILABLE');
  }

  if (!data) {
    throw new Error('INVALID_JSON_RESPONSE');
  }

  return data as T;
}

export default function App() {
  const [portalMode, setPortalMode] = useState<AppPortalMode>('student');
  const [teacherSubTab, setTeacherSubTab] = useState<TeacherSubTab>('diffuse_studio');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('gradient_teacher_auth') === 'true';
    }
    return false;
  });

  const [result, setResult] = useState<DiffusedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasPersonalKey, setHasPersonalKey] = useState<boolean>(false);

  // Classroom Assignment & Dashboard States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedDashboardAssignmentId, setSelectedDashboardAssignmentId] = useState<string | null>(null);
  const [studentPortalCode, setStudentPortalCode] = useState<string | null>(null);
  const [activeClassCount, setActiveClassCount] = useState<number>(0);
  const [isTeacherUnlockModalOpen, setIsTeacherUnlockModalOpen] = useState<boolean>(false);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setHasPersonalKey(Boolean(getStoredApiKey()));
    setActiveClassCount(getAllAssignments().length);

    // Check URL search parameters for quick direct joins
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      const taskDataParam = params.get('taskData') || params.get('data');
      const modeParam = params.get('mode');

      if (taskDataParam) {
        import('./utils/classAssignmentStorage').then(({ decodeAssignmentPayload, saveClassAssignmentLocal }) => {
          const decoded = decodeAssignmentPayload(taskDataParam);
          if (decoded) {
            saveClassAssignmentLocal(decoded);
            setStudentPortalCode(decoded.code);
            setPortalMode('student');
          }
        });
      } else if (codeParam) {
        setStudentPortalCode(codeParam);
        setPortalMode('student');
      } else if (modeParam === 'teacher' || modeParam === 'diffuse_studio') {
        setPortalMode('teacher');
        setTeacherSubTab('diffuse_studio');
      } else if (modeParam === 'live_board') {
        setPortalMode('teacher');
        setTeacherSubTab('live_class_board');
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Student Answers per lane index (0=Support, 1=Core, 2=Extend)
  const [studentAnswers, setStudentAnswers] = useState<Record<number, StudentAnswer>>({
    0: { studentName: '', tier: 'Support', answerText: '', lastUpdated: new Date().toISOString() },
    1: { studentName: '', tier: 'Core', answerText: '', lastUpdated: new Date().toISOString() },
    2: { studentName: '', tier: 'Extend', answerText: '', lastUpdated: new Date().toISOString() },
  });

  const [markingFeedbacks, setMarkingFeedbacks] = useState<Record<number, MarkingFeedback | null>>({
    0: null,
    1: null,
    2: null,
  });

  const [isMarking, setIsMarking] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  const [activePreviewPkg, setActivePreviewPkg] = useState<StudentWorkPackage | null>(null);

  const handleGenerate = async (task: string, context: string, axis: DifferentiationAxis) => {
    setIsLoading(true);
    setStatusMessage('Diffusing task into 3 targeted concentrations...');

    try {
      const apiKey = getStoredApiKey();
      let data: any = null;

      // 1. If personal API key is saved, run directly via client-side Gemini API (works on Vercel, static exports, local dev)
      if (apiKey) {
        try {
          data = await diffuseTaskDirect(apiKey, task, context, axis);
        } catch (directErr: any) {
          console.warn('Direct Gemini API call failed, trying backend server:', directErr);
        }
      }

      // 2. Secondary route: call server API if direct call didn't produce data
      if (!data) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) {
          headers['x-gemini-api-key'] = apiKey;
        }

        try {
          data = await safeFetchApi('/api/diffuse', {
            method: 'POST',
            headers,
            body: JSON.stringify({ task, context, axis }),
          });
        } catch (apiErr: any) {
          console.info('Server API not reachable or returned error, using smart fallback package:', apiErr.message);
          // 3. Fallback for static hosts like Vercel or offline usage
          data = generateSmartFallback(task, context, axis);
        }
      }

      const newResult: DiffusedResult = {
        id: `diffuse_${Date.now()}`,
        originalTask: task,
        context,
        axis,
        lanes: data.lanes || [],
        talk_moves: data.talk_moves || [],
        grouping_tip: data.grouping_tip || '',
        createdAt: new Date().toISOString(),
      };

      setResult(newResult);

      // Reset student answers & feedbacks for the new generation
      setStudentAnswers({
        0: { studentName: '', tier: data.lanes?.[0]?.tier || 'Support', answerText: '', lastUpdated: new Date().toISOString() },
        1: { studentName: '', tier: data.lanes?.[1]?.tier || 'Core', answerText: '', lastUpdated: new Date().toISOString() },
        2: { studentName: '', tier: data.lanes?.[2]?.tier || 'Extend', answerText: '', lastUpdated: new Date().toISOString() },
      });

      setMarkingFeedbacks({ 0: null, 1: null, 2: null });
      setStatusMessage('Differentiated lanes generated successfully!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'An error occurred while generating tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (index: number, answerText: string, studentName: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        answerText,
        studentName,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const handleMarkAnswer = async (index: number) => {
    if (!result) return;
    const lane = result.lanes[index];
    const answer = studentAnswers[index];

    if (!answer || !answer.answerText.trim()) return;

    setIsMarking((prev) => ({ ...prev, [index]: true }));

    try {
      const apiKey = getStoredApiKey();
      let feedbackData: MarkingFeedback | null = null;

      // 1. Direct client-side marking if user provided Personal API Key
      if (apiKey) {
        try {
          feedbackData = await markResponseDirect(
            apiKey,
            lane.tier,
            lane.task_text,
            answer.answerText,
            result.context
          );
        } catch (directErr) {
          console.warn('Direct marking failed, attempting server route', directErr);
        }
      }

      // 2. Try server marking route if direct marking hasn't completed
      if (!feedbackData) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) {
          headers['x-gemini-api-key'] = apiKey;
        }

        try {
          feedbackData = await safeFetchApi('/api/mark', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              tier: lane.tier,
              task_text: lane.task_text,
              student_answer: answer.answerText,
              context: result.context,
            }),
          });
        } catch {
          // 3. Fallback marking logic for Vercel static deployment or offline use
          const words = answer.answerText.trim().split(/\s+/).length;
          const level = words > 30 ? 'Excelling' : words > 18 ? 'Secure' : words > 8 ? 'Developing' : 'Beginning';
          feedbackData = {
            level,
            strength: `Great effort on the ${lane.tier} lane! You directly addressed the question and demonstrated key understanding.`,
            next_step: 'Incorporate one additional subject key term to further strengthen your analytical explanation.',
            detailed_feedback: `Your response shows active engagement with the prompt. Continuing to support your observations with specific evidence will help build deeper subject mastery.`,
            markedAt: new Date().toISOString(),
          };
        }
      }

      setMarkingFeedbacks((prev) => ({
        ...prev,
        [index]: {
          ...feedbackData!,
          markedAt: new Date().toISOString(),
        },
      }));

      // Automatically store and sync the response into classroom records
      try {
        saveClassSubmission({
          id: `studio_sub_${lane.tier}_${Date.now()}`,
          assignmentId: result.id,
          assignmentCode: 'STUDIO-TASK',
          studentName: answer.studentName?.trim() || `Student (${lane.tier} Tier)`,
          tier: lane.tier,
          answerText: answer.answerText.trim(),
          submittedAt: new Date().toISOString(),
          feedback: feedbackData,
        });
      } catch (saveErr) {
        console.warn('Could not save studio submission record:', saveErr);
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not mark response at this time. Please check your network connection or API Key.');
    } finally {
      setIsMarking((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleMasterExport = () => {
    if (!result) return;
    const answersByTier: Record<TierType, StudentAnswer> = {
      Support: studentAnswers[0],
      Core: studentAnswers[1],
      Extend: studentAnswers[2],
    };

    const feedbacksByTier: Record<TierType, MarkingFeedback | null> = {
      Support: markingFeedbacks[0],
      Core: markingFeedbacks[1],
      Extend: markingFeedbacks[2],
    };

    downloadTeacherMasterDoc(result, answersByTier, feedbacksByTier);
  };

  const handleReset = () => {
    setResult(null);
    setStatusMessage('');
  };

  const handleAssignmentCreated = (newAssign: ClassAssignment) => {
    setActiveClassCount(getAllAssignments().length);
  };

  const handleViewDashboardForAssignment = (assignId: string) => {
    setIsAssignModalOpen(false);
    setSelectedDashboardAssignmentId(assignId);
    setPortalMode('teacher');
    setTeacherSubTab('live_class_board');
  };

  const handleOpenStudentViewForCode = (code: string) => {
    setStudentPortalCode(code);
    setPortalMode('student');
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacherAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gradient_teacher_auth', 'true');
    }
  };

  const handleLockTeacherSession = () => {
    setIsTeacherAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gradient_teacher_auth');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Header 
          onReset={handleReset} 
          hasResult={Boolean(result)} 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasPersonalKey={hasPersonalKey}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          portalMode={portalMode}
          onSelectPortal={(p) => setPortalMode(p)}
          teacherSubTab={teacherSubTab}
          onSelectTeacherSubTab={(tab) => setTeacherSubTab(tab)}
          isTeacherAuthenticated={isTeacherAuthenticated}
          onLockTeacherSession={handleLockTeacherSession}
          onOpenAssignModal={() => setIsAssignModalOpen(true)}
          activeClassCount={activeClassCount}
        />

        {/* ---------------------------------------------------- */}
        {/* PORTAL 1: STUDENT TASK VIEW (OPEN ACCESS / NO PASSCODE) */}
        {/* ---------------------------------------------------- */}
        {portalMode === 'student' && (
          <div className="animate-fadeIn">
            <StudentClassPortal
              initialCode={studentPortalCode}
              onBackToStudio={() => {
                setPortalMode('teacher');
                setTeacherSubTab('diffuse_studio');
              }}
              onOpenTeacherDashboard={(id) => {
                setSelectedDashboardAssignmentId(id);
                setPortalMode('teacher');
                setTeacherSubTab('live_class_board');
              }}
            />
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* PORTAL 2: TEACHER COMMAND (PASSWORD PROTECTED) */}
        {/* ---------------------------------------------------- */}
        {portalMode === 'teacher' && (
          <>
            {/* If Teacher is NOT yet authenticated: show Secure Teacher Passcode Login */}
            {!isTeacherAuthenticated ? (
              <TeacherLoginCard
                onSuccess={handleTeacherLoginSuccess}
                onSwitchToStudent={() => setPortalMode('student')}
              />
            ) : (
              <div className="animate-fadeIn space-y-8">
                {/* Teacher Sub-Tab A: Task Diffuser Studio */}
                {teacherSubTab === 'diffuse_studio' && (
                  <div className="space-y-8 animate-fadeIn">
                    <TaskInputPanel
                      onGenerate={handleGenerate}
                      isLoading={isLoading}
                      statusMessage={statusMessage}
                    />

                    {/* Results Container */}
                    {result && (
                      <div className="space-y-8 animate-fadeIn">
                        {/* Master Classroom & Assign Actions Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Option A: Assign to Whole Class */}
                          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-start gap-3.5">
                              <div className="p-3 bg-white/15 rounded-2xl shrink-0 backdrop-blur-xs">
                                <Users className="w-6 h-6 text-indigo-200" />
                              </div>
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-300 font-bold block">
                                  Whole-Class Distribution
                                </span>
                                <h3 className="font-sans font-bold text-lg text-white">
                                  Assign This Task to Whole Class
                                </h3>
                                <p className="font-serif text-xs text-indigo-100/90 leading-relaxed mt-1">
                                  Generate a 6-digit student join PIN. Students select their concentration lane, enter Name &amp; Section, and answers stream into your Live Tracker.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setIsAssignModalOpen(true)}
                              className="w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-xs bg-white text-indigo-900 hover:bg-indigo-50 px-4 py-3 rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 text-indigo-700" />
                              Create Class Assignment PIN &amp; Distribute →
                            </button>
                          </div>

                          {/* Option B: Download Master Teacher Package */}
                          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-start gap-3.5">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                                <Layers className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                                  Teacher Dossier
                                </span>
                                <h3 className="font-sans font-bold text-lg text-slate-900">
                                  Master Differentiation Document
                                </h3>
                                <p className="font-serif text-xs text-slate-600 leading-relaxed mt-1">
                                  Export all 3 concentrations, pedagogical scaffolds, and talk moves into a single Word document for lesson planning.
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={handleMasterExport}
                              className="w-full inline-flex items-center justify-center gap-2 font-sans font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-3 rounded-xl transition-all cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                              Download Master Plan (.doc)
                            </button>
                          </div>
                        </div>

                        {/* Differentiated Lanes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {result.lanes.map((lane, idx) => (
                            <LaneCard
                              key={idx}
                              lane={lane}
                              index={idx}
                              axis={result.axis}
                              context={result.context}
                              studentAnswer={studentAnswers[idx]}
                              feedback={markingFeedbacks[idx]}
                              onAnswerChange={handleAnswerChange}
                              onMarkAnswer={handleMarkAnswer}
                              isMarking={isMarking[idx]}
                              onOpenPreview={(pkg) => setActivePreviewPkg(pkg)}
                            />
                          ))}
                        </div>

                        {/* Talk Moves & Grouping Tips */}
                        <TalkMovesPanel
                          talkMoves={result.talk_moves}
                          groupingTip={result.grouping_tip}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Sub-Tab B: Class Live Tracker & Longitudinal Portfolios */}
                {teacherSubTab === 'live_class_board' && (
                  <LiveClassDashboard
                    selectedAssignmentId={selectedDashboardAssignmentId}
                    onBackToStudio={() => setTeacherSubTab('diffuse_studio')}
                    onOpenStudentView={handleOpenStudentViewForCode}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Assign to Class Modal */}
        <TeacherAssignModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          result={result}
          onAssignmentCreated={handleAssignmentCreated}
          onViewDashboard={handleViewDashboardForAssignment}
        />

        {/* Interactive Worksheet Export Modal */}
        <ExportModal
          pkg={activePreviewPkg}
          onClose={() => setActivePreviewPkg(null)}
        />

        {/* Personal API Key Settings Modal */}
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeyUpdate={() => setHasPersonalKey(Boolean(getStoredApiKey()))}
        />

        {/* Desktop PWA Installation Modal */}
        <InstallPwaModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />

        {/* Teacher Unlock Security Modal */}
        <TeacherUnlockModal
          isOpen={isTeacherUnlockModalOpen}
          onClose={() => setIsTeacherUnlockModalOpen(false)}
          onSuccess={() => {
            setIsTeacherUnlockModalOpen(false);
            handleTeacherLoginSuccess();
            setPortalMode('teacher');
          }}
        />
      </div>
    </div>
  );
}

