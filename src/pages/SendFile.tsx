import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightAddon,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import * as Dialog from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { GoFileDirectory } from "react-icons/go";
import { Store } from "tauri-plugin-store-api";
import RS232SettingScreen from "../components/RS232SettingScreen";

interface SendFileProps {
  setScreen: React.Dispatch<
    React.SetStateAction<
      "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
    >
  >;
}

const SendFile: React.FC<SendFileProps> = ({ setScreen }) => {
  const toast = useToast();

  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");

  const [messages, setMessages] = useState<{ time: string; message: string }[]>(
    []
  );

  const endOfDiv = React.useRef(null);

  const [filePath, setFilePath] = useState("");
  const [filePathFile, setFilePathFile] = useState("");

  const [rs232Set, setRs232Set] = useState(false);

  const [fileSet, setFileSet] = useState(false);

  const functionCalled = React.useRef(false);

  useEffect(() => {
    const store = new Store(".settings.dat");

    store
      .get("file-path-file")
      .then((e: any) =>
        typeof e === "string"
          ? setFilePathFile(e)
          : e === null
          ? setFilePathFile("")
          : setFilePathFile(JSON.stringify(e))
      );

    store
      .get("file-path")
      .then((e: any) =>
        typeof e === "string"
          ? setFilePath(e)
          : e === null
          ? setFilePath("")
          : setFilePath(JSON.stringify(e))
      );

    if (!functionCalled.current) {
      functionCalled.current = true;
      listen("rs232", (event) => {
        setMessages((e) => [
          ...e,
          { time: new Date().toISOString(), message: event.payload as string },
        ]);

        if (endOfDiv.current != null) {
          endOfDiv.current.scrollIntoView();
        }
      });
    }
  }, []);

  const validatePath = async () => {
    if (filePath != "") {
      const store = new Store(".settings.dat");

      await store.set("file-path", filePath);

      await store.set("file-path-file", filePathFile);

      await store.save();

      setFileSet(true);
    }
  };

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

      invoke("start_file_send", {
        filePath: filePathFile,
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
      {!fileSet ? (
        <Flex
          height={"100vh"}
          width="100vw"
          justifyContent={"center"}
          alignItems="center"
          bgColor={"gray.300"}
        >
          <Flex
            width={"700px"}
            maxW="95vw"
            bgColor="white"
            borderRadius={"20px"}
            flexDir="column"
            p="20px"
          >
            <Heading
              color="gray.800"
              fontSize={["16px", "20px", "24px"]}
              mt="20px"
            >
              Open bestand
            </Heading>

            <Box mt={3}>
              <FormControl fontSize={["sm", "md", "lg"]}>
                <Flex alignItems="center">
                  <FormLabel color={textColor} fontSize={["sm", "md", "lg"]}>
                    Select file-path
                  </FormLabel>
                </Flex>

                <InputGroup size={size}>
                  <Input
                    color={textColor}
                    fontSize={["sm", "md", "lg"]}
                    readOnly
                    value={filePathFile}
                  />
                  <InputRightAddon
                    cursor="pointer"
                    onClick={() => {
                      Dialog.open({
                        defaultPath: filePath === "" ? undefined : filePath,
                        directory: false,
                        multiple: false,
                        filters: [
                          {
                            name: ".txt",
                            extensions: ["txt"],
                          },
                        ],
                      })
                        .then((e) => {
                          if (e != null) {
                            const pathToFile = e as string;

                            setFilePathFile(pathToFile);
                            setFilePath(
                              pathToFile.substring(
                                0,
                                pathToFile.lastIndexOf("\\")
                              )
                            );
                          }
                        })
                        .catch((e) => console.log("error", e));
                    }}
                    children={<Icon as={GoFileDirectory} />}
                  />
                </InputGroup>
              </FormControl>
            </Box>
            <Flex width="fit-content" ml="auto" mt="20px">
              <Button
                mr="1"
                onClick={() => {
                  toast.closeAll();
                  setScreen("Initial");
                }}
                size={size}
              >
                Exit
              </Button>
              <Button
                ml="1"
                colorScheme={"twitter"}
                size={size}
                onClick={() => validatePath()}
              >
                Volgende
              </Button>
            </Flex>
          </Flex>
        </Flex>
      ) : !rs232Set ? (
        <RS232SettingScreen
          validateRs232={validateRs232}
          setScreen={setScreen}
        />
      ) : (
        <Flex
          height={"100vh"}
          width="100vw"
          justifyContent={"center"}
          alignItems="center"
          bgColor={"gray.300"}
          textColor={textColor}
        >
          <Flex
            width={"1200px"}
            maxW="95vw"
            bgColor="white"
            borderRadius={"20px"}
            flexDir="column"
            p="20px"
          >
            <Heading
              color="gray.800"
              fontSize={["16px", "20px", "24px"]}
              mt="20px"
            >
              Sending file...
            </Heading>
            <Text mt="10px" fontSize={["sm", "md", "lg"]}>
              {filePath}
            </Text>
            <Box
              mt="30px"
              width={"100%"}
              bg="gray.200"
              height="400px"
              maxH={"400px"}
              overflowX={"hidden"}
              borderRadius={"10px"}
              p="5"
            >
              {messages.length > 0 ? (
                messages.map((e, key) => {
                  return (
                    <Text
                      key={key}
                      fontSize={["14px", "16px", "18px"]}
                      ml={2}
                      fontWeight="semibold"
                    >
                      {e.message}
                    </Text>
                  );
                })
              ) : (
                <Text>Nothing send yet...</Text>
              )}
              <div ref={endOfDiv} style={{ marginTop: "50px" }}></div>
            </Box>

            <Flex width="fit-content" ml="auto" mt="20px">
              <Button ml="1" colorScheme={"red"} size={size}>
                Stop
              </Button>

              {messages.length > 0 ? (
                <Button
                  ml="1"
                  colorScheme={"green"}
                  size={size}
                  onClick={() => {
                    invoke("stop_rs232")
                      .then((e) => setScreen("Initial"))
                      .catch((e) => setScreen("Initial"));
                  }}
                >
                  Done
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default SendFile;
