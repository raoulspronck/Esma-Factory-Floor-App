import {
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";

interface CircularProgressWidgetWithVariableColorProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const CircularProgressWidgetWithVariableColor: React.FC<
  CircularProgressWidgetWithVariableColorProps
> = ({ deviceId, dataPoints, deviceKey }) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [color, setColor] = useState("none");
  const [realColor, setRealColor] = useState("none");

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

      invoke("get_last_value", {
        deviceId,
        datapointKey: dataPoints[2],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);
            setColor((valueJson.value as string).toLowerCase());
          } catch (_error) {}
        })
        .catch((_err) => {});

      listen(`notification---${deviceKey}---${dataPoints[0]}`, (event) => {
        setValue(parseInt(event.payload as string));
      });

      listen(`notification---${deviceKey}---${dataPoints[1]}`, (event) => {
        setMaxValue(parseInt(event.payload as string));
      });

      listen(`notification---${deviceKey}---${dataPoints[2]}`, (event) => {
        setColor((event.payload as string).toLowerCase());
      });

      functionCalled.current = true;
    }
  }, [deviceId, deviceKey, dataPoints]);

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
    <Flex justifyContent={"center"} pb={5} pt={5}>
      <CircularProgress
        value={(value / maxValue) * 100}
        size="180px"
        color={`${realColor}.400`}
        trackColor="gray.300"
        border="10px solid"
        borderColor={`${realColor}.400`}
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

export default CircularProgressWidgetWithVariableColor;
