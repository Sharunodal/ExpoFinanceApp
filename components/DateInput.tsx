import { Platform } from "react-native";
import DateInputNative from "./DateInput.native";
import DateInputWeb from "./DateInput.web";

const DateInputRow = Platform.OS === "web" ? DateInputWeb : DateInputNative;

export default DateInputRow;
