import { Flex, Box, Text, Checkbox, LightMode } from "@chakra-ui/react";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import SerialLine from "../components/serialLine";

interface RS232MonitorProps {
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const RS232Monitor: React.FC<RS232MonitorProps> = ({ setError }) => {
  const functionCalled = useRef(false);
  const autoScroll = useRef(true);
  const [checkBox, setCheckBox] = useState(autoScroll.current);
  const endOfDiv = useRef(null);
  const [serialInput, setSerialInput] = useState<
    { time: string; message: string; hex: string }[]
  >([]);

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;

      listen("rs232", (event) => {
        setError("");

        const json = JSON.parse(event.payload as string);

        setSerialInput((e) => [
          ...e,
          {
            time: new Date().toISOString(),
            message: json.message,
            hex: json.decimal,
          },
        ]);

        if (endOfDiv.current != null && autoScroll.current) {
          endOfDiv.current.scrollIntoView();
        }
      });
    }
  }, []);

  return (
    <Box height={"100% "} bg="black">
      <Flex
        justifyContent={"center"}
        height="50px"
        bgColor={"gray.100"}
        alignItems={"center"}
        color="white"
      >
        <Text fontSize={"22px"} mr={3} color="gray.800">
          Direct Rs-232 communicatie
        </Text>

        <Box
          mr={[1, 2]}
          ml={[1, 2]}
          height={["60%", "70%", "80%"]}
          width={"1px"}
          backgroundColor={"blackAlpha.800"}
        />

        <LightMode>
          <Checkbox
            isChecked={checkBox}
            onChange={(e) => {
              autoScroll.current = e.target.checked;
              setCheckBox(e.target.checked);
            }}
            borderColor="gray.400"
          >
            <Text
              fontSize={["12px", "12px", "15px"]}
              fontWeight="medium"
              color="gray.800"
            >
              Auto scroll
            </Text>
          </Checkbox>
        </LightMode>
      </Flex>

      <Box
        height={"calc(100% - 50px)"}
        width="100%"
        bgColor="#141414"
        overflowX={"hidden"}
        overflowY="auto"
        paddingBottom={"30px"}
        userSelect="none"
      >
        {serialInput.map((item, key) => (
          <SerialLine item={item} key={key} />
        ))}
        <div ref={endOfDiv} style={{ marginTop: "100px" }}></div>
      </Box>
    </Box>
  );
};

export default RS232Monitor;