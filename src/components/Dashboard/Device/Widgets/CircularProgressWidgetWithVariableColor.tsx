import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Stat,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { emitter } from "../../../../index";

interface CircularProgressWidgetWithVariableColorProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const CircularProgressWidgetWithVariableColor: React.FC<
  CircularProgressWidgetWithVariableColorProps
> = ({ deviceId, dataPoints, deviceKey }) => {
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [color, setColor] = useState("none");
  const [realColor, setRealColor] = useState("none");
  const [loading, setLoading] = useState(false);

  const fetchValues = async () => {
    setLoading(true);

    try {
      const val = (await invoke("get_last_value", {
        deviceId,
        deviceKey,
        datapointKey: dataPoints[0],
      })) as any;

      const maxVal = (await invoke("get_last_value", {
        deviceId,
        deviceKey,
        datapointKey: dataPoints[1],
      })) as any;

      const color = (await invoke("get_last_value", {
        deviceId,
        deviceKey,
        datapointKey: dataPoints[2],
      })) as any;

      setValue(parseInt(JSON.parse(val).value as string));
      setMaxValue(parseInt(JSON.parse(maxVal).value as string));
      setColor((JSON.parse(color).value as string).toLowerCase());

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    emitter.on("refetch", fetchValues);

    fetchValues();

    const unlisten1 = listen(
      `notification---${deviceKey}---${dataPoints[0]}`,
      (event) => {
        setValue(parseInt(event.payload as string));
      }
    );

    const unlisten2 = listen(
      `notification---${deviceKey}---${dataPoints[1]}`,
      (event) => {
        setMaxValue(parseInt(event.payload as string));
      }
    );

    const unlisten3 = listen(
      `notification---${deviceKey}---${dataPoints[2]}`,
      (event) => {
        setColor((event.payload as string).toLowerCase());
      }
    );

    return () => {
      emitter.off("refetch", fetchValues);
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
      unlisten3.then((f) => f());
    };
  }, []);

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
      {loading ? (
        <Text fontSize="30px">Loading...</Text>
      ) : (
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
      )}
    </Flex>
  );
};

export default CircularProgressWidgetWithVariableColor;
