import React, { useState } from 'react';
import { DifferentiationAxis } from '../types';
import { Sparkles, BookOpen, Layers, Lightbulb, GraduationCap, School, BookMarked } from 'lucide-react';

interface TaskInputPanelProps {
  onGenerate: (task: string, context: string, axis: DifferentiationAxis) => void;
  isLoading: boolean;
  statusMessage: string;
}

type CurriculumSystem = 'IB MYP' | 'Cambridge IGCSE';

const SAMPLE_TASKS = [
  {
    label: 'IB MYP 2 Biology: Cell Structure',
    curriculum: 'IB MYP' as CurriculumSystem,
    yearGroup: 'MYP 2',
    subject: 'Biology',
    topic: 'Cell Structure & Membrane Transport',
    axis: 'readiness' as DifferentiationAxis,
    task: 'Explain how the structure of a red blood cell relates to its function of transporting oxygen throughout the body.'
  },
  {
    label: 'IGCSE FM4 History: Treaty of Versailles',
    curriculum: 'Cambridge IGCSE' as CurriculumSystem,
    yearGroup: 'FM4',
    subject: 'History',
    topic: 'World War I & Treaty Analysis',
    axis: 'product' as DifferentiationAxis,
    task: 'Evaluate the reliability and limitations of political cartoons as historical evidence regarding the Treaty of Versailles.'
  },
  {
    label: 'IB MYP 4 English: Symbolism Analysis',
    curriculum: 'IB MYP' as CurriculumSystem,
    yearGroup: 'MYP 4',
    subject: 'English Language & Literature',
    topic: 'Dystopian Literature & Imagery',
    axis: 'profile' as DifferentiationAxis,
    task: 'Analyze how the author uses imagery and symbolism to develop the theme of isolation in Chapter 3.'
  }
];

const SUBJECT_OPTIONS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Integrated Science',
  'Mathematics',
  'English Language & Literature',
  'History',
  'Geography',
  'Economics & Business Studies',
  'Global Perspectives / Individuals & Societies',
  'Computer Science & ICT',
  'Visual Arts',
  'Other / Custom Subject'
];

