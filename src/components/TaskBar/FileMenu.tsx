import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { BiExport, BiImport } from "react-icons/bi";
import { BsChevronDown } from "react-icons/bs";
import { FiFolder } from "react-icons/fi";

import ReceiveFileModal from "../FileMenu/receiveFileModel";
import SendFileModal from "../FileMenu/sendFileModal";
import { useConnectionStore } from "../../stores/connectionStore";

export default function FileMenu() {
  const setFileSend = useConnectionStore((s) => s.setFileSend);
  const setFileReceive = useConnectionStore((s) => s.setFileReceive);
  const setFileSendStatus = useConnectionStore((s) => s.setFileSendStatus);
  const setFileSendProgress = useConnectionStore((s) => s.setFileSendProgress);
  const setFileReceivePath = useConnectionStore((s) => s.setFileReceivePath);
  const setFileError = useConnectionStore((s) => s.setFileError);

  const { isOpen: isOpenSend, onOpen: onOpenSend, onClose: onCloseSend } = useDisclosure();
  const { isOpen: isOpenReceive, onOpen: onOpenReceive, onClose: onCloseReceive } = useDisclosure();

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    listen("rs232-file-send", (e) => setFileSendStatus(e.payload as string));
    listen("rs232-file-progress", (e) => setFileSendProgress(e.payload as string));
    listen("rs232-error-file", (e) => setFileError(e.payload as string));
  }, []);

  const startFileSending = async (
    filePath: string,
    enableBreaks: number,
    maxChar: number,
    delay: number,
    listenCnc: number,
    stopChar: number,
    restartChar: number
  ): Promise<string> =>
    new Promise((res) =>
      invoke("start_file_send", { filePath, sendInPieces: enableBreaks, maxChar, delay, listenCnc, stopChar, restartChar })
        .then(() => res("oke"))
        .catch((e) => res(e))
    );

  const startFileReceiving = async (
    filePath: string,
    startDecimal: number,
    stopDecimal: number,
    forbiddenDecimals: number[]
  ): Promise<string> =>
    new Promise((res) =>
      invoke("start_file_receive", { filePath, startDecimal, stopDecimal, forbiddenDecimals })
        .then(() => { setFileReceivePath(filePath); res("oke"); })
        .catch((e) => res(e))
    );

  return (
    <Menu gutter={8}>
      <MenuButton
        borderRadius="xl"
        height="52px"
        px={5}
        fontSize="lg"
        fontWeight="semibold"
        bgColor="brand.500"
        color="white"
        _hover={{ bg: "brand.400" }}
        _expanded={{ bg: "brand.600" }}
        _active={{ bg: "brand.600" }}
        transition="background 0.15s ease"
      >
        <Flex alignItems="center" gap={2}>
          <Icon as={FiFolder} boxSize="22px" />
          <Text>File</Text>
          <Icon as={BsChevronDown} boxSize="14px" />
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem onClick={onOpenSend} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            <Flex
              boxSize="40px"
              borderRadius="lg"
              bg="brand.50"
              color="brand.600"
              align="center"
              justify="center"
            >
              <Icon as={BiExport} boxSize="22px" />
            </Flex>
            <Text>Send file</Text>
          </Flex>
        </MenuItem>
        <SendFileModal
          isOpen={isOpenSend}
          onClose={onCloseSend}
          StartFileSending={startFileSending}
          setFileSend={setFileSend as any}
        />
        <MenuItem onClick={onOpenReceive} minH="60px">
          <Flex alignItems="center" width="100%" gap={3}>
            <Flex
              boxSize="40px"
              borderRadius="lg"
              bg="brand.50"
              color="brand.600"
              align="center"
              justify="center"
            >
              <Icon as={BiImport} boxSize="22px" />
            </Flex>
            <Text>Receive file</Text>
          </Flex>
        </MenuItem>
        <ReceiveFileModal
          isOpen={isOpenReceive}
          onClose={onCloseReceive}
          StartFileReceiving={startFileReceiving}
          setFileReceive={setFileReceive as any}
        />
      </MenuList>
    </Menu>
  );
}
