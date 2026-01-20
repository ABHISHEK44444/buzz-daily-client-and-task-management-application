import { GoogleGenAI } from "@google/genai";
import { FollowUp, Task } from "../types";

// This is a more generic function that can be used for various AI tasks.
export const generateAIResponse = async (
  prompt: string,
  context?: { tasks?: Task[]; followUps?: FollowUp[] }
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct a more detailed context for the AI
    let fullPrompt = `You are a helpful business assistant for an app called BizTrack.\n`;
    if (context?.tasks && context.tasks.length > 0) {
      fullPrompt += `Here are the user's current tasks:\n${JSON.stringify(
        context.tasks.map(({ id, ...task }) => task),
        null,
        2
      )}\n\n`;
    }
    if (context?.followUps && context.followUps.length > 0) {
      fullPrompt += `Here are the user's current client follow-ups:\n${JSON.stringify(
        context.followUps.map(({ id, ...followUp }) => followUp),
        null,
        2
      )}\n\n`;
    }
    fullPrompt += `Based on the context above, please respond to the following request. Format your response clearly, using markdown for lists, bolding, etc.\n\nUser Request: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "Unable to generate a response.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
      return "Could not connect to the AI service. Please ensure your API key is correctly configured in the application environment and try again.";
    }
    return "An error occurred while generating the AI response.";
  }
};
