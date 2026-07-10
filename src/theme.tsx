import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

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

// Industrial blue — high contrast on both the dark taskbar and light content.
const brand = {
  50: "#e8f4fc",
  100: "#c5e2f7",
  200: "#9dcef1",
  300: "#6fb7ea",
  400: "#45a2e2",
  500: "#2489d3",
  600: "#1c6fb2",
  700: "#15568c",
  800: "#0e3e66",
  900: "#082842",
};

const fonts = {
  heading: `"Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, sans-serif`,
  body: `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif`,
};

// Touch-first component defaults: the app runs on factory-floor touchscreens,
// so every size token is bumped so even explicit size="sm" stays a usable target.
const components = {
  Button: {
    baseStyle: {
      borderRadius: "xl",
      fontWeight: "semibold",
    },
    sizes: {
      xs: { h: "36px", minW: "36px", fontSize: "sm", px: 3 },
      sm: { h: "42px", minW: "42px", fontSize: "md", px: 4 },
      md: { h: "48px", minW: "48px", fontSize: "md", px: 5 },
      lg: { h: "56px", minW: "56px", fontSize: "lg", px: 6 },
    },
    defaultProps: {
      size: "md",
    },
  },
  Input: {
    sizes: {
      sm: { field: { h: "42px", borderRadius: "lg", fontSize: "md" } },
      md: { field: { h: "48px", borderRadius: "lg", fontSize: "md" } },
      lg: { field: { h: "56px", borderRadius: "xl", fontSize: "lg" } },
    },
    defaultProps: {
      size: "md",
      focusBorderColor: "brand.500",
    },
  },
  NumberInput: {
    baseStyle: {
      root: {
        "--number-input-stepper-width": "44px",
      },
      stepper: {
        fontSize: "14px",
        _first: { borderTopEndRadius: "lg" },
        _last: { borderBottomEndRadius: "lg" },
      },
    },
    sizes: {
      sm: { field: { h: "42px", borderRadius: "lg", fontSize: "md" } },
      md: { field: { h: "48px", borderRadius: "lg", fontSize: "md" } },
      lg: { field: { h: "56px", borderRadius: "xl", fontSize: "lg" } },
    },
    defaultProps: {
      size: "md",
      focusBorderColor: "brand.500",
    },
  },
  Select: {
    sizes: {
      sm: { field: { h: "42px", borderRadius: "lg", fontSize: "md" } },
      md: { field: { h: "48px", borderRadius: "lg", fontSize: "md" } },
      lg: { field: { h: "56px", borderRadius: "xl", fontSize: "lg" } },
    },
    defaultProps: {
      size: "md",
      focusBorderColor: "brand.500",
    },
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: "brand.500",
    },
  },
  Checkbox: {
    sizes: {
      sm: { control: { h: 6, w: 6 }, label: { fontSize: "md" } },
      md: { control: { h: 7, w: 7 }, label: { fontSize: "md" } },
      lg: { control: { h: 9, w: 9 }, label: { fontSize: "lg" }, icon: { fontSize: "1rem" } },
    },
    baseStyle: {
      control: {
        borderRadius: "md",
      },
    },
    defaultProps: {
      size: "lg",
      colorScheme: "brand",
    },
  },
  Switch: {
    defaultProps: {
      size: "lg",
      colorScheme: "brand",
    },
  },
  FormLabel: {
    baseStyle: {
      fontSize: "lg",
      fontWeight: "semibold",
      mb: 2,
    },
  },
  Menu: {
    baseStyle: {
      list: {
        borderRadius: "xl",
        border: "none",
        boxShadow: "0 12px 32px rgba(8, 40, 66, 0.28)",
        py: 2,
        minW: "240px",
        // Menus often render inside the dark taskbar (color="white");
        // force readable text on the light menu surface.
        color: "gray.800",
      },
      item: {
        fontSize: "lg",
        fontWeight: "medium",
        py: 4,
        px: 5,
        color: "gray.800",
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: "2xl",
        mx: 4,
      },
      header: {
        fontSize: "2xl",
        fontWeight: "bold",
        pt: 6,
      },
      body: {
        fontSize: "md",
      },
      footer: {
        pb: 6,
      },
      closeButton: {
        boxSize: "48px",
        fontSize: "16px",
        borderRadius: "xl",
        top: 4,
        insetEnd: 4,
      },
    },
  },
  Popover: {
    baseStyle: {
      content: {
        borderRadius: "xl",
        boxShadow: "0 12px 32px rgba(8, 40, 66, 0.28)",
      },
    },
  },
  Tooltip: {
    baseStyle: {
      borderRadius: "lg",
      fontSize: "md",
      px: 3,
      py: 2,
    },
  },
};

const styles = {
  global: {
    body: {
      bg: "gray.100",
      color: "gray.800",
    },
    "::-webkit-scrollbar": {
      width: "14px",
      height: "14px",
    },
    "::-webkit-scrollbar-thumb": {
      bg: "gray.400",
      borderRadius: "full",
      border: "3px solid transparent",
      backgroundClip: "content-box",
    },
    "::-webkit-scrollbar-track": {
      bg: "transparent",
    },
  },
};

const theme = extendTheme({
  config,
  breakpoints,
  fonts,
  colors: {
    brand,
    // Legacy alias: most of the app uses colorScheme/bgColor "twitter.*".
    // Pointing that scale at the brand palette restyles everything at once.
    twitter: brand,
  },
  styles,
  components,
});

export default theme;
