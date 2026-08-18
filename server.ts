import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// In-Memory & File-backed persistence for classroom assignments & submissions
const DATA_FILE = path.join(process.cwd(), '.classroom_store.json');

interface StoredData {
  assignments: Record<string, any>;
  submissions: Record<string, any[]>;
}

let store: StoredData = {
  assignments: {},
  submissions: {}
};

// Load existing data from file if present
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    store = JSON.parse(raw);
    console.log(`Loaded ${Object.keys(store.assignments || {}).length} assignments from storage file.`);
  }
} catch (err) {
  console.warn('Could not read persistent store file, initializing empty store:', err);
  store = { assignments: {}, submissions: {} };
}

function persistStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting classroom store:', err);
  }
}

// Lazy Gemini AI helper
function getGemini(customKey?: string): GoogleGenAI | null {
  const apiKey = (customKey && typeof customKey === 'string' && customKey.trim().length > 0)
    ? customKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to clean JSON string from markdown fences or extra text
function cleanJsonText(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return match[0];
  }
  return text;
}

// Multi-model fallback sequence to handle transient 503 high demand or quota limits
// We prioritize high-throughput, low-latency models first to avoid spike bottlenecks
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'];

async function generateWithModelFallback(
  ai: GoogleGenAI,
  prompt: string,
  config?: any
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: config || {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 'busy';
      console.log(`[AI Dispatcher] Model ${model} status (${status}). Moving to next candidate...`);
      // Brief jitter before next attempt
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  throw lastError || new Error('All candidate models failed.');
}

function generateFormativeFeedbackFallback(student_answer: string, tier?: string) {
  const wordCount = (student_answer || '').trim().split(/\s+/).filter(Boolean).length;
  const level = wordCount > 35 ? 'Excelling' : wordCount > 20 ? 'Secure' : wordCount > 10 ? 'Developing' : 'Beginning';
  return {
    level,
    strength: `Solid effort in the ${tier || 'assigned'} lane! You addressed the prompt directly and demonstrated clear initial engagement.`,
    next_step: 'Try adding one more key subject term and elaborating with a specific analytical example.',
    detailed_feedback: `Your response shows active participation. Continuing to connect key ideas with detailed evidence will help deepen your overall mastery.`
  };
}
function generateSmartFallback(task: string, context?: string, axis?: string) {
  const shortTask = task.trim();
  const selectedAxis = axis || 'readiness';

  if (selectedAxis === 'profile') {
    return {
      lanes: [
        {
          tier: 'Support',
          task_text: `[Visual & Diagrammatic Route] ${shortTask}: Create a visual concept map, flowchart, or annotated diagram representing key components and connections.`,
          scaffold: 'Concept map graphic organizer with key visual labels and arrow connectors.',
          vocab: ['Visual Representation', 'Structure', 'Connection', 'Diagram']
        },
        {
          tier: 'Core',
          task_text: `[Analytical Text Route] ${shortTask}: Write a structured analytical summary evaluating core arguments and supporting evidence.`,
          scaffold: 'Guided paragraph outline with sentence starters for cause and effect.',
          vocab: ['Analysis', 'Evidence', 'Context', 'Perspective']
        },
        {
          tier: 'Extend',
          task_text: `[Investigative Practical Route] ${shortTask}: Formulate a practical case study or real-world application scenario testing these principles.`,
          scaffold: 'Case study investigation rubric and self-directed inquiry checklist.',
          vocab: ['Application', 'Case Study', 'Evaluation', 'Implication']
        }
      ],
      talk_moves: [
        { tier: 'Support', prompts: ['How do the visual arrows show relationships?', 'What does each color or symbol represent?'] },
        { tier: 'Core', prompts: ['What evidence best supports your thesis statement?', 'How do your paragraphs connect?'] },
        { tier: 'Extend', prompts: ['How would this principle function in an unexpected scenario?', 'What variables need testing?'] }
      ],
      grouping_tip: 'Group students by learning profile preference into visual, textual, and investigative collaborative stations.'
    };
  }

  if (selectedAxis === 'product') {
    return {
      lanes: [
        {
          tier: 'Support',
          task_text: `[Structured Written Format] ${shortTask}: Produce a structured bulleted briefing note or guided response table answering core objectives.`,
          scaffold: 'Sentence starters: "The primary point is... This demonstrates..." with key word bank.',
          vocab: ['Briefing', 'Key Point', 'Evidence', 'Starter']
        },
        {
          tier: 'Core',
          task_text: `[Infographic / Model Summary] ${shortTask}: Design an explanatory digital infographic or poster summarizing core findings and key evidence.`,
          scaffold: 'Infographic layout grid with section prompts for data, quotes, and conclusions.',
          vocab: ['Summary', 'Visual Model', 'Synthesis', 'Layout']
        },
        {
          tier: 'Extend',
          task_text: `[Debate Pitch / Podcast Script] ${shortTask}: Script and deliver a 2-minute persuasive audio pitch or podcast debate arguing your perspective.`,
          scaffold: 'Persuasive rhetoric rubric (Ethos, Pathos, Logos) and audio script template.',
          vocab: ['Rhetoric', 'Counterargument', 'Pitch', 'Justification']
        }
      ],
      talk_moves: [
        { tier: 'Support', prompts: ['Which sentence frame helped you start?', 'What key word completes your bullet point?'] },
        { tier: 'Core', prompts: ['How does your infographic guide the viewer\'s eyes?', 'What is the key takeaway?'] },
        { tier: 'Extend', prompts: ['What persuasive technique makes your argument strongest?', 'How do you address objections?'] }
      ],
      grouping_tip: 'Arrange stations by product format so students can peer-review shared media types.'
    };
  }

  // Default: Readiness Axis
  return {
    lanes: [
      {
        tier: 'Support',
        task_text: `[Support Lane] ${shortTask}: Complete the guided breakdown in 3 steps. Step 1: Identify 2 key ideas or examples. Step 2: Use the provided sentence starters to explain each. Step 3: Check your key vocabulary list.`,
        scaffold: 'Sentence starter: "The main idea of this prompt is ___ because ___." Includes word bank and guided checklist.',
        vocab: ['Identify', 'Main Idea', 'Evidence', 'Context']
      },
      {
        tier: 'Core',
        task_text: `[Core Lane] ${shortTask}: Analyze the core prompt. Explain your reasoning thoroughly, incorporating subject vocabulary and supporting evidence.`,
        scaffold: 'Guided outline with prompt questions for analytical paragraph structure.',
        vocab: ['Analysis', 'Explanation', 'Perspective', 'Conclusion']
      },
      {
        tier: 'Extend',
        task_text: `[Extend Lane] ${shortTask}: Critically evaluate contrasting perspectives or secondary implications. Formulate an original argument and justify your position against counterclaims.`,
        scaffold: 'Open-ended critical evaluation framework & self-assessment rubric.',
        vocab: ['Evaluation', 'Thesis', 'Counterclaim', 'Justification']
      }
    ],
    talk_moves: [
      { tier: 'Support', prompts: ['Which vocabulary word fits your first sentence starter?', 'What is one example you identified?'] },
      { tier: 'Core', prompts: ['What evidence connects your point to the topic?', 'Can you explain your reasoning in your own words?'] },
      { tier: 'Extend', prompts: ['What counterargument might an expert raise?', 'How does this principle apply in a broader context?'] }
    ],
    grouping_tip: 'Seat Support students in flexible pairs near the primary display, with Core and Extend students in collaborative inquiry triads.'
  };
}

// ----------------------------------------------------
// CLASSROOM ASSIGNMENTS & LIVE SUBMISSIONS API ROUTES
// ----------------------------------------------------

// List all assignments
app.get('/api/assignments', (_req, res) => {
  const list = Object.values(store.assignments || {}).sort((a: any, b: any) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  res.json({ assignments: list });
});

// Lookup assignment by PIN Code or ID (case-insensitive)
app.get('/api/assignments/:code', (req, res) => {
  const rawCode = req.params.code || '';
  const searchNormalized = rawCode.trim().toUpperCase().replace(/\s+/g, '-');
  
  const assignments = Object.values(store.assignments || {});
  const found = assignments.find((a: any) => {
    const code = (a.code || '').trim().toUpperCase().replace(/\s+/g, '-');
    return code === searchNormalized || a.id === rawCode;
  });

  if (!found) {
    return res.status(404).json({ error: `Assignment not found for code "${rawCode}".` });
  }

  return res.json({ assignment: found });
});

// Create or update class assignment
app.post('/api/assignments', (req, res) => {
  const assignment = req.body;
  if (!assignment || !assignment.code || !assignment.lanes) {
    return res.status(400).json({ error: 'Invalid assignment data provided.' });
  }

  // Normalize code and id
  const normalizedCode = assignment.code.trim().toUpperCase().replace(/\s+/g, '-');
  const assignmentId = assignment.id || `assign_${Date.now()}`;
  
  const savedAssignment = {
    ...assignment,
    id: assignmentId,
    code: normalizedCode,
    updatedAt: new Date().toISOString()
  };

  store.assignments[assignmentId] = savedAssignment;
  if (!store.submissions[assignmentId]) {
    store.submissions[assignmentId] = [];
  }
  
  persistStore();
  console.log(`Saved assignment [${normalizedCode}] ${savedAssignment.title}`);
  return res.json({ assignment: savedAssignment });
});

// Delete an assignment
app.delete('/api/assignments/:id', (req, res) => {
  const id = req.params.id;
  delete store.assignments[id];
  delete store.submissions[id];
  persistStore();
  return res.json({ success: true });
});

// Get submissions for an assignment
app.get('/api/assignments/:id/submissions', (req, res) => {
  const id = req.params.id;
  let submissions = store.submissions[id] || [];

  // Also check if ID passed was actually a PIN code
  if (submissions.length === 0) {
    const codeNormalized = id.trim().toUpperCase().replace(/\s+/g, '-');
    const assignment = Object.values(store.assignments || {}).find((a: any) => 
      (a.code || '').toUpperCase() === codeNormalized
    );
    if (assignment && store.submissions[assignment.id]) {
      submissions = store.submissions[assignment.id];
    }
  }

  return res.json({ submissions });
});

// Submit student work for an assignment code or ID
app.post('/api/assignments/:code/submissions', (req, res) => {
  const rawCode = req.params.code || '';
  const searchNormalized = rawCode.trim().toUpperCase().replace(/\s+/g, '-');
  const submission = req.body;

  if (!submission || !submission.studentName || !submission.answerText) {
    return res.status(400).json({ error: 'Student name and response are required.' });
  }

  // Find assignment
  let targetAssignment = store.assignments[rawCode];
  if (!targetAssignment) {
    targetAssignment = Object.values(store.assignments || {}).find((a: any) => {
      const code = (a.code || '').trim().toUpperCase().replace(/\s+/g, '-');
      return code === searchNormalized || a.id === rawCode;
    });
  }

  const assignmentId = targetAssignment ? targetAssignment.id : (submission.assignmentId || rawCode);
  const assignmentCode = targetAssignment ? targetAssignment.code : searchNormalized;

  if (!store.submissions[assignmentId]) {
    store.submissions[assignmentId] = [];
  }

  const subId = submission.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const savedSubmission = {
    ...submission,
    id: subId,
    assignmentId,
    assignmentCode,
    submittedAt: submission.submittedAt || new Date().toISOString()
  };

  // Replace or append
  const existingIdx = store.submissions[assignmentId].findIndex((s: any) => s.id === subId);
  if (existingIdx >= 0) {
    store.submissions[assignmentId][existingIdx] = savedSubmission;
  } else {
    store.submissions[assignmentId].unshift(savedSubmission);
  }

  persistStore();
  console.log(`Received student submission from [${savedSubmission.studentName}] for class [${assignmentCode}]`);
  return res.json({ submission: savedSubmission });
});

// ----------------------------------------------------
// CORE AI DIFFERENTIATION & MARKING ROUTES
// ----------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    assignmentsCount: Object.keys(store.assignments || {}).length
  });
});

