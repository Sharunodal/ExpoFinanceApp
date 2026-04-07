import { Alert, Platform } from "react-native";

export async function confirmAction(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: "Confirm",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}
