import * as SecureStore from "expo-secure-store";

export async function getAuthToken() {
  return await SecureStore.getItemAsync("token");
}