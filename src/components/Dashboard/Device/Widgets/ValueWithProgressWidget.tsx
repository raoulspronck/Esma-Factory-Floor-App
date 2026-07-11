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
import React, { useEffect, useRef, useState } from "react";
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

interface ValueWithProgressWidgetProps {
  up: boolean;
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
}

// Sized so a value fits the ~180px value column (after the delta arrow) on
// one line; noOfLines={1} ellipsizes anything longer instead of wrapping.
const textSizeCalculate = (text: string) => {
  if (text.length < 6) {
    return 40;
  } else if (text.length < 11) {
    return 30;
  } else if (text.length < 13) {
    return 25;
  } else if (text.length < 22) {
    return 18;
  } else if (text.length < 34) {
    return 14;
  }
  return 12;
};

const ValueWithProgressWidget: React.FC<ValueWithProgressWidgetProps> = ({
  up,
  dataPoints,
  deviceKey,
  types,
}) => {
  const rawValue = useDeviceValue(deviceKey, dataPoints[0]);
  const time = useDeviceValueTimestamp(deviceKey, dataPoints[0]);
  const loading = rawValue === undefined;
  const value = {
    value: loading ? "" : formatNumberValue(rawValue, types[0]),
    time: time ?? "",
  };

  const prevValue = useRef<number | null>(null);
  const [difference, setDifference] = useState(0);

  // Recompute the % change whenever the value changes (skips the first time
  // it becomes available, since there's nothing yet to compare against).
  useEffect(() => {
    if (rawValue === undefined) return;
    const numeric = parseFloat(rawValue);

    if (prevValue.current !== null && prevValue.current !== 0) {
      const diff = ((numeric - prevValue.current) / prevValue.current) * 100;
      setDifference(Math.round(diff * 100) / 100);
    }

    prevValue.current = numeric;
  }, [rawValue]);

  return (
    <Box width={"100%"} pr={6} pl={6} maxH={STAT_ROW_MIN_H} minH={STAT_ROW_MIN_H} {...STAT_DIVIDER}>
      <Stat height="100%" display="flex" flexDir="column" justifyContent="center">
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"17px"} fontWeight="medium" color={STAT_LABEL_COLOR} noOfLines={1} flexShrink={1} minW={0}>
            {dataPoints[0]}
          </StatLabel>

          <Box ml="auto" textAlign={"right"} flexShrink={0}>
            <Flex alignItems={"baseline"}>
              <Box height={"fit-content"}>
                {difference === 0 ? (
                  <StatHelpText mr={2} fontSize="16px" color={STAT_TIMESTAMP_COLOR} mb={0}>
                    <Icon as={MinusIcon} boxSize={5} color="whiteAlpha.500" />
                    {difference}%
                  </StatHelpText>
                ) : difference > 0 ? (
                  <StatHelpText mr={2} fontSize="15px" fontWeight="semibold" mb={0}>
                    <StatArrow
                      type={"increase"}
                      color={up ? "green.400" : "red.400"}
                      boxSize={5}
                    />
                    {difference}%
                  </StatHelpText>
                ) : (
                  <StatHelpText mr={2} fontSize="15px" fontWeight="semibold" mb={0}>
                    <StatArrow
                      type={"decrease"}
                      color={up ? "red.400" : "green.400"}
                      boxSize={5}
                    />
                    {difference}%
                  </StatHelpText>
                )}
              </Box>
              <Box maxWidth={"180px"}>
                {loading ? (
                  <StatNumber fontSize="32px" color={STAT_VALUE_COLOR}>
                    Loading...
                  </StatNumber>
                ) : value.value !== "" ? (
                  <StatNumber
                    fontSize={`${textSizeCalculate(value.value)}px`}
                    fontWeight="bold"
                    color={STAT_VALUE_COLOR}
                    noOfLines={1}
                  >
                    {value.value}
                  </StatNumber>
                ) : (
                  <StatNumber fontSize="32px" color={STAT_VALUE_COLOR}>
                    No data
                  </StatNumber>
                )}
              </Box>
            </Flex>
          </Box>
        </Flex>
        <Flex>
          <StatHelpText fontSize={"11px"} color={STAT_TIMESTAMP_COLOR} ml="auto" mb={0}>
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default ValueWithProgressWidget;
