import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useDeviceValue } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";

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

  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();
  // Fills whatever the grid cell gives it (1x1 up to a full 2x2+), floored so
  // it never collapses to nothing before the first measurement lands.
  const diameter = Math.max(Math.min(width, height) - 24, 64);

  return (
    <Flex ref={containerRef} justifyContent={"center"} alignItems="center" width="100%" height="100%">
      {loading ? (
        <Text fontSize="30px">Loading...</Text>
      ) : (
        <CircularProgress
          value={(value / maxValue) * 100}
          size={`${diameter}px`}
          thickness="10px"
          color={"brand.400"}
          trackColor="whiteAlpha.200"
          capIsRound
        >
          <CircularProgressLabel color="white">
            <Flex justifyContent={"center"}>
              <Box width={"fit-content"}>
                <Text fontSize={`${Math.round(diameter * 0.27)}px`} fontWeight="extrabold" lineHeight="1">
                  {value}
                </Text>
                <Text
                  fontSize={`${Math.round(diameter * 0.13)}px`}
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
