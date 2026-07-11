import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useDeviceValue } from "../../../../hooks/useDeviceValue";

interface CircularProgressWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const CircularProgressWidget: React.FC<CircularProgressWidgetProps> = ({
  dataPoints,
  deviceKey,
}) => {
  const rawValue = useDeviceValue(deviceKey, dataPoints[0]);
  const rawMaxValue = useDeviceValue(deviceKey, dataPoints[1]);
  const loading = rawValue === undefined || rawMaxValue === undefined;

  const value = parseInt(rawValue ?? "0") || 0;
  const maxValue = parseInt(rawMaxValue ?? "0") || 0;

  return (
    <Flex justifyContent={"center"} pb={6} pt={6}>
      {loading ? (
        <Text fontSize="30px">Loading...</Text>
      ) : (
        <CircularProgress
          value={(value / maxValue) * 100}
          size="208px"
          thickness="10px"
          color={"brand.400"}
          trackColor="whiteAlpha.200"
          capIsRound
        >
          <CircularProgressLabel color="white">
            <Flex justifyContent={"center"}>
              <Box width={"fit-content"}>
                <Text fontSize={"56px"} fontWeight="extrabold" lineHeight="1">
                  {value}
                </Text>
                <Text
                  fontSize={"28px"}
                  fontWeight="semibold"
                  color="whiteAlpha.700"
                  pt={1}
                  mt={1}
                  borderTop="1px solid"
                  borderColor={"whiteAlpha.400"}
                >
                  {maxValue}
                </Text>
              </Box>
            </Flex>
          </CircularProgressLabel>
        </CircularProgress>
      )}
    </Flex>
  );
};

export default CircularProgressWidget;
