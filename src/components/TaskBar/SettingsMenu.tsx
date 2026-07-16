import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { ElementType, useEffect, useRef, useState } from "react";
import { AiOutlineApi, AiOutlineCloudUpload, AiOutlineSetting, AiOutlineUsb } from "react-icons/ai";
import { MdOutlineNetworkCheck } from "react-icons/md";

import EsmaApiSettingsModal from "../SettingsMenu/esmaApiSettingsModal";
import ExaliseHttpSettingModal from "../SettingsMenu/exaliseHttpSettingModal";
import ExaliseSettingModal from "../SettingsMenu/exaliseSettingModal";
import GeneralSettingsModal from "../SettingsMenu/generalSettingsModal";
import SerialPortSettingModal from "../SettingsMenu/serialPortSettingModal";
import TestConnectionModal from "../SettingsMenu/testConnectionModal";

export default function SettingsMenu() {
  const { isOpen: isOpenSerial, onOpen: onOpenSerial, onClose: onCloseSerial } = useDisclosure();
  const { isOpen: isOpenMqtt, onOpen: onOpenMqtt, onClose: onCloseMqtt } = useDisclosure();
  const { isOpen: isOpenHttp, onOpen: onOpenHttp, onClose: onCloseHttp } = useDisclosure();
  const { isOpen: isOpenApi, onOpen: onOpenApi, onClose: onCloseApi } = useDisclosure();
  const { isOpen: isOpenGeneral, onOpen: onOpenGeneral, onClose: onCloseGeneral } = useDisclosure();
  const { isOpen: isOpenTest, onOpen: onOpenTest, onClose: onCloseTest } = useDisclosure();

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
  const [dashboardRows, setDashboardRows] = useState(7);

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
        setDashboardRows(res.dashboard_rows ?? 7);
      })
      .catch(console.log);
  }, []);

  const itemIcon = (icon: ElementType) => (
    <Flex
      boxSize="40px"
      borderRadius="lg"
      bg="brand.50"
      color="brand.600"
      align="center"
      justify="center"
    >
      <Icon as={icon} boxSize="22px" />
    </Flex>
  );

  return (
    <Menu gutter={8}>
      <MenuButton
        borderRadius="xl"
        ml={2}
        height="52px"
        px={5}
        fontSize="lg"
        fontWeight="semibold"
        color="white"
        bg="whiteAlpha.200"
        _hover={{ bg: "whiteAlpha.300" }}
        _expanded={{ bg: "whiteAlpha.400" }}
        transition="background 0.15s ease"
      >
        Settings
      </MenuButton>
      <MenuList>
        <MenuItem onClick={onOpenSerial} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(AiOutlineUsb)}
            <Text>Serial port</Text>
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

        <MenuItem onClick={onOpenMqtt} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(AiOutlineCloudUpload)}
            <Text>Exalise mqtt</Text>
          </Flex>
        </MenuItem>
        <ExaliseSettingModal
          isOpen={isOpenMqtt} onClose={onCloseMqtt}
          mqttKey={mqttKey} setMqttKey={setMqttKey}
          mqttSecret={mqttSecret} setMqttSecret={setMqttSecret}
          deviceKey={deviceKey} setDeviceKey={setDeviceKey}
        />

        <MenuItem onClick={onOpenHttp} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(AiOutlineCloudUpload)}
            <Text>Exalise http</Text>
          </Flex>
        </MenuItem>
        <ExaliseHttpSettingModal
          isOpen={isOpenHttp} onClose={onCloseHttp}
          httpKey={httpKey} setHttpKey={setHttpKey}
          httpSecret={httpSecret} setHttpSecret={setHttpSecret}
        />

        <MenuItem onClick={onOpenTest} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(MdOutlineNetworkCheck)}
            <Text>Test API connection</Text>
          </Flex>
        </MenuItem>
        <TestConnectionModal isOpen={isOpenTest} onClose={onCloseTest} />

        <MenuItem onClick={onOpenApi} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(AiOutlineApi)}
            <Text>Api settings</Text>
          </Flex>
        </MenuItem>
        <EsmaApiSettingsModal
          isOpen={isOpenApi} onClose={onCloseApi}
          apiUsername={apiUsername} setApiUsername={setApiUsername}
          apiPassword={apiPassword} setApiPassword={setApiPassword}
        />

        <MenuItem onClick={onOpenGeneral} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(AiOutlineSetting)}
            <Text>General Settings</Text>
          </Flex>
        </MenuItem>
        <GeneralSettingsModal
          isOpen={isOpenGeneral} onClose={onCloseGeneral}
          gestureControl={gestureControl} setGestureControl={setGestureControl}
          automaticLoadDashboard={automaticLoadDashboard}
          setAutomaticLoadDashboard={setAutomaticLoadDashboard}
          dashboardRows={dashboardRows} setDashboardRows={setDashboardRows}
        />
      </MenuList>
    </Menu>
  );
}
