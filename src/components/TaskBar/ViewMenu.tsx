import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { ElementType, useEffect, useRef } from "react";
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
    <Menu closeOnSelect={false} gutter={8}>
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
        View
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => setLayoutChangable(true)} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(TbExchange)}
            <Text>Change layout</Text>
          </Flex>
        </MenuItem>

        <MenuItem onClick={onOpenAddDevice} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(MdAddToQueue)}
            <Text>Add device</Text>
          </Flex>
        </MenuItem>
        <AddDeviceModal
          isOpen={isOpenAddDevice}
          onClose={onCloseAddDevice}
          setDashboard={setDashboardCompat as any}
          dashboard={dashboard as any}
        />

        <MenuItem onClick={onOpenManageAlerts} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            {itemIcon(TbRefreshAlert)}
            <Text>Manage alerts</Text>
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
