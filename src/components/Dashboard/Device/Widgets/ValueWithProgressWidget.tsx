import { MinusIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Icon,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";

interface ValueWithProgressWidgetProps {
  up: boolean;
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const ValueWithProgressWidget: React.FC<ValueWithProgressWidgetProps> = ({
  up,
  dataPoints,
  deviceId,
  deviceKey,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const prevValue = useRef(0);
  const [difference, setDifference] = useState(0);
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

      listen(`notification-${deviceKey}-${dataPoints[0]}`, (event) => {
        if (prevValue.current !== 0) {
          let diff =
            ((parseFloat(event.payload as string) - prevValue.current) /
              prevValue.current) *
            100;

          setDifference(Math.round(diff * 100) / 100);
        }

        prevValue.current = parseFloat(event.payload as string);
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
            <Flex alignItems={"end"}>
              {difference === 0 ? (
                <StatHelpText mr={2} fontSize="16px">
                  <Icon as={MinusIcon} boxSize={5} color="gray.700" />
                  {difference}%
                </StatHelpText>
              ) : difference > 0 ? (
                <StatHelpText mr={2} fontSize="16px">
                  <StatArrow
                    type={"increase"}
                    color={up ? "green" : "red"}
                    boxSize={5}
                  />
                  {difference}%
                </StatHelpText>
              ) : (
                <StatHelpText mr={2} fontSize="16px">
                  <StatArrow
                    type={"decrease"}
                    color={up ? "red" : "green"}
                    boxSize={5}
                  />
                  {difference}%
                </StatHelpText>
              )}

              <StatNumber fontSize={"32px"}>
                {loading
                  ? "Loading..."
                  : value.value !== ""
                  ? value.value
                  : "No data"}{" "}
                {}
              </StatNumber>
            </Flex>
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

export default ValueWithProgressWidget;
