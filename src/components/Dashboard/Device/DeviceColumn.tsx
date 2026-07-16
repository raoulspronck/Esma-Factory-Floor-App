import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { listen } from "@tauri-apps/api/event";
import { BsThreeDotsVertical } from "react-icons/bs";
import { RxDragHandleDots2 } from "react-icons/rx";
import GridLayout, { Layout } from "react-grid-layout";
import WidgetCell from "./WidgetCell";
import { useDeviceData } from "../../../hooks/useDeviceData";
import { useElementSize } from "../../../hooks/useElementSize";
import { useDashboardStore } from "../../../stores/dashboardStore";
import { useSettingsStore } from "../../../stores/settingsStore";
import { Device } from "../../../types";
import { STRIP_COLS, STRIP_ROWS } from "../../../utils/gridPacking";

const CELL_MARGIN = 6;
const CELL_PADDING = 6;
const HEADER_HEIGHT = 34;

interface DeviceColumnProps {
  device: Device;
  colorToken: string;
  layoutChangable: boolean;
  onAddWidget: () => void;
  onRemoveDevice: () => void;
}

// One device = one vertical strip on the dashboard: a header (name + live
// connection dot + edit actions) above a private 2-column x 8-row grid.
// Widgets can be dragged/resized freely inside the strip but never leave it,
// so a device's widgets are grouped structurally instead of via per-widget
// color tags.
const DeviceColumn: React.FC<DeviceColumnProps> = ({
  device,
  colorToken,
  layoutChangable,
  onAddWidget,
  onRemoveDevice,
}) => {
  const updateWidgetsLayout = useDashboardStore((s) => s.updateWidgetsLayout);
  // Rows per strip is a per-machine setting (screen sizes differ per kiosk).
  const stripRows = useSettingsStore((s) => s.basic?.dashboard_rows ?? STRIP_ROWS);
  const deviceData = useDeviceData(device.id);
  const dataPoints = deviceData?.dataPoint ?? [];
  const [connected, setConnected] = useState<boolean | null>(null);
  const [bodyRef, bodySize] = useElementSize<HTMLDivElement>();

  useEffect(() => {
    if (deviceData?.connected !== undefined) {
      setConnected(deviceData.connected);
    }
  }, [deviceData?.connected]);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    listen(`notification---${device.key}`, (event) => {
      if (event.payload === "connected") setConnected(true);
      else if (event.payload === "disconnected") setConnected(false);
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [device.key]);

  // The strip's rows always exactly fill the measured body height, so a
  // widget's size is defined purely in grid units — independent of screen
  // size, nothing can overflow the strip.
  const rowHeight = Math.max(
    (bodySize.height - CELL_PADDING * 2 - (stripRows - 1) * CELL_MARGIN) / stripRows,
    30
  );

  const rglLayout: Layout[] = device.widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
  }));

  const persist = (settled: Layout[]) => {
    updateWidgetsLayout(
      settled.map((l) => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h }))
    );
  };

  return (
    <Flex
      flexDir="column"
      height="100%"
      minW={0}
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="12px"
      overflow="hidden"
    >
      <Flex
        flexShrink={0}
        alignItems="center"
        height={`${HEADER_HEIGHT}px`}
        px={2}
        borderTop="3px solid"
        borderTopColor={colorToken}
        borderBottom="1px solid"
        borderBottomColor="whiteAlpha.100"
        bg="blackAlpha.400"
      >
        {layoutChangable && (
          <Box
            className="device-drag-handle"
            color="whiteAlpha.500"
            mr={1}
            cursor="grab"
            display="flex"
            alignItems="center"
            aria-label="Drag to reorder device"
          >
            <RxDragHandleDots2 size={16} />
          </Box>
        )}
        <Box
          height="10px"
          width="10px"
          borderRadius="50%"
          bgColor={connected ? "green.400" : connected === false ? "red.400" : "whiteAlpha.400"}
          boxShadow={connected ? "0 0 8px 1px rgba(72, 187, 120, 0.7)" : undefined}
          flexShrink={0}
          mr={2}
        />
        <Text fontSize="14px" fontWeight="bold" color="whiteAlpha.900" noOfLines={1} flex="1" minW={0}>
          {device.name}
        </Text>

        {layoutChangable && (
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<BsThreeDotsVertical />}
              aria-label="Device actions"
              size="xs"
              variant="ghost"
              color="whiteAlpha.800"
            />
            <MenuList fontSize="sm" color="gray.800">
              <MenuItem onClick={onAddWidget}>Add widget</MenuItem>
              <MenuItem onClick={onRemoveDevice} color="red.500">
                Remove device
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>

      <Box flex="1" minH={0} ref={bodyRef} overflow="hidden">
        {bodySize.width > 0 && bodySize.height > 0 && (
          <GridLayout
            className="layout"
            layout={rglLayout}
            cols={STRIP_COLS}
            maxRows={stripRows}
            width={bodySize.width}
            rowHeight={rowHeight}
            margin={[CELL_MARGIN, CELL_MARGIN]}
            containerPadding={[CELL_PADDING, CELL_PADDING]}
            // compactType stays null (no auto-repacking after a drop), but
            // preventCollision must be false so dragging/resizing a widget
            // onto an occupied cell displaces the widget in the way instead
            // of just refusing the move.
            compactType={null}
            preventCollision={false}
            isBounded
            draggableCancel=".notdraggable"
            isDraggable={layoutChangable}
            isResizable={layoutChangable}
            onDragStop={persist}
            onResizeStop={persist}
          >
            {device.widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetCell
                  widget={widget}
                  deviceId={device.id}
                  deviceKey={device.key}
                  layoutChangable={layoutChangable}
                  dataPoints={dataPoints}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </Box>
    </Flex>
  );
};

export default DeviceColumn;
