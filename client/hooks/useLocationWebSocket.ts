import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

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

interface CrewLocationState {
  userId: number;
  userName?: string;
  latitude: number;
  longitude: number;
  previousLatitude?: number;
  previousLongitude?: number;
  heading?: number;
  speed?: number;
  batteryLevel?: number;
  timestamp: number;
  status: "active" | "idle" | "offline";
}

type WebSocketCallback = (data: LocationUpdate | GeofenceEvent) => void;

export function useLocationWebSocket(userId?: number) {
  const [isConnected, setIsConnected] = useState(false);
  const [crewLocations, setCrewLocations] = useState<Map<number, CrewLocationState>>(new Map());
  const [lastGeofenceEvent, setLastGeofenceEvent] = useState<GeofenceEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<Set<WebSocketCallback>>(new Set());

  const getWebSocketUrl = useCallback(() => {
    const apiUrl = getApiUrl();
    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
    const host = apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${wsProtocol}://${host}/ws/locations`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = getWebSocketUrl();
      console.log("Connecting to WebSocket:", wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        if (userId) {
          wsRef.current?.send(JSON.stringify({
            type: "register",
            userId,
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        scheduleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      scheduleReconnect();
    }
  }, [getWebSocketUrl, userId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 3000);
  }, [connect]);

  const handleMessage = useCallback((data: any) => {
    if (data.type === "connected" && data.currentLocations) {
      const initialLocations = new Map<number, CrewLocationState>();
      data.currentLocations.forEach((loc: LocationUpdate) => {
        initialLocations.set(loc.userId, {
          userId: loc.userId,
          userName: loc.userName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading,
          speed: loc.speed,
          batteryLevel: loc.batteryLevel,
          timestamp: loc.timestamp,
          status: "active",
        });
      });
      setCrewLocations(initialLocations);
      return;
    }

    if (data.type === "location_update") {
      setCrewLocations((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.userId);
        
        newMap.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          latitude: data.latitude,
          longitude: data.longitude,
          previousLatitude: existing?.latitude,
          previousLongitude: existing?.longitude,
          heading: data.heading,
          speed: data.speed,
          batteryLevel: data.batteryLevel,
          timestamp: data.timestamp,
          status: "active",
        });
        
        return newMap;
      });

      callbacksRef.current.forEach((cb) => cb(data));
    }

    if (data.type === "location_removed") {
      setCrewLocations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    }

    if (data.type === "geofence_event") {
      setLastGeofenceEvent(data);
      callbacksRef.current.forEach((cb) => cb(data));
    }
  }, []);

  const sendLocationUpdate = useCallback((location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    batteryLevel?: number;
    userName?: string;
  }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && userId) {
      wsRef.current.send(JSON.stringify({
        type: "location_update",
        userId,
        ...location,
      }));
    }
  }, [userId]);

  const subscribe = useCallback((callback: WebSocketCallback) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    isConnected,
    crewLocations: Array.from(crewLocations.values()),
    lastGeofenceEvent,
    sendLocationUpdate,
    subscribe,
    reconnect: connect,
  };
}
