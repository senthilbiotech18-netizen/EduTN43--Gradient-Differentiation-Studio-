// Client-side direct Gemini API caller for static hosting (Vercel, Netlify, PWA)
import { DiffusedResult, MarkingFeedback } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
    const response = await fetch(`${GEMINI_API_URL}?key=${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with OK' }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || 'Invalid API Key or project disabled in Google AI Studio.';
      return { valid: false, error: msg };
    }

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
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
  const unitContext = context || 'General High School / Middle School';

  const systemPrompt = `You are a Master IB MYP & IGCSE Educational Specialist and Differentiation Expert (EduTN43 Gradient).
Differentiate the user's task or question into exactly THREE distinct lanes based on the requested differentiation axis: "${selectedAxis}".

Context: ${unitContext}
Original Task to Differentiate:
"${task}"

CRITICAL INSTRUCTIONS:
1. Support Lane: Scaffolded for students needing foundational access.
2. Core Lane: Standard level matching core curriculum standards.
3. Extend Lane: Higher-order thinking, open-ended extension.

Return ONLY a valid, strict JSON object with NO markdown wrapper, matching this schema exactly:
{
  "lanes": [
    {
      "tier": "Support",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2"]
    },
    {
      "tier": "Core",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2"]
    },
    {
      "tier": "Extend",
      "task_text": "Differentiated task text...",
      "scaffold": "Scaffolding provided...",
      "vocab": ["KeyTerm1", "KeyTerm2"]
    }
  ],
  "talk_moves": [
    { "tier": "Support", "prompts": ["Socratic prompt 1", "Socratic prompt 2"] },
    { "tier": "Core", "prompts": ["Socratic prompt 1", "Socratic prompt 2"] },
    { "tier": "Extend", "prompts": ["Socratic prompt 1", "Socratic prompt 2"] }
  ],
  "grouping_tip": "Specific, practical classroom grouping strategy."
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini API request failed.');
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No content returned from Gemini.');
  }

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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to evaluate response.');
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No response from Gemini API.');
  }

  const cleaned = cleanJsonText(rawText);
  return JSON.parse(cleaned);
}
