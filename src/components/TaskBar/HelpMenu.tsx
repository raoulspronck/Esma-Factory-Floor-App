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
        Help
      </MenuButton>
      <MenuList minWidth="240px" bgColor="twitter.400">
        <MenuItem onClick={onOpen} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={MdError} />
            <Text ml={2}>View logs</Text>
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
