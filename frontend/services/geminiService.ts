import { GoogleGenAI } from "@google/genai";
import { FollowUp, Task } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_API_KEY;

// This is a more generic function that can be used for various AI tasks.
export const generateAIResponse = async (
  prompt: string,
  context?: { tasks?: Task[]; followUps?: FollowUp[] }
): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("API key not valid. Please set VITE_API_KEY in your environment.");
    }
    
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Construct a more detailed context for the AI
    let fullPrompt = `You are a helpful business assistant for an app called BizTrack.\n`;
    // Add specific instructions for formatting and content
    fullPrompt += `When summarizing client follow-up details, only use the data provided. Do not invent or add fields that are not present in the data, such as a 'Priority' field. Format your response clearly using markdown for lists and bolding (e.g., **text**).\n\n`;

    if (context?.tasks && context.tasks.length > 0) {
      fullPrompt += `Here are the user's current tasks:\n${JSON.stringify(
        context.tasks.map(({ id, ...task }) => task),
        null,
        2
      )}\n\n`;
    }
    if (context?.followUps && context.followUps.length > 0) {
      // Explicitly select and name fields for the AI to guide its summary.
      const followUpSummary = context.followUps.map(f => ({
        clientName: f.clientName,
        email: f.email,
        scheduledDate: f.nextFollowUpDate,
        status: f.status,
        notes: f.notes,
      }));
      fullPrompt += `Here are the user's current client follow-ups:\n${JSON.stringify(
        followUpSummary,
        null,
        2
      )}\n\n`;
    }
    fullPrompt += `Based on the context above, please respond to the following request:\n\nUser Request: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "Unable to generate a response.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID') || error.message.includes('VITE_API_KEY'))) {
      return "Could not connect to the AI service. Please ensure your VITE_API_KEY is correctly configured in your application environment and try again.";
    }
    return "An error occurred while generating the AI response.";
  }
};
