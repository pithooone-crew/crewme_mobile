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

  // Language code to name mapping for all 12 supported languages
  const languageNames: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    zh: "Chinese (Simplified)",
    ja: "Japanese",
    ko: "Korean",
    th: "Thai",
    vi: "Vietnamese",
    hi: "Hindi",
    ar: "Arabic",
  };

  // Auto-translate message endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Text and target language are required" });
      }

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

  // Translate message for recipient - auto-detects source language and translates to target
  app.post("/api/translate-message", async (req, res) => {
    try {
      const { message, recipientLanguage } = req.body;

      if (!message || !recipientLanguage) {
        return res.status(400).json({ error: "Message and recipient language are required" });
      }

      const targetLangName = languageNames[recipientLanguage] || recipientLanguage;

      // First, detect the source language
      const detectResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Detect the language of the following text. Only respond with the language code (en, es, fr, de, pt, zh, ja, ko, th, vi, hi, ar). Nothing else.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 10,
      });

      const detectedLanguage = detectResponse.choices[0]?.message?.content?.trim().toLowerCase() || "en";

      // If same language, no need to translate
      if (detectedLanguage === recipientLanguage) {
        return res.json({
          original: message,
          translated: message,
          sourceLanguage: languageNames[detectedLanguage] || detectedLanguage,
          targetLanguage: targetLangName,
          wasTranslated: false,
        });
      }

      // Translate to recipient's language
      const translateResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following text to ${targetLangName}. Only output the translation, nothing else. Maintain the original formatting and tone.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 1000,
      });

      const translatedText = translateResponse.choices[0]?.message?.content || message;

      res.json({
        original: message,
        translated: translatedText.trim(),
        sourceLanguage: languageNames[detectedLanguage] || detectedLanguage,
        targetLanguage: targetLangName,
        wasTranslated: true,
      });
    } catch (error) {
      console.error("Error translating message:", error);
      res.status(500).json({ error: "Failed to translate message" });
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

  // ============================================
  // MAP DASHBOARD & GPS LOCATION TRACKING
  // ============================================

  // In-memory storage for crew locations (in production, use database)
  const crewLocations: Map<number, {
    id: number;
    userId: number;
    userName?: string;
    latitude: string;
    longitude: string;
    accuracy?: number;
    heading?: number;
    speed?: number;
    projectId?: number;
    status: "active" | "idle" | "offline";
    batteryLevel?: number;
    lastUpdated: string;
  }> = new Map();

  // Get all crew GPS positions
  app.get("/api/map/crew-locations", async (req, res) => {
    try {
      // Convert map to array and return
      const locations = Array.from(crewLocations.values());
      
      // Mark locations older than 5 minutes as idle, older than 15 minutes as offline
      const now = Date.now();
      const updatedLocations = locations.map(loc => {
        const lastUpdate = new Date(loc.lastUpdated).getTime();
        const minutesAgo = (now - lastUpdate) / (1000 * 60);
        
        let status = loc.status;
        if (minutesAgo > 15) status = "offline";
        else if (minutesAgo > 5) status = "idle";
        
        return { ...loc, status };
      });
      
      res.json(updatedLocations);
    } catch (error) {
      console.error("Error getting crew locations:", error);
      res.status(500).json({ error: "Failed to get crew locations" });
    }
  });

  // Update user's GPS location
  app.post("/api/map/crew-locations", async (req, res) => {
    try {
      const { latitude, longitude, accuracy, heading, speed, projectId, batteryLevel } = req.body;
      
      // In production, get user ID from auth token
      const userId = 1; // Mock user ID
      const userName = "Current User";
      
      const locationData = {
        id: userId,
        userId,
        userName,
        latitude: String(latitude),
        longitude: String(longitude),
        accuracy,
        heading,
        speed,
        projectId,
        status: "active" as const,
        batteryLevel,
        lastUpdated: new Date().toISOString(),
      };
      
      crewLocations.set(userId, locationData);
      
      // Sync with external web app
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/mobile/crew-locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...locationData,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for crew location:", syncError);
      }
      
      res.json({ success: true, location: locationData });
    } catch (error) {
      console.error("Error updating crew location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Get equipment locations
  app.get("/api/map/equipment-locations", async (req, res) => {
    try {
      // In production, fetch from database
      // For demo, return mock data
      const equipment = [
        {
          id: 1,
          name: "Excavator #1",
          type: "excavator",
          latitude: "37.7749",
          longitude: "-122.4194",
          status: "in_use",
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Crane #1",
          type: "crane",
          latitude: "37.7755",
          longitude: "-122.4180",
          status: "available",
          lastUpdated: new Date().toISOString(),
        },
      ];
      
      res.json(equipment);
    } catch (error) {
      console.error("Error getting equipment locations:", error);
      res.status(500).json({ error: "Failed to get equipment locations" });
    }
  });

  // Get projects with map markers
  app.get("/api/map/projects", async (req, res) => {
    try {
      // In production, fetch from database
      const projects = [
        {
          id: 1,
          name: "Downtown Office Tower",
          latitude: "37.7849",
          longitude: "-122.4094",
          status: "active",
          geofenceRadius: 100,
        },
        {
          id: 2,
          name: "Harbor Bridge Renovation",
          latitude: "37.7949",
          longitude: "-122.3994",
          status: "active",
          geofenceRadius: 150,
        },
        {
          id: 3,
          name: "Residential Complex Phase 2",
          latitude: "37.7649",
          longitude: "-122.4294",
          status: "planned",
          geofenceRadius: 100,
        },
      ];
      
      res.json(projects);
    } catch (error) {
      console.error("Error getting map projects:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });

  // Get site zones for a project
  app.get("/api/map/site-zones", async (req, res) => {
    try {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.json([]);
      }
      
      // In production, fetch from database
      const zones = [
        {
          id: 1,
          projectId: Number(projectId),
          name: "Main Work Area",
          zoneType: "work_area",
          coordinates: [
            { lat: 37.7845, lng: -122.4100 },
            { lat: 37.7855, lng: -122.4100 },
            { lat: 37.7855, lng: -122.4088 },
            { lat: 37.7845, lng: -122.4088 },
          ],
          description: "Primary construction zone",
        },
        {
          id: 2,
          projectId: Number(projectId),
          name: "High Voltage Area",
          zoneType: "hazard",
          riskLevel: "high",
          coordinates: [
            { lat: 37.7852, lng: -122.4095 },
            { lat: 37.7856, lng: -122.4095 },
            { lat: 37.7856, lng: -122.4090 },
            { lat: 37.7852, lng: -122.4090 },
          ],
          description: "Electrical hazard - authorized personnel only",
        },
        {
          id: 3,
          projectId: Number(projectId),
          name: "Material Staging",
          zoneType: "material_staging",
          coordinates: [
            { lat: 37.7840, lng: -122.4095 },
            { lat: 37.7845, lng: -122.4095 },
            { lat: 37.7845, lng: -122.4088 },
            { lat: 37.7840, lng: -122.4088 },
          ],
          description: "Material storage and staging area",
        },
      ];
      
      res.json(zones);
    } catch (error) {
      console.error("Error getting site zones:", error);
      res.status(500).json({ error: "Failed to get site zones" });
    }
  });

  // Get weather overlay data
  app.get("/api/map/weather-overlay", async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      // In production, call weather API
      // For demo, return mock weather data
      const weather = {
        temperature: 72,
        condition: "Partly Cloudy",
        icon: "cloud",
        humidity: 45,
        windSpeed: 8,
        aiRecommendation: "Good conditions for concrete work. UV index moderate - ensure crew has sun protection.",
      };
      
      res.json(weather);
    } catch (error) {
      console.error("Error getting weather data:", error);
      res.status(500).json({ error: "Failed to get weather data" });
    }
  });

  // Handle geofence events (auto check-in/out)
  app.post("/api/map/geofence-event", async (req, res) => {
    try {
      const { projectId, eventType, latitude, longitude } = req.body;
      
      if (!projectId || !eventType) {
        return res.status(400).json({ error: "Project ID and event type are required" });
      }
      
      // In production, get user ID from auth token
      const userId = 1;
      const timestamp = new Date().toISOString();
      
      // Create attendance record
      const attendanceRecord = {
        userId,
        projectId,
        eventType,
        latitude,
        longitude,
        timestamp,
        autoGenerated: true,
      };
      
      // Sync with external web app
      try {
        await fetch("https://site-scheduler--pithooone.replit.app/api/mobile/geofence-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...attendanceRecord,
            source: "crewme-mobile",
          }),
        });
      } catch (syncError) {
        console.log("External sync failed for geofence event:", syncError);
      }
      
      res.json({
        success: true,
        eventType,
        projectId,
        timestamp,
        message: eventType === "enter" 
          ? "Automatically checked in to project site" 
          : "Automatically checked out from project site",
      });
    } catch (error) {
      console.error("Error processing geofence event:", error);
      res.status(500).json({ error: "Failed to process geofence event" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
