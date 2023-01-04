import {
  Button,
  Flex,
  Icon,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen, emit } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { BiErrorAlt, BiRefresh } from "react-icons/bi";

interface Rs232ScreenProps {}

const Rs232Screen: React.FC<Rs232ScreenProps> = ({}) => {
  const [messages, setMessages] = useState<{ time: string; message: string }[]>(
    []
  );

  const [error, setError] = useState("");

  const functionCalled = React.useRef(false);

  const endOfDiv = React.useRef(null);

  const [portsAv, setPortsAv] = useState<string[]>([]);

  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(7);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(2);
  const [baudRate, setBaudRate] = useState(9600);

  const getAllAvailbleComs = () => {
    invoke("get_all_availble_ports")
      .then((message) => {
        setPortsAv(message as string[]);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    getAllAvailbleComs();

    if (portsAv.length > 0) {
      setPort(portsAv[0]);
    }

    if (!functionCalled.current) {
      functionCalled.current = true;
      listen("rs232", (event) => {
        setError("");

        setMessages((e) => [
          ...e,
          { time: new Date().toISOString(), message: event.payload as string },
        ]);

        if (endOfDiv.current != null) {
          endOfDiv.current.scrollIntoView({ behavior: "smooth" });
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

  return (
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
        <Flex alignItems={"center"} mr={2} ml={2}>
          <Text mr={2}>Port:</Text>
          <Select
            width={"fit-content"}
            mr={2}
            value={port}
            onChange={(e) => setPort(e.target.value)}
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
            icon={<BiRefresh />}
            aria-label="Load available ports"
            onClick={() => getAllAvailbleComs()}
          />
        </Flex>

        <Flex alignItems={"center"} mr={2}>
          <Text mr={2}>Baud rate:</Text>
          <Select
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

        <Flex alignItems={"center"} mr={2}>
          <Text mr={2}>Data bits:</Text>
          <NumberInput
            defaultValue={7}
            min={5}
            max={8}
            width="75px"
            value={dataBits}
            onChange={(e) => setDataBits(parseInt(e))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Flex>

        <Flex alignItems={"center"} mr={2}>
          <Text mr={2}>Stop bits:</Text>
          <NumberInput
            defaultValue={1}
            min={1}
            max={2}
            width="75px"
            value={stopBits}
            onChange={(e) => setStopBits(parseInt(e))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Flex>

        <Flex alignItems={"center"}>
          <Text mr={2}>Parity:</Text>
          <Select
            width={"fit-content"}
            value={parity}
            onChange={(e) => setParity(parseInt(e.target.value))}
          >
            <option value={"0"}>None</option>
            <option value={"2"}>Even</option>
            <option value={"1"}>Odd</option>
          </Select>
        </Flex>

        <Button
          colorScheme={"twitter"}
          ml="auto"
          mr="2"
          onClick={() =>
            /* emit('event-name', {
              portName: port,
              baudRate: 9600,
              dataBitsNumber: 7,
              parityString: 2,
              stopBitsNumber: 1,
            }) */

            invoke("start_rs232", {
              portName: port,
              baudRate: 9600,
              dataBitsNumber: dataBits,
              parityString: parity,
              stopBitsNumber: stopBits,
            }).catch((e) => console.log(e))
          }
        >
          Save
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
              <Icon as={BiErrorAlt} color="white" fontSize={"24px"} mr={1} />
              <Text color={"white"} ml={1}>
                {error}
              </Text>
            </Flex>
          </Flex>
        ) : null}

        <div ref={endOfDiv} style={{ marginTop: "50px" }}></div>
      </Flex>
    </Flex>
  );
};

export default Rs232Screen;
