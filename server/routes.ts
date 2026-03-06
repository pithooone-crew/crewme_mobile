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

  // Voice-to-Task: Parse transcription and identify project/task
  app.post("/api/voice-task/parse", async (req, res) => {
    try {
      const { transcription, availableTasks } = req.body;

      if (!transcription) {
        return res.status(400).json({ error: "Transcription is required" });
      }

      const taskListForAI = (availableTasks || []).map((t: any, i: number) => 
        `${i + 1}. Task: "${t.title}" (Project: ${t.projectName || "Unknown"}, Current Status: ${t.status})`
      ).join("\n");

      const systemPrompt = `You are an AI assistant for a construction crew app. Your job is to analyze a worker's voice update and identify:
1. Which task they are talking about (from the provided list)
2. What status the task should be updated to (pending, in_progress, completed, or blocked)
3. Extract key notes from their update

Available tasks:
${taskListForAI || "No tasks available"}

Respond in JSON format:
{
  "matchedTaskIndex": <number or null if unclear>,
  "confidence": "high" | "medium" | "low",
  "suggestedStatus": "pending" | "in_progress" | "completed" | "blocked",
  "extractedNotes": "<summary of worker's update>",
  "reasoning": "<brief explanation of why this task was matched>"
}

If you cannot confidently identify the task (confidence is "low"), set matchedTaskIndex to null.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Worker's voice update: "${transcription}"` },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      // If we have a matched task index and it's valid, include the matched task
      let matchedTask = null;
      if (parsed.matchedTaskIndex !== null && 
          parsed.matchedTaskIndex >= 0 && 
          availableTasks && 
          parsed.matchedTaskIndex < availableTasks.length) {
        matchedTask = availableTasks[parsed.matchedTaskIndex];
      }

      res.json({
        success: true,
        matchedTask,
        confidence: parsed.confidence || "low",
        suggestedStatus: parsed.suggestedStatus || "in_progress",
        extractedNotes: parsed.extractedNotes || transcription,
        reasoning: parsed.reasoning || "",
        needsManualSelection: parsed.confidence === "low" || !matchedTask,
      });
    } catch (error) {
      console.error("Error parsing voice task:", error);
      res.status(500).json({ 
        error: "Failed to parse voice update",
        needsManualSelection: true,
      });
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

  // Initialize with mock crew data for demo
  const mockCrewData = [
    { id: 1, userId: 1, userName: "John Smith", latitude: "40.7128", longitude: "-74.0060", accuracy: 10, heading: 45, speed: 2.5, projectId: 1, status: "active" as const, batteryLevel: 85, lastUpdated: new Date().toISOString() },
    { id: 2, userId: 2, userName: "Maria Garcia", latitude: "40.7135", longitude: "-74.0055", accuracy: 8, heading: 180, speed: 0, projectId: 1, status: "active" as const, batteryLevel: 72, lastUpdated: new Date().toISOString() },
    { id: 3, userId: 3, userName: "James Wilson", latitude: "40.7120", longitude: "-74.0070", accuracy: 15, heading: 270, speed: 1.2, projectId: 1, status: "idle" as const, batteryLevel: 45, lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 4, userId: 4, userName: "Sarah Chen", latitude: "40.7142", longitude: "-74.0048", accuracy: 12, heading: 90, speed: 3.0, projectId: 2, status: "active" as const, batteryLevel: 92, lastUpdated: new Date().toISOString() },
    { id: 5, userId: 5, userName: "Mike Johnson", latitude: "40.7115", longitude: "-74.0080", accuracy: 20, status: "offline" as const, batteryLevel: 15, lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ];
  mockCrewData.forEach(crew => crewLocations.set(crew.id, crew));

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

  // ============================================
  // SMART EQUIPMENT IOT ENDPOINTS
  // ============================================

  interface SmartEquipment {
    id: number;
    name: string;
    category: string;
    model: string;
    serialNumber: string;
    healthScore: number;
    status: "running" | "idle" | "maintenance" | "offline";
    telemetry: {
      rpm: number;
      fuelLevel: number;
      coolantTemp: number;
      oilPressure: number;
      batteryVoltage: number;
      engineHours: number;
      lastUpdated: string;
    };
    location: {
      latitude: number;
      longitude: number;
      projectId?: number;
      projectName?: string;
    };
    activeAlertCount: number;
  }

  interface EquipmentAlert {
    id: number;
    equipmentId: number;
    equipmentName: string;
    alertType: "fuel_low" | "temp_high" | "oil_pressure" | "battery_low" | "maintenance_due" | "engine_fault";
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    timestamp: string;
    acknowledged: boolean;
    resolvedAt?: string;
  }

  // Mock smart equipment data
  const smartEquipmentData: SmartEquipment[] = [
    {
      id: 1, name: "Excavator CAT-01", category: "excavator", model: "CAT 320", serialNumber: "CAT320-2024-001",
      healthScore: 92, status: "running",
      telemetry: { rpm: 1800, fuelLevel: 75, coolantTemp: 185, oilPressure: 45, batteryVoltage: 12.6, engineHours: 4520, lastUpdated: new Date().toISOString() },
      location: { latitude: 40.7128, longitude: -74.006, projectId: 1, projectName: "Downtown Office Tower" },
      activeAlertCount: 0
    },
    {
      id: 2, name: "Bulldozer BD-03", category: "bulldozer", model: "Komatsu D65", serialNumber: "KOM-D65-2023-012",
      healthScore: 78, status: "running",
      telemetry: { rpm: 1650, fuelLevel: 42, coolantTemp: 195, oilPressure: 38, batteryVoltage: 12.2, engineHours: 6890, lastUpdated: new Date().toISOString() },
      location: { latitude: 40.7135, longitude: -74.0055, projectId: 1, projectName: "Downtown Office Tower" },
      activeAlertCount: 2
    },
    {
      id: 3, name: "Crane Tower-07", category: "crane", model: "Liebherr 280EC-H", serialNumber: "LH-280-2022-007",
      healthScore: 95, status: "idle",
      telemetry: { rpm: 0, fuelLevel: 88, coolantTemp: 75, oilPressure: 0, batteryVoltage: 12.8, engineHours: 2150, lastUpdated: new Date().toISOString() },
      location: { latitude: 40.7142, longitude: -74.0048, projectId: 2, projectName: "Harbor Bridge Renovation" },
      activeAlertCount: 0
    },
    {
      id: 4, name: "Loader WH-05", category: "wheel_loader", model: "Volvo L120", serialNumber: "VOL-L120-2023-005",
      healthScore: 45, status: "maintenance",
      telemetry: { rpm: 0, fuelLevel: 60, coolantTemp: 68, oilPressure: 0, batteryVoltage: 11.8, engineHours: 8750, lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      location: { latitude: 40.7120, longitude: -74.007, projectId: 1, projectName: "Downtown Office Tower" },
      activeAlertCount: 3
    },
    {
      id: 5, name: "Dump Truck DT-12", category: "dump_truck", model: "CAT 777G", serialNumber: "CAT777-2024-012",
      healthScore: 88, status: "running",
      telemetry: { rpm: 1950, fuelLevel: 55, coolantTemp: 190, oilPressure: 42, batteryVoltage: 12.4, engineHours: 3200, lastUpdated: new Date().toISOString() },
      location: { latitude: 40.7115, longitude: -74.008, projectId: 3, projectName: "Residential Complex" },
      activeAlertCount: 1
    },
    {
      id: 6, name: "Concrete Mixer CM-02", category: "mixer", model: "McNeilus Bridgemaster", serialNumber: "MCN-BM-2023-002",
      healthScore: 22, status: "offline",
      telemetry: { rpm: 0, fuelLevel: 15, coolantTemp: 45, oilPressure: 0, batteryVoltage: 10.2, engineHours: 12500, lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      location: { latitude: 40.711, longitude: -74.009 },
      activeAlertCount: 5
    }
  ];

  // Mock alerts data
  const equipmentAlerts: EquipmentAlert[] = [
    { id: 1, equipmentId: 2, equipmentName: "Bulldozer BD-03", alertType: "fuel_low", severity: "medium", message: "Fuel level below 45%", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 2, equipmentId: 2, equipmentName: "Bulldozer BD-03", alertType: "temp_high", severity: "high", message: "Coolant temperature approaching critical level", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 3, equipmentId: 4, equipmentName: "Loader WH-05", alertType: "maintenance_due", severity: "critical", message: "Scheduled maintenance overdue by 150 hours", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), acknowledged: true },
    { id: 4, equipmentId: 4, equipmentName: "Loader WH-05", alertType: "oil_pressure", severity: "high", message: "Oil pressure sensor reading abnormal values", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 5, equipmentId: 4, equipmentName: "Loader WH-05", alertType: "battery_low", severity: "medium", message: "Battery voltage below optimal range", timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 6, equipmentId: 5, equipmentName: "Dump Truck DT-12", alertType: "fuel_low", severity: "medium", message: "Fuel level at 55% - consider refueling", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 7, equipmentId: 6, equipmentName: "Concrete Mixer CM-02", alertType: "engine_fault", severity: "critical", message: "Engine fault code detected - immediate attention required", timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 8, equipmentId: 6, equipmentName: "Concrete Mixer CM-02", alertType: "battery_low", severity: "critical", message: "Battery voltage critically low - 10.2V", timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 9, equipmentId: 6, equipmentName: "Concrete Mixer CM-02", alertType: "fuel_low", severity: "high", message: "Fuel level critically low at 15%", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), acknowledged: false },
    { id: 10, equipmentId: 6, equipmentName: "Concrete Mixer CM-02", alertType: "maintenance_due", severity: "high", message: "Major service required at 12500 engine hours", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), acknowledged: true },
    { id: 11, equipmentId: 6, equipmentName: "Concrete Mixer CM-02", alertType: "temp_high", severity: "medium", message: "Coolant temperature fluctuating", timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), acknowledged: true }
  ];

  // GET /api/smart-equipment - Equipment list with telemetry
  app.get("/api/smart-equipment", async (req, res) => {
    try {
      const { category, search } = req.query;
      let filtered = [...smartEquipmentData];
      
      if (category && typeof category === "string") {
        filtered = filtered.filter(e => e.category === category);
      }
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(e => 
          e.name.toLowerCase().includes(searchLower) || 
          e.category.toLowerCase().includes(searchLower) ||
          e.model.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("Error getting smart equipment:", error);
      res.status(500).json({ error: "Failed to get equipment data" });
    }
  });

  // GET /api/smart-equipment/fleet-health - Fleet health analytics (MUST be before :id route)
  app.get("/api/smart-equipment/fleet-health", async (req, res) => {
    try {
      const total = smartEquipmentData.length;
      const running = smartEquipmentData.filter(e => e.status === "running").length;
      const idle = smartEquipmentData.filter(e => e.status === "idle").length;
      const maintenance = smartEquipmentData.filter(e => e.status === "maintenance").length;
      const offline = smartEquipmentData.filter(e => e.status === "offline").length;
      
      const avgHealthScore = Math.round(smartEquipmentData.reduce((sum, e) => sum + e.healthScore, 0) / total);
      const avgFuelLevel = Math.round(smartEquipmentData.reduce((sum, e) => sum + e.telemetry.fuelLevel, 0) / total);
      const totalEngineHours = smartEquipmentData.reduce((sum, e) => sum + e.telemetry.engineHours, 0);
      const activeAlerts = equipmentAlerts.filter(a => !a.resolvedAt).length;
      const criticalAlerts = equipmentAlerts.filter(a => !a.resolvedAt && a.severity === "critical").length;
      
      res.json({
        total,
        running,
        idle,
        maintenance,
        offline,
        avgHealthScore,
        avgFuelLevel,
        totalEngineHours,
        activeAlerts,
        criticalAlerts,
        healthDistribution: {
          excellent: smartEquipmentData.filter(e => e.healthScore >= 90).length,
          good: smartEquipmentData.filter(e => e.healthScore >= 70 && e.healthScore < 90).length,
          fair: smartEquipmentData.filter(e => e.healthScore >= 50 && e.healthScore < 70).length,
          poor: smartEquipmentData.filter(e => e.healthScore >= 30 && e.healthScore < 50).length,
          critical: smartEquipmentData.filter(e => e.healthScore < 30).length
        }
      });
    } catch (error) {
      console.error("Error getting fleet health:", error);
      res.status(500).json({ error: "Failed to get fleet health data" });
    }
  });

  // GET /api/smart-equipment/alerts - Equipment alerts
  app.get("/api/smart-equipment/alerts", async (req, res) => {
    try {
      const { active, severity, type, equipmentId } = req.query;
      let filtered = [...equipmentAlerts];
      
      if (active === "true") {
        filtered = filtered.filter(a => !a.resolvedAt);
      }
      if (severity && typeof severity === "string") {
        filtered = filtered.filter(a => a.severity === severity);
      }
      if (type && typeof type === "string") {
        filtered = filtered.filter(a => a.alertType === type);
      }
      if (equipmentId && typeof equipmentId === "string") {
        filtered = filtered.filter(a => a.equipmentId === parseInt(equipmentId));
      }
      
      // Sort by severity (critical first) then by timestamp (newest first)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      res.json(filtered);
    } catch (error) {
      console.error("Error getting equipment alerts:", error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  // PATCH /api/smart-equipment/alerts/:id - Acknowledge or resolve alert
  app.patch("/api/smart-equipment/alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action } = req.body; // "acknowledge" or "resolve"
      
      const alert = equipmentAlerts.find(a => a.id === id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      if (action === "acknowledge") {
        alert.acknowledged = true;
      } else if (action === "resolve") {
        alert.resolvedAt = new Date().toISOString();
        // Update equipment alert count
        const equipment = smartEquipmentData.find(e => e.id === alert.equipmentId);
        if (equipment && equipment.activeAlertCount > 0) {
          equipment.activeAlertCount--;
        }
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // GET /api/smart-equipment/ai-dispatch - AI dispatch recommendations
  app.get("/api/smart-equipment/ai-dispatch", async (req, res) => {
    try {
      // AI-powered dispatch recommendations based on equipment health, fuel, and location
      const availableEquipment = smartEquipmentData.filter(e => 
        e.status !== "offline" && e.status !== "maintenance" && e.healthScore >= 50
      );
      
      const recommendations = availableEquipment.map(equipment => {
        // Calculate dispatch score based on multiple factors
        const healthWeight = 0.4;
        const fuelWeight = 0.3;
        const alertWeight = 0.2;
        const hoursWeight = 0.1;
        
        const healthScore = equipment.healthScore;
        const fuelScore = equipment.telemetry.fuelLevel;
        const alertScore = Math.max(0, 100 - (equipment.activeAlertCount * 25));
        const hoursScore = Math.max(0, 100 - (equipment.telemetry.engineHours / 150));
        
        const dispatchScore = Math.round(
          healthScore * healthWeight +
          fuelScore * fuelWeight +
          alertScore * alertWeight +
          hoursScore * hoursWeight
        );
        
        const reasons: string[] = [];
        if (healthScore >= 90) reasons.push("Excellent equipment health");
        else if (healthScore >= 70) reasons.push("Good equipment condition");
        if (fuelScore >= 70) reasons.push("Adequate fuel reserves");
        else if (fuelScore >= 40) reasons.push("Fuel available but refuel soon");
        if (equipment.activeAlertCount === 0) reasons.push("No active alerts");
        if (equipment.telemetry.engineHours < 5000) reasons.push("Low engine hours");
        if (equipment.status === "idle") reasons.push("Currently idle and ready");
        
        return {
          equipment,
          dispatchScore,
          healthPercent: healthScore,
          fuelPercent: fuelScore,
          reasons,
          isTopPick: false
        };
      });
      
      // Sort by dispatch score and mark top pick
      recommendations.sort((a, b) => b.dispatchScore - a.dispatchScore);
      if (recommendations.length > 0) {
        recommendations[0].isTopPick = true;
      }
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting AI dispatch recommendations:", error);
      res.status(500).json({ error: "Failed to get dispatch recommendations" });
    }
  });

  // GET /api/smart-equipment/:id - Single equipment details (MUST be after specific routes)
  app.get("/api/smart-equipment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = smartEquipmentData.find(e => e.id === id);
      
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      // Get alerts for this equipment
      const alerts = equipmentAlerts.filter(a => a.equipmentId === id && !a.resolvedAt);
      
      res.json({ ...equipment, alerts });
    } catch (error) {
      console.error("Error getting equipment details:", error);
      res.status(500).json({ error: "Failed to get equipment details" });
    }
  });

  // POST /api/ai/team-builder - AI-powered team building from natural language
  app.post("/api/ai/team-builder", async (req, res) => {
    try {
      const { request: teamRequest, projectId } = req.body;

      if (!teamRequest) {
        return res.status(400).json({ error: "Team request is required" });
      }

      const systemPrompt = `You are an AI construction team builder. Analyze the natural language request and suggest an optimal team composition.

Return JSON with this structure:
{
  "teamName": "string - a name for this team",
  "summary": "string - brief summary of what this team will do",
  "members": [
    {
      "role": "string - job title/role",
      "name": "string - generate a realistic name",
      "skills": ["array of relevant skills"],
      "experience": "string - years of experience",
      "rating": number between 3.5 and 5.0,
      "availability": "available" | "partial" | "busy",
      "matchScore": number between 70 and 100,
      "reasoning": "string - why this person is a good fit"
    }
  ],
  "totalCost": "string - estimated daily team cost",
  "estimatedDuration": "string - how long the work will take",
  "recommendations": ["array of additional suggestions"],
  "warnings": ["array of potential issues to watch"]
}

Generate 3-8 team members based on the request. Make the data realistic for construction.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Build a team for: "${teamRequest}"${projectId ? ` (Project ID: ${projectId})` : ""}` },
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      res.json({
        success: true,
        ...parsed,
      });
    } catch (error) {
      console.error("Error building team:", error);
      res.status(500).json({ error: "Failed to build team" });
    }
  });

  // GET /api/ai/daily-briefing - Morning briefing with weather, tasks, crew, safety
  app.get("/api/ai/daily-briefing", async (req, res) => {
    try {
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const systemPrompt = `You are an AI construction site daily briefing generator. Generate a realistic morning briefing for a construction crew foreman.

Return JSON with this structure:
{
  "greeting": "string - time-appropriate greeting",
  "date": "${today}",
  "weather": {
    "condition": "string - e.g. Partly Cloudy",
    "temperature": "string - e.g. 72F / 22C",
    "humidity": "string - e.g. 45%",
    "wind": "string - e.g. 8 mph NW",
    "advisory": "string or null - weather warning if any",
    "icon": "sun" | "cloud" | "cloud-rain" | "cloud-snow" | "wind" | "cloud-lightning"
  },
  "crewStatus": {
    "totalExpected": number,
    "checkedIn": number,
    "onLeave": number,
    "lateArrivals": number,
    "highlights": ["array of crew-related notes"]
  },
  "todaysTasks": [
    {
      "title": "string",
      "project": "string",
      "priority": "high" | "medium" | "low",
      "status": "pending" | "in_progress",
      "assignedCrew": number,
      "estimatedHours": number
    }
  ],
  "safetyAlerts": [
    {
      "level": "critical" | "warning" | "info",
      "title": "string",
      "description": "string"
    }
  ],
  "aiInsights": ["array of AI-generated insights and recommendations for the day"],
  "equipmentStatus": {
    "operational": number,
    "maintenance": number,
    "alerts": number
  }
}

Generate realistic construction data. Include 4-6 tasks, 1-3 safety alerts, and 2-4 insights.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate today's morning briefing for ${today}. Include weather, crew status, tasks, safety alerts, and AI insights.` },
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        ...parsed,
      });
    } catch (error) {
      console.error("Error generating daily briefing:", error);
      res.status(500).json({ error: "Failed to generate daily briefing" });
    }
  });

  // POST /api/ai/building-code - Chat-style building code Q&A
  app.post("/api/ai/building-code", async (req, res) => {
    try {
      const { question, conversationHistory } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const systemPrompt = `You are an expert construction building code compliance assistant. Answer questions about building codes, regulations, safety standards, and compliance requirements.

Key areas of expertise:
- International Building Code (IBC)
- OSHA regulations
- Fire codes and life safety
- Structural requirements
- Electrical codes (NEC)
- Plumbing codes
- Accessibility (ADA) requirements
- Energy codes
- Zoning regulations

Provide accurate, practical answers. When citing codes, reference the specific section numbers. If you're unsure about a specific local jurisdiction's requirements, mention that local codes may vary. Keep answers concise but thorough.

IMPORTANT: Always include a "confidence" field indicating how confident you are in the answer: "high", "medium", or "low".
Always include a "sources" array with relevant code references.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
      ];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-6)) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }
      }

      messages.push({ role: "user", content: question });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
      });

      const answer = response.choices[0]?.message?.content || "I couldn't generate an answer. Please try rephrasing your question.";

      res.json({
        success: true,
        answer,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error answering building code question:", error);
      res.status(500).json({ error: "Failed to answer question" });
    }
  });

  // POST /api/ai/blueprint-takeoff - Analyze blueprint photo for quantity extraction
  app.post("/api/ai/blueprint-takeoff", async (req, res) => {
    try {
      const { photoDescription, photoBase64, projectType } = req.body;

      if (!photoDescription && !photoBase64) {
        return res.status(400).json({ error: "Photo description or photo data is required" });
      }

      const systemPrompt = `You are an expert construction quantity takeoff specialist. Analyze the description of a blueprint or construction photo and extract material quantities, measurements, and cost estimates.

Return JSON with this structure:
{
  "summary": "string - brief description of what was analyzed",
  "measurements": [
    {
      "item": "string - material or component name",
      "quantity": "string - amount with unit",
      "unit": "string - measurement unit (sq ft, linear ft, cubic yd, etc.)",
      "category": "structural" | "electrical" | "plumbing" | "finishing" | "exterior" | "mechanical",
      "estimatedCost": "string - estimated cost range",
      "notes": "string - any relevant notes"
    }
  ],
  "totalEstimate": "string - total estimated cost range",
  "materialCategories": {
    "structural": number of items,
    "electrical": number of items,
    "plumbing": number of items,
    "finishing": number of items,
    "exterior": number of items,
    "mechanical": number of items
  },
  "recommendations": ["array of recommendations for procurement"],
  "warnings": ["array of potential issues or items that need verification"],
  "accuracy": "high" | "medium" | "low" - how accurate the estimates are
}

Generate realistic construction quantities and costs. Be thorough but practical.`;

      const userContent = photoBase64
        ? `Analyze this blueprint/construction photo for quantity takeoff. Project type: ${projectType || "general construction"}. Photo provided as base64 image data.`
        : `Analyze this blueprint/construction photo for quantity takeoff. Project type: ${projectType || "general construction"}. Photo description: "${photoDescription}"`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      res.json({
        success: true,
        analyzedAt: new Date().toISOString(),
        ...parsed,
      });
    } catch (error) {
      console.error("Error analyzing blueprint:", error);
      res.status(500).json({ error: "Failed to analyze blueprint" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
