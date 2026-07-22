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
import { WidgetErrorBoundary } from "../../WidgetErrorBoundary";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { BiHide } from "react-icons/bi";
import { useDeviceData } from "../../../hooks/useDeviceData";

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

// Stable empty reference so `dataPoints` keeps the same identity across renders
// while the device shape is still loading - otherwise a fresh `[]` each render
// would needlessly re-run the type-resolution effect in DisplayWidget.
const EMPTY_DATAPOINTS: any[] = [];

const DeviceWidget: React.FC<DeviceWidgetProps> = ({
  deviceBlock,
  setDashboard,
  dashboard,
  layoutChangable,
  login,
  setRefresh,
}) => {
  const functionCalled = useRef(false);

  const deviceData = useDeviceData(deviceBlock.id);
  const dataPoints = deviceData?.dataPoint ?? EMPTY_DATAPOINTS;
  const [connected, setConnected] = useState<boolean | null>(null);

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

  // Hydrate from the shared cache (populated once by EventManager via
  // get_dashboard_data). Live "connected"/"disconnected" events below keep it
  // updated after that.
  useEffect(() => {
    if (deviceData?.connected !== undefined) {
      setConnected(deviceData.connected);
    }
  }, [deviceData?.connected]);

  useEffect(() => {
    if (!functionCalled.current) {
      functionCalled.current = true;

      listen(`notification---${deviceBlock.key}`, (event) => {
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
      bgGradient="linear(to-b, gray.800, gray.900)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius={"20px"}
      height="100%"
      overflow="hidden"
      boxShadow="0 8px 24px rgba(0, 0, 0, 0.35)"
      style={{ userSelect: "none" }}
      position="relative"
      display="flex"
      flexDirection="column"
    >
      <Flex
        flexShrink={0}
        justifyContent={"center"}
        alignItems="center"
        height={"52px"}
        maxH="52px"
        position={"relative"}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        px={4}
      >
        <Text fontSize={"23px"} fontWeight="bold" letterSpacing="wide" noOfLines={1}>
          {deviceBlock.name}
        </Text>
        {connected === null || connected === undefined ? null : connected ===
          true ? (
          <Box
            height={"16px"}
            width="16px"
            bgColor={"green.400"}
            borderRadius="50%"
            boxShadow="0 0 10px 2px rgba(72, 187, 120, 0.8)"
            ml={3}
            flexShrink={0}
          />
        ) : (
          <Box
            height={"16px"}
            width="16px"
            bgColor={"red.400"}
            borderRadius="50%"
            boxShadow="0 0 10px 2px rgba(245, 101, 101, 0.8)"
            ml={3}
            flexShrink={0}
          />
        )}

        {layoutChangable ? (
          <IconButton
            position={"absolute"}
            right={2}
            icon={<RiDeleteBin5Fill />}
            aria-label="Delete device"
            colorScheme={"red"}
            size="sm"
            onClick={deleteDevice}
          />
        ) : (
          <IconButton
            position={"absolute"}
            right={2}
            icon={<BiHide />}
            aria-label="Hide device"
            colorScheme={"blackAlpha"}
            size="sm"
            onClick={hideDevice}
            isLoading={loading}
          />
        )}
      </Flex>

      <Box flex="1" minH={0} overflowY="auto" className="notdraggable">
        {deviceBlock.widgets.length > 0
          ? deviceBlock.widgets.map((e) => (
              <WidgetErrorBoundary key={e.id} widgetName={e.widget_type ?? e.type ?? "Widget"}>
                <DisplayWidget
                  widget={e}
                  deviceKey={deviceBlock.key}
                  deviceId={deviceBlock.id}
                  layoutChangable={layoutChangable}
                  setDashboard={setDashboard}
                  dashboard={dashboard}
                  setRefresh={setRefresh}
                  dataPoints={dataPoints}
                />
              </WidgetErrorBoundary>
            ))
          : null}
      </Box>

      {login ? (
        <Flex
          flexShrink={0}
          justifyContent={"center"}
          alignItems="center"
          height={"30px"}
          maxH="30px"
          width={"100%"}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
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
