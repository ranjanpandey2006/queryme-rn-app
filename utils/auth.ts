import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem("authToken", token);
  } catch (err) {
    console.error("Error saving token", err);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("authToken");
  } catch (err) {
    console.error("Error reading token", err);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("authToken");
  } catch (err) {
    console.error("Error removing token", err);
  }
};