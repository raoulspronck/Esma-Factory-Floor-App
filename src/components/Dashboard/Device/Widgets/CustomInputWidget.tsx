import {
  Box,
  Button,
  Flex,
  Input,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { emitter } from "../../../../index";

interface CustomInputWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
  name?: string;
}

const textSizeCalculate = (text: string) => {
  if (text !== undefined) {
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
  }
};

const CustomInputWidget: React.FC<CustomInputWidgetProps> = ({
  deviceId,
  deviceKey,
  dataPoints,
  types,
  small,
  name,
}) => {
  const functionCalled = useRef(false);
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const fetchValue = () => {
    setLoading(true);
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
        } catch (_error) {}

        setLoading(false);
      })
      .catch((_err) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (types[0] !== undefined) {
      if (functionCalled.current === false) {
        functionCalled.current = true;

        emitter.on("refetch", fetchValue);

        fetchValue();

        listen(
          `notification---${deviceKey}---${
            small !== undefined ? dataPoints[small] : dataPoints[0]
          }`,
          (event) => {
            setValue({
              value: event.payload as string,
              time: new Date().toISOString(),
            });
          }
        );
      }
    }
  }, [types]);

  const sendMessage = () => {
    setLoading(true);
    invoke("send_message", {
      deviceKey,
      datapoint: dataPoints[0],
      value: inputValue,
    })
      .then((_e) => {
        setInputValue("");
        setLoading(false);
      })
      .catch((_err) => {
        setLoading(false);
      });
  };

  return (
    <Flex
      width={"100%"}
      pr={3}
      pl={3}
      maxH="80px"
      minH={"80px"}
      flexDir={"column"}
      justifyContent={"center"}
    >
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"16px"}>{dataPoints[0]}</StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"180px"}>
            {loading ? (
              <StatNumber fontSize="20px">Loading...</StatNumber>
            ) : value.value !== undefined && value.value !== "" ? (
              <Flex alignItems={"center"} mt={-1}>
                <Input
                  placeholder={value.value}
                  fontSize={`${textSizeCalculate(value.value) - 5}px`}
                  lineHeight={`${textSizeCalculate(value.value) * 1.2}px`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button ml={2} onClick={() => sendMessage()}>
                  Send
                </Button>
              </Flex>
            ) : (
              <Flex alignItems={"center"} mt={-1}>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button ml={2} onClick={() => sendMessage()}>
                  Send
                </Button>
              </Flex>
            )}
          </Box>
        </Flex>
        <Flex mt={1}>
          <StatHelpText fontSize={"12px"} ml="auto">
            {loading
              ? ""
              : value.value !== "" && value.value !== undefined
              ? formatDate(value.time)
              : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Flex>
  );
};

export default CustomInputWidget;
