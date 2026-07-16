import { Flex, Switch, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";
import { formatDate } from "../../../../utils/formatDate";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  fitFontSize,
  statTypography,
  STAT_LABEL_COLOR,
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

const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  deviceKey,
  dataPoints,
  small,
  name,
}) => {
  const idx = small ?? 0;
  const datapointKey = dataPoints[idx];

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

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const shown = loading ? "Loading..." : value.value !== "" ? value.value.toUpperCase() : "No data";
  // Leave room for the switch control next to the value.
  const valueSize = fitFontSize(shown, width * 0.55, t.valueArea, { min: 12, max: 52 });

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
          {name && name !== "" ? name : datapointKey}
        </Text>
      )}

      <Flex flex="1" minH={0} alignItems="center" justifyContent="center" gap={3} overflow="hidden">
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
        {!loading && value.value !== "" && (
          <Switch
            size={height >= 120 ? "lg" : "md"}
            isChecked={small !== undefined ? value.value !== "on" : value.value === "on"}
            onChange={switchChanged}
            className="notdraggable"
            flexShrink={0}
          />
        )}
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

export default SwitchWidget;
