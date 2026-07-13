import { EntomologicalData } from "@/types";

/**
 * Client-side proxy function to call the server-side /api/process-image endpoint.
 * This completely hides and protects the Gemini API key on the server.
 */
export const processSpecimenImage = async (
  apiKey: string,
  base64Image: string,
  prompt: string,
  modelName: string = "gemini-3.5-flash",
  temperature: number = 0.1
): Promise<EntomologicalData> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch("/api/process-image", {
    method: "POST",
    headers,
    body: JSON.stringify({
      base64Image,
      prompt,
      modelName,
      temperature,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
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