export const TaskInputPanel: React.FC<TaskInputPanelProps> = ({
  onGenerate,
  isLoading,
  statusMessage
}) => {
  const [task, setTask] = useState(
    'Explain how the structure of a red blood cell relates to its function of transporting oxygen.'
  );
  
  const [curriculum, setCurriculum] = useState<CurriculumSystem>('IB MYP');
  const [yearGroup, setYearGroup] = useState('MYP 2');
  const [subject, setSubject] = useState('Biology');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('Cells & Membrane Transport');
  const [axis, setAxis] = useState<DifferentiationAxis>('readiness');

  const axisNotes: Record<DifferentiationAxis, string> = {
    readiness: 'Three tiers of the same core objective, scaffolded by how much structured support or open complexity a student needs right now.',
    profile: 'Three entry routes into the objective — visual/diagrammatic, structured text, and hands-on/investigative learning modes.',
    product: 'Same learning goal assessed through three distinct student demonstration styles — structured written, visual model, or practical/spoken.'
  };

  const handleCurriculumChange = (newCurriculum: CurriculumSystem) => {
    setCurriculum(newCurriculum);
    if (newCurriculum === 'IB MYP') {
      setYearGroup('MYP 2');
    } else {
      setYearGroup('FM2');
    }
  };

  const handleSampleClick = (sample: typeof SAMPLE_TASKS[0]) => {
    setTask(sample.task);
    setCurriculum(sample.curriculum);
    setYearGroup(sample.yearGroup);
    setSubject(sample.subject);
    setTopic(sample.topic);
    setAxis(sample.axis);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    const activeSubject = subject === 'Other / Custom Subject' ? (customSubject.trim() || 'General Subject') : subject;
    const formattedContext = `${curriculum} ${yearGroup} — ${activeSubject}${topic.trim() ? ` (${topic.trim()})` : ''}`;

    onGenerate(task.trim(), formattedContext, axis);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-8 transition-all hover:border-indigo-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Task / Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="task-input" className="font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Task, Question, or Reading Passage to Differentiate
            </label>
            <span className="text-xs text-slate-500 font-mono">Input core material</span>
          </div>
          <textarea
            id="task-input"
            rows={4}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Explain how the structure of a red blood cell relates to its function of transporting oxygen."
            className="w-full font-serif text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all resize-y shadow-2xs"
          />
        </div>

        {/* Quick Sample Presets */}
        <div>
          <span className="text-xs font-mono text-slate-600 flex items-center gap-1 mb-2 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
            Try a quick classroom example:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TASKS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="text-xs font-mono bg-indigo-50/70 hover:bg-indigo-600 hover:text-white text-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-200/80 transition-all cursor-pointer font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Curriculum, Class Year & Subject Selection */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <span className="font-mono text-xs uppercase tracking-wider text-indigo-900 font-bold flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Class Level &amp; Curriculum Alignment
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
              Middle School &amp; High School Only (Max MYP 5 / FM 5)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Curriculum System */}
            <div>
              <label htmlFor="curriculum-select" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Curriculum Framework
              </label>
              <select
                id="curriculum-select"
                value={curriculum}
                onChange={(e) => handleCurriculumChange(e.target.value as CurriculumSystem)}
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-medium"
              >
                <option value="IB MYP">IB MYP (Middle Years Programme)</option>
                <option value="Cambridge IGCSE">Cambridge IGCSE</option>
              </select>
            </div>

            {/* 2. Year Group / Class */}
            <div>
              <label htmlFor="yeargroup-select" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Class / Year Group Level
              </label>
              {curriculum === 'IB MYP' ? (
                <select
                  id="yeargroup-select"
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                  className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-medium"
                >
                  <option value="MYP 1">MYP 1 (Grade 6 / Age 11-12)</option>
                  <option value="MYP 2">MYP 2 (Grade 7 / Age 12-13)</option>
                  <option value="MYP 3">MYP 3 (Grade 8 / Age 13-14)</option>
                  <option value="MYP 4">MYP 4 (Grade 9 / Age 14-15)</option>
                  <option value="MYP 5">MYP 5 (Grade 10 / Age 15-16 — Max MYP)</option>
                </select>
              ) : (
                <select
                  id="yeargroup-select"
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                  className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-medium"
                >
                  <option value="FM1">FM1 (Year 7 / Stage 7)</option>
                  <option value="FM2">FM2 (Year 8 / Stage 8)</option>
                  <option value="FM3">FM3 (Year 9 / Stage 9)</option>
                  <option value="FM4">FM4 (Year 10 / Stage 10)</option>
                  <option value="FM5">FM5 (Year 11 / Stage 11 — Max IGCSE)</option>
                </select>
              )}
            </div>

            {/* 3. Subject Selection */}
            <div>
              <label htmlFor="subject-select" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Subject Area
              </label>
              <select
                id="subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-medium"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Subject Input if 'Other' selected */}
          {subject === 'Other / Custom Subject' && (
            <div>
              <label htmlFor="custom-subject" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Specify Custom Subject
              </label>
              <input
                id="custom-subject"
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Design & Technology / Environmental Science"
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Topic / Unit Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label htmlFor="topic-input" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Unit / Topic Focus (Optional)
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cells & Membrane Transport"
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs"
              />
            </div>

            {/* Differentiation Axis */}
            <div>
              <label htmlFor="axis-select" className="font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Differentiate By
              </label>
              <select
                id="axis-select"
                value={axis}
                onChange={(e) => setAxis(e.target.value as DifferentiationAxis)}
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-medium"
              >
                <option value="readiness">Readiness (Support / Core / Extend Tiers)</option>
                <option value="profile">Learning Profile (Visual / Text / Practical)</option>
                <option value="product">Product Choice (Written / Visual / Spoken)</option>
              </select>
            </div>
          </div>

          <p className="font-mono text-xs text-slate-500 pt-1 leading-normal">
            {axisNotes[axis]}
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-sm-center justify-between gap-3">
          <button
            type="submit"
            disabled={isLoading || !task.trim()}
            className="inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Diffusing Across Concentrated Lanes...
              </>
            ) : (
              <>
                Diffuse This Task →
              </>
            )}
          </button>

          {statusMessage && (
            <div className="font-mono text-xs text-slate-600 flex items-center gap-2 self-center">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              {statusMessage}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

