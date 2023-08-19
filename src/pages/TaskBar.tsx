import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import {
  AiOutlineApi,
  AiOutlineCloudUpload,
  AiOutlineUsb,
} from "react-icons/ai";
import { BiExport, BiImport } from "react-icons/bi";
import { GoAlert } from "react-icons/go";
import {
  MdAddToQueue,
  MdError,
  MdWifiTethering,
  MdWifiTetheringOff,
} from "react-icons/md";
import { TbExchange, TbRefreshAlert } from "react-icons/tb";
import ExaliseLogoBox from "../components/exaliseLogoBox";
import ReceiveFileModal from "../components/FileMenu/receiveFileModel";
import SendFileModal from "../components/FileMenu/sendFileModal";
import ErrorLog from "../components/Help/ErrorLog";
import LoginModal from "../components/LoginModal";
import ReceiveFileTaskbar from "../components/receiveFileTaskBar";
import SendFileTaskBar from "../components/sendFileTaskBar";
import EsmaApiSettingsModal from "../components/SettingsMenu/esmaApiSettingsModal";
import ExaliseHttpSettingModal from "../components/SettingsMenu/exaliseHttpSettingModal";
import ExaliseSettingModal from "../components/SettingsMenu/exaliseSettingModal";
import SerialPortSettingModal from "../components/SettingsMenu/serialPortSettingModal";
import AddDeviceModal from "../components/ViewMenu/addDeviceModal";
import ManageAlertsModal from "../components/ViewMenu/manageAlertsModal";
import { relaunch, exit } from "@tauri-apps/api/process";
import { VscChromeClose, VscDebugRestart } from "react-icons/vsc";

interface TaskBarProps {
  login: boolean;
  setlayoutChangable: React.Dispatch<React.SetStateAction<boolean>>;
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: any[];
      devices: any[];
    }>
  >;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setExaliseStatus: React.Dispatch<React.SetStateAction<string>>;
  exaliseStatus: string;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  page: number;
  dashboard: {
    layout: any[];
    devices: any[];
  };
}

