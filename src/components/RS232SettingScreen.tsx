import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useRef, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { Store } from "tauri-plugin-store-api";

interface RS232SettingScreenProps {
  validateRs232: (
    port: string,
    dataBits: number,
    stopBits: number,
    parity: number,
    baudRate: number
  ) => Promise<void>;

  setScreen: React.Dispatch<
    React.SetStateAction<
      "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
    >
  >;
}

const RS232SettingScreen: React.FC<RS232SettingScreenProps> = ({
  setScreen,
  validateRs232,
}) => {
  const [portsAv, setPortsAv] = useState<string[]>([]);
  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(0);
  const [baudRate, setBaudRate] = useState(9600);

  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");

  const toast = useToast();
  const toastIdRef = useRef(null);

  const getAllAvailbleComs = () => {
    invoke("get_all_availble_ports")
      .then((message) => {
        setPortsAv(message as string[]);

        /* const store = new Store(".settings.dat");

        store
          .get("port")
          .then((e: any) =>
            typeof e === "string"
              ? setPort(e)
              : e === null
              ? setPort("")
              : setPort(JSON.stringify(e))
          )
          .catch((_e) => setPort("")); */
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    getAllAvailbleComs();

    const store = new Store(".settings.dat");

    store
      .get("dataBits")
      .then((e: any) =>
        typeof e === "string"
          ? setDataBits(parseInt(e))
          : e === null
          ? setDataBits(8)
          : typeof e === "number"
          ? setDataBits(e)
          : setDataBits(8)
      );

    store
      .get("stopBits")
      .then((e: any) =>
        typeof e === "string"
          ? setStopBits(parseInt(e))
          : e === null
          ? setStopBits(1)
          : typeof e === "number"
          ? setStopBits(e)
          : setStopBits(1)
      );

    store
      .get("parity")
      .then((e: any) =>
        typeof e === "string"
          ? setParity(parseInt(e))
          : e === null
          ? setParity(0)
          : typeof e === "number"
          ? setParity(e)
          : setParity(0)
      );

    store
      .get("baudRate")
      .then((e: any) =>
        typeof e === "string"
          ? setBaudRate(parseInt(e))
          : e === null
          ? setBaudRate(9600)
          : typeof e === "number"
          ? setBaudRate(e)
          : setBaudRate(9600)
      );
  }, []);

  return (
    <Flex
      height={"100vh"}
      width="100vw"
      justifyContent={"center"}
      alignItems="center"
      bgColor={"gray.300"}
    >
      <Flex
        width={"500px"}
        maxW="95vw"
        bgColor="white"
        borderRadius={"20px"}
        flexDir="column"
        p="20px"
        color={textColor}
      >
        <Box position="relative" width="100%" height="100%">
          <Heading
            color="gray.800"
            fontSize={["16px", "20px", "24px"]}
            mt="20px"
          >
            Bevestig RS232 settings
          </Heading>
          <Flex alignItems={"center"} mt="20px">
            <Text fontSize={["14px", "17px", "20px"]}>Port:</Text>
            <Flex ml="auto" width={"fit-content"}>
              <Select
                width={"fit-content"}
                mr={2}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                size={size}
              >
                <option value={""}>Select port</option>
                {portsAv.map((e, key) => {
                  return (
                    <option value={e} key={key}>
                      {e}
                    </option>
                  );
                })}
              </Select>

              <IconButton
                size={size}
                icon={<BiRefresh />}
                aria-label="Load available ports"
                onClick={() => {
                  getAllAvailbleComs();
                  if (portsAv.length > 0) setPort(portsAv[0]);
                }}
              />
            </Flex>
          </Flex>

          <Flex alignItems={"center"} mt="10px">
            <Text fontSize={["14px", "17px", "20px"]}>Baud rate:</Text>
            <Select
              size={size}
              ml="auto"
              width={"fit-content"}
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value))}
            >
              <option value={"300"}>300</option>
              <option value={"1200"}>1200</option>
              <option value={"2400"}>2400</option>
              <option value={"4800"}>4800</option>
              <option value={"9600"}>9600</option>
              <option value={"19200"}>19200</option>
              <option value={"38400"}>38400</option>
              <option value={"57600"}>57600</option>
              <option value={"115200"}>115200</option>
            </Select>
          </Flex>

          <Flex alignItems={"center"} mt="10px">
            <Text fontSize={["14px", "17px", "20px"]}>Data bits:</Text>
            <NumberInput
              size={size}
              defaultValue={7}
              min={5}
              max={8}
              width="75px"
              value={dataBits}
              onChange={(e) => setDataBits(parseInt(e))}
              ml="auto"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Flex>

          <Flex alignItems={"center"} mt="10px">
            <Text fontSize={["14px", "17px", "20px"]}>Stop bits:</Text>
            <NumberInput
              size={size}
              defaultValue={1}
              min={1}
              max={2}
              width="75px"
              value={stopBits}
              onChange={(e) => setStopBits(parseInt(e))}
              ml="auto"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Flex>

          <Flex alignItems={"center"} mt="10px">
            <Text fontSize={["14px", "17px", "20px"]}>Parity:</Text>
            <Select
              size={size}
              width={"fit-content"}
              value={parity}
              onChange={(e) => setParity(parseInt(e.target.value))}
              ml="auto"
            >
              <option value={"0"}>None</option>
              <option value={"2"}>Even</option>
              <option value={"1"}>Odd</option>
            </Select>
          </Flex>

          <Flex width="fit-content" marginLeft="auto" mt="20px">
            <Button
              size={size}
              mr="1"
              onClick={() => {
                toast.closeAll();
                setScreen("Initial");
              }}
            >
              Exit
            </Button>
            <Button
              size={size}
              ml="1"
              colorScheme={"twitter"}
              onClick={() =>
                validateRs232(port, dataBits, stopBits, parity, baudRate)
              }
            >
              Volgende
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default RS232SettingScreen;
