import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  fitFontSize,
  statTypography,
  STAT_LABEL_COLOR,
  STAT_TIMESTAMP_COLOR,
  STAT_VALUE_COLOR,
} from "./widgetTokens";

interface TimePredictionWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
}

const TimePredictionWidget: React.FC<TimePredictionWidgetProps> = ({
  deviceKey,
  dataPoints,
  small,
}) => {
  const idx = small ?? 0;
  const datapointKey = dataPoints[idx];

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  const loading = rawValue === undefined;
  const value = {
    value: loading ? "" : formatNumberValue(rawValue, "TimePrediction"),
    time: time ?? "",
  };

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const shown = loading ? "Loading..." : value.value !== "" ? value.value : "No data";
  const valueSize = fitFontSize(shown, width * 0.92, t.valueArea, { min: 12, max: 72 });

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
          {datapointKey} · prediction
        </Text>
      )}

      <Flex flex="1" minH={0} alignItems="center" justifyContent="center" overflow="hidden">
        <Text
          fontSize={`${valueSize}px`}
          fontWeight="bold"
          color={STAT_VALUE_COLOR}
          noOfLines={1}
          lineHeight="1.1"
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

export default TimePredictionWidget;