const TaskBar: React.FC<TaskBarProps> = ({
  login,
  setDashboard,
  setlayoutChangable,
  setLogin,
  exaliseStatus,
  setExaliseStatus,
  error,
  setError,
  page,
  dashboard,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [closingTimer, setClosingTimer] = useState(10);

  const {
    isOpen: isOpenLogin,
    onOpen: onOpenLogin,
    onClose: onCloseLogin,
  } = useDisclosure();

  const {
    isOpen: isOpenErrorLog,
    onOpen: onOpenErrorLog,
    onClose: onCloseErrorLog,
  } = useDisclosure();

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
    isOpen: isOpenExaliseSettings,
    onOpen: onOpenExaliseSettings,
    onClose: onCloseExaliseSettings,
  } = useDisclosure();

  const {
    isOpen: isOpenExaliseHttpSettings,
    onOpen: onOpenExaliseHttpSettings,
    onClose: onCloseExaliseHttpSettings,
  } = useDisclosure();

  const {
    isOpen: isOpenSerialSettings,
    onOpen: onOpenSerialSettings,
    onClose: onCloseSerialSettings,
  } = useDisclosure();

  const {
    isOpen: isOpenAddDevice,
    onOpen: onOpenAddDevice,
    onClose: onCloseAddDevice,
  } = useDisclosure();

  const {
    isOpen: isOpenManageAlerts,
    onOpen: onOpenManageAlerts,
    onClose: onCloseManageAlerts,
  } = useDisclosure();

  const {
    isOpen: isOpenApiSettings,
    onOpen: onOpenApiSettings,
    onClose: onCloseApiSettings,
  } = useDisclosure();

  const [fileSend, setFileSend] = useState(false);
  const [fileReceive, setFileReceive] = useState(false);

  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(0);
  const [baudRate, setBaudRate] = useState(9600);

  const [mqttKey, setMqttKey] = useState("");
  const [mqttSecret, setMqttSecret] = useState("");
  const [deviceKey, setDeviceKey] = useState("");

  const [httpKey, setHttpKey] = useState("");
  const [httpSecret, setHttpSecret] = useState("");

  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");

  const [alerts, setAlerts] = useState([]);

  const [fileSendStatus, setFileSendStatus] = useState("");
  const [fileSendProgress, setFileProgress] = useState("");
  const [fileReceivePath, setFileReceivePath] = useState("");

  const [errorInput, setErrorInput] = useState("");

  const functionCalled = useRef(false);
  const functionCalledApi = useRef(false);

  const StartFileSending = async (
    filePath: string,
    enableBreaks: number,
    maxChar: number,
    delay: number,
    listenCnc: number,
    stopChar: number,
    restartChar: number
  ): Promise<string> => {
    return await new Promise((res) =>
      invoke("start_file_send", {
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
  };

  const StartFileReceiving = async (
    filePath: string,
    startDecimal: number,
    stopDecimal: number,
    forbiddenDecimals: number[]
  ): Promise<string> => {
    return await new Promise((res) =>
      invoke("start_file_receive", {
        filePath,
        startDecimal,
        stopDecimal,
        forbiddenDecimals,
      })
        .then((_e) => {
          setFileReceivePath(filePath);
          res("oke");
        })
        .catch((e) => {
          res(e);
        })
    );
  };

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;

      listen("rs232-error", (event) => {
        setError(event.payload as string);
      });

      listen("rs232-file-send", (event) => {
        setFileSendStatus(event.payload as string);
      });

      listen("rs232-file-progress", (event) => {
        setFileProgress(event.payload as string);
      });

      listen("exalise-connection", (event) => {
        setExaliseStatus(event.payload as string);
      });

      listen("rs232-error-file", (event) => {
        setErrorInput(event.payload as string);
      });
    }
  }, []);

  useEffect(() => {
    if (!functionCalledApi.current) {
      functionCalledApi.current = true;
      //get exalise connection
      invoke("get_exalise_connection")
        .then((e) =>
          e === true
            ? setExaliseStatus("connected")
            : setExaliseStatus("disconnected")
        )
        .catch((e) => console.log(e));

      //get dashboard
      invoke("get_dashboard")
        .then((e) => setDashboard(JSON.parse(e as string)))
        .catch((e) => console.log(e));

      //get alerts
      invoke("get_alerts")
        .then((e) => setAlerts(JSON.parse(e as string).alerts)) //
        .catch((e) => console.log(e));

      //get exalise settings
      invoke("get_exalise_settings")
        .then((e) => {
          const res = JSON.parse(e as string);
          setMqttKey(res.mqtt_settings.mqtt_key);
          setMqttSecret(res.mqtt_settings.mqtt_secret);
          setDeviceKey(res.mqtt_settings.device_key);
          setHttpKey(res.http_settings.http_key);
          setHttpSecret(res.http_settings.http_secret);

          setPort(res.rs232_settings.port_name);
          setBaudRate(res.rs232_settings.baud_rate);
          setDataBits(res.rs232_settings.data_bits_number);
          setParity(res.rs232_settings.parity_string);
          setStopBits(res.rs232_settings.stop_bits_number);
        })
        .catch((e) => console.log(e));

      //get api settings
      invoke("get_api_settings")
        .then((e) => {
          const res = JSON.parse(e as string);
          setApiUsername(res.username);
          setApiPassword(res.password);
        })
        .catch((e) => console.log(e));
    }
  }, []);

  const [alertsListenTo, setAlertsListenTo] = useState([]);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    for (let i = 0; i < alerts.length; i++) {
      let alert = `notification-${alerts[i].device_key}-${alerts[i].data_point}`;
      if (!alertsListenTo.includes(alert)) {
        listen(alert, (event) => {
          setAlert(event.payload as string);
          onOpen();

          const closing = setInterval(() => {
            setClosingTimer((e) => e - 1);
          }, 1000);

          setTimeout(() => {
            clearInterval(closing);
            onClose();
            setClosingTimer(10);
          }, 10000);
        });
        setAlertsListenTo((e) => [alert, ...e]);
      }
    }
  }, [alerts]);

  return (
    <>
      <Flex
        backgroundColor={"gray.900"}
        color="white"
        height={"50px"}
        alignItems="center"
        pl={"3"}
        boxShadow="rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px"
        width={"100%"}
      >
        <Menu gutter={5}>
          <MenuButton
            borderRadius={"5px"}
            width="50px"
            justifyContent={"center"}
            bgColor="twitter.400"
            _expanded={{ bg: "twitter.500" }}
            height="40px"
          >
            File
          </MenuButton>

          <MenuList ml={-1} bgColor="twitter.400" border={"none"}>
            <MenuItem
              onClick={onOpenSendFile}
              bgColor="twitter.400"
              _hover={{ bg: "twitter.500" }}
            >
              <Flex alignItems={"center"} width="100%">
                <Icon as={BiExport} />
                <Text ml={2}>Send file</Text>
              </Flex>
            </MenuItem>
            <SendFileModal
              isOpen={isOpenSendFile}
              onClose={onCloseSendFile}
              StartFileSending={StartFileSending}
              setFileSend={setFileSend}
            />
            <MenuItem
              onClick={onOpenReceiveFile}
              bgColor="twitter.400"
              _hover={{ bg: "twitter.500" }}
            >
              <Flex alignItems={"center"} width="100%">
                <Icon as={BiImport} />
                <Text ml={2}> Receive file</Text>
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

        {login ? (
          <>
            <Menu gutter={5}>
              <MenuButton
                borderRadius={"5px"}
                ml={1}
                width="85px"
                justifyContent={"center"}
                bgColor="twitter.400"
                _expanded={{ bg: "twitter.500" }}
                height="40px"
              >
                Settings
              </MenuButton>

              <MenuList ml={-1} bgColor="twitter.400">
                <MenuItem
                  onClick={onOpenSerialSettings}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={AiOutlineUsb} />
                    <Text ml={2}>Serial port</Text>
                  </Flex>
                </MenuItem>

                <SerialPortSettingModal
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
                  isOpen={isOpenSerialSettings}
                  onClose={onCloseSerialSettings}
                />

                <MenuItem
                  onClick={onOpenExaliseSettings}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={AiOutlineCloudUpload} />
                    <Text ml={2}>Exalise mqtt</Text>
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

                <MenuItem
                  onClick={onOpenExaliseHttpSettings}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={AiOutlineCloudUpload} />
                    <Text ml={2}>Exalise http</Text>
                  </Flex>
                </MenuItem>

                <ExaliseHttpSettingModal
                  isOpen={isOpenExaliseHttpSettings}
                  onClose={onCloseExaliseHttpSettings}
                  httpKey={httpKey}
                  setHttpKey={setHttpKey}
                  httpSecret={httpSecret}
                  setHttpSecret={setHttpSecret}
                />

                <MenuItem
                  onClick={onOpenApiSettings}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={AiOutlineApi} />
                    <Text ml={2}>Api settings</Text>
                  </Flex>
                </MenuItem>

                <EsmaApiSettingsModal
                  apiPassword={apiPassword}
                  apiUsername={apiUsername}
                  setApiPassword={setApiPassword}
                  setApiUsername={setApiUsername}
                  isOpen={isOpenApiSettings}
                  onClose={onCloseApiSettings}
                />
              </MenuList>
            </Menu>

            <Menu closeOnSelect={false} gutter={5}>
              <MenuButton
                borderRadius={"5px"}
                ml={3}
                width="55px"
                justifyContent={"center"}
                bgColor="twitter.400"
                _expanded={{ bg: "twitter.500" }}
                height="40px"
              >
                View
              </MenuButton>
              <MenuList minWidth="240px" bgColor="twitter.400">
                {page == 0 ? (
                  <>
                    <MenuItem
                      onClick={() => setlayoutChangable(true)}
                      bgColor="twitter.400"
                      _hover={{ bg: "twitter.500" }}
                    >
                      <Flex alignItems={"center"} width="100%">
                        <Icon as={TbExchange} />
                        <Text ml={2}>Change layout</Text>
                      </Flex>
                    </MenuItem>

                    <MenuItem
                      onClick={onOpenAddDevice}
                      bgColor="twitter.400"
                      _hover={{ bg: "twitter.500" }}
                    >
                      <Flex alignItems={"center"} width="100%">
                        <Icon as={MdAddToQueue} />
                        <Text ml={2}>Add device</Text>
                      </Flex>
                    </MenuItem>

                    <AddDeviceModal
                      isOpen={isOpenAddDevice}
                      onClose={onCloseAddDevice}
                      setDashboard={setDashboard}
                      dashboard={dashboard}
                    />
                  </>
                ) : null}

                <MenuItem
                  onClick={onOpenManageAlerts}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={TbRefreshAlert} />
                    <Text ml={2}>Manage alerts</Text>
                  </Flex>
                </MenuItem>

                <ManageAlertsModal
                  isOpen={isOpenManageAlerts}
                  onClose={onCloseManageAlerts}
                  alerts={alerts}
                  setAlerts={setAlerts}
                />
              </MenuList>
            </Menu>

            <Menu closeOnSelect={false} gutter={5}>
              <MenuButton
                borderRadius={"5px"}
                ml={3}
                width="55px"
                justifyContent={"center"}
                bgColor="twitter.400"
                _expanded={{ bg: "twitter.500" }}
                height="40px"
              >
                Help
              </MenuButton>
              <MenuList minWidth="240px" bgColor="twitter.400">
                <MenuItem
                  onClick={onOpenErrorLog}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={MdError} />
                    <Text ml={2}>View logs</Text>
                  </Flex>
                </MenuItem>

                <ErrorLog isOpen={isOpenErrorLog} onClose={onCloseErrorLog} />
              </MenuList>
            </Menu>

            <Button
              fontWeight={"light"}
              ml="2"
              bgColor="twitter.400"
              _expanded={{ bg: "twitter.500" }}
              onClick={() => setLogin(false)}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              bgColor="twitter.400"
              _expanded={{ bg: "twitter.500" }}
              fontWeight={"light"}
              ml="2"
              onClick={onOpenLogin}
            >
              Login
            </Button>

            <LoginModal
              isOpen={isOpenLogin}
              onClose={onCloseLogin}
              setLogin={setLogin}
            />
          </>
        )}

        <Flex
          alignItems={"center"}
          ml="auto"
          width={"fit-content"}
          mr={5}
          color="white"
        >
          <ExaliseLogoBox size={28} />
          <Text
            fontSize={"18px"}
            fontWeight="medium"
            fontFamily="Helvetica"
            letterSpacing="widest"
            style={{ transform: "scale(1, 0.9)" }}
            ml={2}
            display={["none", "block"]}
          >
            Exalise
          </Text>

          {exaliseStatus === "disconnected" ? (
            <Flex
              width={["110px", "130px", "140px"]}
              alignItems="center"
              justifyContent={"center"}
              backgroundColor="red.500"
              height={["24px", "24px", "31px"]}
              borderRadius="5px"
              fontSize={"md"}
              fontWeight="semibold"
              ml={[1, 2, 3]}
            >
              <Spacer />
              <Icon as={MdWifiTetheringOff} />
              <Spacer />
              <Text>disconnected</Text>
              <Spacer />
            </Flex>
          ) : (
            <Flex
              width={["110px", "130px", "140px"]}
              alignItems="center"
              justifyContent={"center"}
              backgroundColor="green.500"
              height={["24px", "24px", "31px"]}
              borderRadius="5px"
              fontSize={"md"}
              fontWeight="semibold"
              ml={[1, 2, 3]}
            >
              <Spacer />
              <Icon as={MdWifiTethering} />
              <Spacer />
              <Text>connected</Text>
              <Spacer />
            </Flex>
          )}
        </Flex>

        <IconButton
          colorScheme={"whiteAlpha"}
          aria-label={"restart app"}
          icon={<VscDebugRestart />}
          mr={2}
          onClick={async () => {
            await relaunch();
          }}
        />

        <IconButton
          colorScheme={"red"}
          aria-label={"exit"}
          icon={<VscChromeClose />}
          mr={2}
          onClick={async () => {
            await exit(1);
          }}
        />
      </Flex>

      {fileSend ? (
        <SendFileTaskBar
          error={errorInput}
          fileSendProgress={fileSendProgress}
          fileSendStatus={fileSendStatus}
          setFileSend={setFileSend}
        />
      ) : fileReceive ? (
        <ReceiveFileTaskbar
          error={errorInput}
          fileSendProgress={fileSendProgress}
          fileSendStatus={fileSendStatus}
          setFileReceive={setFileReceive}
          fileReceivePath={fileReceivePath}
        />
      ) : null}

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <Flex alignItems={"start"}>
                <Icon as={GoAlert} color="orange.400" fontSize={"35px"} />

                <Text ml="2" fontSize={"25px"} fontWeight="medium">
                  Alert
                </Text>
              </Flex>
            </AlertDialogHeader>

            <AlertDialogBody
              fontSize={"24px"}
              bgColor="orange.400"
              color="white"
            >
              {alert}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Text mr="auto">Automatisch sluiten in {closingTimer}s</Text>
              <Button ref={cancelRef} onClick={onClose}>
                Oke
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default TaskBar;