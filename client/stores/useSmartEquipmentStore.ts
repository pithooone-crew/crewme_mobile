import { create } from "zustand";

export interface SmartEquipment {
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

export interface EquipmentAlert {
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

export interface FleetHealth {
  total: number;
  running: number;
  idle: number;
  maintenance: number;
  offline: number;
  avgHealthScore: number;
  avgFuelLevel: number;
  totalEngineHours: number;
  activeAlerts: number;
  criticalAlerts: number;
  healthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
}

export interface DispatchRecommendation {
  equipment: SmartEquipment;
  dispatchScore: number;
  healthPercent: number;
  fuelPercent: number;
  reasons: string[];
  isTopPick: boolean;
}

interface SmartEquipmentState {
  equipment: SmartEquipment[];
  alerts: EquipmentAlert[];
  fleetHealth: FleetHealth | null;
  dispatchRecommendations: DispatchRecommendation[];
  isLoadingEquipment: boolean;
  isLoadingAlerts: boolean;
  isLoadingFleetHealth: boolean;
  isLoadingDispatch: boolean;
  searchQuery: string;
  categoryFilter: string | null;
  setEquipment: (equipment: SmartEquipment[]) => void;
  setAlerts: (alerts: EquipmentAlert[]) => void;
  setFleetHealth: (health: FleetHealth) => void;
  setDispatchRecommendations: (recommendations: DispatchRecommendation[]) => void;
  setLoadingEquipment: (loading: boolean) => void;
  setLoadingAlerts: (loading: boolean) => void;
  setLoadingFleetHealth: (loading: boolean) => void;
  setLoadingDispatch: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  acknowledgeAlert: (alertId: number) => void;
  resolveAlert: (alertId: number) => void;
}

export const useSmartEquipmentStore = create<SmartEquipmentState>((set) => ({
  equipment: [],
  alerts: [],
  fleetHealth: null,
  dispatchRecommendations: [],
  isLoadingEquipment: false,
  isLoadingAlerts: false,
  isLoadingFleetHealth: false,
  isLoadingDispatch: false,
  searchQuery: "",
  categoryFilter: null,
  setEquipment: (equipment) => set({ equipment }),
  setAlerts: (alerts) => set({ alerts }),
  setFleetHealth: (fleetHealth) => set({ fleetHealth }),
  setDispatchRecommendations: (dispatchRecommendations) => set({ dispatchRecommendations }),
  setLoadingEquipment: (isLoadingEquipment) => set({ isLoadingEquipment }),
  setLoadingAlerts: (isLoadingAlerts) => set({ isLoadingAlerts }),
  setLoadingFleetHealth: (isLoadingFleetHealth) => set({ isLoadingFleetHealth }),
  setLoadingDispatch: (isLoadingDispatch) => set({ isLoadingDispatch }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ),
  })),
  resolveAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter((alert) => alert.id !== alertId),
  })),
}));
