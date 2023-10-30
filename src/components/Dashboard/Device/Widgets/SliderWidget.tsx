import {
  Box,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";

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
  deviceId,
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const [slider, setSlider] = useState(50);
  const [loading, setLoading] = useState(true);

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: ["8px", "10px", "12px"],
  };

  useEffect(() => {
    if (!functionCalled.current && types[0] !== undefined) {
      invoke("get_last_value", {
        deviceId,
        deviceKey,
        datapointKey: small !== undefined ? dataPoints[small] : dataPoints[0],
      })
        .then((e: any) => {
          try {
            let valueJson = JSON.parse(e);

            setValue({
              value: valueJson.value,
              time: valueJson.createdAt,
            });
            setSlider(parseInt(valueJson.value));
          } catch (_error) {}

          setLoading(false);
        })
        .catch((_err) => {
          setLoading(false);
        });

      listen(
        `notification---${deviceKey}---${
          small !== undefined ? dataPoints[small] : dataPoints[0]
        }`,
        (event) => {
          setValue({
            value: formatNumberValue(
              event.payload as string,
              small !== undefined ? types[small] : types[0]
            ),
            time: new Date().toISOString(),
          });
        }
      );

      functionCalled.current = true;
    }
  }, [types]);

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
    <Box width={"100%"} pr={5} pl={5} maxH="80px" minH={"80px"}>
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"16px"} width={"fit-content"}>
            {dataPoints[0]}
          </StatLabel>

          <Box width={"100%"} ml={5} mr={0} textAlign={"right"}>
            {loading ? (
              <Text>Loading...</Text>
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
                  mt={["-5", "-6", "-7"]}
                  ml={["-3", "-4", "-5"]}
                  fontSize={["10px", "12px", "14px"]}
                >
                  {slider}%
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb width={["5px", "10px", "15px"]} />
              </Slider>
            )}
          </Box>
        </Flex>
        <Flex mt={3}>
          <StatHelpText fontSize={"12px"} ml="auto">
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default SliderWidget;
