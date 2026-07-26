import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

const TOKEN_KEY = '@emp_mgmt_token';
const USER_KEY = '@emp_mgmt_user';

export const storageKeys = {
  token: TOKEN_KEY,
  user: USER_KEY,
};

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([removeToken(), removeUser()]);
}
