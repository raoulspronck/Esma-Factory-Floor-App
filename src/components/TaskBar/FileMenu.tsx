import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { BiExport, BiImport } from "react-icons/bi";

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
    <Menu gutter={5}>
      <MenuButton
        borderRadius="5px"
        width="50px"
        justifyContent="center"
        bgColor="twitter.400"
        _expanded={{ bg: "twitter.500" }}
        height="40px"
      >
        File
      </MenuButton>
      <MenuList ml={-1} bgColor="twitter.400" border="none">
        <MenuItem onClick={onOpenSend} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={BiExport} />
            <Text ml={2}>Send file</Text>
          </Flex>
        </MenuItem>
        <SendFileModal
          isOpen={isOpenSend}
          onClose={onCloseSend}
          StartFileSending={startFileSending}
          setFileSend={setFileSend as any}
        />
        <MenuItem onClick={onOpenReceive} bgColor="twitter.400" _hover={{ bg: "twitter.500" }}>
          <Flex alignItems="center" width="100%">
            <Icon as={BiImport} />
            <Text ml={2}>Receive file</Text>
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
