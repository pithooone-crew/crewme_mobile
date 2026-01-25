import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface LocationUpdate {
  type: "location_update";
  userId: number;
  userName?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  batteryLevel?: number;
  timestamp: number;
}

interface GeofenceEvent {
  type: "geofence_event";
  userId: number;
  userName?: string;
  projectId: number;
  projectName: string;
  eventType: "enter" | "exit";
  timestamp: number;
}

type WebSocketMessage = LocationUpdate | GeofenceEvent;

const clients = new Map<WebSocket, { userId?: number; subscriptions: Set<string> }>();
const crewLocations = new Map<number, LocationUpdate>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/locations" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.set(ws, { subscriptions: new Set(["locations"]) });

    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to location tracking",
      currentLocations: Array.from(crewLocations.values()),
    }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      const clientInfo = clients.get(ws);
      if (clientInfo?.userId) {
        crewLocations.delete(clientInfo.userId);
        broadcastLocationRemoved(clientInfo.userId);
      }
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);

  console.log("WebSocket server initialized on /ws/locations");
  return wss;
}

function handleMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case "register":
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        clientInfo.userId = message.userId;
      }
      break;

    case "location_update":
      handleLocationUpdate(ws, message);
      break;

    case "subscribe":
      const info = clients.get(ws);
      if (info && message.channel) {
        info.subscriptions.add(message.channel);
      }
      break;

    case "unsubscribe":
      const subInfo = clients.get(ws);
      if (subInfo && message.channel) {
        subInfo.subscriptions.delete(message.channel);
      }
      break;
  }
}

function handleLocationUpdate(ws: WebSocket, message: any) {
  const clientInfo = clients.get(ws);
  const userId = message.userId || clientInfo?.userId;
  
  if (!userId) return;

  const locationUpdate: LocationUpdate = {
    type: "location_update",
    userId,
    userName: message.userName,
    latitude: message.latitude,
    longitude: message.longitude,
    heading: message.heading,
    speed: message.speed,
    accuracy: message.accuracy,
    batteryLevel: message.batteryLevel,
    timestamp: Date.now(),
  };

  crewLocations.set(userId, locationUpdate);
  broadcastToSubscribers("locations", locationUpdate);
}

function broadcastToSubscribers(channel: string, message: WebSocketMessage) {
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN && clientInfo.subscriptions.has(channel)) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastLocationRemoved(userId: number) {
  const message = {
    type: "location_removed",
    userId,
    timestamp: Date.now(),
  };

  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN && clientInfo.subscriptions.has("locations")) {
      ws.send(JSON.stringify(message));
    }
  });
}

export function broadcastGeofenceEvent(event: Omit<GeofenceEvent, "type">) {
  const message: GeofenceEvent = {
    type: "geofence_event",
    ...event,
  };

  broadcastToSubscribers("locations", message);
}

export function getCurrentLocations(): LocationUpdate[] {
  return Array.from(crewLocations.values());
}
