import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#111",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Entries",
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require("../../assets/images/edit.png")}
              style={{
                width: size,
                height: size,
                opacity: focused ? 1 : 0.8,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="filter"
        options={{
          title: "Filter",
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require("../../assets/images/filter.png")}
              style={{
                width: size,
                height: size,
                opacity: focused ? 1 : 0.8,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require("../../assets/images/summary.png")}
              style={{
                width: size,
                height: size,
                opacity: focused ? 1 : 0.8,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require("../../assets/images/settings.png")}
              style={{
                width: size,
                height: size,
                opacity: focused ? 1 : 0.8,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}