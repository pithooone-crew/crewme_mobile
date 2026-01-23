import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Message Generation endpoint for crew communications
  app.post("/api/generate-message", async (req, res) => {
    try {
      const { subject, category, projectName, taskName, tone = "professional" } = req.body;

      if (!subject) {
        return res.status(400).json({ error: "Subject is required" });
      }

      const contextParts = [];
      if (projectName) contextParts.push(`Project: ${projectName}`);
      if (taskName) contextParts.push(`Task: ${taskName}`);
      const context = contextParts.length > 0 ? contextParts.join(", ") : "";

      const systemPrompt = `You are a helpful assistant for construction crew communications. Generate a clear, ${tone} message for crew members. Keep it concise and action-oriented. Do not include greetings like "Dear team" or signatures.`;

      const userPrompt = `Generate a ${category || "general"} message about: "${subject}"${context ? `. Context: ${context}` : ""}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      });

      const generatedMessage = response.choices[0]?.message?.content || "";
      
      res.json({ message: generatedMessage.trim() });
    } catch (error) {
      console.error("Error generating message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  // Read receipt endpoint - marks message as read and generates AI acknowledgment
  app.post("/api/crew-messages/:id/read-receipt", async (req, res) => {
    try {
      const { id } = req.params;
      const { messageSubject, messageContent, priority } = req.body;
      
      const readAt = new Date().toISOString();
      
      // Generate AI acknowledgment based on message content and priority
      let aiAcknowledgment = "";
      try {
        const urgencyContext = priority === "high" || priority === "urgent" 
          ? "urgent and formal" 
          : priority === "low" 
            ? "casual and friendly" 
            : "professional and measured";
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: `You are generating a brief read receipt acknowledgment for a construction crew message. Keep it to 1-2 sentences. The tone should be ${urgencyContext}. Do not include greetings or signatures.`
            },
            { 
              role: "user", 
              content: `Generate an acknowledgment for receiving this message about: "${messageSubject || "a crew update"}". ${messageContent ? `Message content: "${messageContent.substring(0, 200)}"` : ""}`
            },
          ],
          max_tokens: 100,
        });
        
        aiAcknowledgment = response.choices[0]?.message?.content?.trim() || "Message received and acknowledged.";
      } catch (aiError) {
        console.error("AI acknowledgment generation failed:", aiError);
        aiAcknowledgment = "Message received and acknowledged.";
      }
      
      res.json({ 
        success: true, 
        readAt,
        aiAcknowledgment,
        readBy: "current_user",
      });
    } catch (error) {
      console.error("Error sending read receipt:", error);
      res.status(500).json({ error: "Failed to send read receipt" });
    }
  });

  // Get read status for a message
  app.get("/api/crew-messages/:id/read-status", async (req, res) => {
    try {
      const { id } = req.params;
      
      // In a real app, this would fetch from database
      // For now, return a mock status that indicates it was read
      res.json({
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: "current_user",
        readReceiptSent: true,
        aiAcknowledgment: "Message received and acknowledged.",
      });
    } catch (error) {
      console.error("Error getting read status:", error);
      res.status(500).json({ error: "Failed to get read status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