app.post('/api/test-key', async (req, res) => {
  const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
  const ai = getGemini(customKey);
  if (!ai) {
    return res.status(400).json({ valid: false, error: 'No API key provided.' });
  }
  try {
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: 'Respond with OK',
        });
        if (response.text) {
          return res.json({ valid: true });
        }
      } catch (err: any) {
        console.warn(`Test key probe on ${model} returned:`, err?.message || err);
      }
    }
    return res.status(400).json({ valid: false, error: 'Could not validate key against Gemini models. Please check if your key is active in Google AI Studio.' });
  } catch (error: any) {
    return res.status(400).json({ valid: false, error: error.message || 'Invalid API key or connection error.' });
  }
});

app.post('/api/diffuse', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;
  const { task, context, axis } = req.body;

  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'Task input is required.' });
  }

  const axisDescriptions: Record<string, string> = {
    readiness: 'three READINESS tiers named exactly "Support", "Core", "Extend" — same learning objective, increasing complexity and independence. Support gets sentence starters, worked scaffolding, and structured prompts; Core is the grade-level task; Extend adds a higher-order, open-ended or critical twist.',
    profile: 'three LEARNING PROFILE routes named exactly "Support", "Core", "Extend" where Support = a visual/diagrammatic/graphical route; Core = a structured text & analytical route; Extend = an investigative, practical, or real-world application route into the SAME learning objective.',
    product: 'three PRODUCT CHOICE options named exactly "Support", "Core", "Extend" where Support = structured written response format; Core = visual model or infographic summary format; Extend = audio script, debate pitch, or self-directed demonstration format assessing the same understanding.'
  };

  const selectedAxisDesc = axisDescriptions[axis] || axisDescriptions.readiness;  const prompt = `You are an expert master educator specializing in adaptive classroom differentiation across international and national curricula (EduTN43 Gradient).

CRITICAL CURRICULUM & GRADE LEVEL CALIBRATION RULES:
1. STRICT CURRICULUM & GRADE COGNITIVE LOAD TRACKING:
   - Target Context & Grade Level: ${context || 'IBMYP / IGCSE / ICSE / IBDP'}
   - You MUST tailor vocabulary, reading level, sentence complexity, cognitive load, and scaffolding EXACTLY to the specified Curriculum and Grade Level:
     * IGCSE (FM 1 to FM 5):
       - FM 1 (Grade 6 / Age 11-12): Emerging secondary. Use simple, everyday words, very short sentences, concrete prompts.
       - FM 2 (Grade 7 / Age 12-13): Early secondary. Direct, clear, and relatable.
       - FM 3 (Grade 8 / Age 13-14): Mid secondary. Standard concise secondary tasks with guided terminology.
       - FM 4 (Grade 9 / Age 14-15): Upper secondary / IGCSE Year 1. Structured analytical prompts.
       - FM 5 (Grade 10 / Age 15-16): IGCSE exam year. Clear, structured exam-style questions with precise command terms.
     * IBMYP (MYP 1 to MYP 5):
       - MYP 1 (Grade 6): Inquiry-based, accessible, concrete conceptual framing.
       - MYP 2 (Grade 7): Guided exploration of global contexts and related concepts.
       - MYP 3 (Grade 8): Balanced conceptual inquiry with structured analytical criteria.
       - MYP 4 (Grade 9): Critical thinking with command terms and synthesis.
       - MYP 5 (Grade 10): Rigorous criterion-referenced inquiry and synthesis.
     * ICSE (Grade 1 to Grade 10):
       - Grades 1-5: Primary level. Clear, illustrative, step-by-step guidance.
       - Grades 6-8: Middle school. Syllabus-aligned, conceptual clarity with defined terminology.
       - Grades 9-10: High school board level. Structured, analytical, syllabus-precise questions.
     * IBDP (IBDP 1 to IBDP 2):
       - IBDP 1 (Grade 11): Pre-university diploma. Rigorous, analytical, inquiry and Theory of Knowledge (TOK) aware.
       - IBDP 2 (Grade 12): Final diploma year. High-level evaluative synthesis, critical examination, and precise subject terminology.

2. TIER DIFFICULTY GUIDELINES:
   - SUPPORT LANE (Foundational & Highly Scaffolding):
     * Must be gentle, clear, and confidence-building for students needing foundational help at this grade level.
     * Break the task down into 2 or 3 short, bite-sized steps (e.g. "Step 1: Look at...", "Step 2: Use the starter...").
     * Provide a fill-in-the-blank or sentence starter frame (e.g. "The main reason is ___ because ___").
     * Give 3 essential, accessible vocabulary terms.
   
   - CORE LANE (Standard Grade-Level Objective):
     * Must be clear, direct, and straightforward for the average student in this exact curriculum grade.
     * State the core objective in 1-2 focused sentences.
     * Provide a guiding prompt or paragraph structure.
     * Give 3-4 standard grade-level vocabulary terms.

   - EXTEND LANE (Enriching & Challenging — Strictly Calibrated to this Grade Level):
     * Offer a thoughtful, higher-order thinking challenge (e.g., comparative perspective, evaluation, or real-world application).
     * The challenge MUST still be achievable and engaging for a student of this specific grade level.
     * Give 3-4 advanced/enriching terms appropriate for this grade.

Original Core Task / Material: """${task}"""

Generate ${selectedAxisDesc}.

Provide:
1. Three lanes ("Support", "Core", "Extend"), each with:
   - task_text: The differentiated prompt/question (clear, direct, age-appropriate for the specified MYP/FM year level).
   - scaffold: Concrete scaffolding, sentence starter, or structured strategy provided.
   - vocab: Array of 3 to 4 domain terms calibrated to this grade level.
2. talk_moves: For each tier ("Support", "Core", "Extend"), provide 2 friendly spoken prompts the teacher can ask out loud while circulating to prompt thinking without overwhelming the student.
3. grouping_tip: One practical sentence on seating or peer support for this task.

Return strictly valid JSON matching this schema:
{
  "lanes": [
    { "tier": "Support", "task_text": "...", "scaffold": "...", "vocab": ["word1", "word2", "word3"] },
    { "tier": "Core", "task_text": "...", "scaffold": "...", "vocab": ["word1", "word2", "word3"] },
    { "tier": "Extend", "task_text": "...", "scaffold": "...", "vocab": ["word1", "word2", "word3"] }
  ],
  "talk_moves": [
    { "tier": "Support", "prompts": ["prompt 1", "prompt 2"] },
    { "tier": "Core", "prompts": ["prompt 1", "prompt 2"] },
    { "tier": "Extend", "prompts": ["prompt 1", "prompt 2"] }
  ],
  "grouping_tip": "..."
}`;

  try {
    const ai = getGemini(customApiKey);

    if (!ai) {
      return res.json(generateSmartFallback(task, context, axis));
    }

    try {
      const responseText = await generateWithModelFallback(ai, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      const cleaned = cleanJsonText(responseText);
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.lanes) && parsed.lanes.length >= 3) {
        return res.json(parsed);
      }
      return res.json(generateSmartFallback(task, context, axis));
    } catch (modelError: any) {
      console.warn('Gemini models unavailable in /api/diffuse, applying smart pedagogical fallback:', modelError?.message || modelError);
      return res.json(generateSmartFallback(task, context, axis));
    }
  } catch (error: any) {
    console.error('Error in /api/diffuse:', error);
    return res.json(generateSmartFallback(task, context, axis));
  }
});

