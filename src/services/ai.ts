import { GoogleGenAI } from "@google/genai";
import { User, Symptom, HealthRecord, Appointment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiAdvisor = {
  async getAdvice(user: User, symptoms: Symptom[], health: HealthRecord[], appointments: Appointment[], history: { role: 'user' | 'model'; text: string }[]) {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `
            You are MamaKeya AI, a professional pregnancy advisor. 
            User Context:
            - Name: ${user.name}
            - Pregnancy Start: ${user.pregnancy_start_date}
            - Due Date: ${user.due_date}
            
            Recent Symptoms: ${JSON.stringify(symptoms.slice(0, 5))}
            Recent Health Records: ${JSON.stringify(health.slice(0, 5))}
            Upcoming Appointments: ${JSON.stringify(appointments.slice(0, 3))}
            
            Provide empathetic, medically-informed (but with a disclaimer) advice based on this data. 
            Keep it concise and supportive.
          ` }]
        },
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      ],
      config: {
        systemInstruction: "You are a helpful and empathetic pregnancy advisor. Always include a disclaimer that you are an AI and not a doctor."
      }
    });

    const response = await model;
    return response.text;
  }
};
