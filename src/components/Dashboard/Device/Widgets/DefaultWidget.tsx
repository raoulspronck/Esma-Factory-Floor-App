import {
  Box,
  Flex,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";

interface DefaultWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const DefaultWidget: React.FC<DefaultWidgetProps> = ({
  deviceId,
  deviceKey,
  dataPoints,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!functionCalled.current) {
      invoke("get_last_value", {
        deviceId,
        datapointKey: dataPoints[0],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);

            setValue({
              value: valueJson.value,
              time: valueJson.createdAt,
            });

            setLoading(false);
          } catch (_error) {
            setLoading(false);
          }
        })
        .catch((_err) => {
          setLoading(false);
        });

      listen(`notification---${deviceKey}---${dataPoints[0]}`, (event) => {
        setValue({
          value: event.payload as string,
          time: new Date().toISOString(),
        });
      });

      functionCalled.current = true;
    }
  }, []);

  return (
    <Box width={"100%"} pr={5} pl={5} maxH="80px" minH={"80px"}>
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"16px"}>{dataPoints[0]}</StatLabel>

          <Box ml="auto" textAlign={"right"}>
            <StatNumber fontSize={"32px"}>
              {loading
                ? "Loading..."
                : value.value !== ""
                ? value.value
                : "No data"}{" "}
              {}
            </StatNumber>
          </Box>
        </Flex>
        <Flex>
          <StatHelpText fontSize={"12px"} ml="auto">
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default DefaultWidget;
