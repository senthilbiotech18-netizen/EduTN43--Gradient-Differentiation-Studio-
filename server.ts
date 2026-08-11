import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

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

// Helper to clean JSON string
function cleanJsonText(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  return text;
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') });
});

app.post('/api/test-key', async (req, res) => {
  const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
  const ai = getGemini(customKey);
  if (!ai) {
    return res.status(400).json({ valid: false, error: 'No API key provided.' });
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Respond with OK',
    });
    if (response.text) {
      return res.json({ valid: true });
    }
    return res.json({ valid: false, error: 'No response received from model.' });
  } catch (error: any) {
    return res.status(400).json({ valid: false, error: error.message || 'Invalid API key or connection error.' });
  }
});

app.post('/api/diffuse', async (req, res) => {
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

  const selectedAxisDesc = axisDescriptions[axis] || axisDescriptions.readiness;

  const prompt = `You are an expert IB MYP and Cambridge IGCSE master teacher helping differentiate ONE core classroom task into 3 distinct learning lanes for a secondary classroom.

CRITICAL CURRICULUM & ACADEMIC LEVEL CONSTRAINTS:
- You MUST strictly align all tasks, scaffolding, and vocabulary to Middle School and High School level ONLY (Ages 11-16 / Grades 6-10).
- Permitted Curriculum Frameworks: IB MYP (MYP 1 to MYP 5) and Cambridge IGCSE (FM1 to FM5).
- STRICTLY PROHIBITED: Do NOT generate higher secondary school level, IB Diploma Programme (DP), A-Level, AP, or university level material under any circumstances. Keep task complexity strictly within the MYP 1-5 or IGCSE FM1-FM5 target scope.

Target Curriculum, Class/Year & Subject: ${context || 'Secondary Education (IB MYP / Cambridge IGCSE)'}
Original Core Task / Material: """${task}"""

Generate ${selectedAxisDesc}.

Provide:
1. Three lanes ("Support", "Core", "Extend"), each with:
   - task_text: The differentiated prompt/question for the student (clear, direct, age-appropriate for the specified MYP 1-5 / FM1-5 level).
   - scaffold: Specific scaffolding, sentence starter, or guiding strategy provided.
   - vocab: Array of 3 to 5 key domain terms needed for this lane at this grade level.
2. talk_moves: For each tier ("Support", "Core", "Extend"), provide 2 short spoken prompts/questions the teacher can ask out loud to prompt deeper thinking while circulating.
3. grouping_tip: One practical sentence on seating or group dynamics for this task.

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
      // Return a smart fallback if API key is not configured yet
      return res.json({
        lanes: [
          {
            tier: 'Support',
            task_text: `[Support] ${task.slice(0, 100)}... Identify key features using the provided word bank and complete the sentence frame.`,
            scaffold: 'Sentence starter: "The structure helps function because..." with labeled diagram hints.',
            vocab: ['Structure', 'Function', 'Transport', 'Surface Area']
          },
          {
            tier: 'Core',
            task_text: `[Core] ${task}`,
            scaffold: 'Guided outline with prompt questions for key evidence.',
            vocab: ['Mechanism', 'Efficiency', 'Adaptation', 'Proportion']
          },
          {
            tier: 'Extend',
            task_text: `[Extend] Analyze ${task.slice(0, 80)}... Compare under extreme conditions and evaluate potential trade-offs.`,
            scaffold: 'Open comparative rubric & self-assessment checklist.',
            vocab: ['Homeostasis', 'Optimization', 'Constraint', 'Hypothesis']
          }
        ],
        talk_moves: [
          { tier: 'Support', prompts: ['Which key vocabulary word matches the diagram label?', 'How does the shape help it move faster?'] },
          { tier: 'Core', prompts: ['What evidence connects this cause to its effect?', 'Can you explain your reasoning in your own words?'] },
          { tier: 'Extend', prompts: ['What would happen if this environmental variable doubled?', 'How does this principle apply to a different biological system?'] }
        ],
        grouping_tip: 'Seat Support students in flexible pairs near the primary display, with Core and Extend students in collaborative triad stations.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const responseText = response.text || '';
    const cleaned = cleanJsonText(responseText);
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/diffuse:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate differentiated tasks.' });
  }
});

app.post('/api/mark', async (req, res) => {
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
      const wordCount = student_answer.trim().split(/\s+/).length;
      const level = wordCount > 30 ? 'Secure' : wordCount > 15 ? 'Developing' : 'Beginning';
      return res.json({
        level,
        strength: `Good attempt in the ${tier} lane! You clearly addressed the core focus of the prompt.`,
        next_step: 'Try adding one more key vocabulary term and explaining the connection in detail.',
        detailed_feedback: `Your response shows solid effort. Continuing to use subject-specific vocabulary will strengthen your overall explanation.`
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const responseText = response.text || '';
    const cleaned = cleanJsonText(responseText);
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/mark:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark student response.' });
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
