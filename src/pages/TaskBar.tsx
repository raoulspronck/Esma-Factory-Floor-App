import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  Box,
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
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { relaunch } from "@tauri-apps/api/process";
import {
  AiOutlineApi,
  AiOutlineCloudUpload,
  AiOutlineSetting,
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
import { exit } from "@tauri-apps/api/process"; //relaunch
import { VscChromeClose } from "react-icons/vsc";
import { BsCheckCircle } from "react-icons/bs";
import { FiAlertCircle } from "react-icons/fi";
import { formatDate } from "../utils/formatDate";
import GeneralSettingsModal from "../components/SettingsMenu/generalSettingsModal";
import { emitter } from "../index";
import DisplayAlert from "../components/DisplayAlert";
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
  // Dialog it self
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  // connect-error text
  const [connectionErrorText, setConnectionErrorText] = useState([]);

  // All the allerts it wants to subscribes
  const [alerts, setAlerts] = useState([]);

  // All the allerts it is subscribed to
  const [subscribedAlerts, setSubscribedAlerts] = useState([]);

  // All the active allerts
  const activeAlerts = useRef([]);
  const [displayActiveAlerts, setDisplayActiveAlerts] = useState([]);

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

  const {
    isOpen: isOpenGeneralSettings,
    onOpen: onOpenGeneralSettings,
    onClose: onCloseGeneralSettings,
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

  const [gestureControl, setGestureControl] = useState("");
  const [automaticLoadDashboard, setAutomaticLoadDashboard] = useState("");

  const [fileSendStatus, setFileSendStatus] = useState("");
  const [fileSendProgress, setFileProgress] = useState("");
  const [fileReceivePath, setFileReceivePath] = useState("");

  const [errorInput, setErrorInput] = useState("");

  const [currentDate, setCurrentDate] = useState(formatDate(""));

  const [pingTime, setPingTime] = useState(0);

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

  const acceptNotification = (notification: string) => {
    let notification_split = notification.split("/");
    let message = notification_split[1] + "/ alert accepted";

    // send alert accepted
    invoke("send_message", {
      deviceKey: notification_split[0].split("---")[1],
      datapoint: notification_split[0].split("---")[2],
      value: message,
    })
      .then((e) => console.log("Message send"))
      .catch((e) => console.log(e));
  };

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;

      listen("exalise-connection-status", (event) => {
        const connection_error = event.payload as string;
        let total_text = connectionErrorText;
        total_text.push(`${connection_error}\r\n`);
        if (total_text.length > 50) {
          total_text.shift();
        }
        setConnectionErrorText(total_text);
      });

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

      listen("Ping", (event) => {
        setPingTime(0);
      });

      listen("gesture", (event) => {
        if (event.payload === "Thumb_Up") {
          // acknoledge first notification
          if (activeAlerts.current.length > 0) {
            // get first active notification
            const firstAlert = activeAlerts.current[0];
            // let notification_key = alert_key + "/" + message + "/" + alerts[i].require_accept;
            const splittedAlert = firstAlert.split("/");
            if (splittedAlert[2] !== "No") {
              // we can aknoledge
              acceptNotification(firstAlert);
            }
          }
        }
      });

      setPingTime(0);
      setInterval(() => {
        setPingTime((e) => e - 1);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (!functionCalledApi.current) {
      functionCalledApi.current = true;
      // update current time
      setInterval(() => {
        setCurrentDate(formatDate(""));
      }, 1000);

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

      //get alerts
      invoke("get_basic_settings")
        .then((e) => {
          const res = JSON.parse(e as string);
          setGestureControl(res.gesture_control);
          setAutomaticLoadDashboard(res.automatic_load_dashboard);
        }) //
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

  useEffect(() => {
    // alerts have changed
    for (let i = 0; i < alerts.length; i++) {
      // key to subscribe to
      let alert_key = `notification---${alerts[i].device_key}---${alerts[i].data_point}`;
      // subscribe to all the allerts it is already subscribed to
      if (!subscribedAlerts.includes(alert)) {
        listen(alert_key, (event) => {
          // what happens if alert comes in
          let message = event.payload as string;
          let notification_key =
            alert_key + "/" + message + "/" + alerts[i].require_accept;

          // If message not yet active, add it
          if (!activeAlerts.current.includes(notification_key)) {
            var tempArray = [notification_key, ...activeAlerts.current];
            activeAlerts.current = tempArray;
            setDisplayActiveAlerts(() => [...tempArray]);
            onOpen();
          }
        });
        setSubscribedAlerts((e) => [alert, ...e]);
      }
    }
  }, [alerts]);

  useEffect(() => {
    if (pingTime < -60) {
      relaunch();
    }
  }, [pingTime]);

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
        position={"relative"}
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
          <Flex width={"fit-content"}>
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

                <MenuItem
                  onClick={onOpenGeneralSettings}
                  bgColor="twitter.400"
                  _hover={{ bg: "twitter.500" }}
                >
                  <Flex alignItems={"center"} width="100%">
                    <Icon as={AiOutlineSetting} />
                    <Text ml={2}>General Settings</Text>
                  </Flex>
                </MenuItem>

                <GeneralSettingsModal
                  isOpen={isOpenGeneralSettings}
                  onClose={onCloseGeneralSettings}
                  automaticLoadDashboard={automaticLoadDashboard}
                  gestureControl={gestureControl}
                  setAutomaticLoadDashboard={setAutomaticLoadDashboard}
                  setGestureControl={setGestureControl}
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
                {page === 0 ? (
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

                <ErrorLog
                  isOpen={isOpenErrorLog}
                  onClose={onCloseErrorLog}
                  connectionErrorText={connectionErrorText}
                />
              </MenuList>
            </Menu>

            <Button
              fontWeight={"light"}
              ml="2"
              bgColor="twitter.400"
              _expanded={{ bg: "twitter.500" }}
              onClick={() => setLogin(false)}
              color="white"
            >
              Logout
            </Button>
          </Flex>
        ) : (
          <Flex width={"250px"}>
            <Button
              bgColor="twitter.400"
              _expanded={{ bg: "twitter.500" }}
              fontWeight={"light"}
              ml="2"
              onClick={onOpenLogin}
              color="white"
            >
              Login
            </Button>

            <LoginModal
              isOpen={isOpenLogin}
              onClose={onCloseLogin}
              setLogin={setLogin}
            />
          </Flex>
        )}

        <Spacer />
        <Text fontSize={"25px"} style={{ transform: "scale(1, 0.9)" }} ml={2}>
          {currentDate}
        </Text>
        <Spacer />
        <Flex alignItems={"center"} width={"fit-content"} mr={5} color="white">
          <ExaliseLogoBox size={28} />

          <Popover>
            {({ isOpen, onClose }) => (
              <>
                <PopoverTrigger>
                  <Text
                    fontSize={"18px"}
                    fontWeight="medium"
                    fontFamily="Helvetica"
                    letterSpacing="widest"
                    style={{ transform: "scale(1, 0.9)" }}
                    ml={2}
                    display={["none", "block"]}
                    cursor={"pointer"}
                  >
                    Exalise
                  </Text>
                </PopoverTrigger>
                <Portal>
                  <PopoverContent width={"fit-content"}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody>
                      <Flex flexDir={"column"}>
                        <Button
                          leftIcon={<TfiReload />}
                          colorScheme="blue"
                          onClick={async () => {
                            await invoke("post_remove_cache");
                            emitter.emit("refetch", true);
                            onClose();
                          }}
                        >
                          Refetch
                        </Button>
                        <Button
                          mt={2}
                          leftIcon={<TfiReload />}
                          colorScheme="orange"
                          onClick={async () => {
                            await relaunch();
                          }}
                        >
                          Relaunch
                        </Button>
                      </Flex>
                    </PopoverBody>
                  </PopoverContent>
                </Portal>
              </>
            )}
          </Popover>

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
              width={["110px", "130px", "150px"]}
              alignItems="center"
              justifyContent={"center"}
              backgroundColor="green.500"
              height={["24px", "24px", "31px"]}
              borderRadius="5px"
              fontSize={"md"}
              fontWeight="semibold"
              ml={[1, 2, 3]}
            >
              <Icon ml={3} as={MdWifiTethering} />
              <Text ml={2}>connected</Text>
              <Text ml="auto" mr={2}>
                {" "}
                {pingTime}s
              </Text>
            </Flex>
          )}
        </Flex>

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
        closeOnOverlayClick={false}
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
              {displayActiveAlerts.map((a) => {
                return (
                  <DisplayAlert
                    key={a}
                    activeAlerts={activeAlerts}
                    alert={a}
                    alertSplit={a.split("/")}
                    onClose={onClose}
                    setDisplayActiveAlerts={setDisplayActiveAlerts}
                  />
                );
              })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                colorScheme="gray"
                onClick={() => {
                  setDisplayActiveAlerts([]);
                  activeAlerts.current = [];
                  onClose();
                }}
              >
                Sluit
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default TaskBar;
