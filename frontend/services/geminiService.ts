
import { GoogleGenAI } from "@google/genai";
import { FollowUp } from "../types";

export const generateFollowUpEmail = async (followUp: FollowUp): Promise<string> => {
  try {
    // Initialize inside the function to use the latest process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a professional business assistant.
      Draft a polite and concise follow-up email to a client based on the following details:
      
      Client Name: ${followUp.clientName}
      Company: ${followUp.company}
      Last Contact Date: ${followUp.lastContactDate}
      Context/Notes: ${followUp.notes}
      
      The email should be professional, warm, and encourage a response.
      Subject line should be included.
      Do not include placeholders like "[Your Name]" - sign it as "The Team".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate email draft.";
  } catch (error) {
    console.error("Error generating email:", error);
    return "Error generating email. Please check your API key and try again.";
  }
};

export const suggestPriorities = async (tasks: string[]): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
        I have the following tasks. Please analyze them and suggest a priority order (High to Low) with a brief 1-sentence reason for the top task.
        Tasks: ${JSON.stringify(tasks)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "Unable to analyze tasks.";
    } catch (error) {
        console.error("Error analyzing tasks:", error);
        return "Error analyzing tasks.";
    }
}
