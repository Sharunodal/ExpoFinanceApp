import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: "center" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Entries",
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
        }}
      />
    </Tabs>
  );
}