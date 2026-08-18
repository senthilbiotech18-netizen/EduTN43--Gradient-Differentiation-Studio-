import { ClassAssignment, ClassSubmission, TierType } from '../types';

const ASSIGNMENTS_STORAGE_KEY = 'edutn43_class_assignments_v1';
const SUBMISSIONS_STORAGE_KEY = 'edutn43_class_submissions_v1';
const SYNC_CHANNEL_NAME = 'edutn43_class_channel';

// Helper to generate readable 6-character classroom code, e.g. "DIFF-492"
export function generateAssignmentCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
  return `${prefix}-${num}`;
}

// Broadcast updates for cross-tab real-time sync
function broadcastSync(type: 'assignment_created' | 'submission_added' | 'assignment_updated') {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.postMessage({ type, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    // Fallback: storage event is already triggered by localStorage.setItem
  }
}

// Listen for updates across windows/tabs
export function subscribeToClassUpdates(callback: (eventData?: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === ASSIGNMENTS_STORAGE_KEY || e.key === SUBMISSIONS_STORAGE_KEY) {
      callback();
    }
  };

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = (msg) => {
      callback(msg.data);
    };
  } catch (e) {
    // BroadcastChannel unsupported, storage listener is enough
  }

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      channel.close();
    }
  };
}

export function getAllAssignments(): ClassAssignment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return getSampleInitialAssignments();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load assignments from storage:', e);
    return [];
  }
}

export async function getAllAssignmentsAsync(): Promise<ClassAssignment[]> {
  try {
    const res = await fetch('/api/assignments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.assignments) && data.assignments.length > 0) {
        // Merge with local storage
        const local = getAllAssignments();
        const serverMap = new Map<string, ClassAssignment>();
        data.assignments.forEach((a: ClassAssignment) => serverMap.set(a.id, a));
        local.forEach((a) => {
          if (!serverMap.has(a.id)) serverMap.set(a.id, a);
        });
        const merged = Array.from(serverMap.values());
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.warn('Could not reach assignments server, using local cache:', e);
  }
  return getAllAssignments();
}

export function getAssignmentByCode(code: string): ClassAssignment | null {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, '-');
  const all = getAllAssignments();
  return all.find((a) => a.code.toUpperCase() === normalized || a.id === code) || null;
}

export async function getAssignmentByCodeAsync(code: string): Promise<ClassAssignment | null> {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, '-');
  
  // 1. Try server API first to ensure students on other devices get the live teacher's task
  try {
    const res = await fetch(`/api/assignments/${encodeURIComponent(normalized)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.assignment) {
        // Cache assignment into local browser storage for offline resilience
        saveClassAssignmentLocal(data.assignment);
        return data.assignment;
      }
    }
  } catch (e) {
    console.warn('Network lookup for assignment failed, checking local cache:', e);
  }

  // 2. Fallback to local storage
  return getAssignmentByCode(code);
}

export function getAssignmentById(id: string): ClassAssignment | null {
  const all = getAllAssignments();
  return all.find((a) => a.id === id) || null;
}

function saveClassAssignmentLocal(assignment: ClassAssignment) {
  const all = getAllAssignments();
  const existingIdx = all.findIndex((a) => a.id === assignment.id || a.code.toUpperCase() === assignment.code.toUpperCase());

  let updatedList: ClassAssignment[];
  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = assignment;
  } else {
    updatedList = [assignment, ...all];
  }

  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updatedList));
}

export function saveClassAssignment(assignment: ClassAssignment): ClassAssignment {
  saveClassAssignmentLocal(assignment);
  broadcastSync('assignment_created');

  // Push to server asynchronously so students on other devices can access it immediately
  fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment)
  }).catch((err) => {
    console.warn('Could not sync assignment to server backend:', err);
  });

  return assignment;
}

export function deleteClassAssignment(id: string): void {
  const all = getAllAssignments();
  const filtered = all.filter((a) => a.id !== id);
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(filtered));

  // Also remove submissions associated with this assignment
  const subs = getAllSubmissions().filter((s) => s.assignmentId !== id);
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(subs));

  broadcastSync('assignment_updated');

  fetch(`/api/assignments/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch((err) => console.warn('Could not delete assignment on server:', err));
}

export function getAllSubmissions(): ClassSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) return getSampleInitialSubmissions();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load submissions from storage:', e);
    return [];
  }
}

