import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useState } from "react";
import GridLayout from "react-grid-layout";
import { MdAddToQueue } from "react-icons/md";
import AddDevicesToDashboardModal from "../components/Dashboard/AddDevicesToDashboardModal";
import DeviceWidget from "../components/Dashboard/Device/DeviceWidget";
import QuickToolBar from "../components/QuickToolBar/QuickToolBar";

interface ConfigurableDashboardProps {
  dashboard: {
    layout: any[];
    devices: any[];
  };
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: any[];
      devices: any[];
    }>
  >;
  setlayoutChangable: React.Dispatch<React.SetStateAction<boolean>>;
  layoutChangable: boolean;
  login: boolean;
}

const ConfigurableDashboard: React.FC<ConfigurableDashboardProps> = ({
  layoutChangable,
  setlayoutChangable,
  setDashboard,
  dashboard,
  login,
}) => {
  const {
    isOpen: isOpenAddDevicesToDashboard,
    onOpen: onOpenAddDevicesToDashboard,
    onClose: onCloseAddDevicesToDashboard,
  } = useDisclosure();

  const [currentLayout, setCurrentLayout] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const saveLayout = () => {
    const newLayout = dashboard.layout.map((item: any) => {
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      };
    });

    invoke("save_dashboard_layout", {
      dashboard: {
        layout: newLayout,
        devices: dashboard.devices,
      },
    })
      .then((i) => {
        if (i == "saved") {
          setDashboard((dash) => {
            return {
              layout: newLayout,
              devices: dash.devices,
            };
          });
          setlayoutChangable(false);
        }
      })
      .catch((e) => console.log(e));
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
                    <DeviceWidget
                      deviceBlock={e}
                      setDashboard={setDashboard}
                      dashboard={dashboard}
                      layoutChangable={layoutChangable}
                      login={login}
                      setRefresh={setRefresh}
                    />
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
        dashboard={dashboard}
        setDashboard={setDashboard}
      />
    </Box>
  );
};

export default ConfigurableDashboard;
