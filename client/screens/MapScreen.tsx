import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { MapView, Marker, Circle, Polygon, PROVIDER_GOOGLE, isMapAvailable } from "@/components/MapViewWrapper";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface CrewLocation {
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
}

interface EquipmentLocation {
  id: number;
  name: string;
  type: string;
  latitude: string;
  longitude: string;
  status: "available" | "in_use" | "maintenance";
  lastUpdated: string;
}

interface SiteZone {
  id: number;
  projectId: number;
  name: string;
  zoneType: "work_area" | "hazard" | "material_staging" | "access_point" | "restricted" | "parking" | "office";
  coordinates: { lat: number; lng: number }[];
  color?: string;
  riskLevel?: "high" | "medium" | "low";
  description?: string;
}

interface ProjectMarker {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  status: "active" | "planned" | "completed";
  geofenceRadius: number;
}

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  aiRecommendation?: string;
}

const GEOFENCE_RADIUS = 100;
const LOCATION_UPDATE_INTERVAL = 30000;

export default function MapScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mapRef = useRef<MapView>(null);
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showWeather, setShowWeather] = useState(true);
  const [isInsideGeofence, setIsInsideGeofence] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const { data: crewLocations = [], isLoading: loadingCrew } = useQuery<CrewLocation[]>({
    queryKey: ["/api/map/crew-locations"],
    refetchInterval: 30000,
  });

  const { data: equipmentLocations = [], isLoading: loadingEquipment } = useQuery<EquipmentLocation[]>({
    queryKey: ["/api/map/equipment-locations"],
    refetchInterval: 60000,
  });

  const { data: projects = [] } = useQuery<ProjectMarker[]>({
    queryKey: ["/api/map/projects"],
  });

  const { data: siteZones = [] } = useQuery<SiteZone[]>({
    queryKey: ["/api/map/site-zones", selectedProject],
    enabled: selectedProject !== null,
  });

  const { data: weather } = useQuery<WeatherData>({
    queryKey: ["/api/map/weather-overlay", userLocation?.coords.latitude, userLocation?.coords.longitude],
    enabled: !!userLocation,
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (location: Location.LocationObject) => {
      return apiRequest("POST", "/api/map/crew-locations", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        projectId: isInsideGeofence,
      });
    },
  });

  const geofenceEventMutation = useMutation({
    mutationFn: async (data: { projectId: number; eventType: "enter" | "exit"; latitude: number; longitude: number }) => {
      return apiRequest("POST", "/api/map/geofence-event", data);
    },
    onSuccess: (_, variables) => {
      const action = variables.eventType === "enter" ? "checked in" : "checked out";
      Alert.alert("Auto Attendance", `You've been automatically ${action} at the project site.`);
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    
    if (status === "granted") {
      startLocationTracking();
    }
  };

  const startLocationTracking = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(currentLocation);
      updateLocationMutation.mutate(currentLocation);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10,
        },
        (location) => {
          setUserLocation(location);
          updateLocationMutation.mutate(location);
          checkGeofences(location);
        }
      );
    } catch (error) {
      console.error("Error starting location tracking:", error);
    }
  };

  const checkGeofences = useCallback((location: Location.LocationObject) => {
    if (!projects.length) return;

    let insideProject: number | null = null;

    for (const project of projects) {
      const distance = getDistance(
        location.coords.latitude,
        location.coords.longitude,
        parseFloat(project.latitude),
        parseFloat(project.longitude)
      );

      if (distance <= (project.geofenceRadius || GEOFENCE_RADIUS)) {
        insideProject = project.id;
        break;
      }
    }

    if (insideProject !== isInsideGeofence) {
      if (insideProject !== null && isInsideGeofence === null) {
        geofenceEventMutation.mutate({
          projectId: insideProject,
          eventType: "enter",
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else if (insideProject === null && isInsideGeofence !== null) {
        geofenceEventMutation.mutate({
          projectId: isInsideGeofence,
          eventType: "exit",
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
      setIsInsideGeofence(insideProject);
    }
  }, [projects, isInsideGeofence]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === "granted") {
        startLocationTracking();
      }
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && projects.length > 0) {
      checkGeofences(userLocation);
    }
  }, [projects, userLocation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return Colors.success;
      case "idle": return Colors.warning;
      case "offline": return Colors.textSecondary;
      case "available": return Colors.success;
      case "in_use": return Colors.primary;
      case "maintenance": return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getProjectColor = (status: string) => {
    switch (status) {
      case "active": return Colors.success;
      case "planned": return Colors.warning;
      case "completed": return Colors.textSecondary;
      default: return Colors.primary;
    }
  };

  const getZoneColor = (zone: SiteZone) => {
    if (zone.color) return zone.color;
    
    switch (zone.zoneType) {
      case "hazard":
        switch (zone.riskLevel) {
          case "high": return "rgba(239, 68, 68, 0.4)";
          case "medium": return "rgba(249, 115, 22, 0.4)";
          case "low": return "rgba(245, 158, 11, 0.4)";
          default: return "rgba(239, 68, 68, 0.4)";
        }
      case "work_area": return "rgba(14, 165, 233, 0.3)";
      case "material_staging": return "rgba(139, 92, 246, 0.3)";
      case "access_point": return "rgba(16, 185, 129, 0.3)";
      case "restricted": return "rgba(239, 68, 68, 0.3)";
      case "parking": return "rgba(107, 114, 128, 0.3)";
      case "office": return "rgba(59, 130, 246, 0.3)";
      default: return "rgba(107, 114, 128, 0.3)";
    }
  };

  if (locationPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (locationPermission !== "granted") {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Feather name="map-pin" size={64} color={Colors.primary} />
        <Text style={[styles.permissionTitle, { color: theme.text }]}>Location Access Required</Text>
        <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
          Enable location access to see crew locations, track your position, and enable automatic attendance.
        </Text>
        {locationPermission === "denied" ? (
          Platform.OS !== "web" ? (
            <Pressable
              style={styles.permissionButton}
              onPress={async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error("Could not open settings");
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </Pressable>
          ) : (
            <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
              Please enable location in your browser settings.
            </Text>
          )
        ) : (
          <Pressable style={styles.permissionButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  if (!isMapAvailable) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[styles.webContainer, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.webHeader}>
          <Feather name="map" size={48} color={Colors.primary} />
          <Text style={[styles.webTitle, { color: theme.text }]}>Map Dashboard</Text>
          <Text style={[styles.webSubtitle, { color: theme.textSecondary }]}>
            Run in Expo Go on your device to see the interactive map with crew locations and geofencing.
          </Text>
        </View>

        <View style={[styles.webCard, { backgroundColor: theme.backgroundDefault }]}>
          <Text style={[styles.webCardTitle, { color: theme.text }]}>Projects ({projects.length})</Text>
          {projects.map((project) => (
            <View key={project.id} style={styles.webListItem}>
              <View style={[styles.statusDot, { backgroundColor: getProjectColor(project.status) }]} />
              <View style={styles.webListContent}>
                <Text style={[styles.webListName, { color: theme.text }]}>{project.name}</Text>
                <Text style={[styles.webListDetail, { color: theme.textSecondary }]}>
                  Status: {project.status} | Geofence: {project.geofenceRadius}m
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.webCard, { backgroundColor: theme.backgroundDefault }]}>
          <Text style={[styles.webCardTitle, { color: theme.text }]}>Crew Locations ({crewLocations.length})</Text>
          {crewLocations.length > 0 ? crewLocations.map((crew) => (
            <View key={crew.id} style={styles.webListItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(crew.status) }]} />
              <View style={styles.webListContent}>
                <Text style={[styles.webListName, { color: theme.text }]}>{crew.userName || `Crew #${crew.userId}`}</Text>
                <Text style={[styles.webListDetail, { color: theme.textSecondary }]}>
                  Status: {crew.status} | Last update: {new Date(crew.lastUpdated).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )) : (
            <Text style={[styles.webEmptyText, { color: theme.textSecondary }]}>No crew locations available</Text>
          )}
        </View>

        <View style={[styles.webCard, { backgroundColor: theme.backgroundDefault }]}>
          <Text style={[styles.webCardTitle, { color: theme.text }]}>Equipment ({equipmentLocations.length})</Text>
          {equipmentLocations.map((equipment) => (
            <View key={equipment.id} style={styles.webListItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(equipment.status) }]} />
              <View style={styles.webListContent}>
                <Text style={[styles.webListName, { color: theme.text }]}>{equipment.name}</Text>
                <Text style={[styles.webListDetail, { color: theme.textSecondary }]}>
                  {equipment.type} | Status: {equipment.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {weather ? (
          <View style={[styles.webCard, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.webCardTitle, { color: theme.text }]}>Weather</Text>
            <View style={styles.weatherRow}>
              <Feather name="cloud" size={24} color={Colors.primary} />
              <Text style={[styles.weatherTempLarge, { color: theme.text }]}>{weather.temperature}°F</Text>
              <Text style={[styles.weatherConditionLarge, { color: theme.textSecondary }]}>{weather.condition}</Text>
            </View>
            {weather.aiRecommendation ? (
              <Text style={[styles.weatherRecommendationLarge, { color: theme.textSecondary }]}>
                {weather.aiRecommendation}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        mapType="standard"
      >
        {projects.map((project) => (
          <React.Fragment key={`project-${project.id}`}>
            <Marker
              coordinate={{
                latitude: parseFloat(project.latitude),
                longitude: parseFloat(project.longitude),
              }}
              title={project.name}
              description={`Status: ${project.status}`}
              onPress={() => setSelectedProject(project.id)}
            >
              <View style={[styles.projectMarker, { backgroundColor: getProjectColor(project.status) }]}>
                <Feather name="briefcase" size={16} color="#fff" />
              </View>
            </Marker>
            <Circle
              center={{
                latitude: parseFloat(project.latitude),
                longitude: parseFloat(project.longitude),
              }}
              radius={project.geofenceRadius || GEOFENCE_RADIUS}
              strokeColor={getProjectColor(project.status)}
              fillColor={`${getProjectColor(project.status)}20`}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}

        {crewLocations.map((crew) => (
          <Marker
            key={`crew-${crew.id}`}
            coordinate={{
              latitude: parseFloat(crew.latitude),
              longitude: parseFloat(crew.longitude),
            }}
            title={crew.userName || `Crew #${crew.userId}`}
            description={`Status: ${crew.status}${crew.batteryLevel ? ` | Battery: ${crew.batteryLevel}%` : ""}`}
          >
            <View style={[styles.crewMarker, { borderColor: getStatusColor(crew.status) }]}>
              <Feather name="user" size={14} color={getStatusColor(crew.status)} />
            </View>
          </Marker>
        ))}

        {equipmentLocations.map((equipment) => (
          <Marker
            key={`equipment-${equipment.id}`}
            coordinate={{
              latitude: parseFloat(equipment.latitude),
              longitude: parseFloat(equipment.longitude),
            }}
            title={equipment.name}
            description={`${equipment.type} - ${equipment.status}`}
          >
            <View style={[styles.equipmentMarker, { backgroundColor: getStatusColor(equipment.status) }]}>
              <Feather name="tool" size={12} color="#fff" />
            </View>
          </Marker>
        ))}

        {siteZones.map((zone) => (
          <Polygon
            key={`zone-${zone.id}`}
            coordinates={zone.coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
            strokeColor={getZoneColor(zone).replace("0.3)", "1)")}
            fillColor={getZoneColor(zone)}
            strokeWidth={2}
            tappable
            onPress={() => Alert.alert(zone.name, zone.description || `Zone type: ${zone.zoneType}`)}
          />
        ))}
      </MapView>

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={[styles.legendCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>Active</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>Idle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textSecondary }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>Offline</Text>
          </View>
        </View>
      </View>

      {showWeather && weather && (
        <View style={[styles.weatherCard, { backgroundColor: theme.backgroundDefault, top: insets.top + 60 }]}>
          <View style={styles.weatherHeader}>
            <Feather name="cloud" size={20} color={Colors.primary} />
            <Text style={[styles.weatherTemp, { color: theme.text }]}>{weather.temperature}°</Text>
            <Text style={[styles.weatherCondition, { color: theme.textSecondary }]}>{weather.condition}</Text>
          </View>
          {weather.aiRecommendation ? (
            <Text style={[styles.weatherRecommendation, { color: theme.textSecondary }]} numberOfLines={2}>
              {weather.aiRecommendation}
            </Text>
          ) : null}
          <Pressable style={styles.weatherClose} onPress={() => setShowWeather(false)}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {isInsideGeofence !== null && (
        <View style={[styles.geofenceAlert, { backgroundColor: Colors.success }]}>
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.geofenceText}>On-site - Auto attendance active</Text>
        </View>
      )}

      <View style={[styles.actionButtons, { bottom: insets.bottom + 100 }]}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
          onPress={centerOnUser}
        >
          <Feather name="navigation" size={20} color={Colors.primary} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => setShowWeather(!showWeather)}
        >
          <Feather name="cloud" size={20} color={showWeather ? Colors.primary : theme.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => queryClient.invalidateQueries({ queryKey: ["/api/map"] })}
        >
          <Feather name="refresh-cw" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {(loadingCrew || loadingEquipment) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  legendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  weatherCard: {
    position: "absolute",
    right: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  weatherTemp: {
    ...Typography.h3,
  },
  weatherCondition: {
    ...Typography.caption,
  },
  weatherRecommendation: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  weatherClose: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.xs,
  },
  projectMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  crewMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  equipmentMarker: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  geofenceAlert: {
    position: "absolute",
    top: 120,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  geofenceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  actionButtons: {
    position: "absolute",
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: "absolute",
    top: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  permissionTitle: {
    ...Typography.h2,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  webContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  webHeader: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  webTitle: {
    ...Typography.h1,
    textAlign: "center",
  },
  webSubtitle: {
    ...Typography.body,
    textAlign: "center",
    maxWidth: 400,
  },
  webCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  webCardTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  webListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  webListContent: {
    flex: 1,
  },
  webListName: {
    ...Typography.body,
    fontWeight: "600",
  },
  webListDetail: {
    ...Typography.small,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  webEmptyText: {
    ...Typography.body,
    fontStyle: "italic",
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  weatherTempLarge: {
    ...Typography.h2,
  },
  weatherConditionLarge: {
    ...Typography.body,
  },
  weatherRecommendationLarge: {
    ...Typography.small,
    marginTop: Spacing.sm,
  },
});
