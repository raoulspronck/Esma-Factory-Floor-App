import {
  Button,
  Flex,
  Icon,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { BiErrorAlt } from "react-icons/bi";
import { Store } from "tauri-plugin-store-api";
import RS232SettingScreen from "../components/RS232SettingScreen";

interface MonitorScreenProps {
  setScreen: React.Dispatch<
    React.SetStateAction<
      "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
    >
  >;
}

const MonitorScreen: React.FC<MonitorScreenProps> = ({ setScreen }) => {
  const [messages, setMessages] = useState<{ time: string; message: string }[]>(
    []
  );

  const [error, setError] = useState("");

  const functionCalled = React.useRef(false);
  const endOfDiv = React.useRef(null);

  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");

  const [rs232Set, setRs232Set] = useState(false);

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;
      listen("rs232", (event) => {
        setError("");

        setMessages((e) => [
          ...e,
          { time: new Date().toISOString(), message: event.payload as string },
        ]);

        if (endOfDiv.current != null) {
          endOfDiv.current.scrollIntoView();
        }
      });

      listen("rs232-error", (event) => {
        setError(event.payload as string);

        if (endOfDiv.current != null) {
          endOfDiv.current.scrollIntoView();
        }
      });
    }
  }, []);

  const validateRs232 = async (
    port: string,
    dataBits: number,
    stopBits: number,
    parity: number,
    baudRate: number
  ) => {
    if (port != "") {
      const store = new Store(".settings.dat");
      await store.set("port", port);
      await store.set("dataBits", dataBits);
      await store.set("stopBits", stopBits);
      await store.set("parity", parity);
      await store.set("baudRate", baudRate);
      await store.save();

      invoke("start_rs232", {
        portName: port,
        baudRate: baudRate,
        dataBitsNumber: dataBits,
        parityString: parity,
        stopBitsNumber: stopBits,
      })
        .then(() => setRs232Set(true))
        .catch((e) => console.log(e));
    }
  };

  return (
    <>
      {!rs232Set ? (
        <RS232SettingScreen
          validateRs232={validateRs232}
          setScreen={setScreen}
        />
      ) : (
        <Flex
          flexDir={"column"}
          borderColor={"gray.400"}
          position={"relative"}
          overflowX={"hidden"}
        >
          <Flex
            position={"fixed"}
            top={0}
            left={0}
            width="100%"
            alignItems={"center"}
            boxShadow={`0 1px 15px -5px gray`}
            height="75px"
            bgColor={"white"}
          >
            <Text ml="2" fontSize={["22px"]}>
              Raw Monitor
            </Text>

            <Button
              ml="auto"
              mr="3"
              size={buttonSize}
              colorScheme={"twitter"}
              onClick={() => {
                invoke("stop_rs232")
                  .then(() => setRs232Set(false))
                  .catch((e) => console.log(e));
              }}
            >
              Change settings
            </Button>
            <Button
              mr="3"
              size={buttonSize}
              colorScheme={"twitter"}
              onClick={() => {
                invoke("stop_rs232");
                setScreen("Initial");
              }}
            >
              Stop
            </Button>
          </Flex>
          <Flex
            mt="75px"
            overflowX={"hidden"}
            height={"calc(100vh - 75px)"}
            maxH={"calc(100vh - 75px)"}
            flexDir={"column"}
            p="5"
            width={"100%"}
          >
            {messages.map((e, key) => {
              return (
                <Flex key={key} alignItems="center">
                  <Text fontSize={["12px", "14px", "16px"]} mr={2}>
                    {e.time}
                  </Text>
                  <Text
                    fontSize={["14px", "16px", "18px"]}
                    ml={2}
                    fontWeight="semibold"
                  >
                    {e.message}
                  </Text>
                </Flex>
              );
            })}

            {error != "" ? (
              <Flex
                justifyContent={"center"}
                height="50px"
                position={"absolute"}
                bottom={0}
                width="100%"
              >
                <Flex
                  width={"fit-content"}
                  justifyContent="center"
                  alignItems={"center"}
                  p={5}
                  borderRadius={10}
                  height="35px"
                  bgColor="red.500"
                >
                  <Icon
                    as={BiErrorAlt}
                    color="white"
                    fontSize={"24px"}
                    mr={1}
                  />
                  <Text color={"white"} ml={1}>
                    {error}
                  </Text>
                </Flex>
              </Flex>
            ) : null}

            <div ref={endOfDiv} style={{ marginTop: "50px" }}></div>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default MonitorScreen;
