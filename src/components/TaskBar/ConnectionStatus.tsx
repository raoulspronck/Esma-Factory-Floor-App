import {
  Button,
  Flex,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { relaunch } from "@tauri-apps/api/process";
import { useEffect, useState } from "react";
import { TfiReload } from "react-icons/tfi";
import { MdWifiTethering, MdWifiTetheringOff } from "react-icons/md";

import ExaliseLogoBox from "../exaliseLogoBox";
import { emitter } from "../../index";
import { useConnectionStore } from "../../stores/connectionStore";

export default function ConnectionStatus() {
  const mqttStatus = useConnectionStore((s) => s.mqttStatus);

  const [pingTime, setPingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPingTime((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pingTime < -60) relaunch();
  }, [pingTime]);

  return (
    <Flex alignItems="center" width="fit-content" mr={5} color="white">
      <ExaliseLogoBox size={28} />

      <Popover>
        {({ onClose }) => (
          <>
            <PopoverTrigger>
              <Text
                fontSize="18px"
                fontWeight="medium"
                fontFamily="Helvetica"
                letterSpacing="widest"
                style={{ transform: "scale(1, 0.9)" }}
                ml={2}
                display={["none", "block"]}
                cursor="pointer"
              >
                Exalise
              </Text>
            </PopoverTrigger>
            <Portal>
              <PopoverContent width="fit-content">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>
                  <Flex flexDir="column">
                    <Button
                      leftIcon={<TfiReload />}
                      colorScheme="blue"
                      onClick={async () => {
                        await invoke("post_remove_cache");
                        emitter.emit("refetch", true);
                        onClose();
                      }}
                    >
                      Refetch
                    </Button>
                    <Button
                      mt={2}
                      leftIcon={<TfiReload />}
                      colorScheme="orange"
                      onClick={() => relaunch()}
                    >
                      Relaunch
                    </Button>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </>
        )}
      </Popover>

      {mqttStatus === "disconnected" ? (
        <Flex
          alignItems="center"
          gap={2}
          backgroundColor="red.500"
          height="40px"
          borderRadius="full"
          px={5}
          fontSize="md"
          fontWeight="semibold"
          ml={3}
        >
          <Icon as={MdWifiTetheringOff} boxSize="20px" />
          <Text>Disconnected</Text>
        </Flex>
      ) : (
        <Flex
          alignItems="center"
          gap={2}
          backgroundColor="green.500"
          height="40px"
          borderRadius="full"
          px={5}
          fontSize="md"
          fontWeight="semibold"
          ml={3}
        >
          <Icon as={MdWifiTethering} boxSize="20px" />
          <Text>Connected</Text>
          <Text
            color="whiteAlpha.800"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {pingTime}s
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
