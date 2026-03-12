
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ExamMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const VTU_SYSTEM_INSTRUCTION = `
You are the "VTU Smart Study Assistant", an expert academic tutor for Visvesvaraya Technological University (VTU) Engineering students.
Your primary goal is to help students excel in VTU exams by providing high-quality, exam-oriented answers.

GUIDELINES:
1. STRUCTURE: For engineering subjects, always use clear headings (Introduction, Principles, Diagram Description, Advantages, Disadvantages, Applications).
2. EXAM FOCUS: VTU examiners look for keywords and bullet points. Use them generously.
3. DIAGRAMS: Since you are a text-based AI, whenever a question involves a circuit, flow chart, or block diagram, provide a detailed textual description of how the student should draw it (e.g., "Draw a rectangular block for CPU, connect it to RAM via a bidirectional bus...").
4. MARK SCHEMES:
   - If asked for a 5-mark answer, keep it to 1-1.5 pages of equivalent text, focusing on core concepts.
   - If asked for a 10-mark answer, provide a comprehensive explanation with all necessary sub-sections.
5. LANGUAGE: Use simple, professional English that is easy to reproduce in an exam hall.
6. SYLLABUS: Be aware of standard VTU schemes (2018, 2021, 2022). If unsure, ask the student for their specific scheme or module number.
7. CRITICAL: Never provide incorrect technical information. If a concept is complex, explain it using an analogy related to real-world engineering.
`;

export async function getGeminiResponse(
  prompt: string, 
  mode: ExamMode, 
  history: { role: string; parts: { text: string }[] }[] = [],
  imageData?: string
) {
  const model = "gemini-3-flash-preview";
  
  const modeInstructions = {
    [ExamMode.NORMAL]: "Explain this concept clearly.",
    [ExamMode.EXAM_5_MARKS]: "Provide a concise 5-mark exam-oriented answer with bullet points and a description of the necessary diagram.",
    [ExamMode.EXAM_10_MARKS]: "Provide a detailed 10-mark exam-oriented answer. Include sections like Introduction, Working Principle, Construction, and Applications.",
    [ExamMode.VIVA_VOCE]: "Give short, crisp one-liner answers or viva-style questions for this topic."
  };

  const fullPrompt = `${modeInstructions[mode]}\n\nUser Question: ${prompt}`;

  try {
    const contents: any = history.length > 0 ? history : [];
    
    const currentMessageParts: any[] = [{ text: fullPrompt }];
    if (imageData) {
      currentMessageParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(',')[1] // Remove prefix
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [...contents, { role: 'user', parts: currentMessageParts }],
      config: {
        systemInstruction: VTU_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the study assistant. Please check your internet connection or try again later.";
  }
}
