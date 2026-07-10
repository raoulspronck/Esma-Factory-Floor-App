import { Flex, IconButton, Spacer, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { exit } from "@tauri-apps/api/process";
import { useEffect, useRef, useState } from "react";
import { VscChromeClose } from "react-icons/vsc";

import { formatDate } from "../utils/formatDate";
import { useConnectionStore } from "../stores/connectionStore";

import AlertsDialog from "../components/TaskBar/AlertsDialog";
import ConnectionStatus from "../components/TaskBar/ConnectionStatus";
import FileMenu from "../components/TaskBar/FileMenu";
import LoginSection from "../components/TaskBar/LoginSection";
import ReceiveFileTaskbar from "../components/receiveFileTaskBar";
import SendFileTaskBar from "../components/sendFileTaskBar";

const TaskBar: React.FC = () => {
  const setMqttStatus = useConnectionStore((s) => s.setMqttStatus);
  const fileSend = useConnectionStore((s) => s.fileSend);
  const fileReceive = useConnectionStore((s) => s.fileReceive);
  const fileSendStatus = useConnectionStore((s) => s.fileSendStatus);
  const fileSendProgress = useConnectionStore((s) => s.fileSendProgress);
  const fileReceivePath = useConnectionStore((s) => s.fileReceivePath);
  const fileError = useConnectionStore((s) => s.fileError);
  const setFileSend = useConnectionStore((s) => s.setFileSend);
  const setFileReceive = useConnectionStore((s) => s.setFileReceive);

  const [currentDate, setCurrentDate] = useState(formatDate(""));

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setInterval(() => setCurrentDate(formatDate("")), 1000);

    // Set initial MQTT connection status once on mount;
    // EventManager keeps it updated going forward via events.
    invoke("get_exalise_connection")
      .then((e) => setMqttStatus(e === true ? "connected" : "disconnected"))
      .catch(console.log);

    // Reset ping counter on each heartbeat
    listen("Ping", () => {
      // ping relaunch logic lives in ConnectionStatus
    });
  }, []);

  return (
    <>
      <Flex
        bgGradient="linear(to-b, gray.900, gray.800)"
        color="white"
        height="68px"
        alignItems="center"
        pl="4"
        boxShadow="rgba(9, 30, 66, 0.35) 0px 6px 12px -2px, rgba(9, 30, 66, 0.12) 0px 0px 0px 1px"
        width="100%"
        position="relative"
        gap={2}
      >
        <FileMenu />
        <LoginSection />

        <Spacer />
        <Text
          fontSize="26px"
          fontWeight="semibold"
          letterSpacing="wide"
          sx={{ fontVariantNumeric: "tabular-nums" }}
          ml={2}
        >
          {currentDate}
        </Text>
        <Spacer />

        <ConnectionStatus />

        <IconButton
          colorScheme="red"
          aria-label="exit"
          icon={<VscChromeClose />}
          boxSize="52px"
          minW="52px"
          fontSize="22px"
          borderRadius="xl"
          mr={3}
          onClick={() => exit(1)}
        />
      </Flex>

      {fileSend ? (
        <SendFileTaskBar
          error={fileError}
          fileSendProgress={fileSendProgress}
          fileSendStatus={fileSendStatus}
          setFileSend={setFileSend as any}
        />
      ) : fileReceive ? (
        <ReceiveFileTaskbar
          error={fileError}
          fileSendProgress={fileSendProgress}
          fileSendStatus={fileSendStatus}
          setFileReceive={setFileReceive as any}
          fileReceivePath={fileReceivePath}
        />
      ) : null}

      <AlertsDialog />
    </>
  );
};

export default TaskBar;
