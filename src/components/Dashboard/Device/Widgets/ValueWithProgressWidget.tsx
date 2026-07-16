import { MinusIcon } from "@chakra-ui/icons";
import { Flex, Icon, Text } from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  fitFontSize,
  scaleFont,
  statTypography,
  STAT_LABEL_COLOR,
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

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const shown = loading ? "Loading..." : value.value !== "" ? value.value : "No data";
  const valueSize = fitFontSize(shown, width * 0.6, t.valueArea, { min: 12, max: 60 });
  const deltaSize = scaleFont(height, 0.11, 10, 15);

  const deltaColor =
    difference === 0 ? "whiteAlpha.500" : (difference > 0) === up ? "green.400" : "red.400";

  return (
    <Flex
      ref={rootRef}
      flexDir="column"
      width="100%"
      height="100%"
      px={3}
      py={1.5}
      overflow="hidden"
    >
      {t.showLabel && (
        <Text
          fontSize={`${t.labelSize}px`}
          fontWeight="medium"
          color={STAT_LABEL_COLOR}
          noOfLines={1}
          flexShrink={0}
        >
          {dataPoints[0]}
        </Text>
      )}

      <Flex flex="1" minH={0} alignItems="center" justifyContent="center" gap={2} overflow="hidden">
        <Flex alignItems="center" flexShrink={0} color={deltaColor} fontWeight="semibold" fontSize={`${deltaSize}px`}>
          <Icon
            as={difference === 0 ? MinusIcon : difference > 0 ? TriangleUpIcon : TriangleDownIcon}
            boxSize={`${deltaSize}px`}
            mr={1}
          />
          {difference}%
        </Flex>
        <Text
          fontSize={`${valueSize}px`}
          fontWeight="bold"
          color={STAT_VALUE_COLOR}
          noOfLines={1}
          lineHeight="1.1"
          minW={0}
        >
          {shown}
        </Text>
      </Flex>

      {t.showTs && (
        <Text
          fontSize={`${t.tsSize}px`}
          color={STAT_TIMESTAMP_COLOR}
          textAlign="right"
          noOfLines={1}
          flexShrink={0}
        >
          {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
        </Text>
      )}
    </Flex>
  );
};

export default ValueWithProgressWidget;
