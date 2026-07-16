import { Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { useElementSize } from "../../../../hooks/useElementSize";
import { fitFontSize, scaleFont, STATUS_COLOR } from "./widgetTokens";

function convertSecondsToHhMmSs({ time }: { time: number }): string {
  var negative = time < 0 ? true : false;

  time = Math.abs(time);

  var secondsNum = Math.floor((time / 1000) % 60);
  var minutesNum = Math.floor((time / (1000 * 60)) % 60);
  var hoursNum = Math.floor(time / (1000 * 60 * 60));

  var hours = hoursNum < 10 ? "0" + hoursNum : hoursNum.toString();
  var minutes = minutesNum < 10 ? "0" + minutesNum : minutesNum.toString();
  var seconds = secondsNum < 10 ? "0" + secondsNum : secondsNum.toString();

  if (negative) {
    return "-" + hours + ":" + minutes + ":" + seconds;
  }

  return hours + ":" + minutes + ":" + seconds;
}

interface TimerWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ dataPoints, deviceKey }) => {
  const rawValue = useDeviceValue(deviceKey, dataPoints[0]);
  const time = useDeviceValueTimestamp(deviceKey, dataPoints[0]);
  const loading = rawValue === undefined || time === undefined;
  const value = rawValue ?? "";

  const [timer, setTimer] = useState(0);

  // Re-baseline elapsed time whenever the underlying value changes (initial
  // hydration, a live push, or a manual refetch).
  useEffect(() => {
    if (time === undefined) return;
    setTimer(Date.now() - new Date(time).getTime());
  }, [time]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((i) => i + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [rootRef, { width, height }] = useElementSize<HTMLDivElement>();
  const timeText = convertSecondsToHhMmSs({ time: timer });
  const timeSize = fitFontSize(timeText, width * 0.9, height * 0.42, { min: 16, max: 64 });
  const statusSize = scaleFont(height, 0.2, 12, 32);

  // The status color fills the whole cell so machine state is readable from
  // across the floor.
  return (
    <Flex
      ref={rootRef}
      width={"100%"}
      height="100%"
      flexDir="column"
      alignItems="flex-end"
      justifyContent="center"
      color="white"
      backgroundColor={
        loading
          ? STATUS_COLOR.idle
          : value.toLowerCase() === "run" || value.toLowerCase() === "herstart"
          ? STATUS_COLOR.run
          : value.toLowerCase() === "pauze"
          ? STATUS_COLOR.pause
          : STATUS_COLOR.stop
      }
      px={4}
    >
      <Text
        fontSize={`${timeSize}px`}
        fontWeight="extrabold"
        lineHeight="1"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {loading ? null : timeText}
      </Text>
      <Text
        fontSize={`${statusSize}px`}
        fontWeight="bold"
        letterSpacing="wide"
        textTransform="uppercase"
        mt={1}
        noOfLines={1}
        maxW="100%"
      >
        {loading ? "Loading..." : value !== "" ? value : "No data"}
      </Text>
    </Flex>
  );
};

export default TimerWidget;
