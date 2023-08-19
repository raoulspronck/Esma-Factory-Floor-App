// 1. import `extendTheme` function
import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
// 2. Add your color mode config
const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
} as ThemeConfig;

const breakpoints = createBreakpoints({
  sm: "700px",
  md: "1017px",
  lg: "1300px",
  xl: "1700px",
  "2xl": "2000px",
});

const components = {
  Checkbox: {
    baseStyle: {
      icon: {
        size: "40px", // works only when resetting defaultProps
        fontSize: "40px",
      },
      control: {
        height: "40px", // works only when resetting defaultProps
        width: "40px",
      },
    },
  },
};

// 3. extend the theme
const theme = extendTheme({ config, breakpoints, components });
export default theme;
