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
          fontWeight="light"
          ml="2"
          bgColor="twitter.400"
          _expanded={{ bg: "twitter.500" }}
          onClick={() => setLogin(false)}
          color="white"
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex width="250px">
      <Button
        bgColor="twitter.400"
        _expanded={{ bg: "twitter.500" }}
        fontWeight="light"
        ml="2"
        onClick={onOpen}
        color="white"
      >
        Login
      </Button>
      <LoginModal isOpen={isOpen} onClose={onClose} setLogin={setLogin as any} />
    </Flex>
  );
}
