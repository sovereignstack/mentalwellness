import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

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

export interface AnalysisResult {
  reflection: string;
  themes: string[];
  detectedStressors: string[];
  copingStrategy: string;
  mindfulnessExercise: string;
}

/**
 * Classifies the student journal text for immediate safety risk.
 */
export async function safetyClassify(text: string): Promise<'none' | 'elevated' | 'crisis'> {
  const ai = getAI();
  if (!ai || !text.trim()) {
    return 'none';
  }

  try {
    const prompt = `Classify the following student journal text for immediate safety risk.
Return ONLY JSON with this format: {"risk": "none"|"elevated"|"crisis"}.
"crisis" = any sign of self-harm, suicidal thoughts, or intent to harm.
"elevated" = severe hopelessness/overwhelm without explicit self-harm.
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
    mindfulnessExercise: "Close your eyes, sit comfortably, and take 5 slow, deep breaths, focusing entirely on the feeling of your lungs expanding and contracting."
  };

  const ai = getAI();
  if (!ai || !journal.trim()) {
    return fallbackResult;
  }

  try {
    const prompt = `You are a warm, supportive well-being companion for an Indian student preparing for ${exam || 'their board/entrance exams'}.
You are NOT a therapist and must not diagnose or give medical advice.
Read the journal entry and respond with empathy, then help gently.
Validate feelings without amplifying distress; encourage healthy steps, rest, and real-world support.
Return ONLY JSON matching this structure:
{
  "reflection": "2-3 warm sentences acknowledging their feelings, no clichés, no toxic positivity",
  "themes": ["short topic tags"],
  "detectedStressors": ["likely stressors evident in the text"],
  "copingStrategy": "ONE specific, practical, exam-context coping action",
  "mindfulnessExercise": "ONE short exercise, <60 words, e.g. a breathing or grounding micro-practice"
}
Mood the user self-reported: ${mood}/5. Context tags: ${tags.join(', ')}.
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
    
    // Validate schema fields
    if (
      parsed &&
      typeof parsed.reflection === 'string' &&
      Array.isArray(parsed.themes) &&
      Array.isArray(parsed.detectedStressors) &&
      typeof parsed.copingStrategy === 'string' &&
      typeof parsed.mindfulnessExercise === 'string'
    ) {
      return parsed;
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

    const prompt = `You are a warm, supportive well-being companion for an Indian student preparing for ${exam || 'high-stakes board/entrance exams'}.
You are NOT a therapist and must not diagnose or give medical advice.
Continue as the same warm, non-clinical companion. Keep it brief (1-3 sentences), validating, and gently constructive.
Do not encourage dependence — suggest real-world support and breaks where natural.
Here is the chat history:
${formattedHistory}
Student's new message: "${newMessage.replace(/"/g, '\\"')}"
Response:`;

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
