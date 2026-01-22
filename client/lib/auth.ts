import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "crewme_auth_token";
const USER_KEY = "crewme_user";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "crew_member" | "lead" | "foreman" | "project_manager" | "admin";
  avatarUrl?: string;
  xp: number;
  level: number;
  points: number;
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function storeToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
}

export async function storeUser(user: User): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<User | null> {
  const userStr = await getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function removeUser(): Promise<void> {
  await deleteItem(USER_KEY);
}

export async function clearAuth(): Promise<void> {
  await removeToken();
  await removeUser();
}
