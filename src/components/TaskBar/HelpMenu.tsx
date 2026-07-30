import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { MdError } from "react-icons/md";

import ErrorLog from "../Help/ErrorLog";
import { useTauriEvent } from "../../hooks/useTauriEvent";
import { LogEntry, useConnectionStore } from "../../stores/connectionStore";

export default function HelpMenu() {
  const appLog = useConnectionStore((s) => s.appLog);
  const appendAppLog = useConnectionStore((s) => s.appendAppLog);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useTauriEvent<LogEntry>("app-log", (e) => appendAppLog(e.payload));

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
        Help
      </MenuButton>
      <MenuList>
        <MenuItem onClick={onOpen} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            <Flex
              boxSize="40px"
              borderRadius="lg"
              bg="brand.50"
              color="brand.600"
              align="center"
              justify="center"
            >
              <Icon as={MdError} boxSize="22px" />
            </Flex>
            <Text>View logs</Text>
          </Flex>
        </MenuItem>
        <ErrorLog isOpen={isOpen} onClose={onClose} appLog={appLog} />
      </MenuList>
    </Menu>
  );
}
