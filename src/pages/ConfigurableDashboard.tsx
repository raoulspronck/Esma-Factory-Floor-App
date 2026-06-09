/* eslint no-unused-vars: 0 */

import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import GridLayout from "react-grid-layout";
import { MdAddToQueue } from "react-icons/md";
import AddDevicesToDashboardModal from "../components/Dashboard/AddDevicesToDashboardModal";
import DeviceWidget from "../components/Dashboard/Device/DeviceWidget";
import QuickToolBar from "../components/QuickToolBar/QuickToolBar";

import { useDashboardStore } from "../stores/dashboardStore";
import { useUiStore } from "../stores/uiStore";
import { Dashboard } from "../types";
import { WidgetErrorBoundary } from "../components/WidgetErrorBoundary";

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
      pt={2}
      position="relative"
      bgColor={"black"}
      color="white"
    >
      <Box height={"calc(100% - 150px)"} width="100%">
        {dashboard.layout.length > 0 ? (
          <GridLayout
            className="layout"
            layout={dashboard.layout}
            cols={5}
            width={1920}
            maxRows={18}
            rowHeight={60}
            compactType="horizontal"
            margin={[20, 20]}
            containerPadding={[10, 10]}
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
                    data-grid={dashboard.layout.filter((i) => i.i === e.id)[0]}
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
