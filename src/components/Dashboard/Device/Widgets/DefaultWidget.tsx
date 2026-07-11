import {
  Box,
  Flex,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import React from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { formatedDateTime } from "../../../../utils/formatedDateTime";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import {
  STAT_DIVIDER,
  STAT_LABEL_COLOR,
  STAT_ROW_MIN_H,
  STAT_TIMESTAMP_COLOR,
  STAT_VALUE_COLOR,
} from "./widgetTokens";

interface DefaultWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
}

const formatValue = (value: string, type: string) => {
  switch (type) {
    case "DateTime":
      return formatedDateTime(parseInt(value), "Europe/Brussels");

    default:
      return value;
  }
};

// Sized so a value fits the ~220px value column on one line; anything
// longer than that still gets a size (rather than shrinking forever) and
// relies on noOfLines={1} to ellipsize instead of wrapping into the
// timestamp below it.
const textSizeCalculate = (text: string) => {
  if (text === undefined) {
    return 32;
  }

  if (text.length < 6) {
    return 46;
  } else if (text.length < 11) {
    return 38;
  } else if (text.length < 13) {
    return 32;
  } else if (text.length < 20) {
    return 23;
  } else if (text.length < 26) {
    return 19;
  } else if (text.length < 34) {
    return 16;
  }
  return 13;
};

const halfSizeCalculate = (text: string) => Math.max(textSizeCalculate(text) - 10, 14);

const DefaultWidget: React.FC<DefaultWidgetProps> = ({
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const datapointKey = small !== undefined ? dataPoints[small] : dataPoints[0];
  const type = small !== undefined ? types[small] : types[0];

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  const loading = type === undefined || rawValue === undefined;
  const value = {
    value: loading ? "" : formatNumberValue(rawValue, type),
    time: time ?? "",
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
            <StatLabel
              fontSize={"14px"}
              fontWeight="medium"
              color={STAT_LABEL_COLOR}
              noOfLines={1}
            >
              {dataPoints[small]}
            </StatLabel>

            {loading ? (
              <StatNumber fontSize="22px" color={STAT_VALUE_COLOR}>
                Loading...
              </StatNumber>
            ) : value.value !== "" ? (
              <StatNumber
                fontSize={`${halfSizeCalculate(value.value)}px`}
                fontWeight="bold"
                color={STAT_VALUE_COLOR}
                noOfLines={1}
                lineHeight="1.15"
                mt={0.5}
                width="100%"
              >
                {formatValue(value.value, types[small])}
              </StatNumber>
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
          <StatLabel
            fontSize={"17px"}
            fontWeight="medium"
            color={STAT_LABEL_COLOR}
            noOfLines={1}
            flexShrink={1}
            minW={0}
          >
            {dataPoints[0]}
          </StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"220px"} flexShrink={0}>
            {loading ? (
              <StatNumber fontSize="32px" color={STAT_VALUE_COLOR}>
                Loading...
              </StatNumber>
            ) : value.value !== "" ? (
              <StatNumber
                fontSize={`${textSizeCalculate(value.value)}px`}
                lineHeight={`${textSizeCalculate(value.value) * 1.15}px`}
                fontWeight="bold"
                color={STAT_VALUE_COLOR}
                noOfLines={1}
              >
                {formatValue(value.value, types[0])}
              </StatNumber>
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

export default DefaultWidget;
