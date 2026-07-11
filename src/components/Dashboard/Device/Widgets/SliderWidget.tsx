import {
  Box,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stat,
  StatHelpText,
  StatLabel,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { STAT_DIVIDER, STAT_LABEL_COLOR, STAT_ROW_MIN_H, STAT_TIMESTAMP_COLOR } from "./widgetTokens";

interface SliderWidgetProps {
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

const SliderWidget: React.FC<SliderWidgetProps> = ({
  deviceKey,
  dataPoints,
  small,
}) => {
  const datapointKey = small !== undefined ? dataPoints[small] : dataPoints[0];

  const rawValue = useDeviceValue(deviceKey, datapointKey);
  const time = useDeviceValueTimestamp(deviceKey, datapointKey);
  const loading = rawValue === undefined;
  const value = {
    value: loading ? "" : rawValue,
    time: time ?? "",
  };

  const [slider, setSlider] = useState(0);

  // Resync the slider position whenever the underlying value changes
  // (initial hydration, a live push, or a manual refetch) - but not during
  // an in-progress local drag, since that only calls setSlider directly.
  useEffect(() => {
    if (rawValue !== undefined) {
      setSlider(parseInt(rawValue));
    }
  }, [rawValue]);

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    color: STAT_TIMESTAMP_COLOR,
    fontSize: ["10px", "12px", "14px"],
  };

  const send = (val: number) => {
    invoke("send_message", {
      deviceKey,
      datapoint: dataPoints[0],
      value: val.toString(),
    })
      .then()
      .catch();
  };

  return (
    <Box width={"100%"} pr={6} pl={6} maxH={STAT_ROW_MIN_H} minH={STAT_ROW_MIN_H} {...STAT_DIVIDER}>
      <Stat height="100%" display="flex" flexDir="column" justifyContent="center">
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"17px"} fontWeight="medium" color={STAT_LABEL_COLOR} width={"fit-content"} noOfLines={1} flexShrink={0}>
            {dataPoints[0]}
          </StatLabel>

          <Box width={"100%"} ml={5} mr={0} textAlign={"right"}>
            {loading ? (
              <Text color={STAT_LABEL_COLOR}>Loading...</Text>
            ) : (
              <Slider
                aria-label="slider-ex-6"
                onChangeEnd={(val) => send(val)}
                width={"100%"}
                mt={4}
                onChange={(val) => setSlider(val)}
                value={slider}
              >
                <SliderMark value={25} {...labelStyles}>
                  25%
                </SliderMark>
                <SliderMark value={50} {...labelStyles}>
                  50%
                </SliderMark>
                <SliderMark value={75} {...labelStyles}>
                  75%
                </SliderMark>
                <SliderMark
                  value={slider}
                  textAlign="center"
                  color={"white"}
                  fontWeight="bold"
                  mt={["-6", "-7", "-8"]}
                  ml={["-4", "-5", "-6"]}
                  fontSize={["14px", "16px", "18px"]}
                >
                  {slider}%
                </SliderMark>
                <SliderTrack height="8px" borderRadius="full" bg="whiteAlpha.200">
                  <SliderFilledTrack bg="brand.400" />
                </SliderTrack>
                <SliderThumb boxSize="26px" />
              </Slider>
            )}
          </Box>
        </Flex>
        <Flex mt={3}>
          <StatHelpText fontSize={"11px"} color={STAT_TIMESTAMP_COLOR} ml="auto" mb={0}>
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default SliderWidget;
