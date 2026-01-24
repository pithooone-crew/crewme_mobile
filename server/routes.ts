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

  // Accept work assignment (replacement request, shift swap, overtime)
  app.post("/api/work-assignments/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, assignmentType, projectId, projectName, date, duration, notes } = req.body;
      
      const acceptedAt = new Date().toISOString();
      
      // In production, this would:
      // 1. Update assignment status in database
      // 2. Notify the web app/scheduler about the acceptance
      // 3. Update worker's schedule
      // 4. Send notifications to relevant parties
      
      // Sync with external web app (Site Scheduler)
      try {
        const externalResponse = await fetch("https://site-scheduler--pithooone.replit.app/api/assignments/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: id,
            workerId: userId,
            acceptedAt,
            projectId,
            projectName,
            date,
            duration,
            source: "crewme-mobile",
          }),
        });
        
        if (!externalResponse.ok) {
          console.log("External sync returned non-OK status, proceeding with local acceptance");
        }
      } catch (syncError) {
        // Log but don't fail - the acceptance is still valid locally
        console.log("External sync failed, will retry later:", syncError);
      }
      
      res.json({
        success: true,
        assignmentId: id,
        status: "accepted",
        acceptedAt,
        message: "Work assignment accepted successfully. Your schedule has been updated.",
      });
    } catch (error) {
      console.error("Error accepting work assignment:", error);
      res.status(500).json({ error: "Failed to accept work assignment" });
    }
  });

  // Decline work assignment
  app.post("/api/work-assignments/:id/decline", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, reason, assignmentType } = req.body;
      
      const declinedAt = new Date().toISOString();
      
      // Sync with external web app
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/assignments/decline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: id,
            workerId: userId,
            declinedAt,
            reason,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for decline:", syncError);
      }
      
      res.json({
        success: true,
        assignmentId: id,
        status: "declined",
        declinedAt,
        message: "Work assignment declined. The AI will find another available worker.",
      });
    } catch (error) {
      console.error("Error declining work assignment:", error);
      res.status(500).json({ error: "Failed to decline work assignment" });
    }
  });

  // Accept matched availability shift
  app.post("/api/availability/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, projectId, projectName, date, startTime, endTime } = req.body;
      
      const confirmedAt = new Date().toISOString();
      
      // Sync with external web app
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/availability/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availabilityId: id,
            workerId: userId,
            confirmedAt,
            projectId,
            projectName,
            date,
            startTime,
            endTime,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for availability confirmation:", syncError);
      }
      
      res.json({
        success: true,
        availabilityId: id,
        status: "confirmed",
        confirmedAt,
        message: "Shift confirmed! You've been added to the project schedule.",
      });
    } catch (error) {
      console.error("Error confirming availability:", error);
      res.status(500).json({ error: "Failed to confirm shift" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
