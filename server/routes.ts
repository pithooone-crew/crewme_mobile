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

  // Auto-translate message endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Text and target language are required" });
      }

      const languageNames: Record<string, string> = {
        en: "English",
        es: "Spanish",
        fr: "French",
        zh: "Chinese (Simplified)",
        pt: "Portuguese",
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      const sourceLangName = sourceLanguage ? languageNames[sourceLanguage] || sourceLanguage : "auto-detected";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following text to ${targetLangName}. Only output the translation, nothing else. Maintain the original formatting and tone.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 1000,
      });

      const translatedText = response.choices[0]?.message?.content || text;

      res.json({
        original: text,
        translated: translatedText.trim(),
        sourceLanguage: sourceLangName,
        targetLanguage: targetLangName,
      });
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  // Update user language preference
  app.post("/api/user/language", async (req, res) => {
    try {
      const { language, autoTranslate } = req.body;

      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      // In production, update the user's language in the database
      res.json({
        success: true,
        language,
        autoTranslate: autoTranslate || false,
      });
    } catch (error) {
      console.error("Error updating language preference:", error);
      res.status(500).json({ error: "Failed to update language preference" });
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

  // Get pending assignments for mobile
  app.get("/api/mobile/assignments/pending", async (req, res) => {
    try {
      // In production, fetch from database
      // For demo, return mock data
      res.json({
        assignments: [],
        count: 0,
      });
    } catch (error) {
      console.error("Error getting pending assignments:", error);
      res.status(500).json({ error: "Failed to get pending assignments" });
    }
  });

  // Accept or decline work assignment
  app.post("/api/mobile/assignments/:messageId/respond", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { accepted, responseContent } = req.body;
      
      const respondedAt = new Date().toISOString();
      
      // Sync with external web app (Site Scheduler)
      try {
        const externalResponse = await fetch("https://site-scheduler--pithooone.replit.app/api/mobile/assignments/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            accepted,
            responseContent,
            respondedAt,
            source: "crewme-mobile",
          }),
        });
        
        if (!externalResponse.ok) {
          console.log("External sync returned non-OK status, proceeding with local response");
        }
      } catch (syncError) {
        console.log("External sync failed, will retry later:", syncError);
      }
      
      res.json({
        success: true,
        messageId,
        status: accepted ? "accepted" : "declined",
        respondedAt,
        message: accepted 
          ? "Work assignment accepted successfully. Your schedule has been updated."
          : "Work assignment declined. The AI will find another available worker.",
      });
    } catch (error) {
      console.error("Error responding to work assignment:", error);
      res.status(500).json({ error: "Failed to respond to work assignment" });
    }
  });

  // Mark available for specific date
  app.post("/api/mobile/open-to-work", async (req, res) => {
    try {
      const { 
        availableDate,
        skills, 
        maxHours, 
        preferredProjects,
        notes
      } = req.body;
      
      const createdAt = new Date().toISOString();
      
      // Sync with external web app for AI allocation
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/mobile/open-to-work", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availableDate,
            skills,
            maxHours,
            preferredProjects,
            notes,
            createdAt,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for open-to-work:", syncError);
      }
      
      res.json({
        success: true,
        availableDate,
        createdAt,
        message: "You're now visible to AI for task assignments on this date!",
      });
    } catch (error) {
      console.error("Error adding open-to-work availability:", error);
      res.status(500).json({ error: "Failed to add availability" });
    }
  });

  // Quick toggle for today/tomorrow/week
  app.post("/api/mobile/open-to-work/quick", async (req, res) => {
    try {
      const { days, maxHours } = req.body;
      
      const createdAt = new Date().toISOString();
      
      // Sync with external web app
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/mobile/open-to-work/quick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            days,
            maxHours,
            createdAt,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for quick toggle:", syncError);
      }
      
      res.json({
        success: true,
        days,
        maxHours,
        createdAt,
        message: `Open to work for ${days.join(", ")}!`,
      });
    } catch (error) {
      console.error("Error setting quick availability:", error);
      res.status(500).json({ error: "Failed to set quick availability" });
    }
  });

  // Get my availability
  app.get("/api/mobile/open-to-work", async (req, res) => {
    try {
      // In production, fetch from database
      res.json({
        availability: [],
        count: 0,
      });
    } catch (error) {
      console.error("Error getting open-to-work status:", error);
      res.status(500).json({ error: "Failed to get availability" });
    }
  });

  // Remove availability
  app.delete("/api/mobile/open-to-work/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Sync with external web app
      try {
        await fetch(`https://site-scheduler--pithooone.replit.app/api/mobile/open-to-work/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "crewme-mobile" }),
        });
      } catch (syncError) {
        console.log("External sync failed for removing availability:", syncError);
      }
      
      res.json({
        success: true,
        id,
        message: "Availability removed.",
      });
    } catch (error) {
      console.error("Error removing availability:", error);
      res.status(500).json({ error: "Failed to remove availability" });
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