export function getSubmissionsForAssignment(assignmentId: string): ClassSubmission[] {
  const all = getAllSubmissions();
  return all.filter((s) => s.assignmentId === assignmentId);
}

export async function fetchRemoteSubmissions(assignmentId: string): Promise<ClassSubmission[]> {
  try {
    const res = await fetch(`/api/assignments/${encodeURIComponent(assignmentId)}/submissions`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.submissions)) {
        // Merge with local storage
        const local = getAllSubmissions();
        const subMap = new Map<string, ClassSubmission>();
        local.forEach((s) => subMap.set(s.id, s));
        data.submissions.forEach((s: ClassSubmission) => subMap.set(s.id, s));
        const merged = Array.from(subMap.values());
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
        return data.submissions;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch remote submissions from server:', e);
  }
  return getSubmissionsForAssignment(assignmentId);
}

export function saveClassSubmission(submission: ClassSubmission): ClassSubmission {
  const all = getAllSubmissions();
  const existingIdx = all.findIndex((s) => s.id === submission.id);

  let updated: ClassSubmission[];
  if (existingIdx >= 0) {
    updated = [...all];
    updated[existingIdx] = submission;
  } else {
    updated = [submission, ...all];
  }

  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
  broadcastSync('submission_added');

  // Push to server asynchronously
  const targetCode = submission.assignmentCode || submission.assignmentId;
  fetch(`/api/assignments/${encodeURIComponent(targetCode)}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission)
  }).catch((err) => {
    console.warn('Could not sync submission to server backend:', err);
  });

  return submission;
}

// Export class responses to CSV
export function exportClassSubmissionsCsv(assignment: ClassAssignment, submissions: ClassSubmission[]): void {
  const headers = ['Student Name', 'Section / Grade', 'Student ID', 'Concentration Tier', 'Assessment Level', 'Submitted At', 'Strength', 'Next Step', 'Student Response'];
  
  const rows = submissions.map((s) => {
    const cleanAnswer = `"${(s.answerText || '').replace(/"/g, '""')}"`;
    const cleanStrength = `"${(s.feedback?.strength || '').replace(/"/g, '""')}"`;
    const cleanNextStep = `"${(s.feedback?.next_step || '').replace(/"/g, '""')}"`;
    const dateFormatted = new Date(s.submittedAt).toLocaleString();

    return [
      `"${s.studentName || 'Anonymous'}"`,
      `"${s.section || 'Unassigned'}"`,
      `"${s.studentId || ''}"`,
      `"${s.tier}"`,
      `"${s.feedback?.level || 'Pending / Unmarked'}"`,
      `"${dateFormatted}"`,
      cleanStrength,
      cleanNextStep,
      cleanAnswer,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Class_Submissions_${assignment.code}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export individual student longitudinal dossier (.doc format)
export function exportStudentDossierDoc(
  studentName: string,
  studentSubmissions: ClassSubmission[],
  assignments: ClassAssignment[]
): void {
  const assignMap = new Map<string, ClassAssignment>();
  assignments.forEach((a) => assignMap.set(a.id, a));

  const totalTasks = studentSubmissions.length;
  const supportCount = studentSubmissions.filter((s) => s.tier === 'Support').length;
  const coreCount = studentSubmissions.filter((s) => s.tier === 'Core').length;
  const extendCount = studentSubmissions.filter((s) => s.tier === 'Extend').length;

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Student Differentiation Portfolio - ${studentName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 28px; }
        h1 { color: #1e1b4b; font-size: 24pt; margin-bottom: 4px; border-bottom: 3px solid #6366f1; padding-bottom: 8px; }
        h2 { color: #312e81; font-size: 16pt; margin-top: 20pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        .meta-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; margin-bottom: 16pt; }
        .stats-grid { display: flex; gap: 12px; margin-bottom: 16pt; }
        .stat-card { background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px 16px; border-radius: 6px; font-weight: bold; }
        .task-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 14px; margin-bottom: 14pt; border-left: 5px solid #6366f1; border-radius: 6px; }
        .badge { display: inline-block; padding: 3px 10px; font-size: 9pt; font-weight: bold; border-radius: 4px; color: #fff; }
        .badge-Support { background-color: #2563eb; }
        .badge-Core { background-color: #4f46e5; }
        .badge-Extend { background-color: #7e22ce; }
        .feedback-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-top: 8pt; }
      </style>
    </head>
    <body>
      <h1>EduTN43 Gradient: Student Differentiation Dossier</h1>
      <div class="meta-box">
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Total Differentiated Tasks Completed:</strong> ${totalTasks}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">Total Completed: ${totalTasks}</div>
        <div class="stat-card">Support Tier: ${supportCount} (${totalTasks > 0 ? Math.round((supportCount / totalTasks) * 100) : 0}%)</div>
        <div class="stat-card">Core Tier: ${coreCount} (${totalTasks > 0 ? Math.round((coreCount / totalTasks) * 100) : 0}%)</div>
        <div class="stat-card">Extend Tier: ${extendCount} (${totalTasks > 0 ? Math.round((extendCount / totalTasks) * 100) : 0}%)</div>
      </div>

      <h2>Chronological Differentiated Learning History</h2>
      ${
        studentSubmissions.length === 0
          ? '<p><em>No differentiated task submissions recorded for this student.</em></p>'
          : studentSubmissions
              .map((sub, i) => {
                const assign = assignMap.get(sub.assignmentId);
                return `
          <div class="task-card">
            <h3>${i + 1}. ${assign?.title || 'Class Assignment'} <span class="badge badge-${sub.tier}">${sub.tier} Tier</span></h3>
            <p><strong>Teacher:</strong> ${assign?.teacherName || 'Instructor'} | <strong>Class/Year:</strong> ${assign?.context || 'Secondary'}</p>
            <p><strong>Date Completed:</strong> ${new Date(sub.submittedAt).toLocaleString()}</p>
            <p><strong>Core Prompt:</strong> "${assign?.originalTask || 'Differentiated Lesson Task'}"</p>
            <p><strong>Student Work:</strong><br/><em>${(sub.answerText || '').replace(/\n/g, '<br/>')}</em></p>
            ${
              sub.feedback
                ? `
              <div class="feedback-box">
                <p><strong>Assessment Level:</strong> <strong>${sub.feedback.level}</strong></p>
                <p><strong>Demonstrated Strength:</strong> ${sub.feedback.strength}</p>
                <p><strong>Next Step for Growth:</strong> ${sub.feedback.next_step}</p>
                ${sub.feedback.detailed_feedback ? `<p><strong>Commentary:</strong> "${sub.feedback.detailed_feedback}"</p>` : ''}
              </div>
            `
                : ''
            }
          </div>
        `;
              })
              .join('')
      }
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanName = studentName.replace(/\s+/g, '_');
  link.setAttribute('download', `Student_Differentiation_Dossier_${cleanName}_${new Date().toISOString().slice(0, 10)}.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportClassMasterDoc(assignment: ClassAssignment, submissions: ClassSubmission[]): void {
  const supportCount = submissions.filter((s) => s.tier === 'Support').length;
  const coreCount = submissions.filter((s) => s.tier === 'Core').length;
  const extendCount = submissions.filter((s) => s.tier === 'Extend').length;

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Classroom Differentiation Master Report - ${assignment.title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 24px; }
        h1 { color: #312e81; font-size: 22pt; margin-bottom: 4px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
        h2 { color: #4338ca; font-size: 15pt; margin-top: 20pt; }
        .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 16pt; }
        .stats-grid { display: flex; gap: 12px; margin-bottom: 16pt; }
        .stat-card { background: #eef2ff; border: 1px solid #c7d2fe; padding: 8px 14px; border-radius: 6px; font-weight: bold; }
        .lane-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 12pt; }
        .submission-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10pt; border-left: 4px solid #6366f1; }
        .badge { display: inline-block; padding: 2px 8px; font-size: 9pt; font-weight: bold; border-radius: 4px; color: #fff; }
        .badge-Support { background-color: #2563eb; }
        .badge-Core { background-color: #4f46e5; }
        .badge-Extend { background-color: #7e22ce; }
      </style>
    </head>
    <body>
      <h1>EduTN43 Gradient: Whole-Class Task Report</h1>
      <div class="meta-box">
        <p><strong>Assignment:</strong> ${assignment.title}</p>
        <p><strong>Class Code:</strong> ${assignment.code} | <strong>Teacher:</strong> ${assignment.teacherName || 'Instructor'}</p>
        <p><strong>Context & Curriculum:</strong> ${assignment.context}</p>
        <p><strong>Differentiation Axis:</strong> ${assignment.axis.toUpperCase()}</p>
        <p><strong>Original Task:</strong> "${assignment.originalTask}"</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">Total Submissions: ${submissions.length}</div>
        <div class="stat-card">Support: ${supportCount}</div>
        <div class="stat-card">Core: ${coreCount}</div>
        <div class="stat-card">Extend: ${extendCount}</div>
      </div>

      <h2>Calibrated Concentration Lanes</h2>
      ${assignment.lanes
        .map(
          (lane) => `
        <div class="lane-box">
          <h3><span class="badge badge-${lane.tier}">${lane.tier} Tier</span></h3>
          <p><strong>Task:</strong> ${lane.task_text}</p>
          <p><strong>Scaffold:</strong> ${lane.scaffold}</p>
          <p><strong>Key Vocabulary:</strong> ${lane.vocab.join(', ')}</p>
        </div>
      `
        )
        .join('')}

      <h2>Student Submissions & Formative Assessment (${submissions.length})</h2>
      ${
        submissions.length === 0
          ? '<p><em>No student submissions recorded yet for this assignment.</em></p>'
          : submissions
              .map(
                (s, i) => `
          <div class="submission-card">
            <h4>${i + 1}. ${s.studentName || 'Student'} <span class="badge badge-${s.tier}">${s.tier} Tier</span> ${
                  s.feedback ? `— <strong>${s.feedback.level}</strong>` : ''
                }</h4>
            <p><strong>Submitted:</strong> ${new Date(s.submittedAt).toLocaleString()}</p>
            <p><strong>Student Response:</strong><br/><em>${(s.answerText || '').replace(/\n/g, '<br/>')}</em></p>
            ${
              s.feedback
                ? `
              <div style="background: #f1f5f9; padding: 8px; border-radius: 4px; margin-top: 6px;">
                <p><strong>Strength:</strong> ${s.feedback.strength}</p>
                <p><strong>Growth Step:</strong> ${s.feedback.next_step}</p>
                ${s.feedback.detailed_feedback ? `<p><strong>Feedback:</strong> ${s.feedback.detailed_feedback}</p>` : ''}
              </div>
            `
                : ''
            }
          </div>
        `
              )
              .join('')
      }
    </body>
    </html>
  `;

  const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Class_Report_${assignment.code}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initial Sample Seed Data for immediate testing
function getSampleInitialAssignments(): ClassAssignment[] {
  const initial: ClassAssignment = {
    id: 'assign_sample_01',
    code: 'MYP-742',
    title: 'Cell Membrane Transport & Surface Area',
    teacherName: 'Dr. Senthil Kumar',
    originalTask: 'Explain how the structure of a red blood cell relates to its function of transporting oxygen throughout the human circulatory system.',
    context: 'IB MYP 2 — Biology (Cells & Membrane Transport)',
    axis: 'readiness',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    allowSelfSelection: true,
    status: 'active',
    lanes: [
      {
        tier: 'Support',
        task_text: 'Complete the 3-step structured prompt: 1. Identify the biconcave shape of a red blood cell. 2. Explain how this increases surface area for oxygen diffusion using the sentence starter: "The biconcave shape allows oxygen to diffuse quickly because...". 3. List 2 key organelle adaptations (lack of nucleus).',
        scaffold: 'Sentence Starter: "The shape of the red blood cell increases surface area, which helps oxygen bind to hemoglobin faster."',
        vocab: ['Biconcave', 'Surface Area', 'Hemoglobin', 'Diffusion']
      },
      {
        tier: 'Core',
        task_text: 'Analyze the relationship between the specialized structural adaptations of erythrocytes (biconcave disc, lack of nucleus, hemoglobin density) and their physiological efficiency in oxygen uptake and circulatory transport.',
        scaffold: 'Guided 3-part paragraph outline with cause-and-effect transitions.',
        vocab: ['Erythrocyte', 'Surface Area to Volume Ratio', 'Hemoglobin', 'Circulatory Flow']
      },
      {
        tier: 'Extend',
        task_text: 'Critically evaluate how environmental stressors (such as high altitude hypoxia or sickle cell hemoglobin mutations) disrupt the biophysical transport kinetics of red blood cells, and predict physiological compensatory mechanisms.',
        scaffold: 'Comparative hypothesis testing rubric with biophysical kinetic parameters.',
        vocab: ['Hypoxia', 'Allosteric Regulation', 'Kinetics', 'Microcirculation']
      }
    ],
    talk_moves: [
      { tier: 'Support', prompts: ['Which vocabulary term explains the shape of the cell?', 'How does no nucleus leave more room for oxygen?'] },
      { tier: 'Core', prompts: ['How does the surface area to volume ratio affect diffusion speed?', 'What evidence links structure to metabolic demand?'] },
      { tier: 'Extend', prompts: ['How does hemoglobin saturation change under low partial pressure of O2?', 'What trade-offs exist between cell flexibility and capacity?'] }
    ],
    grouping_tip: 'Seat Support students in paired collaborative dyads near the lab display; arrange Core and Extend students in reciprocal peer-review pods.'
  };

  return [initial];
}

function getSampleInitialSubmissions(): ClassSubmission[] {
  return [
    {
      id: 'sub_sample_01',
      assignmentId: 'assign_sample_01',
      assignmentCode: 'MYP-742',
      studentName: 'Aarav Patel',
      studentId: 'ST-201',
      tier: 'Support',
      answerText: 'The biconcave shape of a red blood cell gives it a higher surface area to volume ratio. This allows oxygen to quickly diffuse across the membrane and bind to hemoglobin. It also has no nucleus so there is more room inside.',
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      feedback: {
        level: 'Secure',
        strength: 'Accurately used key vocabulary (biconcave, hemoglobin) and clearly explained the lack of nucleus adaptation.',
        next_step: 'Add one specific detail about how the cell moves smoothly through narrow capillaries.',
        detailed_feedback: 'Clear, accurate response that demonstrates strong foundational understanding of cell membrane transport.',
        markedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    },
    {
      id: 'sub_sample_02',
      assignmentId: 'assign_sample_01',
      assignmentCode: 'MYP-742',
      studentName: 'Maya Lin',
      studentId: 'ST-208',
      tier: 'Core',
      answerText: 'Erythrocytes feature a distinctive biconcave disc morphology which drastically optimizes the surface area to volume ratio. This structural specialization minimizes the diffusion distance for oxygen molecules binding to intracellular hemoglobin proteins. Furthermore, the absence of a nucleus and organelles accommodates maximum hemoglobin concentration while enabling flexible deformation through capillary beds.',
      submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      feedback: {
        level: 'Excelling',
        strength: 'Exceptional analytical depth connecting morphology directly to molecular diffusion and capillary mechanics.',
        next_step: 'Consider mentioning how carbon dioxide transport interacts with the same circulatory pathway.',
        detailed_feedback: 'Thorough, academic prose meeting full IB MYP Criterion A/C expectations.',
        markedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
      }
    },
    {
      id: 'sub_sample_03',
      assignmentId: 'assign_sample_01',
      assignmentCode: 'MYP-742',
      studentName: 'Ethan Wright',
      studentId: 'ST-214',
      tier: 'Extend',
      answerText: 'Under high altitude conditions, low atmospheric PO2 lowers the oxygen saturation curve of hemoglobin. In response, the body stimulates erythropoietin secretion to increase erythrocyte count. In sickle cell mutations, the polymerisation of HbS causes red blood cells to lose elastic flexibility, leading to microvascular occlusion and reduced tissue oxygenation.',
      submittedAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
      feedback: {
        level: 'Excelling',
        strength: 'Superb integration of physiological feedback loops (EPO) and biophysical pathology (HbS polymerisation).',
        next_step: 'Explore how 2,3-BPG allosterically shifts the oxygen dissociation curve during acclimatization.',
        detailed_feedback: 'Demonstrates exemplary high-level conceptual mastery and comparative reasoning.',
        markedAt: new Date(Date.now() - 3600000 * 0.8).toISOString()
      }
    }
  ];
}
