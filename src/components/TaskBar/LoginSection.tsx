import { Button, Flex, useDisclosure } from "@chakra-ui/react";

import LoginModal from "../LoginModal";
import { useUiStore } from "../../stores/uiStore";

import SettingsMenu from "./SettingsMenu";
import ViewMenu from "./ViewMenu";
import HelpMenu from "./HelpMenu";

export default function LoginSection() {
  const login = useUiStore((s) => s.login);
  const setLogin = useUiStore((s) => s.setLogin);

  const { isOpen, onOpen, onClose } = useDisclosure();

  if (login) {
    return (
      <Flex width="fit-content">
        <SettingsMenu />
        <ViewMenu />
        <HelpMenu />
        <Button
          ml={2}
          height="52px"
          px={5}
          fontSize="lg"
          color="white"
          bg="whiteAlpha.200"
          _hover={{ bg: "whiteAlpha.300" }}
          _active={{ bg: "whiteAlpha.400" }}
          onClick={() => setLogin(false)}
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex width="250px">
      <Button
        ml={2}
        height="52px"
        px={5}
        fontSize="lg"
        color="white"
        bg="whiteAlpha.200"
        _hover={{ bg: "whiteAlpha.300" }}
        _active={{ bg: "whiteAlpha.400" }}
        onClick={onOpen}
      >
        Login
      </Button>
      <LoginModal isOpen={isOpen} onClose={onClose} setLogin={setLogin as any} />
    </Flex>
  );
}
