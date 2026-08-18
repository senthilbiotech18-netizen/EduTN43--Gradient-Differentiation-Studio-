import React, { useState, useEffect } from 'react';
import { ClassAssignment, ClassSubmission, TierType } from '../types';
import { 
  getAllAssignments, 
  getSubmissionsForAssignment, 
  subscribeToClassUpdates,
  exportClassSubmissionsCsv,
  exportClassMasterDoc,
  deleteClassAssignment
} from '../utils/classAssignmentStorage';
import { 
  Users, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowLeft, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Clock,
  Award,
  Layers,
  BarChart3,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';

interface LiveClassDashboardProps {
  selectedAssignmentId?: string | null;
  onBackToStudio: () => void;
  onOpenStudentView: (code: string) => void;
}

export const LiveClassDashboard: React.FC<LiveClassDashboardProps> = ({
  selectedAssignmentId,
  onBackToStudio,
  onOpenStudentView,
}) => {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<ClassAssignment | null>(null);
  const [submissions, setSubmissions] = useState<ClassSubmission[]>([]);
  const [tierFilter, setTierFilter] = useState<'All' | TierType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeDetailSubmission, setActiveDetailSubmission] = useState<ClassSubmission | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  const refreshData = () => {
    const all = getAllAssignments();
    setAssignments(all);

    let current = activeAssignment;
    if (selectedAssignmentId) {
      current = all.find((a) => a.id === selectedAssignmentId) || all[0] || null;
    } else if (!current && all.length > 0) {
      current = all[0];
    } else if (current) {
      current = all.find((a) => a.id === current?.id) || all[0] || null;
    }

    setActiveAssignment(current);
    if (current) {
      setSubmissions(getSubmissionsForAssignment(current.id));
    } else {
      setSubmissions([]);
    }
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToClassUpdates(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [selectedAssignmentId]);

  const handleSelectAssignment = (assign: ClassAssignment) => {
    setActiveAssignment(assign);
    setSubmissions(getSubmissionsForAssignment(assign.id));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this assignment and all associated student submissions?')) {
      deleteClassAssignment(id);
      refreshData();
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesTier = tierFilter === 'All' || sub.tier === tierFilter;
    const matchesSearch = 
      (sub.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.answerText || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  // Calculate statistics
  const supportCount = submissions.filter((s) => s.tier === 'Support').length;
  const coreCount = submissions.filter((s) => s.tier === 'Core').length;
  const extendCount = submissions.filter((s) => s.tier === 'Extend').length;
  const totalCount = submissions.length;

  const excellingCount = submissions.filter((s) => s.feedback?.level === 'Excelling').length;
  const secureCount = submissions.filter((s) => s.feedback?.level === 'Secure').length;
  const developingCount = submissions.filter((s) => s.feedback?.level === 'Developing').length;
  const beginningCount = submissions.filter((s) => s.feedback?.level === 'Beginning').length;

  const tierPercent = (count: number) => (totalCount > 0 ? Math.round((count / totalCount) * 100) : 0);

  const getTierBadge = (tier: TierType) => {
    switch (tier) {
      case 'Support':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Core':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Extend':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getLevelBadge = (level?: string) => {
    switch (level) {
      case 'Excelling':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Secure':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Developing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Beginning':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStudio}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Return to Differentiation Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-indigo-700 font-bold">
                Classroom Command Center
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync: {lastSyncTime}
              </span>
            </div>
            <h2 className="font-sans font-bold text-2xl text-slate-900 leading-tight">
              Whole-Class Assigned Tasks &amp; Live Submissions
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refreshData}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {activeAssignment && (
            <button
              onClick={() => onOpenStudentView(activeAssignment.code)}
              className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              Open Student Portal View
            </button>
          )}

          <button
            onClick={onBackToStudio}
            className="inline-flex items-center gap-1.5 font-sans font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + Diffuse New Class Task
          </button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-sans font-bold text-xl text-slate-900">
            No Class Assignments Published Yet
          </h3>
          <p className="font-serif text-sm text-slate-600 max-w-md mx-auto">
            Create a differentiated task in the Studio, then click <strong>"Assign to Whole Class"</strong> to generate a join code for all your students.
          </p>
          <button
            onClick={onBackToStudio}
            className="inline-flex items-center gap-2 font-sans font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Go to Task Diffuser Studio →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Assignment Selector List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-600 font-bold px-1 flex items-center justify-between">
              <span>Active Assignments ({assignments.length})</span>
            </h3>

            <div className="space-y-2">
              {assignments.map((assign) => {
                const isSelected = activeAssignment?.id === assign.id;
                const assignSubs = getSubmissionsForAssignment(assign.id);

                return (
                  <div
                    key={assign.id}
                    onClick={() => handleSelectAssignment(assign)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-300 shadow-xs ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-md tracking-wider">
                        {assign.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {assignSubs.length} response{assignSubs.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-sm text-slate-900 line-clamp-1">
                      {assign.title}
                    </h4>

                    <span className="font-mono text-[10px] text-slate-500 line-clamp-1">
                      {assign.context}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Area: Active Assignment Statistics & Student Submissions Grid */}
          {activeAssignment && (
            <div className="lg:col-span-3 space-y-6">
              
              {/* Active Assignment Header Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.8) 1.5px, transparent 1.5px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                        {activeAssignment.context}
                      </span>
                      <span className="font-mono text-xs bg-purple-400/30 text-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                        {activeAssignment.axis.toUpperCase()} DIFFERENTIATION
                      </span>
                    </div>

                    <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                      {activeAssignment.title}
                    </h3>
                    <p className="text-indigo-100 text-xs font-serif italic max-w-xl line-clamp-2">
                      "{activeAssignment.originalTask}"
                    </p>
                  </div>

                  {/* Class PIN Badge & Action */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0 min-w-[180px]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-200 font-bold block mb-0.5">
                      Student Join PIN
                    </span>
                    <div className="font-mono font-extrabold text-3xl text-white tracking-wider mb-2">
                      {activeAssignment.code}
                    </div>
                    <button
                      onClick={() => handleCopyCode(activeAssignment.code)}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold bg-white text-indigo-900 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs w-full justify-center"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'PIN Copied!' : 'Copy PIN for Students'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Total Submissions */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Total Submissions
                  </span>
                  <div className="font-sans font-extrabold text-3xl text-slate-900">
                    {totalCount}
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    Students responded
                  </span>
                </div>

                {/* Support Tier Concentration */}
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl shadow-2xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-blue-700 font-bold block mb-1">
                    Support Tier
                  </span>
                  <div className="font-sans font-extrabold text-3xl text-blue-900">
                    {supportCount} <span className="text-sm font-medium text-blue-600">({tierPercent(supportCount)}%)</span>
                  </div>
                  <span className="font-mono text-[11px] text-blue-700">
                    Guided scaffolds
                  </span>
                </div>

                {/* Core Tier Concentration */}
                <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl shadow-2xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-700 font-bold block mb-1">
                    Core Tier
                  </span>
                  <div className="font-sans font-extrabold text-3xl text-indigo-900">
                    {coreCount} <span className="text-sm font-medium text-indigo-600">({tierPercent(coreCount)}%)</span>
                  </div>
                  <span className="font-mono text-[11px] text-indigo-700">
                    Standard objective
                  </span>
                </div>

                {/* Extend Tier Concentration */}
                <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl shadow-2xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-purple-700 font-bold block mb-1">
                    Extend Tier
                  </span>
                  <div className="font-sans font-extrabold text-3xl text-purple-900">
                    {extendCount} <span className="text-sm font-medium text-purple-600">({tierPercent(extendCount)}%)</span>
                  </div>
                  <span className="font-mono text-[11px] text-purple-700">
                    Advanced inquiry
                  </span>
                </div>
              </div>

              {/* Concentration Distribution Visual Bar */}
              {totalCount > 0 && (
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      Live Concentration Breakdown
                    </span>
                    <span>
                      {excellingCount} Excelling · {secureCount} Secure · {developingCount} Developing · {beginningCount} Beginning
                    </span>
                  </div>

                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      style={{ width: `${tierPercent(supportCount)}%` }} 
                      className="bg-blue-600 transition-all duration-500" 
                      title={`Support: ${supportCount} (${tierPercent(supportCount)}%)`}
                    />
                    <div 
                      style={{ width: `${tierPercent(coreCount)}%` }} 
                      className="bg-indigo-600 transition-all duration-500" 
                      title={`Core: ${coreCount} (${tierPercent(coreCount)}%)`}
                    />
                    <div 
                      style={{ width: `${tierPercent(extendCount)}%` }} 
                      className="bg-purple-700 transition-all duration-500" 
                      title={`Extend: ${extendCount} (${tierPercent(extendCount)}%)`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600" /> Support ({supportCount})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" /> Core ({coreCount})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-700" /> Extend ({extendCount})
                    </span>
                  </div>
                </div>
              )}

              {/* Submissions Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                
                {/* Search, Filter & Export Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Tier Filters */}
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl font-mono text-xs font-semibold">
                      {(['All', 'Support', 'Core', 'Extend'] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setTierFilter(tier)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            tierFilter === tier
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student or response..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-2 focus:outline-indigo-600 focus:bg-white transition-all w-48 sm:w-60"
                      />
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportClassSubmissionsCsv(activeAssignment, submissions)}
                      disabled={submissions.length === 0}
                      className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Export CSV Roster
                    </button>

                    <button
                      onClick={() => exportClassMasterDoc(activeAssignment, submissions)}
                      disabled={submissions.length === 0}
                      className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      Class Master Report (.doc)
                    </button>

                    <button
                      onClick={() => handleDelete(activeAssignment.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete assignment and submissions"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submissions Roster List */}
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <p className="font-sans font-semibold text-sm text-slate-700">
                      {submissions.length === 0
                        ? 'No student submissions received yet for this task.'
                        : 'No submissions match your search or filter criteria.'}
                    </p>
                    <p className="font-serif text-xs text-slate-500">
                      Have students open the Student Portal and enter PIN: <strong>{activeAssignment.code}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSubmissions.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className="font-sans font-bold text-base text-slate-900">
                              {sub.studentName || 'Anonymous Student'}
                            </span>
                            {sub.studentId && (
                              <span className="font-mono text-[11px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                                ID: {sub.studentId}
                              </span>
                            )}
                            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-bold ${getTierBadge(sub.tier)}`}>
                              {sub.tier} Concentration
                            </span>
                            {sub.feedback?.level && (
                              <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-bold ${getLevelBadge(sub.feedback.level)}`}>
                                {sub.feedback.level}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => setActiveDetailSubmission(sub)}
                              className="inline-flex items-center gap-1 font-sans font-semibold text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review Feedback
                            </button>
                          </div>
                        </div>

                        {/* Student Response Snippet */}
                        <p className="font-serif text-sm text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                          {sub.answerText}
                        </p>

                        {/* Formative Strength & Next Step Snippet */}
                        {sub.feedback && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-serif">
                            <div className="bg-emerald-50/60 border border-emerald-200/60 p-2.5 rounded-lg text-emerald-950">
                              <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">
                                Strength
                              </span>
                              {sub.feedback.strength}
                            </div>
                            <div className="bg-indigo-50/60 border border-indigo-200/60 p-2.5 rounded-lg text-indigo-950">
                              <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 block">
                                Growth Next Step
                              </span>
                              {sub.feedback.next_step}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Detail Modal */}
      {activeDetailSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-200 font-bold block">
                  Student Assessment Detail
                </span>
                <h3 className="font-sans font-bold text-lg">
                  {activeDetailSubmission.studentName} — {activeDetailSubmission.tier} Lane
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailSubmission(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Full Student Response
                </span>
                <div className="font-serif text-sm text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeDetailSubmission.answerText}
                </div>
              </div>

              {activeDetailSubmission.feedback && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-indigo-900">
                      Formative Assessment Result
                    </span>
                    <span className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold border ${getLevelBadge(activeDetailSubmission.feedback.level)}`}>
                      {activeDetailSubmission.feedback.level}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase text-emerald-800 font-bold block">
                      Demonstrated Strength
                    </span>
                    <p className="font-serif text-xs text-slate-800 leading-relaxed">
                      {activeDetailSubmission.feedback.strength}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase text-indigo-800 font-bold block">
                      Growth Next Step
                    </span>
                    <p className="font-serif text-xs text-slate-800 leading-relaxed">
                      {activeDetailSubmission.feedback.next_step}
                    </p>
                  </div>

                  {activeDetailSubmission.feedback.detailed_feedback && (
                    <div>
                      <span className="font-mono text-[10px] uppercase text-slate-600 font-bold block">
                        Detailed Teacher Commentary
                      </span>
                      <p className="font-serif text-xs text-slate-700 italic leading-relaxed">
                        "{activeDetailSubmission.feedback.detailed_feedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveDetailSubmission(null)}
                className="font-sans text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
