import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { useEffect, useRef } from "react";
import { MdAddToQueue } from "react-icons/md";
import { TbExchange, TbRefreshAlert } from "react-icons/tb";

import AddDeviceModal from "../ViewMenu/addDeviceModal";
import ManageAlertsModal from "../ViewMenu/manageAlertsModal";
import { useConnectionStore } from "../../stores/connectionStore";
import { useDashboardStore } from "../../stores/dashboardStore";
import { useUiStore } from "../../stores/uiStore";
import { Dashboard } from "../../types";

export default function ViewMenu() {
  const setLayoutChangable = useUiStore((s) => s.setLayoutChangable);

  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);

  const alerts = useConnectionStore((s) => s.alerts);
  const setAlerts = useConnectionStore((s) => s.setAlerts);

  const { isOpen: isOpenAddDevice, onOpen: onOpenAddDevice, onClose: onCloseAddDevice } = useDisclosure();
  const { isOpen: isOpenManageAlerts, onOpen: onOpenManageAlerts, onClose: onCloseManageAlerts } = useDisclosure();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    invoke("get_alerts")
      .then((e) => setAlerts(JSON.parse(e as string).alerts))
      .catch(console.log);
  }, []);

  const setDashboardCompat = (d: Dashboard | ((prev: Dashboard) => Dashboard)) => {
    const resolved = typeof d === "function" ? d(dashboard) : d;
    setDashboard(resolved);
  };

  return (
    <Menu closeOnSelect={false} gutter={5}>
      <MenuButton
        borderRadius="5px"
        ml={3}
        width="55px"
        justifyContent="center"
        bgColor="twitter.400"
        _expanded={{ bg: "twitter.500" }}
        height="40px"
      >
        View
      </MenuButton>
      <MenuList minWidth="240px" bgColor="twitter.400">
        <MenuItem onClick={() => setLayoutChangable(true)} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={TbExchange} />
            <Text ml={2}>Change layout</Text>
          </Flex>
        </MenuItem>

        <MenuItem onClick={onOpenAddDevice} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={MdAddToQueue} />
            <Text ml={2}>Add device</Text>
          </Flex>
        </MenuItem>
        <AddDeviceModal
          isOpen={isOpenAddDevice}
          onClose={onCloseAddDevice}
          setDashboard={setDashboardCompat as any}
          dashboard={dashboard as any}
        />

        <MenuItem onClick={onOpenManageAlerts} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={TbRefreshAlert} />
            <Text ml={2}>Manage alerts</Text>
          </Flex>
        </MenuItem>
        <ManageAlertsModal
          isOpen={isOpenManageAlerts}
          onClose={onCloseManageAlerts}
          alerts={alerts}
          setAlerts={setAlerts as any}
        />
      </MenuList>
    </Menu>
  );
}
