import React, { useEffect, useRef, useState } from "react";
import {
  Flex,
  Text,
  Box,
  Button,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { MdSettings } from "react-icons/md";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";
import WidgetModal from "./WidgetModal";
import DisplayWidget from "./DisplayWidget";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { BiHide } from "react-icons/bi";

interface DeviceWidgetProps {
  deviceBlock: {
    id: string;
    key: string;
    name: string;
    display: boolean;
    widgets: any[];
  };
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        static: boolean;
      }[];
      devices: any[];
    }>
  >;
  dashboard: {
    layout: {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      static: boolean;
    }[];
    devices: any[];
  };
  layoutChangable: boolean;
  login: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const DeviceWidget: React.FC<DeviceWidgetProps> = ({
  deviceBlock,
  setDashboard,
  dashboard,
  layoutChangable,
  login,
  setRefresh,
}) => {
  const functionCalled = useRef(false);

  const [dataPoints, setDataPoints] = useState([]);
  const [connected, setConnected] = useState(null);

  const [loading, setLoading] = useState(false);

  const {
    isOpen: isOpenWidget,
    onOpen: onOpenWidget,
    onClose: onCloseWidget,
  } = useDisclosure();

  const deleteDevice = async () => {
    const newDashboard = {
      layout: dashboard.layout.filter((e) => e.i !== deviceBlock.id),
      devices: dashboard.devices.filter((e) => e.id !== deviceBlock.id),
    };

    console.log(newDashboard);

    setDashboard(newDashboard);
  };

  const hideDevice = async () => {
    setLoading(true);

    const newDevices = dashboard.devices.map((e) => {
      if (e.id === deviceBlock.id) {
        return {
          id: deviceBlock.id,
          name: deviceBlock.name,
          key: deviceBlock.key,
          display: false,
          widgets: deviceBlock.widgets,
        };
      }

      return e;
    });

    //const newLayout = dashboard.layout.filter((e) => e.i != deviceBlock.id);

    invoke("save_dashboard_layout", {
      dashboard: {
        layout: dashboard.layout,
        devices: newDevices,
      },
    })
      .then((i) => {
        if (i === "saved") {
          setDashboard({
            layout: dashboard.layout,
            devices: newDevices,
          });
        }
        setLoading(false);
      })
      .catch((e) => setLoading(false));
  };

  useEffect(() => {
    invoke("get_device", {
      deviceId: deviceBlock.id,
    })
      .then((e) => {
        setConnected(JSON.parse(e as string).connected);
        setDataPoints(JSON.parse(e as string).dataPoint);
      })
      .catch((er) => console.log(er));
  }, [deviceBlock.id]);

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;

      listen(`notification-${deviceBlock.key}`, (event) => {
        if (event.payload === "connected") {
          setConnected(true);
        } else if (event.payload === "disconnected") {
          setConnected(false);
        }
      });
    }
  }, [deviceBlock.key]);

  return (
    <Box
      bg="gray.800"
      borderRadius={"10px"}
      height="100%"
      style={{ userSelect: "none" }}
      position="relative"
    >
      <Flex
        justifyContent={"center"}
        alignItems="center"
        height={"30px"}
        maxH="30px"
        position={"relative"}
      >
        <Text fontSize={"20px"}>{deviceBlock.name}</Text>
        {connected === null ? null : connected === true ? (
          <Box
            height={"15px"}
            width="15px"
            bgColor={"green"}
            borderRadius="50%"
            ml={3}
          />
        ) : (
          <Box
            height={"15px"}
            width="15px"
            bgColor={"red"}
            borderRadius="50%"
            ml={3}
          />
        )}

        {layoutChangable ? (
          <IconButton
            position={"absolute"}
            right={0}
            icon={<RiDeleteBin5Fill />}
            aria-label="Delete device"
            colorScheme={"red"}
            size="sm"
            onClick={deleteDevice}
          />
        ) : (
          <IconButton
            position={"absolute"}
            right={0}
            icon={<BiHide />}
            aria-label="Hide device"
            colorScheme={"blackAlpha"}
            size="sm"
            onClick={hideDevice}
            isLoading={loading}
          />
        )}
      </Flex>

      {deviceBlock.widgets.length > 0
        ? deviceBlock.widgets.map((e) => (
            <DisplayWidget
              key={e.id}
              widget={e}
              deviceKey={deviceBlock.key}
              deviceId={deviceBlock.id}
              layoutChangable={layoutChangable}
              setDashboard={setDashboard}
              dashboard={dashboard}
              setRefresh={setRefresh}
            />
          ))
        : null}

      {login ? (
        <Flex
          position={"absolute"}
          bottom={0}
          justifyContent={"center"}
          alignItems="center"
          height={"30px"}
          maxH="30px"
          width={"100%"}
        >
          <Button
            className="notdraggable"
            size="xs"
            leftIcon={<MdSettings fontSize={"18px"} />}
            onClick={onOpenWidget}
            colorScheme="blackAlpha"
          >
            Add widget
          </Button>

          <WidgetModal
            dataPoints={dataPoints}
            isOpen={isOpenWidget}
            onClose={onCloseWidget}
            deviceBlock={deviceBlock}
            setDashboard={setDashboard}
            dashboard={dashboard}
            setRefresh={setRefresh}
          />
        </Flex>
      ) : null}
    </Box>
  );
};

export default DeviceWidget;
