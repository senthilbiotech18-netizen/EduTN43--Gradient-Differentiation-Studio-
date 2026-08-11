import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TaskInputPanel } from './components/TaskInputPanel';
import { LaneCard } from './components/LaneCard';
import { TalkMovesPanel } from './components/TalkMovesPanel';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { 
  DiffusedResult, 
  DifferentiationAxis, 
  StudentAnswer, 
  MarkingFeedback, 
  StudentWorkPackage, 
  TierType 
} from './types';
import { downloadTeacherMasterDoc } from './utils/exportUtils';
import { getStoredApiKey } from './utils/apiKeyUtils';
import { Download, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [result, setResult] = useState<DiffusedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasPersonalKey, setHasPersonalKey] = useState<boolean>(false);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setHasPersonalKey(Boolean(getStoredApiKey()));

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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const response = await fetch('/api/diffuse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ task, context, axis }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate differentiated tasks.');
      }

      const data = await response.json();

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
        0: { studentName: '', tier: data.lanes[0]?.tier || 'Support', answerText: '', lastUpdated: new Date().toISOString() },
        1: { studentName: '', tier: data.lanes[1]?.tier || 'Core', answerText: '', lastUpdated: new Date().toISOString() },
        2: { studentName: '', tier: data.lanes[2]?.tier || 'Extend', answerText: '', lastUpdated: new Date().toISOString() },
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const response = await fetch('/api/mark', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: lane.tier,
          task_text: lane.task_text,
          student_answer: answer.answerText,
          context: result.context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark student response.');
      }

      const feedbackData: MarkingFeedback = await response.json();
      setMarkingFeedbacks((prev) => ({
        ...prev,
        [index]: {
          ...feedbackData,
          markedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      console.error(err);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Header 
          onReset={handleReset} 
          hasResult={Boolean(result)} 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasPersonalKey={hasPersonalKey}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        <TaskInputPanel
          onGenerate={handleGenerate}
          isLoading={isLoading}
          statusMessage={statusMessage}
        />

        {/* Results Container */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
            {/* Master Classroom Export Bar */}
            <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-sm-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900">
                    Master Classroom Differentiation Package
                  </h3>
                  <p className="font-mono text-xs text-slate-600">
                    Export all 3 lanes, student answers, and teacher talk moves into a single master document.
                  </p>
                </div>
              </div>

              <button
                onClick={handleMasterExport}
                className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Download Master Package (.doc)
              </button>
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
      </div>
    </div>
  );
}
