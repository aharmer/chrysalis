
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EntomologicalData } from "../types";

// Schema definition for structured JSON output
const entomoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    raw_ocr_text: { type: Type.STRING },
    collection_date: { type: Type.STRING },
    collection_date_end: { type: Type.STRING },
    collector: { type: Type.STRING },
    country: { type: Type.STRING },
    state: { type: Type.STRING },
    locality: { type: Type.STRING },
    verbatim_locality: { type: Type.STRING },
    decimal_latitude: { type: Type.STRING },
    decimal_longitude: { type: Type.STRING },
    geocode_method: { type: Type.STRING },
    altitude: { type: Type.STRING },
    habitat: { type: Type.STRING },
    method: { type: Type.STRING },
    determiner: { type: Type.STRING },
    notes: { type: Type.STRING },
  },
  required: ["raw_ocr_text", "locality", "collector"], 
};

export const processSpecimenImage = async (
  apiKey: string,
  base64Image: string,
  prompt: string,
  modelName: string = "gemini-2.5-flash",
  temperature: number = 0.1
): Promise<EntomologicalData> => {
  // Use the provided API key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: entomoSchema,
        temperature: temperature,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text generated");

    try {
      return JSON.parse(text) as EntomologicalData;
    } catch (e) {
      console.error("Failed to parse JSON", text);
      throw new Error("Model response was not valid JSON");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle the specific error mentioned in rules
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API configuration error or model unavailable. Please check project billing.");
    }
    throw new Error(error.message || "Unknown error processing image");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
