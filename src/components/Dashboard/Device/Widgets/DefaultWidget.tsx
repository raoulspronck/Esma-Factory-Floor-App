import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { formatedDateTime } from "../../../../utils/formatedDateTime";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  fitFontSize,
  statTypography,
  STAT_LABEL_COLOR,
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

const DefaultWidget: React.FC<DefaultWidgetProps> = ({
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const idx = small ?? 0;
  const datapointKey = dataPoints[idx];
  const type = types[idx];

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  // Loading depends only on whether we have a value. `type` is optional
  // formatting metadata from the device shape; if it hasn't resolved yet we
  // still show the raw value (formatNumberValue passes unknown types through)
  // rather than hanging on "Loading..." forever.
  const loading = rawValue === undefined;
  const value = {
    value: loading ? "" : formatNumberValue(rawValue, type),
    time: time ?? "",
  };

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const shown = loading ? "Loading..." : value.value !== "" ? formatValue(value.value, type) : "No data";
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
          {datapointKey}
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

export default DefaultWidget;
