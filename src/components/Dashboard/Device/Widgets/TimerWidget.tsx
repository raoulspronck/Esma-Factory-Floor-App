import { Box, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useDeviceValue, useDeviceValueTimestamp } from "../../../../hooks/useDeviceValue";
import { STATUS_COLOR } from "./widgetTokens";

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

  return (
    <Box width={"100%"}>
      <Box
        ml="auto"
        width={"100%"}
        textAlign="right"
        color="white"
        backgroundColor={
          loading
            ? STATUS_COLOR.idle
            : value.toLowerCase() === "run" ||
              value.toLowerCase() === "herstart"
            ? STATUS_COLOR.run
            : value.toLowerCase() === "pauze"
            ? STATUS_COLOR.pause
            : STATUS_COLOR.stop
        }
        borderBottomRadius="19px"
        py="16px"
        px="24px"
      >
        <Text
          fontSize={"58px"}
          fontWeight="extrabold"
          lineHeight="1"
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {loading ? null : convertSecondsToHhMmSs({ time: timer })}
        </Text>
        <Text
          fontSize={"30px"}
          fontWeight="bold"
          letterSpacing="wide"
          textTransform="uppercase"
          mt={1}
        >
          {loading ? "Loading..." : value !== "" ? value : "No data"}
        </Text>
      </Box>
    </Box>
  );
};

export default TimerWidget;
