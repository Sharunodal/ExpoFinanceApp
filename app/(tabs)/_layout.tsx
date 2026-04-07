import { Tabs } from "expo-router";
import { Image, ImageSourcePropType } from "react-native";

const TAB_CONFIG: {
  name: "index" | "filter" | "summary" | "graph" | "settings";
  title: string;
  icon: ImageSourcePropType;
}[] = [
  {
    name: "index",
    title: "Entries",
    icon: require("../../assets/images/edit.png"),
  },
  {
    name: "filter",
    title: "Filter",
    icon: require("../../assets/images/filter.png"),
  },
  {
    name: "summary",
    title: "Summary",
    icon: require("../../assets/images/summary.png"),
  },
  {
    name: "graph",
    title: "Graph",
    icon: require("../../assets/images/chart.png"),
  },
  {
    name: "settings",
    title: "Settings",
    icon: require("../../assets/images/settings.png"),
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#111",
        tabBarInactiveTintColor: "#888",
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ size, focused }) => (
              <Image
                source={tab.icon}
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
      ))}
    </Tabs>
  );
}
