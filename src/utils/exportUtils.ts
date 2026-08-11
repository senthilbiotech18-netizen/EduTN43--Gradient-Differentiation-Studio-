import jsPDF from 'jspdf';
import { StudentWorkPackage, DiffusedResult, StudentAnswer, MarkingFeedback, TierType } from '../types';

export function formatDate(dateString?: string): string {
  const d = dateString ? new Date(dateString) : new Date();
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Downloads a clean, formatted PDF of the student's work package.
 */
export function downloadStudentWorkPDF(pkg: StudentWorkPackage): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 45;

  // Header Banner
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(margin, y, contentWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('EduTN43 GRADIENT — Differentiated Task & Assessment Report', margin + 15, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`EduTN43 Task Differentiation Studio | Generated: ${formatDate(pkg.submittedAt)}`, margin + 15, y + 39);

  y += 65;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Student Name: ${pkg.studentName || 'Anonymous Student'}`, margin + 12, y + 20);

  if (pkg.studentId) {
    doc.text(`ID: ${pkg.studentId}`, margin + 250, y + 20);
  }

  doc.setFont('helvetica', 'normal');
  doc.text(`Subject / Context: ${pkg.context || 'General'}`, margin + 12, y + 38);
  doc.text(`Differentiation Lane: ${pkg.tier} Tier (${pkg.axis.toUpperCase()})`, margin + 250, y + 38);

  y += 70;

  // Helper function to check page space and add new page if needed
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }
  };

  // Section 1: Assigned Differentiated Task
  ensureSpace(60);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. DIFFERENTIATED TASK', margin, y);
  y += 15;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const qLines = doc.splitTextToSize(pkg.question, contentWidth - 10);
  const qBoxHeight = Math.max(35, qLines.length * 14 + 16);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, qBoxHeight, 4, 4, 'FD');
  doc.text(qLines, margin + 10, y + 18);

  y += qBoxHeight + 15;

  // Section 2: Scaffolding & Key Vocabulary
  if (pkg.scaffold || (pkg.vocab && pkg.vocab.length > 0)) {
    ensureSpace(60);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. SCAFFOLDS & KEY VOCABULARY', margin, y);
    y += 15;

    let vocabText = pkg.vocab?.join(', ') || 'None';
    let scaffoldText = pkg.scaffold || 'None';

    const infoText = `Scaffold: ${scaffoldText}\nKey Vocab: ${vocabText}`;
    const infoLines = doc.splitTextToSize(infoText, contentWidth - 20);
    const infoBoxHeight = Math.max(30, infoLines.length * 13 + 14);

    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, y, contentWidth, infoBoxHeight, 4, 4, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(infoLines, margin + 10, y + 16);

    y += infoBoxHeight + 15;
  }

  // Section 3: Student Written Answer
  ensureSpace(100);
  doc.setTextColor(124, 58, 237); // Purple accent for student response
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("3. STUDENT'S WRITTEN RESPONSE", margin, y);
  y += 15;

  const answerText = pkg.answerText.trim() || '[No response provided]';
  const aLines = doc.splitTextToSize(answerText, contentWidth - 20);
  const aBoxHeight = Math.max(60, aLines.length * 14 + 20);

  ensureSpace(aBoxHeight + 10);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, aBoxHeight, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(aLines, margin + 10, y + 18);

  y += aBoxHeight + 20;

  // Section 4: Evaluation & AI/Teacher Feedback
  if (pkg.feedback) {
    ensureSpace(110);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('4. FORMATIVE ASSESSMENT & FEEDBACK', margin, y);
    y += 15;

    const fb = pkg.feedback;
    const levelColors: Record<string, [number, number, number]> = {
      Excelling: [124, 58, 237],
      Secure: [79, 70, 229],
      Developing: [37, 99, 235],
      Beginning: [100, 116, 139],
    };

    const badgeColor = levelColors[fb.level] || [79, 70, 229];

    doc.setFillColor(...badgeColor);
    doc.roundedRect(margin, y, 110, 22, 11, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(fb.level.toUpperCase(), margin + 15, y + 15);

    y += 30;

    const strText = `Key Strength: ${fb.strength}`;
    const nextText = `Next Step: ${fb.next_step}`;
    const strLines = doc.splitTextToSize(strText, contentWidth - 20);
    const nextLines = doc.splitTextToSize(nextText, contentWidth - 20);

    const fbBoxHeight = (strLines.length + nextLines.length) * 13 + 20;
    ensureSpace(fbBoxHeight);

    doc.setFillColor(244, 246, 243);
    doc.setDrawColor(211, 218, 211);
    doc.roundedRect(margin, y, contentWidth, fbBoxHeight, 4, 4, 'FD');

    doc.setTextColor(29, 43, 57);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(strLines, margin + 10, y + 16);
    doc.text(nextLines, margin + 10, y + 16 + strLines.length * 13);

    y += fbBoxHeight + 15;
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages} — Gradient Differentiation Studio`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  const sanitizedFileName = (pkg.studentName || 'Student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${sanitizedFileName}_${pkg.tier.toLowerCase()}_work.pdf`);
}

/**
 * Downloads a clean Markdown (.md) document of student work.
 */
export function downloadStudentWorkMarkdown(pkg: StudentWorkPackage): void {
  const mdContent = `# EduTN43 GRADIENT — Classroom Task Differentiation Studio
## Differentiated Student Work & Assessment Report

**Student Name:** ${pkg.studentName || 'Anonymous Student'}  
${pkg.studentId ? `**Student ID:** ${pkg.studentId}  \n` : ''}**Subject / Context:** ${pkg.context || 'N/A'}  
**Differentiation Lane:** ${pkg.tier} Tier (${pkg.axis.toUpperCase()})  
**Submitted At:** ${formatDate(pkg.submittedAt)}  

---

## 1. Differentiated Task
> ${pkg.question.replace(/\n/g, '\n> ')}

**Scaffold:** ${pkg.scaffold || 'N/A'}  
**Key Vocabulary:** ${pkg.vocab?.join(', ') || 'N/A'}  

---

## 2. Student's Written Response
\`\`\`
${pkg.answerText || '[No response provided]'}
\`\`\`

---

## 3. Formative Assessment & Feedback
${pkg.feedback ? `
**Achievement Level:** ${pkg.feedback.level}

- **Key Strength:** ${pkg.feedback.strength}
- **Next Growth Step:** ${pkg.feedback.next_step}
${pkg.feedback.detailed_feedback ? `\n*Teacher Commentary:* ${pkg.feedback.detailed_feedback}\n` : ''}
` : '*Not yet evaluated.*'}

---
*Generated with EduTN43 Gradient — Classroom Task Differentiation Studio*
`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitized = (pkg.studentName || 'Student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${sanitized}_${pkg.tier.toLowerCase()}_work.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a Word-compatible styled HTML (.doc) document.
 */
export function downloadStudentWorkDoc(pkg: StudentWorkPackage): void {
  const htmlDoc = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Student Work Report - ${pkg.studentName}</title>
<style>
  body { font-family: 'Georgia', serif; color: #0F172A; margin: 40px; line-height: 1.6; background-color: #FFFFFF; }
  .header { background: linear-gradient(to right, #4F46E5, #7C3AED); color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .header h1 { margin: 0; font-family: 'Arial', sans-serif; font-size: 20px; }
  .header p { margin: 5px 0 0; font-size: 12px; opacity: 0.9; }
  .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
  .section-title { color: #4F46E5; font-size: 16px; font-family: 'Arial', sans-serif; border-bottom: 2px solid #7C3AED; padding-bottom: 4px; margin-top: 25px; }
  .task-box { background: #FFFFFF; border: 1px solid #E2E8F0; padding: 15px; border-radius: 6px; font-style: italic; margin-bottom: 15px; }
  .answer-box { background: #FFFFFF; border: 2px solid #7C3AED; padding: 18px; border-radius: 6px; white-space: pre-wrap; font-size: 15px; margin-bottom: 20px; }
  .feedback-box { background: #EEF2FF; border: 1px solid #C7D2FE; padding: 18px; border-radius: 6px; }
  .badge { display: inline-block; background: #4F46E5; color: white; font-weight: bold; padding: 4px 12px; border-radius: 12px; font-family: sans-serif; font-size: 12px; }
</style>
</head>
<body>

<div class="header">
  <h1>EduTN43 GRADIENT — Classroom Task Differentiation Studio</h1>
  <p>Differentiated Task & Student Assessment Report | Date: ${formatDate(pkg.submittedAt)}</p>
</div>

<div class="meta-box">
  <strong>Student Name:</strong> ${pkg.studentName || 'Anonymous Student'}<br>
  ${pkg.studentId ? `<strong>Student ID:</strong> ${pkg.studentId}<br>` : ''}
  <strong>Subject / Unit:</strong> ${pkg.context || 'General Science / MYP'}<br>
  <strong>Differentiation Lane:</strong> ${pkg.tier} Tier (${pkg.axis.toUpperCase()})
</div>

<h2 class="section-title">1. Differentiated Task</h2>
<div class="task-box">
  ${pkg.question.replace(/\n/g, '<br>')}
</div>
<p><strong>Scaffold Provided:</strong> ${pkg.scaffold || 'Standard'}</p>
<p><strong>Key Vocabulary:</strong> ${pkg.vocab?.join(', ') || 'None'}</p>

<h2 class="section-title">2. Student's Written Response</h2>
<div class="answer-box">${pkg.answerText || '[No response typed]'}</div>

<h2 class="section-title">3. Formative Feedback</h2>
${pkg.feedback ? `
<div class="feedback-box">
  <p><span class="badge">${pkg.feedback.level}</span></p>
  <p><strong>Strength:</strong> ${pkg.feedback.strength}</p>
  <p><strong>Next Step:</strong> ${pkg.feedback.next_step}</p>
  ${pkg.feedback.detailed_feedback ? `<p><strong>Commentary:</strong> ${pkg.feedback.detailed_feedback}</p>` : ''}
</div>
` : '<p><em>Not marked yet.</em></p>'}

</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitized = (pkg.studentName || 'Student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${sanitized}_${pkg.tier.toLowerCase()}_work.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Master Export for Teachers: Exports all 3 lanes + student answers + talk moves in 1 document.
 */
export function downloadTeacherMasterDoc(
  result: DiffusedResult,
  studentAnswers: Record<TierType, StudentAnswer>,
  feedbacks: Record<TierType, MarkingFeedback | null>
): void {
  const lanesHtml = result.lanes.map(lane => {
    const ans = studentAnswers[lane.tier];
    const fb = feedbacks[lane.tier];
    return `
    <div style="border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #fff;">
      <h3 style="margin-top:0; color:#4F46E5;">${lane.tier} Tier — Differentiated Task</h3>
      <p><strong>Differentiated Task:</strong> ${lane.task_text}</p>
      <p><strong>Scaffold:</strong> ${lane.scaffold}</p>
      <p><strong>Key Vocab:</strong> ${lane.vocab.join(', ')}</p>
      
      <div style="background:#F8FAFC; padding:12px; border-left:4px solid #7C3AED; margin:10px 0;">
        <strong>Student Response (${ans?.studentName || 'Unassigned'}):</strong><br>
        ${ans?.answerText ? ans.answerText.replace(/\n/g, '<br>') : '<em>No response typed yet</em>'}
      </div>

      ${fb ? `
      <div style="background:#EEF2FF; padding:10px; border-radius:6px; font-size:13px; color:#1E1B4B;">
        <strong>Marking (${fb.level}):</strong> ${fb.strength} <br>
        <strong>Next Step:</strong> ${fb.next_step}
      </div>
      ` : ''}
    </div>
    `;
  }).join('');

  const talkHtml = result.talk_moves.map(tm => `
    <li><strong>${tm.tier} Lane Prompts:</strong> ${tm.prompts.join(' | ')}</li>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Gradient Master Teacher Overview</title></head>
<body style="font-family:sans-serif; padding:30px; color:#0F172A; max-width:850px; margin:auto; background-color:#FFFFFF;">
  <h1 style="color:#4F46E5;">EduTN43 GRADIENT — Classroom Task Differentiation Studio</h1>
  <p style="font-size: 14px; color: #475569; font-weight: bold;">Master Differentiation Package & Student Assessment Report</p>
  <p><strong>Core Prompt Input:</strong> ${result.originalTask}</p>
  <p><strong>Subject / Unit Context:</strong> ${result.context} | <strong>Differentiation Axis:</strong> ${result.axis.toUpperCase()}</p>
  <p><strong>Classroom Grouping Strategy:</strong> ${result.grouping_tip}</p>
  
  <h2 style="color:#7C3AED; border-bottom: 2px solid #C7D2FE; padding-bottom: 4px;">Teacher Spoken Prompts ("Talk Moves")</h2>
  <ul>${talkHtml}</ul>

  <h2 style="color:#7C3AED; border-bottom: 2px solid #C7D2FE; padding-bottom: 4px;">Differentiated Tasks & Student Responses</h2>
  ${lanesHtml}
</body>
</html>
`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gradient_master_package_${Date.now()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
