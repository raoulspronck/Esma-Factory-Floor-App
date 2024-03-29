import { Box, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { emitter } from "../../../../index";

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

const TimerWidget: React.FC<TimerWidgetProps> = ({
  deviceId,
  dataPoints,
  deviceKey,
}) => {
  const [value, setValue] = useState("");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const alreadyFetched = useRef(false);

  const fetchValue = () => {
    setLoading(true);
    invoke("get_last_value", {
      deviceId,
      deviceKey,
      datapointKey: dataPoints[0],
    })
      .then((e: any) => {
        try {
          let valueJson = JSON.parse(e);

          setValue(valueJson.value as string);

          const oldTime = new Date(valueJson.createdAt).getTime();
          const newTime = new Date().getTime();

          const difference = newTime - oldTime;
          setTimer(difference);
          setLoading(false);

          setInterval(() => {
            setTimer((i) => i + 1000);
          }, 1000);
        } catch (_error) {
          setLoading(false);
        }
      })
      .catch((_err) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (alreadyFetched.current === false) {
      alreadyFetched.current = true;

      emitter.on("refetch", fetchValue);

      fetchValue();

      listen(`notification---${deviceKey}---${dataPoints[0]}`, (event) => {
        setValue(event.payload as string);
        setTimer(0);
      });
    }
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
            ? "gray.500"
            : value.toLowerCase() === "run" ||
              value.toLowerCase() === "herstart"
            ? "green.400"
            : value.toLowerCase() === "pauze"
            ? "orange.400"
            : "red.400"
        }
        pr="10px"
      >
        <Text fontSize={"40px"}>
          {loading ? null : convertSecondsToHhMmSs({ time: timer })}
        </Text>
        <Text fontSize={"30px"} mt={"-10px"}>
          {loading ? "Loading..." : value !== "" ? value : "No data"}
        </Text>
      </Box>
    </Box>
  );
};

export default TimerWidget;
