import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { MdError } from "react-icons/md";

import ErrorLog from "../Help/ErrorLog";
import { useConnectionStore } from "../../stores/connectionStore";

export default function HelpMenu() {
  const connectionErrorLog = useConnectionStore((s) => s.connectionErrorLog);
  const appendConnectionError = useConnectionStore((s) => s.appendConnectionError);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    listen("exalise-connection-status", (e) => {
      appendConnectionError(`${e.payload as string}\r\n`);
    });
  }, []);

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
        <ErrorLog
          isOpen={isOpen}
          onClose={onClose}
          connectionErrorText={connectionErrorLog}
        />
      </MenuList>
    </Menu>
  );
}
