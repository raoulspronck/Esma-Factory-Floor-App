import React from "react";
import { useColorMode, IconButton } from "@chakra-ui/react";
import { MoonIcon } from "@chakra-ui/icons";
import { FaSun } from "react-icons/fa";

interface darkmodeprops {
  color: string;
  fontSize: string[];
  size: string;
}

const DarkModeSwitch: React.FC<darkmodeprops> = ({ color, fontSize, size }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <IconButton
      fontSize={fontSize}
      bg={"transparent"}
      color={color}
      aria-label="toggle darkmode"
      icon={!isDark ? <MoonIcon /> : <FaSun />}
      onClick={toggleColorMode}
      size={size}
    />
  );
};

export default DarkModeSwitch;
