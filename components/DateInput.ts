import { Platform } from "react-native";

const DateInputRow = Platform.OS === "web"
  ? require("./web").default
  : require("./native").default;

export default DateInputRow;