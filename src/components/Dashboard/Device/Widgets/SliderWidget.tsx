import {
  Box,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  scaleFont,
  statTypography,
  STAT_LABEL_COLOR,
  STAT_TIMESTAMP_COLOR,
} from "./widgetTokens";

interface SliderWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
}

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

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const t = statTypography(width, height);
  const markSize = scaleFont(height, 0.09, 9, 12);
  const currentSize = scaleFont(height, 0.14, 12, 18);
  const showMarks = height >= 96;

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    color: STAT_TIMESTAMP_COLOR,
    fontSize: `${markSize}px`,
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
    <Flex
      ref={rootRef}
      flexDir="column"
      width="100%"
      height="100%"
      px={4}
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

      <Flex flex="1" minH={0} alignItems="center" overflow="hidden" className="notdraggable">
        {loading ? (
          <Text color={STAT_LABEL_COLOR}>Loading...</Text>
        ) : (
          <Box width="100%" px={2}>
            <Slider
              aria-label="datapoint-slider"
              onChangeEnd={(val) => send(val)}
              width={"100%"}
              onChange={(val) => setSlider(val)}
              value={slider}
            >
              {showMarks && (
                <>
                  <SliderMark value={25} {...labelStyles}>
                    25%
                  </SliderMark>
                  <SliderMark value={50} {...labelStyles}>
                    50%
                  </SliderMark>
                  <SliderMark value={75} {...labelStyles}>
                    75%
                  </SliderMark>
                </>
              )}
              <SliderMark
                value={slider}
                textAlign="center"
                color={"white"}
                fontWeight="bold"
                mt={`-${currentSize + 18}px`}
                ml={`-${currentSize}px`}
                fontSize={`${currentSize}px`}
              >
                {slider}%
              </SliderMark>
              <SliderTrack height="8px" borderRadius="full" bg="whiteAlpha.200">
                <SliderFilledTrack bg="brand.400" />
              </SliderTrack>
              <SliderThumb boxSize={height >= 120 ? "26px" : "18px"} />
            </Slider>
          </Box>
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

export default SliderWidget;
