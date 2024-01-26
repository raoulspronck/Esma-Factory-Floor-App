import {
  Box,
  Flex,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { formatDate } from "../../../../utils/formatDate";
import { formatNumberValue } from "../../../../utils/formatValue";
import { emitter } from "../../../../index";

interface DefaultWidgetProps {
  deviceId: string;
  deviceKey: string;
  dataPoints: string[];
  types: string[];
  small?: number;
}

const textSizeCalculate = (text: string) => {
  if (text === undefined) {
    return 30;
  }

  if (text.length < 6) {
    return 35;
  } else if (text.length < 11) {
    return 32;
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

const DefaultWidget: React.FC<DefaultWidgetProps> = ({
  deviceId,
  deviceKey,
  dataPoints,
  types,
  small,
}) => {
  const [value, setValue] = useState({
    value: "",
    time: "",
  });
  const [loading, setLoading] = useState(true);
  const alreadyFetched = useRef(false);

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
            value: formatNumberValue(
              valueJson.value,
              small !== undefined ? types[small] : types[0]
            ),
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
    if (
      small !== undefined ? types[small] !== undefined : types[0] !== undefined
    ) {
      if (alreadyFetched.current === false) {
        alreadyFetched.current = true;

        emitter.on("refetch", fetchValue);

        fetchValue();

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
      }
    }
  }, [types]);

  if (small !== undefined) {
    return (
      <Box width={"100%"} pr={3} pl={3} maxH="80px" minH={"80px"}>
        <Stat>
          <Flex
            alignItems={"start"}
            flexDir={"column"}
            maxH="80px"
            height={"80px"}
            position={"relative"}
          >
            <StatLabel fontSize={"13px"}>{dataPoints[small]}</StatLabel>

            {loading ? (
              <StatNumber fontSize="20px">Loading...</StatNumber>
            ) : value.value !== "" ? (
              <StatNumber
                fontSize={`${textSizeCalculate(value.value) - 5}px`}
                //lineHeight={`${textSizeCalculate(value.value) * 1.2}px`}
                textOverflow="ellipsis"
                wordBreak={"break-word"}
                whiteSpace={"break-spaces"}
                mt={-1}
              >
                {value.value}
              </StatNumber>
            ) : (
              <StatNumber fontSize="20px">No data</StatNumber>
            )}
            <StatHelpText fontSize={"10px"} position={"absolute"} bottom={0}>
              {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
            </StatHelpText>
          </Flex>
        </Stat>
      </Box>
    );
  }

  return (
    <Box width={"100%"} pr={5} pl={5} maxH="80px" minH={"80px"}>
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"16px"}>{dataPoints[0]}</StatLabel>

          <Box ml="auto" textAlign={"right"} maxWidth={"180px"}>
            {loading ? (
              <StatNumber fontSize="30px">Loading...</StatNumber>
            ) : value.value !== "" ? (
              <StatNumber
                fontSize={`${textSizeCalculate(value.value)}px`}
                lineHeight={`${textSizeCalculate(value.value) * 1.2}px`}
                textOverflow="ellipsis"
                wordBreak={"break-word"}
                whiteSpace={"break-spaces"}
              >
                {value.value}
              </StatNumber>
            ) : (
              <StatNumber fontSize="30px">No data</StatNumber>
            )}
          </Box>
        </Flex>
        <Flex mt={1}>
          <StatHelpText fontSize={"12px"} ml="auto">
            {loading ? "" : value.value !== "" ? formatDate(value.time) : ""}
          </StatHelpText>
        </Flex>
      </Stat>
    </Box>
  );
};

export default DefaultWidget;
