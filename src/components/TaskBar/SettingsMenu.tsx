import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { useEffect, useRef, useState } from "react";
import { AiOutlineApi, AiOutlineCloudUpload, AiOutlineSetting, AiOutlineUsb } from "react-icons/ai";

import EsmaApiSettingsModal from "../SettingsMenu/esmaApiSettingsModal";
import ExaliseHttpSettingModal from "../SettingsMenu/exaliseHttpSettingModal";
import ExaliseSettingModal from "../SettingsMenu/exaliseSettingModal";
import GeneralSettingsModal from "../SettingsMenu/generalSettingsModal";
import SerialPortSettingModal from "../SettingsMenu/serialPortSettingModal";

export default function SettingsMenu() {
  const { isOpen: isOpenSerial, onOpen: onOpenSerial, onClose: onCloseSerial } = useDisclosure();
  const { isOpen: isOpenMqtt, onOpen: onOpenMqtt, onClose: onCloseMqtt } = useDisclosure();
  const { isOpen: isOpenHttp, onOpen: onOpenHttp, onClose: onCloseHttp } = useDisclosure();
  const { isOpen: isOpenApi, onOpen: onOpenApi, onClose: onCloseApi } = useDisclosure();
  const { isOpen: isOpenGeneral, onOpen: onOpenGeneral, onClose: onCloseGeneral } = useDisclosure();

  // RS232 form state
  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(0);
  const [baudRate, setBaudRate] = useState(9600);

  // Exalise MQTT form state
  const [mqttKey, setMqttKey] = useState("");
  const [mqttSecret, setMqttSecret] = useState("");
  const [deviceKey, setDeviceKey] = useState("");

  // Exalise HTTP form state
  const [httpKey, setHttpKey] = useState("");
  const [httpSecret, setHttpSecret] = useState("");

  // API form state
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");

  // General / basic settings form state
  const [gestureControl, setGestureControl] = useState("");
  const [automaticLoadDashboard, setAutomaticLoadDashboard] = useState("");

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

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
      .catch(console.log);

    invoke("get_api_settings")
      .then((e) => {
        const res = JSON.parse(e as string);
        setApiUsername(res.username);
        setApiPassword(res.password);
      })
      .catch(console.log);

    invoke("get_basic_settings")
      .then((e) => {
        const res = JSON.parse(e as string);
        setGestureControl(res.gesture_control);
        setAutomaticLoadDashboard(res.automatic_load_dashboard);
      })
      .catch(console.log);
  }, []);

  return (
    <Menu gutter={5}>
      <MenuButton
        borderRadius="5px"
        ml={1}
        width="85px"
        justifyContent="center"
        bgColor="twitter.400"
        _expanded={{ bg: "twitter.500" }}
        height="40px"
      >
        Settings
      </MenuButton>
      <MenuList ml={-1} bgColor="twitter.400">
        <MenuItem onClick={onOpenSerial} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={AiOutlineUsb} />
            <Text ml={2}>Serial port</Text>
          </Flex>
        </MenuItem>
        <SerialPortSettingModal
          port={port} setPort={setPort}
          baudRate={baudRate} setBaudRate={setBaudRate}
          dataBits={dataBits} setDataBits={setDataBits}
          parity={parity} setParity={setParity}
          stopBits={stopBits} setStopBits={setStopBits}
          isOpen={isOpenSerial} onClose={onCloseSerial}
        />

        <MenuItem onClick={onOpenMqtt} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={AiOutlineCloudUpload} />
            <Text ml={2}>Exalise mqtt</Text>
          </Flex>
        </MenuItem>
        <ExaliseSettingModal
          isOpen={isOpenMqtt} onClose={onCloseMqtt}
          mqttKey={mqttKey} setMqttKey={setMqttKey}
          mqttSecret={mqttSecret} setMqttSecret={setMqttSecret}
          deviceKey={deviceKey} setDeviceKey={setDeviceKey}
        />

        <MenuItem onClick={onOpenHttp} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={AiOutlineCloudUpload} />
            <Text ml={2}>Exalise http</Text>
          </Flex>
        </MenuItem>
        <ExaliseHttpSettingModal
          isOpen={isOpenHttp} onClose={onCloseHttp}
          httpKey={httpKey} setHttpKey={setHttpKey}
          httpSecret={httpSecret} setHttpSecret={setHttpSecret}
        />

        <MenuItem onClick={onOpenApi} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={AiOutlineApi} />
            <Text ml={2}>Api settings</Text>
          </Flex>
        </MenuItem>
        <EsmaApiSettingsModal
          isOpen={isOpenApi} onClose={onCloseApi}
          apiUsername={apiUsername} setApiUsername={setApiUsername}
          apiPassword={apiPassword} setApiPassword={setApiPassword}
        />

        <MenuItem onClick={onOpenGeneral} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={AiOutlineSetting} />
            <Text ml={2}>General Settings</Text>
          </Flex>
        </MenuItem>
        <GeneralSettingsModal
          isOpen={isOpenGeneral} onClose={onCloseGeneral}
          gestureControl={gestureControl} setGestureControl={setGestureControl}
          automaticLoadDashboard={automaticLoadDashboard}
          setAutomaticLoadDashboard={setAutomaticLoadDashboard}
        />
      </MenuList>
    </Menu>
  );
}
