import { Button, Flex, Input, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  statTypography,
  STAT_LABEL_COLOR,
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
  // Only the value gates loading; this widget doesn't use `types` for anything,
  // so a device shape that hasn't resolved must not keep it on "Loading...".
  const loading = rawValue === undefined;
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

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const controlSize = height >= 150 ? "lg" : height >= 90 ? "md" : "sm";

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

      <Flex flex="1" minH={0} alignItems="center" gap={2} overflow="hidden" className="notdraggable">
        {loading ? (
          <Text color={STAT_LABEL_COLOR}>Loading...</Text>
        ) : (
          <>
            <Input
              size={controlSize}
              placeholder={value.value !== "" ? value.value : undefined}
              fontWeight="bold"
              textAlign="right"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button size={controlSize} colorScheme="brand" onClick={() => sendMessage()} flexShrink={0}>
              Send
            </Button>
          </>
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

export default CustomInputWidget;
