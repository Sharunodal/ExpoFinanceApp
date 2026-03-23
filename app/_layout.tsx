import { Stack } from "expo-router";
import { ExpenseProvider } from "../context/Expense";

export default function RootLayout() {
  return (
    <ExpenseProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add"
          options={{
            title: "Add Expense",
            presentation: "modal",
          }}
        />
      </Stack>
    </ExpenseProvider>
  );
}
