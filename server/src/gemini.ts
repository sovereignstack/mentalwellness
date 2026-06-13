import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import type { AnalysisResult, SafetyLevel } from '../../shared/types.js';

export type { AnalysisResult };

dotenv.config();

// Initialize the Gemini SDK.
// It will look for process.env.GEMINI_API_KEY automatically.
// We provide a getter function so that if the key is added/loaded late, it still functions.
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({ apiKey });
    } else {
      console.warn('GEMINI_API_KEY is not defined. Gemini client will run in mock/fallback mode.');
    }
  }
  return aiInstance;
}

/**
 * Classifies the student journal text for immediate safety risk.
 */
export async function safetyClassify(text: string): Promise<SafetyLevel> {
  const ai = getAI();
  if (!ai || !text.trim()) {
    return 'none';
  }

  try {
    const prompt = `You are a safety classifier for a student well-being app. Read the text and assess immediate risk only.
Return ONLY JSON: {"risk": "none" | "elevated" | "crisis"}. No other text.
- "crisis": ANY sign of self-harm, suicidal thoughts, intent or plan to harm self or others. When in doubt between crisis and elevated, choose crisis.
- "elevated": severe hopelessness, worthlessness, or feeling unable to cope, WITHOUT explicit self-harm.
- "none": ordinary stress, frustration, or low mood.
Text: "${text.replace(/"/g, '\\"')}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText.trim());
    if (parsed && (parsed.risk === 'none' || parsed.risk === 'elevated' || parsed.risk === 'crisis')) {
      return parsed.risk;
    }
    return 'none';
  } catch (error) {
    console.error('Gemini safety classification error:', error);
    // If Gemini fails, we fail safe by relying on the deterministic keyword check.
    return 'none';
  }
}

/**
 * Analyzes a student journal entry to return themes, stressors, and supportive resources.
 */
export async function analyzeEntry(
  journal: string,
  exam: string,
  mood: number,
  tags: string[]
): Promise<AnalysisResult> {
  const fallbackResult: AnalysisResult = {
    reflection: "Thank you for sharing your thoughts today. Taking a moment to journal is a great way to step back and reflect.",
    themes: tags.length > 0 ? tags : ["reflection"],
    detectedStressors: tags.length > 0 ? tags : ["general pressure"],
    copingStrategy: "Take a short 5-minute stretch break and drink a glass of water before starting your next study block.",
    mindfulnessExercise: "Close your eyes, sit comfortably, and take 5 slow, deep breaths, focusing entirely on the feeling of your lungs expanding and contracting.",
    motivation: "Steady effort matters more than any single day — you are showing up, and that counts."
  };

  const ai = getAI();
  if (!ai || !journal.trim()) {
    return fallbackResult;
  }

  try {
    const prompt = `You are MindEase, a warm, non-clinical well-being companion for an Indian student preparing for ${exam || 'their board/entrance exams'}.
You are NOT a therapist; never diagnose, never give medical advice, never use clinical labels.
Read the journal entry and help gently. Anchor everything in the student's exam context (mock tests, results, parental pressure, peer comparison, sleep, time pressure).
Tone rules: validate feelings without amplifying them; do NOT mirror distress back in a way that deepens rumination; avoid clichés and toxic positivity ("just relax", "everything will be fine"); encourage rest, breaks, and real-world support.

Respond with ONLY a single JSON object (no markdown, no commentary) with EXACTLY these keys:
{
  "reflection": "2-3 warm, specific sentences acknowledging what they actually wrote",
  "themes": ["2-4 short lowercase topic tags drawn from the entry"],
  "detectedStressors": ["1-3 concrete stressors evident in the text"],
  "copingStrategy": "ONE specific, practical, exam-context coping action they can do today",
  "mindfulnessExercise": "ONE short exercise under 60 words (e.g. a breathing or grounding micro-practice)",
  "motivation": "ONE short, genuine, exam-contextual encouraging sentence — no clichés, no pressure"
}
Mood the student self-reported: ${mood}/5. Context tags: ${tags.join(', ') || 'none'}.
Journal entry: "${journal.replace(/"/g, '\\"')}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText.trim()) as AnalysisResult;

    // Validate schema fields defensively; motivation falls back if the model omits it.
    if (
      parsed &&
      typeof parsed.reflection === 'string' &&
      Array.isArray(parsed.themes) &&
      Array.isArray(parsed.detectedStressors) &&
      typeof parsed.copingStrategy === 'string' &&
      typeof parsed.mindfulnessExercise === 'string'
    ) {
      return {
        ...parsed,
        motivation:
          typeof parsed.motivation === 'string' && parsed.motivation.trim()
            ? parsed.motivation
            : fallbackResult.motivation,
      };
    }
    return fallbackResult;
  } catch (error) {
    console.error('Gemini entry analysis error:', error);
    return fallbackResult;
  }
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Generates an empathetic reply to a follow-up conversation message.
 */
export async function companionChat(
  history: ChatMessage[],
  newMessage: string,
  exam: string
): Promise<string> {
  const fallbackReply = "I'm here to support you. Let's take it one step at a time. Have you had a chance to rest or drink some water recently?";
  
  const ai = getAI();
  if (!ai) {
    return fallbackReply;
  }

  try {
    const formattedHistory = history.map(h => 
      `${h.role === 'user' ? 'Student' : 'Companion'}: ${h.text}`
    ).join('\n');

    const prompt = `You are MindEase, a warm, non-clinical well-being companion for an Indian student preparing for ${exam || 'high-stakes board/entrance exams'}.
You are NOT a therapist; never diagnose or give medical advice.
Reply in 1-3 brief sentences: validating and gently constructive, grounded in their exam context.
Validate without amplifying distress; avoid clichés and toxic positivity. Do NOT foster dependence ("keep talking to me") — where natural, point toward rest, breaks, and real-world support.
Chat so far:
${formattedHistory}
Student's new message: "${newMessage.replace(/"/g, '\\"')}"
Reply:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || fallbackReply;
  } catch (error) {
    console.error('Gemini companion chat error:', error);
    return fallbackReply;
  }
}
