import { GoogleGenAI } from "@google/genai";
import { AiChatMessage } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development, but the app expects the key to be set in the environment.
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const systemInstruction = `You are CourseSphere AI, a helpful and friendly assistant for a learning and community platform.
Your purpose is to answer user questions about the platform's features, guide them on how to find content like courses or downloads, and encourage community engagement.
Be concise and supportive. Do not mention that you are a language model.
Platform features include:
- Community: A feed where users can post questions and share ideas.
- Classroom: A section with courses on various topics. Premium members have full access.
- Downloads: A repository of digital resources available to premium members.
- Settings: Where users can manage their account and subscription plan.`;

export const getAiAssistantResponse = async (history: AiChatMessage[], newMessage: string): Promise<string> => {
  if (!API_KEY) {
    return "AI Assistant is currently unavailable. The API key is not configured.";
  }

  try {
    // FIX: Switched from creating a new chat on every request to a more direct generateContent call with history.
    // This is more efficient for how the assistant is currently implemented.
    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: newMessage }]
      }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction: systemInstruction },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error. Please try again later.";
  }
};