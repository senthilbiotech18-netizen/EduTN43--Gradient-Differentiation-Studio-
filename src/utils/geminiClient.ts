// Client-side direct Gemini API caller for static hosting (Vercel, Netlify, PWA)
import { DiffusedResult, MarkingFeedback } from '../types';

const DIRECT_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'];

function getGeminiEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
}

async function callDirectWithModelFallback(apiKey: string, contents: any, isJson: boolean = false): Promise<string> {
  let lastError: any = null;

  for (const model of DIRECT_MODELS) {
    try {
      const url = getGeminiEndpoint(model, apiKey);
      const bodyPayload: any = {
        contents: typeof contents === 'string' ? [{ parts: [{ text: contents }] }] : contents,
      };
      if (isJson) {
        bodyPayload.generationConfig = {
          responseMimeType: 'application/json',
          temperature: 0.2
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `Model ${model} returned error status ${response.status}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Direct model ${model} failed, trying next candidate:`, err?.message || err);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

function cleanJsonText(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return match[0];
  }
  return text;
}

export async function validateGeminiApiKeyDirect(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { valid: false, error: 'Please enter a valid Gemini API key.' };
  }

  try {
    const text = await callDirectWithModelFallback(cleanKey, 'Respond with OK', false);
    if (text) {
      return { valid: true };
    }
    return { valid: false, error: 'Model did not return a valid response.' };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error connecting to Google Gemini API.' };
  }
}

export async function diffuseTaskDirect(
  apiKey: string,
  task: string,
  context?: string,
  axis?: string
): Promise<any> {
  const selectedAxis = axis || 'readiness';
  const unitContext = context || 'IBMYP / IGCSE / ICSE / IBDP Secondary';

  const systemPrompt = `You are an expert master educator specializing in adaptive classroom differentiation across international and national curricula (EduTN43 Gradient).

CRITICAL CURRICULUM & GRADE LEVEL CALIBRATION RULES:
1. STRICT CURRICULUM & GRADE COGNITIVE LOAD TRACKING:
   - Target Context & Grade Level: ${unitContext}
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

Original Task to Differentiate:
"${task}"

Differentiate by axis: "${selectedAxis}".

Return ONLY a valid, strict JSON object with NO markdown wrapper, matching this schema exactly:
{
  "lanes": [
    {
      "tier": "Support",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2", "KeyTerm3"]
    },
    {
      "tier": "Core",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2", "KeyTerm3"]
    },
    {
      "tier": "Extend",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2", "KeyTerm3"]
    }
  ],
  "talk_moves": [
    { "tier": "Support", "prompts": ["Friendly prompt 1", "Friendly prompt 2"] },
    { "tier": "Core", "prompts": ["Friendly prompt 1", "Friendly prompt 2"] },
    { "tier": "Extend", "prompts": ["Friendly prompt 1", "Friendly prompt 2"] }
  ],
  "grouping_tip": "Specific, practical classroom grouping strategy."
}`;

  const rawText = await callDirectWithModelFallback(apiKey, systemPrompt, true);
  const cleaned = cleanJsonText(rawText);
  return JSON.parse(cleaned);
}

export async function markResponseDirect(
  apiKey: string,
  tier: string,
  task_text: string,
  student_answer: string,
  context?: string
): Promise<MarkingFeedback> {
  const prompt = `You are an IB / IGCSE Master Teacher evaluating student work.
Evaluate the following student submission for a ${tier} tier differentiated task.

Context: ${context || 'General'}
Task Text: "${task_text}"
Student Answer: "${student_answer}"

Return ONLY a valid JSON object matching this schema:
{
  "level": "Beginning" | "Developing" | "Secure" | "Excelling",
  "strength": "1-2 sentences highlighting what the student did well.",
  "next_step": "1 actionable, encouraging growth step for the student.",
  "detailed_feedback": "3-4 sentences of constructive formative feedback."
}`;

  const rawText = await callDirectWithModelFallback(apiKey, prompt, true);
  const cleaned = cleanJsonText(rawText);
  return JSON.parse(cleaned);
}