app.post('/api/mark', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;
  const { tier, task_text, student_answer, context } = req.body;

  if (!student_answer || typeof student_answer !== 'string') {
    return res.status(400).json({ error: 'Student answer is required.' });
  }

  const prompt = `You are an encouraging, expert secondary formative evaluator marking a student response in an IB MYP / Cambridge IGCSE classroom.

STRICT ACADEMIC LEVEL LIMIT:
- Target Framework & Level: ${context || 'IB MYP (MYP 1-5) / Cambridge IGCSE (FM1-FM5)'} (Middle School to High School Level ONLY; Ages 11-16 / Grades 6-10).
- Do NOT judge or mark against higher secondary (IB DP / A-Level / University) standards.
- Lane Concentration Tier: ${tier || 'Core'} (Judged ONLY against expectations appropriate for the ${tier} lane at this specific grade level, NOT against higher tiers).

Assigned Differentiated Question: """${task_text}"""
Student's Submitted Answer: """${student_answer}"""

Evaluate the work for depth of understanding, clarity, and use of relevant terminology.

Return strictly valid JSON in this exact shape:
{
  "level": "Beginning" | "Developing" | "Secure" | "Excelling",
  "strength": "A concise, specific 1-2 sentence praise highlighting what the student demonstrated accurately.",
  "next_step": "A constructive 1-2 sentence actionable tip to help the student refine or expand their response.",
  "detailed_feedback": "2-3 sentences of deeper qualitative commentary encouraging the student."
}`;

  try {
    const ai = getGemini(customApiKey);

    if (!ai) {
      return res.json(generateFormativeFeedbackFallback(student_answer, tier));
    }

    try {
      const responseText = await generateWithModelFallback(ai, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.2,
      });

      const cleaned = cleanJsonText(responseText);
      const parsed = JSON.parse(cleaned);

      if (parsed && parsed.level && parsed.strength && parsed.next_step) {
        return res.json(parsed);
      }
      return res.json(generateFormativeFeedbackFallback(student_answer, tier));
    } catch (modelError: any) {
      console.warn('Gemini models unavailable in /api/mark, applying formative feedback fallback:', modelError?.message || modelError);
      return res.json(generateFormativeFeedbackFallback(student_answer, tier));
    }
  } catch (error: any) {
    console.error('Error in /api/mark:', error);
    return res.json(generateFormativeFeedbackFallback(student_answer, tier));
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();


