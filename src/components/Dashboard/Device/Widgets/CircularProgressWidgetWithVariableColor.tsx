import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useDeviceValue } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";

interface CircularProgressWidgetWithVariableColorProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const CircularProgressWidgetWithVariableColor: React.FC<
  CircularProgressWidgetWithVariableColorProps
> = ({ dataPoints, deviceKey }) => {
  const rawValue = useDeviceValue(deviceKey, dataPoints[0]);
  const rawMaxValue = useDeviceValue(deviceKey, dataPoints[1]);
  const rawColor = useDeviceValue(deviceKey, dataPoints[2]);
  const loading =
    rawValue === undefined || rawMaxValue === undefined || rawColor === undefined;

  const value = parseInt(rawValue ?? "0") || 0;
  const maxValue = parseInt(rawMaxValue ?? "0") || 0;
  const color = (rawColor ?? "none").toLowerCase();

  const [realColor, setRealColor] = useState("none");
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();
  const diameter = Math.max(Math.min(width, height) - 24, 64);

  useEffect(() => {
    let interval: any;

    if (color.startsWith("flashing")) {
      interval = setInterval(async () => {
        setRealColor(color.substring(9));

        await new Promise((r) => setTimeout(r, 500));

        setRealColor("none");
      }, 1000);
    } else {
      setRealColor(color);
    }

    return () => {
      clearInterval(interval);
    };
  }, [color]);

  return (
    <Flex ref={containerRef} justifyContent={"center"} alignItems="center" width="100%" height="100%">
      {loading ? (
        <Text fontSize="30px">Loading...</Text>
      ) : (
        <CircularProgress
          value={(value / maxValue) * 100}
          size={`${diameter}px`}
          thickness="10px"
          color={`${realColor}.400`}
          trackColor="whiteAlpha.200"
          capIsRound
          border="12px solid"
          borderColor={`${realColor}.400`}
          borderRadius={"50%"}
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

export default CircularProgressWidgetWithVariableColor;
