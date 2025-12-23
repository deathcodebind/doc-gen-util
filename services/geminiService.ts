
import { GoogleGenAI } from "@google/genai";

// Fix: Direct initialization using process.env.API_KEY as per the @google/genai SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceDescription = async (text: string): Promise<string> => {
  // Fix: Removed environment variable checks as availability is assumed per guidelines
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Improve the following API documentation description. Keep the meaning but make it more professional and technical. Keep it concise.
      
      Original: ${text}`,
    });
    // Fix: Accessing .text property directly instead of calling it as a method
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

export const suggestEndpoints = async (docTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a list of 3 common API endpoints for a project titled "${docTitle}". Return ONLY a JSON array of objects with fields: method, path, description, arguments, response. Use 'null' for arguments/response if not applicable.`,
    });
    // Fix: Accessing .text property directly instead of calling it as a method
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};
