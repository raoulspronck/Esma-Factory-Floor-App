import {
  Box,
  Flex,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";

interface SwitchWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
}

const textSizeCalculate = (text: string) => {
  if (text.length < 11) {
    return 30;
  } else if (text.length < 13) {
    return 27;
  } else if (text.length < 20) {
    return 25;
  } else if (text.length < 26) {
    return 23;
  } else if (text.length < 34) {
    return 20;
  }
  return 15;
};

const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  deviceId,
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!functionCalled.current && types[0] !== undefined) {
      invoke("get_last_value", {
        deviceId,
        deviceKey,
        datapointKey: small !== undefined ? dataPoints[small] : dataPoints[0],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);

            setValue({
              value: valueJson.value,
              time: valueJson.createdAt,
            });
          } catch (_error) {}

          setLoading(false);
        })
        .catch((_err) => {
          setLoading(false);
        });

      listen(
        `notification---${deviceKey}---${
          small !== undefined ? dataPoints[small] : dataPoints[0]
        }`,
        (event) => {
          setValue({
            value: formatNumberValue(
              event.payload as string,
              small !== undefined ? types[small] : types[0]
            ),
            time: new Date().toISOString(),
          });
        }
      );

      functionCalled.current = true;
    }
  }, [types]);

  const switchChanged = () => {
    invoke("send_message", {
      deviceKey,
      datapoint: dataPoints[0],
      value: value.value === "on" ? "off" : "on",
    })
      .then()
      .catch();
  };

  if (small !== undefined) {
    return (
      <Box width={"100%"} pr={3} pl={3} maxH="80px" minH={"80px"}>
        <Stat>
          <Flex
            alignItems={"start"}
            flexDir={"column"}
            maxH="80px"
            height={"80px"}
            position={"relative"}
          >
            <StatLabel fontSize={"13px"}>{dataPoints[small]}</StatLabel>

            {loading ? (
              <StatNumber fontSize="20px">Loading...</StatNumber>
            ) : value.value !== "" ? (
              <Flex alignItems={"center"} mt={-1}>
                <StatNumber
                  fontSize={`${textSizeCalculate(value.value) - 5}px`}
                  lineHeight={`${textSizeCalculate(value.value) * 1.2}px`}
                  textOverflow="ellipsis"
                  wordBreak={"break-word"}
                  whiteSpace={"break-spaces"}
                  mr={2}
                >
                  {value.value}
                </StatNumber>
                <Switch
                  size={"lg"}
                  ml="auto"
                  mr={2}
                  isChecked={value.value === "on" ? false : true}
                  onChange={switchChanged}
                />
              </Flex>
            ) : (
              <StatNumber fontSize="20px">No data</StatNumber>
            )}
            <StatHelpText fontSize={"10px"} position={"absolute"} bottom={0}>
              {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
            </StatHelpText>
          </Flex>
        </Stat>
      </Box>
    );
  }

  return (
    <Box width={"100%"} pr={5} pl={5} maxH="80px" minH={"80px"}>
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"16px"}>{dataPoints[0]}</StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"180px"}>
            {loading ? (
              <StatNumber fontSize="30px">Loading...</StatNumber>
            ) : value.value !== "" ? (
              <Flex alignItems={"center"}>
                <StatNumber
                  fontSize={`${textSizeCalculate(value.value)}px`}
                  lineHeight={`${textSizeCalculate(value.value) * 1.2}px`}
                  textOverflow="ellipsis"
                  wordBreak={"break-word"}
                  whiteSpace={"break-spaces"}
                  mr={2}
                >
                  {value.value.toUpperCase()}
                </StatNumber>
                <Switch
                  size={"lg"}
                  ml="auto"
                  mr={2}
                  isChecked={value.value === "on" ? true : false}
                  onChange={switchChanged}
                />
              </Flex>
            ) : (
              <StatNumber fontSize="30px">No data</StatNumber>
            )}
          </Box>
        </Flex>
        <Flex mt={1}>
          <StatHelpText fontSize={"12px"} ml="auto">
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default SwitchWidget;
