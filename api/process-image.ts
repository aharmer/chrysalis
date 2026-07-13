import { GoogleGenAI, Type, Schema } from "@google/genai";

// Schema definition for structured JSON output from specimen labels
const entomoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    accession_number: { type: Type.STRING },
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
    coordinate_uncertainty_in_meters: { type: Type.STRING },
    altitude: { type: Type.STRING },
    habitat: { type: Type.STRING },
    method: { type: Type.STRING },
    determiner: { type: Type.STRING },
    order: { type: Type.STRING },
    family: { type: Type.STRING },
    genus: { type: Type.STRING },
    species: { type: Type.STRING },
    notes: { type: Type.STRING },
  },
  required: ["raw_ocr_text", "locality", "collector"], 
};

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { base64Image, prompt, temperature, modelName = "gemini-3.5-flash" } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "Missing base64Image parameter" });
    }

    // Retrieve client-supplied API key from headers, or fallback to server environment variable
    let apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || "";
    }

    if (!apiKey) {
      return res.status(401).json({ 
        error: "Gemini API Key is required. Please click 'Set API Key' in the top-right to configure your key." 
      });
    }

    // Initialize the modern @google/genai client on Vercel's server-side environment
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Execute structured content generation via Gemini
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
            text: prompt || "Transcribe all visible information on the specimen labels.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: entomoSchema,
        temperature: temperature !== undefined ? Number(temperature) : 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text generated from Gemini model.");
    }

    try {
      const parsedData = JSON.parse(text);
      return res.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text);
      return res.status(500).json({ 
        error: "Gemini response was not in a valid JSON format.",
        rawText: text 
      });
    }

  } catch (error: any) {
    console.error("Serverless Gemini API Error on Vercel:", error);
    
    let errMsg = error.message || "Unknown error processing image";
    if (errMsg.includes("Requested entity was not found")) {
      errMsg = "API configuration error or model unavailable. Please check project billing.";
    }
    
    return res.status(500).json({ error: errMsg });
  }
}
