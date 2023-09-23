import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";

interface CircularProgressWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const CircularProgressWidget: React.FC<CircularProgressWidgetProps> = ({
  deviceId,
  dataPoints,
  deviceKey,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    if (!functionCalled.current) {
      invoke("get_last_value", {
        deviceId,
        datapointKey: dataPoints[0],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);

            setValue(parseInt(valueJson.value as string));
          } catch (_error) {}
        })
        .catch((_err) => {});

      invoke("get_last_value", {
        deviceId,
        datapointKey: dataPoints[1],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);

            setMaxValue(parseInt(valueJson.value as string));
          } catch (_error) {}
        })
        .catch((_err) => {});

      listen(`notification---${deviceKey}---${dataPoints[0]}`, (event) => {
        setValue(parseInt(event.payload as string));
      });

      listen(`notification---${deviceKey}---${dataPoints[1]}`, (event) => {
        setMaxValue(parseInt(event.payload as string));
      });

      functionCalled.current = true;
    }
  }, [deviceId, deviceKey, dataPoints]);

  return (
    <Flex justifyContent={"center"} pb={5} pt={5}>
      <CircularProgress
        value={(value / maxValue) * 100}
        size="180px"
        color={"gray.400"}
        trackColor="gray.300"
        border="10px solid"
        borderColor={"gray.400"}
        borderRadius={"50%"}
      >
        <CircularProgressLabel color="white">
          <Flex justifyContent={"center"}>
            <Box width={"fit-content"}>
              <Text fontSize={"45px"} mb={-2} fontWeight="medium">
                {value}
              </Text>
              <Text
                fontSize={"25px"}
                pt={-2}
                borderTop="1px"
                borderColor={"white"}
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
