import {
  Box,
  Flex,
  Icon,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Text,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import Hotkeys from "react-hot-keys";
import { AiOutlineCloudUpload, AiOutlineUsb } from "react-icons/ai";
import { BiExport, BiImport, BiSave } from "react-icons/bi";
import { Store } from "tauri-plugin-store-api";
import ExaliseSettingModal from "./components/exaliseSettingModal";
import ExaliseSettingTaskbar from "./components/exaliseSettingTaskbar";
import MainTaskBar from "./components/mainTaskbar";
import ReceiveFileModal from "./components/receiveFileModel";
import ReceiveFileTaskbar from "./components/receiveFileTaskBar";
import SaveInputModal from "./components/saveInputModal";
import SendFileModal from "./components/sendFileModal";
import SendFileTaskBar from "./components/sendFileTaskBar";
import SerialLine from "./components/serialLine";
import SerialPortSettingModal from "./components/serialPortSettingModal";
import SerialPortSettingTaskBar from "./components/serialPortSettingTaskBar";
import useWindowSize from "./utils/useWindowSize";

function App() {
  const {
    isOpen: isOpenSendFile,
    onOpen: onOpenSendFile,
    onClose: onCloseSendFile,
  } = useDisclosure();

  const {
    isOpen: isOpenReceiveFile,
    onOpen: onOpenReceiveFile,
    onClose: onCloseReceiveFile,
  } = useDisclosure();

  const {
    isOpen: isOpenSaveInput,
    onOpen: onOpenSaveInput,
    onClose: onCloseSaveInput,
  } = useDisclosure();

  const {
    isOpen: isOpenSerialSettings,
    onOpen: onOpenSerialSettings,
    onClose: onCloseSerialSettings,
  } = useDisclosure();

  const {
    isOpen: isOpenExaliseSettings,
    onOpen: onOpenExaliseSettings,
    onClose: onCloseExaliseSettings,
  } = useDisclosure();

  const [taskbarView, setTaskbarView] = useState<string[]>(["serial"]);

  const taskbarHeight = useBreakpointValue([35, 40, 50]);
  const serialTaskbarHeight = useBreakpointValue([70, 80, 50]);
  const exaliseTaskbarHeight = useBreakpointValue([105, 80, 50]);
  const errorHeight = useBreakpointValue([40, 50, 60]);

  const [serialInput, setSerialInput] = useState<
    { time: string; message: string; hex: string }[]
  >([]);

  const [error, setError] = useState("");
  const functionCalled = useRef(false);
  const endOfDiv = useRef(null);

  const { height } = useWindowSize();

  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(0);
  const [baudRate, setBaudRate] = useState(9600);

  const [mqttKey, setMqttKey] = useState("");
  const [mqttSecret, setMqttSecret] = useState("");
  const [deviceKey, setDeviceKey] = useState("");

  const [TrheadStarted, setTrheadStarted] = useState(false);
  const [localThreadStarted, setlocalThreadStarted] = useState(false);

  const [exaliseConn, setExaliseConn] = useState(false);

  const [exaliseStatus, setExaliseStatus] = useState("disconnected");

  const autoScroll = useRef(true);

  const [fileSend, setFileSend] = useState(false);
  const [fileReceive, setFileReceive] = useState(false);

  const [fileSendStatus, setFileSendStatus] = useState("");
  const [fileSendProgress, setFileProgress] = useState("");

  const handleKeyPressed = (e: string) => {
    switch (e) {
      case "ctrl+s":
        onOpenSaveInput();
        break;

      case "ctrl+t":
        onOpenSendFile();
        break;

      case "ctrl+r":
        onOpenReceiveFile();
        break;

      case "ctrl+p":
        onOpenSerialSettings();
        break;

      case "ctrl+e":
        onOpenExaliseSettings();
        break;
    }
  };

  const StartFileSending = async (
    filePath: string,
    enableBreaks: number,
    maxChar: number,
    delay: number,
    listenCnc: number,
    stopChar: number,
    restartChar: number
  ): Promise<string> => {
    if (TrheadStarted) {
      return "Stop het rs232 monitoren alvorens een bestand te versturen";
    } else {
      return await new Promise((res) =>
        invoke("start_file_send", {
          portName: port,
          baudRate: baudRate,
          dataBitsNumber: dataBits,
          parityString: parity,
          stopBitsNumber: stopBits,
          filePath,
          sendInPieces: enableBreaks,
          maxChar,
          delay,
          listenCnc,
          stopChar,
          restartChar,
        })
          .then((_e) => res("oke"))
          .catch((e) => {
            res(e);
          })
      );
    }
  };

  const StartFileReceiving = async (
    filePath: string,
    startDecimal: number,
    stopDecimal: number,
    forbiddenDecimals: number[]
  ): Promise<string> => {
    if (TrheadStarted) {
      return "Stop het rs232 monitoren alvorens een bestand te kunnen ontvangen";
    } else {
      return await new Promise((res) =>
        invoke("start_file_receive", {
          portName: port,
          baudRate: baudRate,
          dataBitsNumber: dataBits,
          parityString: parity,
          stopBitsNumber: stopBits,
          filePath,
          startDecimal,
          stopDecimal,
          forbiddenDecimals,
        })
          .then((_e) => res("oke"))
          .catch((e) => {
            res(e);
          })
      );
    }
  };

  const restartRs232Monitoring = () => {
    if (TrheadStarted) {
      invoke("stop_rs232");
    } else {
      if (exaliseConn) {
        invoke("start_rs232_with_exalise", {
          portName: port,
          baudRate: baudRate,
          dataBitsNumber: dataBits,
          parityString: parity,
          stopBitsNumber: stopBits,
          mqttKey,
          mqttSecret,
          deviceKey,
        }).catch((e) => {
          setlocalThreadStarted(false);
          setError(e);
        });
      } else {
        invoke("start_rs232", {
          portName: port,
          baudRate: baudRate,
          dataBitsNumber: dataBits,
          parityString: parity,
          stopBitsNumber: stopBits,
        }).catch((e) => {
          setlocalThreadStarted(false);
          setError(e);
        });
      }
    }
  };

  useEffect(() => {
    const store = new Store(".settings.dat");

    store
      .get("view-settings")
      .then((e: any) =>
        typeof e === "string"
          ? setTaskbarView(JSON.parse(e))
          : e === null
          ? null
          : e
      )
      .catch((_e) => null);

    store
      .get("port")
      .then((e: any) =>
        typeof e === "string"
          ? setPort(e)
          : e === null
          ? null
          : setPort(JSON.stringify(e))
      )
      .catch((_e) => null);

    store
      .get("dataBits")
      .then((e: any) =>
        typeof e === "string"
          ? setDataBits(parseInt(e))
          : e === null
          ? null
          : setDataBits(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("stopBits")
      .then((e: any) =>
        typeof e === "string"
          ? setStopBits(parseInt(e))
          : e === null
          ? null
          : setStopBits(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("parity")
      .then((e: any) =>
        typeof e === "string"
          ? setParity(parseInt(e))
          : e === null
          ? null
          : setParity(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("baudRate")
      .then((e: any) =>
        typeof e === "string"
          ? setBaudRate(parseInt(e))
          : e === null
          ? null
          : setBaudRate(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("mqttKey")
      .then((e: any) =>
        typeof e === "string"
          ? setMqttKey(e)
          : e === null
          ? null
          : setMqttKey(JSON.stringify(e))
      )
      .catch((_e) => setMqttKey(""));

    store
      .get("mqttSecret")
      .then((e: any) =>
        typeof e === "string"
          ? setMqttSecret(e)
          : e === null
          ? null
          : setMqttSecret(JSON.stringify(e))
      )
      .catch((_e) => setMqttSecret(""));

    store
      .get("deviceKey")
      .then((e: any) =>
        typeof e === "string"
          ? setDeviceKey(e)
          : e === null
          ? null
          : setDeviceKey(JSON.stringify(e))
      )
      .catch((_e) => setDeviceKey(""));
  }, []);

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

      listen("rs232-error", (event) => {
        setError(event.payload as string);
      });

      listen("rs232-status", (event) => {
        if ((event.payload as string) === "stopped") {
          setTrheadStarted(false);
          setError("");
        } else if ((event.payload as string) === "started") {
          setTrheadStarted(true);
          setError("");
        }
      });

      listen("exalise-connection", (event) => {
        if ((event.payload as string) === "connected") {
          setExaliseStatus("connected");
        } else if ((event.payload as string) === "disconnected") {
          setExaliseStatus("disconnected");
        } else if ((event.payload as string) === "disconnecting") {
          setExaliseStatus("disconnecting");
        } else if ((event.payload as string) === "connecting") {
          setExaliseStatus("connecting");
        }
      });

      listen("rs232-file-send", (event) => {
        setFileSendStatus(event.payload as string);
      });

      listen("rs232-file-progress", (event) => {
        setFileProgress(event.payload as string);
      });
    }
  }, []);

  return (
    <Hotkeys
      keyName="ctrl+s, ctrl+t, ctrl+r, ctrl+p, ctrl+e"
      onKeyDown={(e) => handleKeyPressed(e)}
    >
      <Box width={"100%"} height="100vh" position="relative">
        <Flex
          backgroundColor={"white"}
          height={"30px"}
          alignItems="center"
          pl={"3"}
          boxShadow="rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px"
        >
          <Menu gutter={5}>
            <MenuButton
              color="gray.700"
              borderRadius={"5px"}
              width="50px"
              justifyContent={"center"}
              _expanded={{ bg: "gray.200" }}
            >
              File
            </MenuButton>

            <MenuList ml={-1}>
              <MenuItem onClick={onOpenSaveInput}>
                <Flex alignItems={"center"}>
                  <Icon as={BiSave} />
                  <Text ml={2}>Save input</Text>
                  <Text color={"gray.500"} ml="75px">
                    Ctrl + S
                  </Text>
                </Flex>
              </MenuItem>
              <SaveInputModal
                isOpen={isOpenSaveInput}
                onClose={onCloseSaveInput}
                serialInput={serialInput}
              />
              <MenuItem onClick={onOpenSendFile}>
                <Flex alignItems={"center"} width="100%">
                  <Icon as={BiExport} />
                  <Text ml={2}>Send file</Text>
                  <Text color={"gray.500"} ml="auto">
                    Ctrl + T
                  </Text>
                </Flex>
              </MenuItem>
              <SendFileModal
                isOpen={isOpenSendFile}
                onClose={onCloseSendFile}
                StartFileSending={StartFileSending}
                setFileSend={setFileSend}
              />
              <MenuItem onClick={onOpenReceiveFile}>
                <Flex alignItems={"center"} width="100%">
                  <Icon as={BiImport} />
                  <Text ml={2}> Receive file</Text>
                  <Text color={"gray.500"} ml="auto">
                    Ctrl + R
                  </Text>
                </Flex>
              </MenuItem>
              <ReceiveFileModal
                isOpen={isOpenReceiveFile}
                onClose={onCloseReceiveFile}
                StartFileReceiving={StartFileReceiving}
                setFileReceive={setFileReceive}
              />
            </MenuList>
          </Menu>

          <Menu gutter={5}>
            <MenuButton
              color="gray.700"
              borderRadius={"5px"}
              ml={1}
              width="85px"
              justifyContent={"center"}
              _expanded={{ bg: "gray.200" }}
            >
              Settings
            </MenuButton>

            <MenuList ml={-1}>
              <MenuItem onClick={onOpenSerialSettings}>
                <Flex alignItems={"center"} width="100%">
                  <Icon as={AiOutlineUsb} />
                  <Text ml={2}>Serial port</Text>
                  <Text color={"gray.500"} ml="auto">
                    Ctrl + P
                  </Text>
                </Flex>
              </MenuItem>

              <SerialPortSettingModal
                isOpen={isOpenSerialSettings}
                onClose={onCloseSerialSettings}
              />

              <MenuItem onClick={onOpenExaliseSettings}>
                <Flex alignItems={"center"} width="100%">
                  <Icon as={AiOutlineCloudUpload} />
                  <Text ml={2}>Exalise</Text>
                  <Text color={"gray.500"} ml="auto">
                    Ctrl + E
                  </Text>
                </Flex>
              </MenuItem>

              <ExaliseSettingModal
                isOpen={isOpenExaliseSettings}
                onClose={onCloseExaliseSettings}
                mqttKey={mqttKey}
                setMqttKey={setMqttKey}
                mqttSecret={mqttSecret}
                setMqttSecret={setMqttSecret}
                deviceKey={deviceKey}
                setDeviceKey={setDeviceKey}
              />
            </MenuList>
          </Menu>

          <Menu closeOnSelect={false} gutter={5}>
            <MenuButton
              color="gray.700"
              borderRadius={"5px"}
              ml={1}
              width="55px"
              justifyContent={"center"}
              _expanded={{ bg: "gray.200" }}
            >
              View
            </MenuButton>
            <MenuList minWidth="240px">
              <MenuOptionGroup
                title="Task bar"
                type="checkbox"
                mt={-1}
                onChange={async (e) => {
                  setTaskbarView(e as string[]);
                  try {
                    const store = new Store(".settings.dat");
                    await store.set("view-settings", JSON.stringify(e));
                    await store.save();
                  } catch (_error) {
                    return;
                  }
                }}
                value={taskbarView}
              >
                <MenuItemOption value="serial">Serial options</MenuItemOption>
                <MenuItemOption value="exalise">Exalise options</MenuItemOption>
              </MenuOptionGroup>
            </MenuList>
          </Menu>
        </Flex>

        {fileSend ? (
          <SendFileTaskBar
            error={error}
            fileSendProgress={fileSendProgress}
            fileSendStatus={fileSendStatus}
            setFileSend={setFileSend}
          />
        ) : fileReceive ? (
          <ReceiveFileTaskbar
            error={error}
            fileSendProgress={fileSendProgress}
            fileSendStatus={fileSendStatus}
            setFileReceive={setFileReceive}
          />
        ) : (
          <MainTaskBar
            restartRs232Monitoring={restartRs232Monitoring}
            TrheadStarted={TrheadStarted}
            localThreadStarted={localThreadStarted}
            setlocalThreadStarted={setlocalThreadStarted}
            autoScroll={autoScroll}
            onOpenSaveInput={onOpenSaveInput}
            exaliseConn={exaliseConn}
            setExaliseConn={setExaliseConn}
            exaliseStatus={exaliseStatus}
          />
        )}

        {taskbarView.includes("serial") ? (
          <SerialPortSettingTaskBar
            port={port}
            setPort={setPort}
            baudRate={baudRate}
            setBaudRate={setBaudRate}
            dataBits={dataBits}
            setDataBits={setDataBits}
            parity={parity}
            setParity={setParity}
            stopBits={stopBits}
            setStopBits={setStopBits}
            restartRs232Monitoring={restartRs232Monitoring}
          />
        ) : null}

        {taskbarView.includes("exalise") ? (
          <ExaliseSettingTaskbar
            mqttKey={mqttKey}
            setMqttKey={setMqttKey}
            mqttSecret={mqttSecret}
            setMqttSecret={setMqttSecret}
            deviceKey={deviceKey}
            setDeviceKey={setDeviceKey}
          />
        ) : null}

        {serialInput.length > 0 ? (
          <Flex
            width={"100%"}
            position="absolute"
            top={`${taskbarHeight} + ${
              taskbarView.includes("serial") ? serialTaskbarHeight : 0
            } + ${
              taskbarView.includes("exalise") ? exaliseTaskbarHeight : 0
            }`} /*  {height - 0.04 * height - errorHeight} */
            justifyContent="center"
            cursor="pointer"
          >
            <Flex
              height={"fit-content"}
              backgroundColor={"twitter.800"}
              color="white"
              justifyContent={"center"}
              alignItems="center"
              borderRadius={"15px"}
              fontSize={["12px", "14px", "16px"]}
              letterSpacing={"0.8px"}
              mt={1}
              pl={2}
              pr={2}
              onClick={() => setSerialInput([])}
            >
              <Text>Invoer verwijderen</Text>
            </Flex>
          </Flex>
        ) : null}

        <Flex
          height={`calc(100vh - 30px - ${taskbarHeight}px -  ${
            taskbarView.includes("serial") ? serialTaskbarHeight : 0
          }px -  ${
            taskbarView.includes("exalise") ? exaliseTaskbarHeight : 0
          }px)`}
          maxHeight={`calc(100vh - 30px - ${taskbarHeight}px -  ${
            taskbarView.includes("serial") ? serialTaskbarHeight : 0
          }px -  ${
            taskbarView.includes("exalise") ? exaliseTaskbarHeight : 0
          }px)`}
          bgColor="#141414"
          overflowX={"hidden"}
          overflowY="auto"
          flexDir={"column"}
        >
          {serialInput.map((item, key) => (
            <SerialLine item={item} key={key} />
          ))}

          <div ref={endOfDiv} style={{ marginTop: "100px" }}></div>
        </Flex>

        {error === "" ? null : (
          <Flex
            width={"100%"}
            height={`${errorHeight}px`}
            position="absolute"
            top={height - 0.04 * height - errorHeight}
            justifyContent="center"
          >
            <Flex
              height={"100%"}
              width={["250px", "300px", "400px"]}
              backgroundColor={"red"}
              color="white"
              justifyContent={"center"}
              alignItems="center"
              borderRadius={["12px", "16px", "20px"]}
              fontSize={["12px", "16px", "20px"]}
              fontWeight={"medium"}
              p="5"
            >
              {error == "Thread already started" ? (
                <Flex alignItems={"center"} flexDir="column">
                  <Text>{error}</Text>

                  <Link
                    fontSize={["9px", "12px", "14px"]}
                    onClick={() => {
                      invoke("stop_rs232");
                    }}
                  >
                    Click here to force all threads to stop
                  </Link>
                </Flex>
              ) : (
                error
              )}
            </Flex>
          </Flex>
        )}
      </Box>
    </Hotkeys>
  );
}

export default App;
