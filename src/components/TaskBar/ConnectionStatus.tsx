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
  Spacer,
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
          width={["110px", "130px", "140px"]}
          alignItems="center"
          justifyContent="center"
          backgroundColor="red.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize="md"
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Spacer />
          <Icon as={MdWifiTetheringOff} />
          <Spacer />
          <Text>disconnected</Text>
          <Spacer />
        </Flex>
      ) : (
        <Flex
          width={["110px", "130px", "150px"]}
          alignItems="center"
          justifyContent="center"
          backgroundColor="green.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize="md"
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Icon ml={3} as={MdWifiTethering} />
          <Text ml={2}>connected</Text>
          <Text ml="auto" mr={2}>{pingTime}s</Text>
        </Flex>
      )}
    </Flex>
  );
}
