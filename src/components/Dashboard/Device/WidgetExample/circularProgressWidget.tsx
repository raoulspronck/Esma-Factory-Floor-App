import {
  Flex,
  CircularProgress,
  CircularProgressLabel,
  Box,
  Text,
} from "@chakra-ui/react";
import React from "react";

interface CircularProgressWidgetProps {
  color: string;
  value: number;
  maxValue: number;
}

const CircularProgressWidget: React.FC<CircularProgressWidgetProps> = ({
  color,
  value,
  maxValue,
}) => {
  return (
    <Flex justifyContent={"center"} mt={5} pb={5}>
      <CircularProgress
        value={(value / maxValue) * 100}
        size="185px"
        color={`${color}.400`}
        trackColor="gray.300"
        border="10px solid"
        borderColor={`${color}.400`}
        borderRadius={"50%"}
      >
        <CircularProgressLabel color="gray.800">
          <Flex justifyContent={"center"}>
            <Box width={"fit-content"}>
              <Text fontSize={"45px"} mb={-2}>
                {value}
              </Text>
              <Text
                fontSize={"30px"}
                pt={-2}
                borderTop="1px"
                borderColor={"gray.800"}
              >
                {maxValue}
              </Text>
            </Box>
          </Flex>
        </CircularProgressLabel>
      </CircularProgress>
    </Flex>
  );
};

export default CircularProgressWidget;
