import React, { useState } from 'react';
import { DifferentiationAxis, CurriculumType } from '../types';
import { Sparkles, BookOpen, Layers, Lightbulb, GraduationCap, School, BookMarked } from 'lucide-react';
import { CURRICULUM_CONFIGS, ALL_CURRICULA, getGradesForCurriculum } from '../utils/curriculumConfig';

interface TaskInputPanelProps {
  onGenerate: (task: string, context: string, axis: DifferentiationAxis, curriculum?: CurriculumType, gradeLevel?: string) => void;
  isLoading: boolean;
  statusMessage: string;
}

const SAMPLE_TASKS = [
  {
    label: 'IGCSE FM 4 History: Treaty Analysis',
    curriculum: 'IGCSE' as CurriculumType,
    gradeLevel: 'FM 4',
    subject: 'History',
    topic: 'World War I & Treaty of Versailles',
    axis: 'product' as DifferentiationAxis,
    task: 'Evaluate the reliability and limitations of political cartoons as historical evidence regarding the Treaty of Versailles.'
  },
  {
    label: 'IBMYP MYP 3 Biology: Cell Transport',
    curriculum: 'IBMYP' as CurriculumType,
    gradeLevel: 'MYP 3',
    subject: 'Biology',
    topic: 'Cell Structure & Membrane Transport',
    axis: 'readiness' as DifferentiationAxis,
    task: 'Explain how the structure of a red blood cell relates to its function of transporting oxygen throughout the body.'
  },
  {
    label: 'ICSE Grade 9 Physics: Laws of Motion',
    curriculum: 'ICSE' as CurriculumType,
    gradeLevel: 'Grade 9',
    subject: 'Physics',
    topic: 'Newtonian Dynamics & Inertia',
    axis: 'profile' as DifferentiationAxis,
    task: 'Illustrate and explain the law of inertia using everyday transport scenarios like accelerating buses and sudden stops.'
  },
  {
    label: 'IBDP IBDP 1 Economics: Market Failure',
    curriculum: 'IBDP' as CurriculumType,
    gradeLevel: 'IBDP 1',
    subject: 'Economics & Business Studies',
    topic: 'Negative Externalities of Consumption',
    axis: 'readiness' as DifferentiationAxis,
    task: 'Analyze how indirect taxation can correct market failure caused by negative externalities of consumption.'
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
  
  const [curriculum, setCurriculum] = useState<CurriculumType>('IGCSE');
  const [gradeLevel, setGradeLevel] = useState<string>('FM 3');
  const [subject, setSubject] = useState('Biology');
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('Cells & Membrane Transport');
  const [axis, setAxis] = useState<DifferentiationAxis>('readiness');

  const axisNotes: Record<DifferentiationAxis, string> = {
    readiness: 'Three tiers of the same core objective, scaffolded by how much structured support or open complexity a student needs right now.',
    profile: 'Three entry routes into the objective — visual/diagrammatic, structured text, and hands-on/investigative learning modes.',
    product: 'Same learning goal assessed through three distinct student demonstration styles — structured written, visual model, or practical/spoken.'
  };

  const handleCurriculumChange = (newCurriculum: CurriculumType) => {
    setCurriculum(newCurriculum);
    const availableGrades = getGradesForCurriculum(newCurriculum);
    setGradeLevel(availableGrades[Math.floor(availableGrades.length / 2)] || availableGrades[0]);
  };

  const handleSampleClick = (sample: typeof SAMPLE_TASKS[0]) => {
    setTask(sample.task);
    setCurriculum(sample.curriculum);
    setGradeLevel(sample.gradeLevel);
    setSubject(sample.subject);
    setTopic(sample.topic);
    setAxis(sample.axis);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    const activeSubject = subject === 'Other / Custom Subject' ? (customSubject.trim() || 'General Subject') : subject;
    const formattedContext = `${CURRICULUM_CONFIGS[curriculum]?.label || curriculum} [${gradeLevel}] — ${activeSubject}${topic.trim() ? ` (${topic.trim()})` : ''}`;

    onGenerate(task.trim(), formattedContext, axis, curriculum, gradeLevel);
  };

  const availableGrades = getGradesForCurriculum(curriculum);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-8 transition-all hover:border-indigo-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Task / Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="task-input" className="font-mono text-xs uppercase tracking-wider text-slate-700 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Task, Question, or Prompt to Differentiate
            </label>
            <span className="text-xs text-slate-500 font-mono">Curriculum Aligned Input</span>
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
            Try a curriculum-specific classroom example:
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
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 flex-wrap gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-indigo-900 font-bold flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Curriculum &amp; Grade / Class Mapping
            </span>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full font-medium">
              {CURRICULUM_CONFIGS[curriculum]?.description}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Curriculum System */}
            <div>
              <label htmlFor="curriculum-select" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Select Curriculum
              </label>
              <select
                id="curriculum-select"
                value={curriculum}
                onChange={(e) => handleCurriculumChange(e.target.value as CurriculumType)}
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-bold"
              >
                <option value="IGCSE">IGCSE (Classes FM 1 to FM 5)</option>
                <option value="IBMYP">IB MYP (Classes MYP 1 to MYP 5)</option>
                <option value="ICSE">ICSE (Grades 1 to 10)</option>
                <option value="IBDP">IBDP (Classes IBDP 1 &amp; IBDP 2)</option>
              </select>
            </div>

            {/* 2. Grade / Class Level (Dynamic based on selected curriculum) */}
            <div>
              <label htmlFor="gradelevel-select" className="font-mono text-xs text-slate-700 font-semibold block mb-1">
                Class / Grade Level ({curriculum})
              </label>
              <select
                id="gradelevel-select"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all cursor-pointer shadow-2xs font-bold"
              >
                {availableGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {curriculum === 'IGCSE' && `${grade} (Cambridge Secondary)`}
                    {curriculum === 'IBMYP' && `${grade} (IB Middle Years)`}
                    {curriculum === 'ICSE' && `${grade} (CISCE Syllabus)`}
                    {curriculum === 'IBDP' && `${grade} (IB Diploma Programme)`}
                  </option>
                ))}
              </select>
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
                placeholder="e.g. Design & Technology / Environmental Management"
                className="w-full font-sans text-sm text-slate-900 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-2 focus:outline-indigo-600 transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Topic / Unit Focus & Differentiation Axis */}
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

          {/* Difficulty Tier Calibration Guide */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-600 font-bold">Calibrated for {curriculum} ({gradeLevel}):</span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
              🟢 Support: Scaffolded steps &amp; essential sentence starters
            </span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
              🔵 Core: Standard benchmark for {gradeLevel}
            </span>
            <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-medium">
              🟣 Extend: Deeper synthesis calibrated to {curriculum}
            </span>
          </div>
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
                Diffusing for {curriculum} {gradeLevel}...
              </>
            ) : (
              <>
                Diffuse This Task ({curriculum} • {gradeLevel}) →
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


