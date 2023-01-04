// 1. import `extendTheme` function
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
// 2. Add your color mode config
const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
} as any;

const breakpoints = createBreakpoints({
  sm: "700px",
  md: "1017px",
  lg: "1300px",
  xl: "1700px",
  "2xl": "2000px",
});

// 3. extend the theme
const theme = extendTheme({ config, breakpoints });
export default theme;
