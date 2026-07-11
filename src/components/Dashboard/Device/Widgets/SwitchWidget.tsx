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
import React from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import {
  STAT_DIVIDER,
  STAT_LABEL_COLOR,
  STAT_ROW_MIN_H,
  STAT_TIMESTAMP_COLOR,
  STAT_VALUE_COLOR,
} from "./widgetTokens";

interface SwitchWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
  name?: string;
}

// Sized so a value fits its column (shared with the toggle) on one line;
// noOfLines={1} ellipsizes anything longer instead of wrapping.
const textSizeCalculate = (text: string) => {
  if (text.length < 11) {
    return 30;
  } else if (text.length < 13) {
    return 25;
  } else if (text.length < 20) {
    return 18;
  } else if (text.length < 26) {
    return 15;
  } else if (text.length < 34) {
    return 13;
  }
  return 11;
};

const halfSizeCalculate = (text: string) => Math.max(textSizeCalculate(text) - 4, 14);

const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  deviceKey,
  dataPoints,
  small,
  name,
}) => {
  const datapointKey = small !== undefined ? dataPoints[small] : dataPoints[0];

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  const loading = rawValue === undefined;
  const value = {
    value: loading ? "" : rawValue,
    time: time ?? "",
  };

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
      <Box width={"100%"} pr={4} pl={4} maxH="92px" minH={"92px"} {...STAT_DIVIDER}>
        <Stat>
          <Flex
            alignItems={"start"}
            flexDir={"column"}
            maxH="92px"
            height={"92px"}
            justifyContent="center"
            position={"relative"}
          >
            {name && name !== "" ? (
              <StatLabel fontSize={"14px"} fontWeight="medium" color={STAT_LABEL_COLOR} noOfLines={1}>
                {name}
              </StatLabel>
            ) : (
              <StatLabel fontSize={"14px"} fontWeight="medium" color={STAT_LABEL_COLOR} noOfLines={1}>
                {dataPoints[small]}
              </StatLabel>
            )}

            {loading ? (
              <StatNumber fontSize="22px" color={STAT_VALUE_COLOR}>
                Loading...
              </StatNumber>
            ) : value.value !== "" ? (
              <Flex alignItems={"center"} mt={0.5} width="100%">
                <StatNumber
                  fontSize={`${halfSizeCalculate(value.value)}px`}
                  fontWeight="bold"
                  color={STAT_VALUE_COLOR}
                  lineHeight="1.15"
                  noOfLines={1}
                  mr={2}
                  minW={0}
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
              <StatNumber fontSize="22px" color={STAT_VALUE_COLOR}>
                No data
              </StatNumber>
            )}
            <StatHelpText
              fontSize={"10px"}
              color={STAT_TIMESTAMP_COLOR}
              position={"absolute"}
              bottom={1}
              m={0}
            >
              {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
            </StatHelpText>
          </Flex>
        </Stat>
      </Box>
    );
  }

  return (
    <Box width={"100%"} pr={6} pl={6} maxH={STAT_ROW_MIN_H} minH={STAT_ROW_MIN_H} {...STAT_DIVIDER}>
      <Stat height="100%" display="flex" flexDir="column" justifyContent="center">
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"17px"} fontWeight="medium" color={STAT_LABEL_COLOR} noOfLines={1} flexShrink={1} minW={0}>
            {dataPoints[0]}
          </StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"220px"} flexShrink={0}>
            {loading ? (
              <StatNumber fontSize="32px" color={STAT_VALUE_COLOR}>
                Loading...
              </StatNumber>
            ) : value.value !== "" ? (
              <Flex alignItems={"center"}>
                <StatNumber
                  fontSize={`${textSizeCalculate(value.value)}px`}
                  lineHeight={`${textSizeCalculate(value.value) * 1.15}px`}
                  fontWeight="bold"
                  color={STAT_VALUE_COLOR}
                  noOfLines={1}
                  mr={2}
                  minW={0}
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
              <StatNumber fontSize="32px" color={STAT_VALUE_COLOR}>
                No data
              </StatNumber>
            )}
          </Box>
        </Flex>
        <Flex mt={1}>
          <StatHelpText fontSize={"11px"} color={STAT_TIMESTAMP_COLOR} ml="auto" mb={0}>
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default SwitchWidget;
