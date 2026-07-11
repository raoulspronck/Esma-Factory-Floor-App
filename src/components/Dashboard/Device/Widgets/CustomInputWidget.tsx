import {
  Box,
  Button,
  Flex,
  Input,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import {
  STAT_DIVIDER,
  STAT_LABEL_COLOR,
  STAT_ROW_MIN_H,
  STAT_TIMESTAMP_COLOR,
} from "./widgetTokens";

interface CustomInputWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
  name?: string;
}

const textSizeCalculate = (text: string) => {
  if (text !== undefined) {
    if (text.length < 11) {
      return 26;
    } else if (text.length < 13) {
      return 24;
    } else if (text.length < 20) {
      return 21;
    } else if (text.length < 26) {
      return 19;
    } else if (text.length < 34) {
      return 17;
    }
    return 15;
  }
};

const CustomInputWidget: React.FC<CustomInputWidgetProps> = ({
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const datapointKey = small !== undefined ? dataPoints[small] : dataPoints[0];
  const [inputValue, setInputValue] = useState("");

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  const loading = types[0] === undefined || rawValue === undefined;
  const value = {
    value: loading ? "" : rawValue,
    time: time ?? "",
  };

  const sendMessage = () => {
    invoke("send_message", {
      deviceKey,
      datapoint: dataPoints[0],
      value: inputValue,
    })
      .then(() => setInputValue(""))
      .catch(() => {});
  };

  return (
    <Flex
      width={"100%"}
      pr={6}
      pl={6}
      maxH={STAT_ROW_MIN_H}
      minH={STAT_ROW_MIN_H}
      flexDir={"column"}
      justifyContent={"center"}
      {...STAT_DIVIDER}
    >
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"17px"} fontWeight="medium" color={STAT_LABEL_COLOR} noOfLines={1} flexShrink={1} minW={0}>
            {dataPoints[0]}
          </StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"220px"} flexShrink={0}>
            {loading ? (
              <StatNumber fontSize="22px" color={STAT_LABEL_COLOR}>
                Loading...
              </StatNumber>
            ) : value.value !== undefined && value.value !== "" ? (
              <Flex alignItems={"center"}>
                <Input
                  size="lg"
                  placeholder={value.value}
                  fontSize={`${textSizeCalculate(value.value)}px`}
                  fontWeight="bold"
                  textAlign="right"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button size="lg" ml={2} colorScheme="brand" onClick={() => sendMessage()}>
                  Send
                </Button>
              </Flex>
            ) : (
              <Flex alignItems={"center"}>
                <Input
                  size="lg"
                  textAlign="right"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button size="lg" ml={2} colorScheme="brand" onClick={() => sendMessage()}>
                  Send
                </Button>
              </Flex>
            )}
          </Box>
        </Flex>
        <Flex mt={1}>
          <StatHelpText fontSize={"11px"} color={STAT_TIMESTAMP_COLOR} ml="auto" mb={0}>
            {loading
              ? ""
              : value.value !== "" && value.value !== undefined
              ? formatDate(value.time)
              : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Flex>
  );
};

export default CustomInputWidget;
