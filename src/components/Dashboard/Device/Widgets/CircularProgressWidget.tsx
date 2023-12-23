import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { emitter } from "../../../../index";

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
  const [value, setValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
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

      setValue(parseInt(JSON.parse(val).value as string));
      setMaxValue(parseInt(JSON.parse(maxVal).value as string));

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

    return () => {
      emitter.off("refetch", fetchValues);
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
    };
  }, []);

  return (
    <Flex justifyContent={"center"} pb={5} pt={5}>
      {loading ? (
        <Text fontSize="30px">Loading...</Text>
      ) : (
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
      )}
    </Flex>
  );
};

export default CircularProgressWidget;
