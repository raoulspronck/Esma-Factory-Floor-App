import { Box, Flex, Icon, IconButton, Text, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { MdAddToQueue, MdCheck } from "react-icons/md";
import AddDeviceModal from "../components/ViewMenu/addDeviceModal";
import DeviceColumn from "../components/Dashboard/Device/DeviceColumn";
import WidgetModal from "../components/Dashboard/Device/WidgetModal";
import QuickToolBar from "../components/QuickToolBar/QuickToolBar";

import { useElementSize } from "../hooks/useElementSize";
import { useDashboardStore } from "../stores/dashboardStore";
import { useUiStore } from "../stores/uiStore";
import { Dashboard } from "../types";
import { deviceColor } from "../utils/deviceColor";
import { MAX_DEVICES } from "../utils/gridPacking";

const COLUMN_GAP = 8;
const EMPTY_SLOT_PREFIX = "empty-slot-";

const ConfigurableDashboard: React.FC = () => {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const removeDevice = useDashboardStore((s) => s.removeDevice);
  const reorderDevices = useDashboardStore((s) => s.reorderDevices);
  const layoutChangable = useUiStore((s) => s.layoutChangable);
  const setLayoutChangable = useUiStore((s) => s.setLayoutChangable);

  // Adapter so child components that expect React.Dispatch<SetStateAction<...>>
  // still work — they only call setDashboard(value), never the functional form.
  const setDashboardCompat = useCallback(
    (d: Dashboard | ((prev: Dashboard) => Dashboard)) => {
      const resolved = typeof d === "function" ? d(dashboard) : d;
      setDashboard(resolved);
    },
    [dashboard, setDashboard]
  );

  const { isOpen: isOpenAddDevice, onOpen: onOpenAddDevice, onClose: onCloseAddDevice } = useDisclosure();
  const { isOpen: isOpenAddWidget, onOpen: onOpenAddWidget, onClose: onCloseAddWidget } = useDisclosure();
  const [addWidgetDeviceId, setAddWidgetDeviceId] = useState<string | null>(null);
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>();

  const devices = dashboard.devices.slice(0, MAX_DEVICES);

  // Device strips live on a single-row, MAX_DEVICES-column grid so the same
  // drag machinery that reorders widgets also reorders devices — dragging a
  // strip by its header handle displaces whichever strip is in the way.
  const deviceLayout: Layout[] = devices.map((device, i) => ({ i: device.id, x: i, y: 0, w: 1, h: 1 }));
  const usedSlots = new Set(deviceLayout.map((l) => l.x));
  const emptySlotLayout: Layout[] = layoutChangable
    ? Array.from({ length: MAX_DEVICES })
        .map((_, i) => i)
        .filter((i) => !usedSlots.has(i))
        .map((i) => ({ i: `${EMPTY_SLOT_PREFIX}${i}`, x: i, y: 0, w: 1, h: 1, static: true }))
    : [];
  const fullLayout = [...deviceLayout, ...emptySlotLayout];

  const handleDeviceReorder = (settled: Layout[]) => {
    const newOrder = settled
      .filter((l) => !l.i.startsWith(EMPTY_SLOT_PREFIX))
      .sort((a, b) => a.x - b.x)
      .map((l) => l.i);
    reorderDevices(newOrder);
  };

  return (
    <Box
      height={"100%"}
      width="100%"
      position="relative"
      bgColor={"black"}
      color="white"
      display="flex"
      flexDirection="column"
    >
      <Box flex="1" minHeight={0} width="100%" p={2} ref={containerRef}>
        {devices.length === 0 && !layoutChangable ? (
          <Flex height="100%" alignItems="center" justifyContent="center">
            <Text color="whiteAlpha.600">No devices on the dashboard yet</Text>
          </Flex>
        ) : (
          containerSize.width > 0 &&
          containerSize.height > 0 && (
            <GridLayout
              className="layout"
              layout={fullLayout}
              cols={MAX_DEVICES}
              maxRows={1}
              width={containerSize.width}
              rowHeight={containerSize.height}
              margin={[COLUMN_GAP, 0]}
              containerPadding={[0, 0]}
              compactType="horizontal"
              preventCollision={false}
              isBounded
              isResizable={false}
              isDraggable={layoutChangable}
              draggableHandle=".device-drag-handle"
              onDragStop={handleDeviceReorder}
            >
              {devices.map((device) => (
                <div key={device.id}>
                  <DeviceColumn
                    device={device}
                    colorToken={deviceColor(device.id)}
                    layoutChangable={layoutChangable}
                    onAddWidget={() => {
                      setAddWidgetDeviceId(device.id);
                      onOpenAddWidget();
                    }}
                    onRemoveDevice={() => removeDevice(device.id)}
                  />
                </div>
              ))}

              {/* In edit mode the unused strips become add-device targets. */}
              {emptySlotLayout.map((slot) => (
                <div key={slot.i}>
                  <Flex
                    as="button"
                    onClick={onOpenAddDevice}
                    width="100%"
                    height="100%"
                    alignItems="center"
                    justifyContent="center"
                    flexDir="column"
                    gap={2}
                    border="2px dashed"
                    borderColor="whiteAlpha.300"
                    borderRadius="12px"
                    color="whiteAlpha.500"
                    _hover={{ borderColor: "whiteAlpha.500", color: "whiteAlpha.700" }}
                  >
                    <Icon as={MdAddToQueue} boxSize="40px" />
                    <Text fontSize="14px" fontWeight="medium">
                      Add device
                    </Text>
                  </Flex>
                </div>
              ))}
            </GridLayout>
          )
        )}
      </Box>

      {layoutChangable ? (
        <Flex position={"absolute"} bottom={5} right={5}>
          <IconButton
            icon={<MdCheck />}
            aria-label="Done editing"
            colorScheme={"twitter"}
            size="lg"
            onClick={() => setLayoutChangable(false)}
          />
        </Flex>
      ) : (
        <QuickToolBar>
          <IconButton
            icon={<MdAddToQueue />}
            aria-label="Add device to dashboard"
            colorScheme={"blackAlpha"}
            height={"80px"}
            width="80px"
            fontSize={"50px"}
            onClick={onOpenAddDevice}
          />
        </QuickToolBar>
      )}

      <AddDeviceModal
        isOpen={isOpenAddDevice}
        onClose={onCloseAddDevice}
        dashboard={dashboard as any}
        setDashboard={setDashboardCompat as any}
      />

      <WidgetModal
        isOpen={isOpenAddWidget}
        onClose={onCloseAddWidget}
        deviceId={addWidgetDeviceId}
        deviceName={dashboard.devices.find((d) => d.id === addWidgetDeviceId)?.name}
      />
    </Box>
  );
};

export default ConfigurableDashboard;
