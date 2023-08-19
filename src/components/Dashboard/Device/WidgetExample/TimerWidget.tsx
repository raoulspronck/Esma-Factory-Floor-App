import React from "react";
import { Box, Text } from "@chakra-ui/react";

interface TimerWidgetProps {}

const TimerWidget: React.FC<TimerWidgetProps> = ({}) => {
  return (
    <Box width={"100%"}>
      <Box
        ml="auto"
        width={"100%"}
        textAlign="right"
        color="white"
        backgroundColor="green.400"
        pr="10px"
      >
        <Text fontSize={"40px"}>13:34:00</Text>
        <Text fontSize={"30px"} mt={"-10px"}>
          Stop
        </Text>
      </Box>
    </Box>
  );
};

export default TimerWidget;
