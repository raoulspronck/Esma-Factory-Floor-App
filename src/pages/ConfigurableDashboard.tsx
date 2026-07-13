/* eslint no-unused-vars: 0 */

import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { MdAddToQueue } from "react-icons/md";
import AddDevicesToDashboardModal from "../components/Dashboard/AddDevicesToDashboardModal";
import DeviceWidget from "../components/Dashboard/Device/DeviceWidget";
import QuickToolBar from "../components/QuickToolBar/QuickToolBar";

import { useDashboardStore } from "../stores/dashboardStore";
import { useUiStore } from "../stores/uiStore";
import { Dashboard } from "../types";
import { WidgetErrorBoundary } from "../components/WidgetErrorBoundary";

// Each device card needs at least 1 row for its header plus whatever each of
// its widgets was budgeted at creation time (widget.height — see
// WidgetModal.tsx's saveSettings). Enforcing this as the grid item's minH
// stops a drag-resize from shrinking a card below what its own content
// needs, which is what was causing widgets to get clipped/overflow.
const HEADER_ROW_UNITS = 1;

const getMinCardHeight = (widgets: { height?: number }[]) =>
  HEADER_ROW_UNITS + widgets.reduce((sum, w) => sum + (w.height ?? 1), 0);

const ConfigurableDashboard: React.FC = () => {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const updateLayout = useDashboardStore((s) => s.updateLayout);
  const layoutChangable = useUiStore((s) => s.layoutChangable);
  const setLayoutChangable = useUiStore((s) => s.setLayoutChangable);
  const login = useUiStore((s) => s.login);

  // Adapter so child components that expect React.Dispatch<SetStateAction<...>>
  // still work — they only call setDashboard(value), never the functional form.
  const setDashboardCompat = useCallback(
    (d: Dashboard | ((prev: Dashboard) => Dashboard)) => {
      const resolved = typeof d === "function" ? d(dashboard) : d;
      setDashboard(resolved);
    },
    [dashboard, setDashboard]
  );

  const {
    isOpen: isOpenAddDevicesToDashboard,
    onOpen: onOpenAddDevicesToDashboard,
    onClose: onCloseAddDevicesToDashboard,
  } = useDisclosure();

  const [currentLayout, setCurrentLayout] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // Measures the grid's actual container instead of assuming every
  // shop-floor touchscreen is 1920px wide (screen size varies per machine).
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setGridWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const saveLayout = async () => {
    if (!currentLayout) return;
    const newLayout = (currentLayout as any[]).map((item: any) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    try {
      await updateLayout(newLayout);
      setLayoutChangable(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (refresh) {
    return <Text>Loading</Text>;
  }

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
      <Box
        flex="1"
        minHeight={0}
        pt={2}
        pb={layoutChangable ? "88px" : 0}
        width="100%"
        overflowY="auto"
        ref={gridContainerRef}
      >
        {dashboard.layout.length > 0 ? (
          <GridLayout
            className="layout"
            layout={dashboard.layout}
            cols={5}
            width={gridWidth}
            maxRows={18}
            rowHeight={72}
            compactType="horizontal"
            margin={[24, 24]}
            containerPadding={[16, 16]}
            draggableCancel={".notdraggable"}
            isResizable={layoutChangable}
            onLayoutChange={(e) => setCurrentLayout(e)}
            isDraggable={layoutChangable}
          >
            {dashboard.devices.map((e) => {
              if (e.display) {
                return (
                  <div
                    key={e.id}
                    data-grid={{
                      ...dashboard.layout.filter((i) => i.i === e.id)[0],
                      minW: 1,
                      minH: getMinCardHeight(e.widgets),
                    }}
                  >
                    <WidgetErrorBoundary widgetName={e.name ?? e.key}>
                      <DeviceWidget
                        deviceBlock={e}
                        setDashboard={setDashboardCompat as any}
                        dashboard={dashboard as any}
                        layoutChangable={layoutChangable}
                        login={login}
                        setRefresh={setRefresh}
                      />
                    </WidgetErrorBoundary>
                  </div>
                );
              } else {
                return null;
              }
            })}
          </GridLayout>
        ) : (
          <Box>
            <Text>No widgets found to display</Text>
          </Box>
        )}
      </Box>

      {layoutChangable ? (
        <Flex position={"absolute"} bottom={5} right={5}>
          <Button
            size="lg"
            colorScheme={"blackAlpha"}
            onClick={() => window.location.reload()}
            mr={2}
          >
            Back
          </Button>

          <Button
            size="lg"
            colorScheme={"twitter"}
            onClick={() => saveLayout()}
          >
            Save layout
          </Button>
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
            onClick={onOpenAddDevicesToDashboard}
          />
        </QuickToolBar>
      )}

      <AddDevicesToDashboardModal
        isOpen={isOpenAddDevicesToDashboard}
        onClose={onCloseAddDevicesToDashboard}
        dashboard={dashboard as any}
        setDashboard={setDashboardCompat as any}
      />
    </Box>
  );
};

export default ConfigurableDashboard;
