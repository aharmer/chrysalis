import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Schema definition for structured JSON output
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
    determined_date: { type: Type.STRING },
    order: { type: Type.STRING },
    family: { type: Type.STRING },
    genus: { type: Type.STRING },
    species: { type: Type.STRING },
    notes: { type: Type.STRING },
  },
  required: ["raw_ocr_text", "locality", "collector"], 
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parser with a generous limit for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route for processing images server-side using Gemini API
  app.post("/api/process-image", async (req, res) => {
    try {
      const { base64Image, prompt, temperature, modelName = "gemini-3.5-flash" } = req.body;

      if (!base64Image) {
        return res.status(400).json({ error: "Missing base64Image parameter" });
      }

      // Use the client-provided API key from headers, or fallback to server environment variable if available
      let apiKey = req.headers["x-api-key"] as string;

      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || "";
      }

      if (!apiKey) {
        return res.status(401).json({ 
          error: "Gemini API Key is required. Please open settings in the top right and set your Gemini API Key." 
        });
      }

      // Initialize GoogleGenAI client with the server-side API key and required header
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Execute content generation
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
      console.error("Server-side Gemini API Error:", error);
      
      // Propagate precise error messages
      let errMsg = error.message || "Unknown error processing image";
      if (errMsg.includes("Requested entity was not found")) {
        errMsg = "API configuration error or model unavailable. Please check project billing.";
      }
      
      return res.status(500).json({ error: errMsg });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
